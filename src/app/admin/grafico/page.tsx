"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileDown, ImagePlus, LayoutGrid, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  buildChart,
  chartToCsv,
  EMPTY_CELL,
  luminance,
  rowsForImage,
  type CrochetChart,
} from "@/lib/crochet-chart";

// Reduz a imagem para cols x rows e devolve os pixels (RGBA) — a base do gráfico.
function sampleImage(img: HTMLImageElement, cols: number, rows: number): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, cols, rows);
  ctx.drawImage(img, 0, 0, cols, rows);
  return ctx.getImageData(0, 0, cols, rows).data;
}

interface DrawOptions {
  cell: number;
  showOverlay: boolean;
  overlayMode: "letters" | "symbols";
  showNumbers: boolean;
}

// Desenha o gráfico (grade + números + legenda por célula) no canvas.
function drawChart(canvas: HTMLCanvasElement, chart: CrochetChart, opts: DrawOptions) {
  const { cols, rows, cells, palette } = chart;
  const { cell, showOverlay, overlayMode, showNumbers } = opts;

  const padLeft = showNumbers ? 30 : 6;
  const padBottom = showNumbers ? 22 : 6;
  const padTop = 6;
  const padRight = 6;
  const width = padLeft + cols * cell + padRight;
  const height = padTop + rows * cell + padBottom;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Células preenchidas
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = `${Math.max(7, Math.floor(cell * 0.58))}px ui-sans-serif, system-ui, sans-serif`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = cells[r * cols + c];
      if (v === EMPTY_CELL) continue;
      const color = palette[v];
      if (!color) continue;
      const x = padLeft + c * cell;
      const y = padTop + r * cell;
      ctx.fillStyle = color.hex;
      ctx.fillRect(x, y, cell, cell);
      if (showOverlay && cell >= 11) {
        ctx.fillStyle = luminance(color.rgb) > 140 ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.85)";
        ctx.font = font;
        const glyph = overlayMode === "symbols" ? color.symbol : color.label;
        ctx.fillText(glyph, x + cell / 2, y + cell / 2 + 0.5);
      }
    }
  }

  // Linhas da grade (finas por ponto, grossas a cada 10)
  const gridLeft = padLeft;
  const gridTop = padTop;
  const gridRight = padLeft + cols * cell;
  const gridBottom = padTop + rows * cell;
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(gridLeft + c * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, gridBottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = c % 10 === 0 ? "rgba(60,40,30,0.55)" : "rgba(60,40,30,0.14)";
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(gridTop + r * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(gridLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.lineWidth = 1;
    // Linhas grossas contadas de baixo pra cima (carreira 10, 20, ...)
    ctx.strokeStyle = (rows - r) % 10 === 0 ? "rgba(60,40,30,0.55)" : "rgba(60,40,30,0.14)";
    ctx.stroke();
  }

  if (!showNumbers) return;

  // Números das carreiras (esquerda, de baixo p/ cima) e pontos (base, esq. p/ dir.)
  ctx.fillStyle = "rgba(60,40,30,0.75)";
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let r = 0; r < rows; r++) {
    const n = rows - r; // carreira 1 = base
    if (n === 1 || n === rows || n % 5 === 0) {
      ctx.fillText(String(n), padLeft - 5, padTop + r * cell + cell / 2);
    }
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let c = 0; c < cols; c++) {
    const n = c + 1;
    if (n === 1 || n === cols || n % 5 === 0) {
      ctx.fillText(String(n), padLeft + c * cell + cell / 2, gridBottom + 5);
    }
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function GraficoPage() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imgName, setImgName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [cols, setCols] = useState(45);
  const [colors, setColors] = useState(12);
  const [stitchAspect, setStitchAspect] = useState(1);
  const [stitchWidthMm, setStitchWidthMm] = useState<string>("");

  const [cell, setCell] = useState(18);
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayMode, setOverlayMode] = useState<"letters" | "symbols">("letters");
  const [showNumbers, setShowNumbers] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rows = useMemo(
    () => (img ? rowsForImage(cols, img.naturalWidth, img.naturalHeight, stitchAspect) : 0),
    [img, cols, stitchAspect],
  );

  const chart = useMemo(() => {
    if (!img || rows <= 0) return null;
    const data = sampleImage(img, cols, rows);
    return buildChart(data, cols, rows, colors);
  }, [img, cols, rows, colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chart) return;
    drawChart(canvas, chart, { cell, showOverlay, overlayMode, showNumbers });
  }, [chart, cell, showOverlay, overlayMode, showNumbers]);

  const loadFile = useCallback((file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem (PNG, JPG, etc).");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setImgName(file.name);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError("Não consegui abrir essa imagem.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }, []);

  const mm = parseFloat(stitchWidthMm.replace(",", "."));
  const finished =
    chart && mm > 0
      ? {
          w: (cols * mm) / 10,
          h: (rows * mm * stitchAspect) / 10,
        }
      : null;

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "grafico-croche.png";
    a.click();
  };

  const downloadCsv = () => {
    if (!chart) return;
    const blob = new Blob(["﻿" + chartToCsv(chart)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receita-croche.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setImg(null);
    setImgName("");
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* CSS só de impressão: esconde controles e deixa gráfico + receita. */}
      <style>{`
        @media print {
          aside, [data-noprint] { display: none !important; }
          [data-print-area] { break-inside: avoid; }
          main { max-width: none !important; padding: 0 !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3" data-noprint>
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <LayoutGrid className="size-6 text-primary" /> Gráfico de crochê
          </h1>
          <p className="text-sm text-muted-foreground">
            Jogue uma imagem e gere a grade de pontos + a receita (quantos pontos de cada cor).
          </p>
        </div>
        {img && (
          <Button variant="ghost" onClick={reset} className="text-muted-foreground">
            <RotateCcw className="size-4" /> Trocar imagem
          </Button>
        )}
      </div>

      {!img ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            loadFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/50",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <ImagePlus className="size-10 text-primary" />
          <div>
            <p className="font-medium">Arraste uma imagem aqui ou clique para escolher</p>
            <p className="text-sm text-muted-foreground">
              Funciona melhor com desenhos simples e contrastados.
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Controles */}
          <div className="space-y-5" data-noprint>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="truncate text-xs text-muted-foreground">{imgName}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt="Imagem original"
                className="mt-2 max-h-40 w-full rounded-lg object-contain"
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <Field label="Largura (pontos)" hint={`${cols}`}>
                <input
                  type="range"
                  min={10}
                  max={140}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </Field>
              <Field label="Número de cores" hint={`${colors}`}>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={colors}
                  onChange={(e) => setColors(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </Field>
              <Field label="Proporção do ponto" hint={`${stitchAspect.toFixed(2)} (alt÷larg)`}>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.05}
                  value={stitchAspect}
                  onChange={(e) => setStitchAspect(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </Field>
              <Field label="Largura do ponto (mm)" hint="opcional">
                <Input
                  inputMode="decimal"
                  placeholder="ex: 5"
                  value={stitchWidthMm}
                  onChange={(e) => setStitchWidthMm(e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Exibição</p>
              <Field label="Zoom da grade" hint={`${cell}px`}>
                <input
                  type="range"
                  min={8}
                  max={30}
                  value={cell}
                  onChange={(e) => setCell(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </Field>
              <label className="flex items-center justify-between text-sm">
                Números das carreiras
                <input
                  type="checkbox"
                  checked={showNumbers}
                  onChange={(e) => setShowNumbers(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                Legenda nas células
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </label>
              {showOverlay && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={overlayMode === "letters" ? "default" : "outline"}
                    onClick={() => setOverlayMode("letters")}
                    className="flex-1"
                  >
                    Letras
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={overlayMode === "symbols" ? "default" : "outline"}
                    onClick={() => setOverlayMode("symbols")}
                    className="flex-1"
                  >
                    Símbolos
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={downloadPng} variant="outline">
                <Download className="size-4" /> Baixar gráfico (PNG)
              </Button>
              <Button onClick={downloadCsv} variant="outline">
                <FileDown className="size-4" /> Baixar receita (CSV)
              </Button>
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="size-4" /> Imprimir
              </Button>
            </div>
          </div>

          {/* Gráfico + receita */}
          <div className="space-y-6" data-print-area>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="overflow-auto rounded-2xl border border-border bg-white p-4">
              <canvas ref={canvasRef} className="mx-auto block" />
            </div>

            {chart && chart.palette.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-heading text-lg">Receita</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Total de pontos</dt>
                    <dd className="text-right font-medium">{chart.total.toLocaleString("pt-BR")}</dd>
                    <dt className="text-muted-foreground">Carreiras</dt>
                    <dd className="text-right font-medium">{chart.rows}</dd>
                    <dt className="text-muted-foreground">Pontos por carreira</dt>
                    <dd className="text-right font-medium">{chart.cols}</dd>
                    <dt className="text-muted-foreground">Cores</dt>
                    <dd className="text-right font-medium">{chart.palette.length}</dd>
                    {finished && (
                      <>
                        <dt className="text-muted-foreground">Tamanho final ≈</dt>
                        <dd className="text-right font-medium">
                          {finished.w.toFixed(1).replace(".", ",")} ×{" "}
                          {finished.h.toFixed(1).replace(".", ",")} cm
                        </dd>
                      </>
                    )}
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Leia de baixo para cima. Áreas transparentes ficam sem ponto.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-heading text-lg">Cores</p>
                  <ul className="mt-3 space-y-1.5">
                    {chart.palette.map((c) => (
                      <li key={c.hex} className="flex items-center gap-3 text-sm">
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-foreground/10"
                          style={{
                            backgroundColor: c.hex,
                            color: luminance(c.rgb) > 140 ? "#3a2a22" : "#ffffff",
                          }}
                        >
                          {overlayMode === "symbols" ? c.symbol : c.label}
                        </span>
                        <span className="font-mono text-xs uppercase text-muted-foreground">
                          {c.hex}
                        </span>
                        <span className="ml-auto tabular-nums">
                          {c.count.toLocaleString("pt-BR")} pts
                        </span>
                        <span className="w-12 text-right tabular-nums text-muted-foreground">
                          {c.percent.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
