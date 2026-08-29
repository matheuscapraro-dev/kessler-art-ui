// Desenho de UM ponto no preview do tecido. Cada técnica tem a sua forma:
// tricô (meia) é o "V" clássico de malha; crochê (ponto baixo, tapestry) é um
// "tijolinho" com as duas alças do topo visíveis. Ambos recebem a caixa do
// ponto (x, y, w, h) e a cor do fio; sombra e brilho são derivados da cor.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0xcccccc;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Mistura a cor com preto (amount<0) ou branco (amount>0). amount em [-1, 1]. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = amount > 0 ? 255 : 0;
  const k = Math.abs(amount);
  return rgbToHex({ r: r + (t - r) * k, g: g + (t - g) * k, b: b + (t - b) * k });
}

/** Luminância (0–255) pra decidir texto claro/escuro sobre a cor. */
export function luminanceOf(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function contrastText(hex: string): string {
  return luminanceOf(hex) > 150 ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.88)";
}

export interface StitchColors {
  base: string;
  dark: string;
  darker: string;
  light: string;
}

const colorCache = new Map<string, StitchColors>();

export function stitchColors(hex: string): StitchColors {
  let c = colorCache.get(hex);
  if (!c) {
    c = {
      base: hex,
      dark: shade(hex, -0.18),
      darker: shade(hex, -0.38),
      light: shade(hex, 0.22),
    };
    colorCache.set(hex, c);
  }
  return c;
}

export type StitchDrawer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: StitchColors,
) => void;

/**
 * Ponto de meia (tricô): duas pernas em "V" que descem e somem atrás do ponto
 * de baixo. Desenhado de baixo pra cima, a carreira de cima cobre a cabeça da
 * de baixo — o entrelaçado real da malha.
 */
export const drawKnitStitch: StitchDrawer = (ctx, x, y, w, h, colors) => {
  const legW = w * 0.42;
  const cx = x + w / 2;
  const top = y + h * 0.12;
  const bottom = y + h + h * 0.55; // as pernas seguem até dentro da carreira de baixo

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const leg = (fromX: number, ctrlX: number, color: string, width: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(fromX, top + dy);
    ctx.quadraticCurveTo(ctrlX, y + h * 0.75 + dy, cx, bottom + dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const lx = x + w * 0.22;
  const rx = x + w * 0.78;

  // Sombra (contorno mais escuro), perna base e brilho.
  leg(lx, x + w * 0.1, colors.darker, legW + Math.max(1, w * 0.12), 0);
  leg(rx, x + w * 0.9, colors.darker, legW + Math.max(1, w * 0.12), 0);
  leg(lx, x + w * 0.1, colors.base, legW, 0);
  leg(rx, x + w * 0.9, colors.base, legW, 0);
  if (w >= 9) {
    leg(lx - w * 0.04, x + w * 0.04, colors.light, legW * 0.32, -h * 0.04);
    leg(rx - w * 0.04, x + w * 0.84, colors.light, legW * 0.32, -h * 0.04);
  }
};

/**
 * Ponto baixo (crochê, tapestry): corpo vertical arredondado e, no topo, as
 * duas alças ("V" deitado) da carreira — a textura típica de amigurumi/tapestry.
 */
export const drawCrochetStitch: StitchDrawer = (ctx, x, y, w, h, colors) => {
  const pad = Math.max(0.5, w * 0.05);
  const loopH = h * 0.34;
  const bodyY = y + loopH * 0.7;
  const bodyH = h - loopH * 0.7 + h * 0.08;
  const r = Math.min(w, bodyH) * 0.28;

  // Corpo (poste) com sombra na base
  const grad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  grad.addColorStop(0, colors.base);
  grad.addColorStop(1, colors.dark);
  roundRect(ctx, x + pad, bodyY, w - pad * 2, bodyH, r);
  ctx.fillStyle = colors.darker;
  ctx.fill();
  roundRect(ctx, x + pad, bodyY, w - pad * 2 - Math.max(0.5, w * 0.06), bodyH - Math.max(0.5, h * 0.06), r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Alças do topo: duas elipses lado a lado, a da direita levemente acima (giro do fio)
  const ry = loopH * 0.5;
  const rxL = w * 0.3;
  const cy = y + loopH * 0.5;
  ellipse(ctx, x + w * 0.32, cy + loopH * 0.08, rxL, ry, -0.35, colors.darker);
  ellipse(ctx, x + w * 0.68, cy - loopH * 0.04, rxL, ry, -0.35, colors.darker);
  ellipse(ctx, x + w * 0.32, cy + loopH * 0.08, rxL * 0.82, ry * 0.78, -0.35, colors.base);
  ellipse(ctx, x + w * 0.68, cy - loopH * 0.04, rxL * 0.82, ry * 0.78, -0.35, colors.base);
  if (w >= 10) {
    ellipse(ctx, x + w * 0.29, cy + loopH * 0.0, rxL * 0.4, ry * 0.32, -0.35, colors.light);
    ellipse(ctx, x + w * 0.65, cy - loopH * 0.12, rxL * 0.4, ry * 0.32, -0.35, colors.light);
  }
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  color: string,
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
