"use client";

// Importa uma imagem como ponto de partida do gráfico: reduz pra `cols`
// pontos de largura, quantiza as cores (median cut, do `crochet-chart.ts`) e
// vira fios + células editáveis. É o gerador antigo, agora dentro do editor.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildChart, EMPTY_CELL, rowsForImage, type CrochetChart } from "@/lib/crochet-chart";
import { LIMITS, stitchAspect, type ChartDoc, type Yarn } from "@/lib/chart-editor/model";

export interface ImportResult {
  cols: number;
  rows: number;
  yarns: Yarn[];
  cells: Uint8Array;
}

function sampleImage(img: HTMLImageElement, cols: number, rows: number): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, cols, rows);
  return ctx.getImageData(0, 0, cols, rows).data;
}

/** Prévia do gráfico que vai sair: célula = quadradinho, sem números nem legenda. */
function drawImportPreview(canvas: HTMLCanvasElement, chart: CrochetChart, box: { width: number; height: number }) {
  const { cols, rows, cells, palette } = chart;
  const cell = Math.max(2, Math.floor(Math.min(box.width / cols, box.height / rows)));
  const width = cols * cell;
  const height = rows * cell;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = cells[r * cols + c];
      if (v === EMPTY_CELL) continue;
      const color = palette[v];
      if (!color) continue;
      ctx.fillStyle = color.hex;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  // Grade fina só quando o ponto é grande o bastante pra ela não virar borrão.
  if (cell < 6) return;
  ctx.strokeStyle = "rgba(60,40,30,0.16)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cell) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: ChartDoc;
  onImport: (result: ImportResult) => void;
}

export function ImportImageDialog({ open, onOpenChange, doc, onImport }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  // URL do arquivo escolhido: fica viva enquanto a miniatura estiver na tela
  // (revogar no onload deixava a <img> do diálogo quebrada).
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgName, setImgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cols, setCols] = useState(Math.min(doc.cols, 60));
  const [colors, setColors] = useState(Math.min(Math.max(doc.yarns.length, 3), 8));
  const previewRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  // Espaço que a prévia pode ocupar: no celular o diálogo é estreito e o
  // rodapé precisa continuar alcançável sem rolagem infinita.
  const [previewBox, setPreviewBox] = useState({ width: 260, height: 260 });

  const clear = useCallback(() => {
    setImg(null);
    setImgName("");
    setImgUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      clear();
      setError(null);
    }
  }, [open, clear]);

  // Solta o objectURL ao desmontar (não segura o arquivo na memória).
  useEffect(
    () => () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    },
    [imgUrl],
  );

  const aspect = stitchAspect(doc.gauge);
  const rows = useMemo(
    () => (img ? Math.min(LIMITS.rows.max, rowsForImage(cols, img.naturalWidth, img.naturalHeight, aspect)) : 0),
    [img, cols, aspect],
  );

  const chart = useMemo(() => {
    if (!img || rows <= 0) return null;
    return buildChart(sampleImage(img, cols, rows), cols, rows, colors);
  }, [img, cols, rows, colors]);

  useEffect(() => {
    const box = previewBoxRef.current;
    if (!box) return;
    const measure = () => {
      const width = Math.max(120, box.clientWidth - 16);
      const wide = window.matchMedia("(min-width: 640px)").matches;
      setPreviewBox({ width: Math.min(width, 260), height: wide ? 260 : 190 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [img]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (canvas && chart) drawImportPreview(canvas, chart, previewBox);
  }, [chart, previewBox]);

  const loadFile = useCallback(
    (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Escolha um arquivo de imagem (PNG, JPG, etc).");
        return;
      }
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        clear();
        setImg(image);
        setImgUrl(url);
        setImgName(file.name);
      };
      image.onerror = () => {
        setError("Não consegui abrir essa imagem.");
        URL.revokeObjectURL(url);
      };
      image.src = url;
    },
    [clear],
  );

  const confirm = () => {
    if (!chart) return;
    onImport({
      cols: chart.cols,
      rows: chart.rows,
      yarns: chart.palette.map((c) => ({ name: `Cor ${c.label}`, hex: c.hex })),
      cells: chart.cells,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Importar imagem</DialogTitle>
          <DialogDescription>
            A imagem vira pontos e cores editáveis. Funciona melhor com desenhos simples e contrastados.
          </DialogDescription>
        </DialogHeader>

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
              "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center transition-colors hover:border-primary/50",
              dragging && "border-primary bg-primary/5",
            )}
          >
            <ImagePlus className="size-8 text-primary" />
            <p className="text-sm font-medium">Arraste uma imagem ou clique para escolher</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — o desenho vira grade de pontos.</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
          </label>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0 space-y-4">
              <div className="flex gap-3">
                {imgUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imgUrl}
                    alt="Imagem escolhida"
                    className="size-20 shrink-0 rounded-lg border border-border bg-muted object-contain"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{imgName}</p>
                  <p className="text-xs text-muted-foreground">
                    {img.naturalWidth} × {img.naturalHeight} px
                  </p>
                  <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={clear}>
                    Trocar imagem
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Label>Largura (pontos)</Label>
                  <span className="text-xs text-muted-foreground">
                    {cols} × {rows}
                  </span>
                </div>
                <input
                  type="range"
                  min={LIMITS.cols.min}
                  max={LIMITS.cols.max}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Label>Número de cores</Label>
                  <span className="text-xs text-muted-foreground">{chart?.palette.length ?? colors}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={LIMITS.yarns.max}
                  value={colors}
                  onChange={(e) => setColors(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {chart && (
                <div className="flex flex-wrap gap-1.5">
                  {chart.palette.map((c) => (
                    <span
                      key={c.hex}
                      className="size-6 rounded-md ring-1 ring-foreground/10"
                      style={{ backgroundColor: c.hex }}
                      title={`${c.label} · ${c.hex} · ${c.count} pts`}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                A altura segue a proporção do ponto do seu gauge. Áreas transparentes ficam sem ponto. Depois de
                importar dá pra pintar, trocar as cores e desfazer com Ctrl+Z.
              </p>
            </div>

            {/* Prévia do gráfico que vai sair — não só da imagem original. */}
            <div className="space-y-1.5 sm:w-[280px]">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Prévia do gráfico</p>
                {chart && (
                  <p className="text-xs text-muted-foreground">{chart.total.toLocaleString("pt-BR")} pontos</p>
                )}
              </div>
              <div
                ref={previewBoxRef}
                className="flex min-h-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2"
              >
                <canvas ref={previewRef} className="block" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Grudado embaixo: no celular a prévia é alta e o botão sumia da tela. */}
        <DialogFooter className="sticky bottom-0 -mb-2 bg-background pb-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!chart || chart.palette.length === 0}>
            Usar como gráfico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
