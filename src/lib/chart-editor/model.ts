// Modelo do editor de gráficos (crochê e tricô).
//
// Um "documento" é uma grade `cols x rows` em que cada célula guarda o índice
// do fio (yarn) usado naquele ponto — ou EMPTY_CELL quando não há ponto (área
// vazada, vinda de imagem transparente ou da borracha). Tudo aqui é puro (sem
// React, sem canvas) para que as operações sejam testáveis e reutilizáveis
// pelos dois editores: o que muda entre crochê e tricô é o `CraftSpec`
// (`crafts.ts`), não o modelo.

import { EMPTY_CELL } from "@/lib/crochet-chart";

export { EMPTY_CELL };

export type Craft = "croche" | "trico";

export interface Yarn {
  /** Nome que a artista dá ao fio (ex: "Terracota 179"). */
  name: string;
  /** #rrggbb */
  hex: string;
}

export interface Gauge {
  /** Pontos em 10 cm. */
  stitches: number;
  /** Carreiras em 10 cm. */
  rows: number;
}

export interface ChartDoc {
  version: 1;
  craft: Craft;
  name: string;
  cols: number;
  rows: number;
  /** Quantas vezes o motivo se repete no preview (largura × altura). */
  repeatsX: number;
  repeatsY: number;
  gauge: Gauge;
  yarns: Yarn[];
  /** cols*rows, linha a linha a partir do TOPO do gráfico. */
  cells: Uint8Array;
}

/** Forma serializável (localStorage / arquivo .json). */
export interface ChartDocJson extends Omit<ChartDoc, "cells"> {
  cells: number[];
}

export const LIMITS = {
  cols: { min: 2, max: 200 },
  rows: { min: 2, max: 200 },
  repeats: { min: 1, max: 12 },
  yarns: { max: 32 },
  gauge: { min: 4, max: 60 },
} as const;

export const MAX_HISTORY = 80;

export interface Point {
  col: number;
  row: number;
}

// ─── Criação ────────────────────────────────────────────────────────────

export function createDoc(
  craft: Craft,
  init: { cols: number; rows: number; gauge: Gauge; yarns: Yarn[] },
): ChartDoc {
  const cells = new Uint8Array(init.cols * init.rows); // tudo = fio 1 (fundo)
  return {
    version: 1,
    craft,
    name: "",
    cols: init.cols,
    rows: init.rows,
    repeatsX: 3,
    repeatsY: 2,
    gauge: init.gauge,
    yarns: init.yarns.map((y) => ({ ...y })),
    cells,
  };
}

// ─── Pintura ────────────────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function cellIndex(doc: Pick<ChartDoc, "cols">, p: Point): number {
  return p.row * doc.cols + p.col;
}

export function inBounds(doc: Pick<ChartDoc, "cols" | "rows">, p: Point): boolean {
  return p.col >= 0 && p.row >= 0 && p.col < doc.cols && p.row < doc.rows;
}

export interface Mirror {
  horizontal: boolean;
  vertical: boolean;
}

/** Pontos afetados por uma pincelada em `p`, considerando o espelhamento. */
export function mirroredPoints(doc: Pick<ChartDoc, "cols" | "rows">, p: Point, mirror: Mirror): Point[] {
  const pts: Point[] = [p];
  if (mirror.horizontal) pts.push({ col: doc.cols - 1 - p.col, row: p.row });
  if (mirror.vertical) pts.push({ col: p.col, row: doc.rows - 1 - p.row });
  if (mirror.horizontal && mirror.vertical) {
    pts.push({ col: doc.cols - 1 - p.col, row: doc.rows - 1 - p.row });
  }
  return pts;
}

/**
 * Pinta `value` nos pontos (já espelhados). Devolve o MESMO array se nada
 * mudou — quem chama usa a identidade pra decidir se re-renderiza.
 */
export function paintCells(doc: ChartDoc, points: Point[], value: number): Uint8Array {
  let next: Uint8Array | null = null;
  for (const p of points) {
    if (!inBounds(doc, p)) continue;
    const i = cellIndex(doc, p);
    const src = next ?? doc.cells;
    if (src[i] === value) continue;
    if (!next) next = new Uint8Array(doc.cells);
    next[i] = value;
  }
  return next ?? doc.cells;
}

/** Balde: preenche a região contígua (4 vizinhos) de mesmo valor a partir de `p`. */
export function floodFill(doc: ChartDoc, p: Point, value: number): Uint8Array {
  if (!inBounds(doc, p)) return doc.cells;
  const { cols, rows, cells } = doc;
  const target = cells[cellIndex(doc, p)];
  if (target === value) return cells;

  const next = new Uint8Array(cells);
  const stack: number[] = [cellIndex(doc, p)];
  while (stack.length) {
    const i = stack.pop()!;
    if (next[i] !== target) continue;
    next[i] = value;
    const c = i % cols;
    const r = (i - c) / cols;
    if (c > 0) stack.push(i - 1);
    if (c < cols - 1) stack.push(i + 1);
    if (r > 0) stack.push(i - cols);
    if (r < rows - 1) stack.push(i + cols);
  }
  return next;
}

