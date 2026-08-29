// Preview do tecido: repete o motivo `repeatsX × repeatsY` vezes e desenha
// cada ponto com o desenhador da técnica. A proporção do ponto vem do gauge
// (tricô é mais largo que alto; ponto baixo é quase quadrado).

import { EMPTY_CELL, stitchAspect, type ChartDoc } from "./model";
import type { CraftSpec } from "./crafts";
import { stitchColors, type StitchColors } from "./stitches";

export interface PreviewOptions {
  /** Largura disponível em CSS px — o tecido preenche essa largura. */
  maxWidth: number;
  /** Zoom multiplicador (1 = cabe na largura). */
  zoom: number;
  /** Mostra a divisória entre repetições. */
  showRepeatLines: boolean;
  /** Se falso, desenha só o motivo (1 repetição). */
  repeat: boolean;
}

export interface PreviewMetrics {
  stitchW: number;
  stitchH: number;
  width: number;
  height: number;
}

export function previewMetrics(doc: ChartDoc, opts: PreviewOptions): PreviewMetrics {
  const rx = opts.repeat ? doc.repeatsX : 1;
  const ry = opts.repeat ? doc.repeatsY : 1;
  const totalCols = doc.cols * rx;
  const totalRows = doc.rows * ry;
  const aspect = stitchAspect(doc.gauge); // altura ÷ largura
  const stitchW = Math.max(3, (opts.maxWidth * opts.zoom) / totalCols);
  const stitchH = stitchW * aspect;
  return {
    stitchW,
    stitchH,
    width: Math.round(stitchW * totalCols),
    height: Math.round(stitchH * totalRows),
  };
}

export function drawPreview(canvas: HTMLCanvasElement, doc: ChartDoc, craft: CraftSpec, opts: PreviewOptions): PreviewMetrics {
  const m = previewMetrics(doc, opts);
  const rx = opts.repeat ? doc.repeatsX : 1;
  const ry = opts.repeat ? doc.repeatsY : 1;
  const totalCols = doc.cols * rx;
  const totalRows = doc.rows * ry;
  const { stitchW, stitchH, width, height } = m;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.round(width * dpr);
  const ph = Math.round(height * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Fundo "entre pontos": um tom escuro neutro que aparece nos vãos da malha.
  ctx.fillStyle = "#3a2f2a";
  ctx.fillRect(0, 0, width, height);

  const palette: (StitchColors | null)[] = doc.yarns.map((y) => stitchColors(y.hex));

  // De baixo pra cima: a carreira de cima cobre a base da de baixo (encaixe real).
  for (let R = totalRows - 1; R >= 0; R--) {
    const r = R % doc.rows;
    const y = R * stitchH;
    for (let C = 0; C < totalCols; C++) {
      const c = C % doc.cols;
      const v = doc.cells[r * doc.cols + c];
      if (v === EMPTY_CELL) {
        // Sem ponto: mostra o fundo branco (área vazada)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(C * stitchW, y, stitchW + 0.5, stitchH + 0.5);
        continue;
      }
      const colors = palette[v];
      if (!colors) continue;
      craft.drawStitch(ctx, C * stitchW, y, stitchW, stitchH, colors);
    }
  }

  if (opts.showRepeatLines && opts.repeat && (rx > 1 || ry > 1)) {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (let i = 1; i < rx; i++) {
      const x = Math.round(i * doc.cols * stitchW) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 1; i < ry; i++) {
      const y = Math.round(i * doc.rows * stitchH) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  return m;
}
