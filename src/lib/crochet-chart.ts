// Geração de "gráfico de crochê" a partir de uma imagem.
//
// Um gráfico de crochê é uma grade onde cada quadradinho = 1 ponto. A partir de
// uma imagem reduzimos a resolução para `cols x rows`, quantizamos as cores
// (median cut) e contamos quantos pontos de cada cor a peça precisa — a "receita"
// que a croceteira segue para montar a peça.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PaletteColor {
  /** Cor média do grupo. */
  rgb: RGB;
  /** #rrggbb, útil pra legenda e exportação. */
  hex: string;
  /** Letra usada no gráfico e na legenda (A, B, C, ...). */
  label: string;
  /** Símbolo alternativo pra impressão em preto e branco. */
  symbol: string;
  /** Quantidade de pontos dessa cor. */
  count: number;
  /** Participação no total de pontos (0–100). */
  percent: number;
}

export interface CrochetChart {
  cols: number;
  rows: number;
  /** cols*rows, ordem linha a linha a partir do topo. Valor = índice na paleta ou EMPTY. */
  cells: Uint8Array;
  palette: PaletteColor[];
  /** Total de pontos que serão feitos (ignora células vazias/transparentes). */
  total: number;
}

/** Célula sem ponto (área transparente da imagem). */
export const EMPTY_CELL = 255;

/** Nº máximo de cores suportado pela paleta (deixa 255 livre pro EMPTY_CELL). */
export const MAX_COLORS = 32;

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SYMBOLS = [
  "●", "▲", "■", "◆", "★", "✚", "✖", "▼",
  "○", "△", "□", "◇", "☆", "♥", "♦", "♣",
  "♠", "▽", "◐", "◑", "◒", "◓", "⬢", "⬡",
  "⊕", "⊗", "⊙", "✿", "❄", "⌘", "✽", "❋",
];

function toHex(rgb: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
}

/** Luminância relativa (0–255) — usada pra escolher texto claro/escuro sobre a cor. */
export function luminance({ r, g, b }: RGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function averageColor(pixels: RGB[]): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = pixels.length || 1;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/** Canal (r|g|b) com maior amplitude no grupo e o tamanho dessa amplitude. */
function widestChannel(pixels: RGB[]): { channel: keyof RGB; range: number } {
  let rMin = 255;
  let rMax = 0;
  let gMin = 255;
  let gMax = 0;
  let bMin = 255;
  let bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  // Pesos perceptuais leves — o olho distingue melhor variações de verde/vermelho.
  const rRange = (rMax - rMin) * 1.0;
  const gRange = (gMax - gMin) * 1.2;
  const bRange = (bMax - bMin) * 0.8;
  if (rRange >= gRange && rRange >= bRange) return { channel: "r", range: rRange };
  if (gRange >= bRange) return { channel: "g", range: gRange };
  return { channel: "b", range: bRange };
}

/** Quantização por median cut: reduz `pixels` a no máximo `maxColors` cores. */
function medianCut(pixels: RGB[], maxColors: number): RGB[] {
  if (pixels.length === 0) return [];
  const buckets: RGB[][] = [pixels];

  while (buckets.length < maxColors) {
    let target = -1;
    let targetRange = -1;
    let targetChannel: keyof RGB = "r";
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].length < 2) continue;
      const { channel, range } = widestChannel(buckets[i]);
      if (range > targetRange) {
        targetRange = range;
        target = i;
        targetChannel = channel;
      }
    }
    if (target === -1) break; // nada mais pra dividir (grupos com 1 pixel)

    const bucket = buckets[target];
    bucket.sort((a, b) => a[targetChannel] - b[targetChannel]);
    const mid = bucket.length >> 1;
    buckets.splice(target, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  return buckets.map(averageColor);
}

