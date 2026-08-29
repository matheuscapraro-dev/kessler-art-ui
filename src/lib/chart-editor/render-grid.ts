// Desenha o gráfico (grade numerada) no canvas. Cada célula mostra o índice do
// fio (1, 2, 3…), como nos gráficos impressos; linhas grossas a cada 5 e
// numeração de carreiras (esquerda, de baixo pra cima) e de pontos (topo, da
// direita pra esquerda — o sentido de leitura da carreira do direito).

import { EMPTY_CELL, type ChartDoc } from "./model";
import { contrastText } from "./stitches";

export type CellLabel = "number" | "letter" | "none";

export interface GridOptions {
  cell: number;
  label: CellLabel;
  showNumbers: boolean;
  /** Célula em destaque (hover). */
  hover?: { col: number; row: number } | null;
  /** Fundo da área sem ponto. */
  emptyPattern?: CanvasPattern | null;
}

export interface GridMetrics {
  padLeft: number;
  padTop: number;
  cell: number;
  width: number;
  height: number;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function gridMetrics(doc: Pick<ChartDoc, "cols" | "rows">, opts: Pick<GridOptions, "cell" | "showNumbers">): GridMetrics {
  const padLeft = opts.showNumbers ? 30 : 6;
  const padTop = opts.showNumbers ? 22 : 6;
  return {
    padLeft,
    padTop,
    cell: opts.cell,
    width: padLeft + doc.cols * opts.cell + 6,
    height: padTop + doc.rows * opts.cell + 6,
  };
}

/** Converte coordenada do canvas (CSS px) em célula; null fora da grade. */
export function pointToCell(
  doc: Pick<ChartDoc, "cols" | "rows">,
  m: GridMetrics,
  x: number,
  y: number,
): { col: number; row: number } | null {
  const col = Math.floor((x - m.padLeft) / m.cell);
  const row = Math.floor((y - m.padTop) / m.cell);
  if (col < 0 || row < 0 || col >= doc.cols || row >= doc.rows) return null;
  return { col, row };
}

export function cellGlyph(index: number, mode: CellLabel): string {
  if (mode === "letter") return LETTERS[index] ?? String(index + 1);
  return String(index + 1);
}

export function drawGrid(canvas: HTMLCanvasElement, doc: ChartDoc, opts: GridOptions): GridMetrics {
  const m = gridMetrics(doc, opts);
  const { cols, rows, cells, yarns } = doc;
  const { cell, label, showNumbers, hover } = opts;
  const { padLeft, padTop, width, height } = m;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Células
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontPx = Math.max(7, Math.floor(cell * 0.5));
  ctx.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
  const drawLabels = label !== "none" && cell >= 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = cells[r * cols + c];
      const x = padLeft + c * cell;
      const y = padTop + r * cell;
      if (v === EMPTY_CELL || !yarns[v]) {
        // Área sem ponto: xadrez discreto
        ctx.fillStyle = "#f4f1ec";
        ctx.fillRect(x, y, cell, cell);
        ctx.fillStyle = "#e6e1d8";
        ctx.fillRect(x, y, cell / 2, cell / 2);
        ctx.fillRect(x + cell / 2, y + cell / 2, cell / 2, cell / 2);
        continue;
      }
      const hex = yarns[v].hex;
      ctx.fillStyle = hex;
      ctx.fillRect(x, y, cell, cell);
      if (drawLabels) {
        ctx.fillStyle = contrastText(hex);
        ctx.fillText(cellGlyph(v, label), x + cell / 2, y + cell / 2 + 0.5);
      }
    }
  }

  // Grade
  const gridRight = padLeft + cols * cell;
  const gridBottom = padTop + rows * cell;
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(padLeft + c * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, gridBottom);
    // Pontos contados da direita pra esquerda: linha grossa a cada 5 a partir da direita.
    ctx.strokeStyle = (cols - c) % 5 === 0 ? "rgba(60,40,30,0.55)" : "rgba(60,40,30,0.16)";
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(padTop + r * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.strokeStyle = (rows - r) % 5 === 0 ? "rgba(60,40,30,0.55)" : "rgba(60,40,30,0.16)";
    ctx.stroke();
  }

  // Hover
  if (hover) {
    ctx.strokeStyle = "rgba(194,100,63,0.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(padLeft + hover.col * cell + 1, padTop + hover.row * cell + 1, cell - 2, cell - 2);
    ctx.lineWidth = 1;
  }

  if (!showNumbers) return m;

  ctx.fillStyle = "rgba(60,40,30,0.75)";
  ctx.font = `${cell >= 14 ? 10 : 9}px ui-sans-serif, system-ui, sans-serif`;
  // Carreiras: 1 = base
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const rowStep = cell >= 12 ? 1 : 5;
  for (let r = 0; r < rows; r++) {
    const n = rows - r;
    if (rowStep === 1 || n === 1 || n === rows || n % rowStep === 0) {
      ctx.fillText(String(n), padLeft - 5, padTop + r * cell + cell / 2);
    }
  }
  // Pontos: 1 = direita
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const colStep = cell >= 12 ? 1 : 5;
  for (let c = 0; c < cols; c++) {
    const n = cols - c;
    if (colStep === 1 || n === 1 || n === cols || n % colStep === 0) {
      ctx.fillText(String(n), padLeft + c * cell + cell / 2, padTop - 4);
    }
  }
  return m;
}