/** Linha reta entre dois pontos (Bresenham) — usada pra não "pular" células no arrasto rápido. */
export function linePoints(a: Point, b: Point): Point[] {
  const pts: Point[] = [];
  let x0 = a.col;
  let y0 = a.row;
  const x1 = b.col;
  const y1 = b.row;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push({ col: x0, row: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
  return pts;
}

// ─── Estrutura ──────────────────────────────────────────────────────────

/**
 * Redimensiona mantendo o desenho ancorado no canto inferior-esquerdo — a
 * carreira 1 é a de baixo, então crescer "pra cima" é o natural.
 * Células novas recebem o fio 1 (fundo).
 */
export function resizeDoc(doc: ChartDoc, cols: number, rows: number): ChartDoc {
  const c2 = clamp(Math.round(cols), LIMITS.cols.min, LIMITS.cols.max);
  const r2 = clamp(Math.round(rows), LIMITS.rows.min, LIMITS.rows.max);
  if (c2 === doc.cols && r2 === doc.rows) return doc;

  const cells = new Uint8Array(c2 * r2); // 0 = fio 1
  const rowOffset = r2 - doc.rows; // >0: linhas novas entram no topo
  for (let r = 0; r < r2; r++) {
    const oldR = r - rowOffset;
    if (oldR < 0 || oldR >= doc.rows) continue;
    const n = Math.min(c2, doc.cols);
    cells.set(doc.cells.subarray(oldR * doc.cols, oldR * doc.cols + n), r * c2);
  }
  return { ...doc, cols: c2, rows: r2, cells };
}

export function shiftDoc(doc: ChartDoc, dx: number, dy: number): ChartDoc {
  const { cols, rows, cells } = doc;
  const next = new Uint8Array(cells.length);
  for (let r = 0; r < rows; r++) {
    const sr = (((r - dy) % rows) + rows) % rows;
    for (let c = 0; c < cols; c++) {
      const sc = (((c - dx) % cols) + cols) % cols;
      next[r * cols + c] = cells[sr * cols + sc];
    }
  }
  return { ...doc, cells: next };
}

export function flipDoc(doc: ChartDoc, axis: "horizontal" | "vertical"): ChartDoc {
  const { cols, rows, cells } = doc;
  const next = new Uint8Array(cells.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sr = axis === "vertical" ? rows - 1 - r : r;
      const sc = axis === "horizontal" ? cols - 1 - c : c;
      next[r * cols + c] = cells[sr * cols + sc];
    }
  }
  return { ...doc, cells: next };
}

export function clearDoc(doc: ChartDoc): ChartDoc {
  return { ...doc, cells: new Uint8Array(doc.cols * doc.rows) };
}

// ─── Fios ───────────────────────────────────────────────────────────────

export function addYarn(doc: ChartDoc, yarn: Yarn): ChartDoc {
  if (doc.yarns.length >= LIMITS.yarns.max) return doc;
  return { ...doc, yarns: [...doc.yarns, yarn] };
}

export function updateYarn(doc: ChartDoc, index: number, patch: Partial<Yarn>): ChartDoc {
  if (!doc.yarns[index]) return doc;
  const yarns = doc.yarns.map((y, i) => (i === index ? { ...y, ...patch } : y));
  return { ...doc, yarns };
}

/**
 * Remove um fio. Pontos que o usavam viram fio 1 (ou vazio, se era o único);
 * índices acima dele descem uma posição pra continuarem apontando certo.
 */
export function removeYarn(doc: ChartDoc, index: number): ChartDoc {
  if (doc.yarns.length <= 1 || !doc.yarns[index]) return doc;
  const yarns = doc.yarns.filter((_, i) => i !== index);
  const cells = new Uint8Array(doc.cells.length);
  for (let i = 0; i < cells.length; i++) {
    const v = doc.cells[i];
    if (v === EMPTY_CELL) cells[i] = EMPTY_CELL;
    else if (v === index) cells[i] = 0;
    else cells[i] = v > index ? v - 1 : v;
  }
  return { ...doc, yarns, cells };
}

export function moveYarn(doc: ChartDoc, from: number, to: number): ChartDoc {
  if (from === to || !doc.yarns[from] || !doc.yarns[to]) return doc;
  const order = doc.yarns.map((_, i) => i);
  order.splice(to, 0, order.splice(from, 1)[0]);
  const remap = new Uint8Array(doc.yarns.length);
  order.forEach((oldIdx, newIdx) => (remap[oldIdx] = newIdx));
  const cells = new Uint8Array(doc.cells.length);
  for (let i = 0; i < cells.length; i++) {
    const v = doc.cells[i];
    cells[i] = v === EMPTY_CELL ? EMPTY_CELL : remap[v];
  }
  return { ...doc, yarns: order.map((i) => doc.yarns[i]), cells };
}

// ─── Receita (contagem) ─────────────────────────────────────────────────

export interface YarnUsage {
  index: number;
  yarn: Yarn;
  /** Pontos no motivo (1 repetição). */
  count: number;
  /** Pontos no total (motivo × repetições). */
  total: number;
  percent: number;
}

export interface Recipe {
  perMotif: number;
  total: number;
  usage: YarnUsage[];
  /** Tamanho final aproximado em cm, com repetições. */
  finishedCm: { width: number; height: number };
}

export function computeRecipe(doc: ChartDoc): Recipe {
  const counts = new Array<number>(doc.yarns.length).fill(0);
  let perMotif = 0;
  for (let i = 0; i < doc.cells.length; i++) {
    const v = doc.cells[i];
    if (v === EMPTY_CELL || v >= counts.length) continue;
    counts[v]++;
    perMotif++;
  }
  const reps = doc.repeatsX * doc.repeatsY;
  const usage: YarnUsage[] = doc.yarns.map((yarn, index) => ({
    index,
    yarn,
    count: counts[index],
    total: counts[index] * reps,
    percent: perMotif ? (counts[index] / perMotif) * 100 : 0,
  }));
  return {
    perMotif,
    total: perMotif * reps,
    usage,
    finishedCm: {
      width: ((doc.cols * doc.repeatsX) / doc.gauge.stitches) * 10,
      height: ((doc.rows * doc.repeatsY) / doc.gauge.rows) * 10,
    },
  };
}

/** Altura ÷ largura de um ponto, derivada do gauge. */
export function stitchAspect(gauge: Gauge): number {
  return gauge.stitches / gauge.rows;
}

export function recipeToCsv(doc: ChartDoc, recipe: Recipe): string {
  const rows = [["Fio", "Codigo", "Pontos no motivo", "Pontos no total", "Porcentagem"]];
  for (const u of recipe.usage) {
    rows.push([
      `${u.index + 1} - ${u.yarn.name}`,
      u.yarn.hex,
      String(u.count),
      String(u.total),
      `${u.percent.toFixed(1)}%`,
    ]);
  }
  rows.push(["Total", "", String(recipe.perMotif), String(recipe.total), "100%"]);
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

// ─── Serialização ───────────────────────────────────────────────────────

export function toJson(doc: ChartDoc): ChartDocJson {
  return { ...doc, cells: Array.from(doc.cells) };
}

/** Lê um documento; devolve null se o conteúdo não for um gráfico válido. */
export function fromJson(raw: unknown, expectedCraft?: Craft): ChartDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Partial<ChartDocJson>;
  if (j.version !== 1) return null;
  if (j.craft !== "croche" && j.craft !== "trico") return null;
  if (expectedCraft && j.craft !== expectedCraft) return null;
  if (!Number.isInteger(j.cols) || !Number.isInteger(j.rows)) return null;
  const cols = clamp(j.cols!, LIMITS.cols.min, LIMITS.cols.max);
  const rows = clamp(j.rows!, LIMITS.rows.min, LIMITS.rows.max);
  if (!Array.isArray(j.yarns) || j.yarns.length === 0) return null;
  const yarns: Yarn[] = j.yarns
    .slice(0, LIMITS.yarns.max)
    .map((y) => ({
      name: typeof y?.name === "string" ? y.name : "",
      hex: /^#[0-9a-f]{6}$/i.test(y?.hex ?? "") ? y.hex.toLowerCase() : "#cccccc",
    }));
  const cells = new Uint8Array(cols * rows);
  if (Array.isArray(j.cells)) {
    for (let i = 0; i < cells.length; i++) {
      const v = j.cells[i];
      cells[i] = v === EMPTY_CELL ? EMPTY_CELL : Number.isInteger(v) && v >= 0 && v < yarns.length ? v : 0;
    }
  }
  const gauge = j.gauge ?? { stitches: 16, rows: 18 };
  return {
    version: 1,
    craft: j.craft,
    name: typeof j.name === "string" ? j.name : "",
    cols,
    rows,
    repeatsX: clamp(Number(j.repeatsX) || 1, LIMITS.repeats.min, LIMITS.repeats.max),
    repeatsY: clamp(Number(j.repeatsY) || 1, LIMITS.repeats.min, LIMITS.repeats.max),
    gauge: {
      stitches: clamp(Number(gauge.stitches) || 16, LIMITS.gauge.min, LIMITS.gauge.max),
      rows: clamp(Number(gauge.rows) || 18, LIMITS.gauge.min, LIMITS.gauge.max),
    },
    yarns,
    cells,
  };
}