function nearestIndex(rgb: RGB, palette: RGB[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    const dr = rgb.r - p.r;
    const dg = rgb.g - p.g;
    const db = rgb.b - p.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Monta o gráfico a partir dos pixels já reduzidos a `cols x rows` (RGBA).
 * Pixels com alpha < 128 viram células vazias (sem ponto).
 */
export function buildChart(
  rgba: Uint8ClampedArray,
  cols: number,
  rows: number,
  maxColors: number,
): CrochetChart {
  const colorLimit = Math.max(1, Math.min(maxColors, MAX_COLORS));
  const cellCount = cols * rows;

  // Pixels opacos que participam da quantização (+ referência da célula de origem).
  const opaque: RGB[] = [];
  const cellRgb: (RGB | null)[] = new Array(cellCount).fill(null);
  for (let i = 0; i < cellCount; i++) {
    const o = i * 4;
    if (rgba[o + 3] < 128) continue; // transparente => sem ponto
    const rgb = { r: rgba[o], g: rgba[o + 1], b: rgba[o + 2] };
    cellRgb[i] = rgb;
    opaque.push(rgb);
  }

  const cells = new Uint8Array(cellCount).fill(EMPTY_CELL);
  if (opaque.length === 0) {
    return { cols, rows, cells, palette: [], total: 0 };
  }

  const rawPalette = medianCut(opaque, colorLimit);

  // Atribui cada célula à cor mais próxima e conta os pontos.
  const counts = new Array(rawPalette.length).fill(0);
  const rawIndex = new Int16Array(cellCount).fill(-1);
  for (let i = 0; i < cellCount; i++) {
    const rgb = cellRgb[i];
    if (!rgb) continue;
    const idx = nearestIndex(rgb, rawPalette);
    rawIndex[i] = idx;
    counts[idx]++;
  }

  // Remove cores sem pontos e junta tons idênticos (mesmo hex).
  const byHex = new Map<string, { rgb: RGB; count: number; raws: number[] }>();
  for (let i = 0; i < rawPalette.length; i++) {
    if (counts[i] === 0) continue;
    const hex = toHex(rawPalette[i]);
    const entry = byHex.get(hex);
    if (entry) {
      entry.count += counts[i];
      entry.raws.push(i);
    } else {
      byHex.set(hex, { rgb: rawPalette[i], count: counts[i], raws: [i] });
    }
  }

  // Ordena por uso (cor mais usada = A) e monta a paleta final.
  const merged = [...byHex.values()].sort((a, b) => b.count - a.count);
  const total = opaque.length;
  const rawToFinal = new Int16Array(rawPalette.length).fill(EMPTY_CELL);
  const palette: PaletteColor[] = merged.map((m, i) => {
    for (const raw of m.raws) rawToFinal[raw] = i;
    return {
      rgb: m.rgb,
      hex: toHex(m.rgb),
      label: LABELS[i] ?? `#${i + 1}`,
      symbol: SYMBOLS[i] ?? LABELS[i] ?? "•",
      count: m.count,
      percent: (m.count / total) * 100,
    };
  });

  for (let i = 0; i < cellCount; i++) {
    const raw = rawIndex[i];
    if (raw >= 0) cells[i] = rawToFinal[raw];
  }

  return { cols, rows, cells, palette, total };
}

/**
 * Calcula quantas carreiras (linhas) manter para preservar a proporção da
 * imagem, considerando a proporção do ponto (altura ÷ largura).
 */
export function rowsForImage(
  cols: number,
  imageWidth: number,
  imageHeight: number,
  stitchAspect: number,
): number {
  if (imageWidth <= 0) return 1;
  const aspect = stitchAspect > 0 ? stitchAspect : 1;
  return Math.max(1, Math.round((cols * imageHeight) / imageWidth / aspect));
}

/** Receita em CSV (para abrir no Excel/planilhas). */
export function chartToCsv(chart: CrochetChart): string {
  const rows = [["Cor", "Codigo", "Simbolo", "Pontos", "Porcentagem"]];
  for (const c of chart.palette) {
    rows.push([c.label, c.hex, c.symbol, String(c.count), `${c.percent.toFixed(1)}%`]);
  }
  rows.push(["Total", "", "", String(chart.total), "100%"]);
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
