"use client";

// Importa uma imagem como ponto de partida do gráfico: reduz pra `cols`
// pontos de largura, quantiza as cores (median cut, do `crochet-chart.ts`) e
// vira fios + células editáveis. É o gerador antigo, agora dentro do editor.

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { buildChart, rowsForImage } from "@/lib/crochet-chart";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: ChartDoc;
  onImport: (result: ImportResult) => void;
}

export function ImportImageDialog({ open, onOpenChange, doc, onImport }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cols, setCols] = useState(Math.min(doc.cols, 60));
  const [colors, setColors] = useState(Math.min(Math.max(doc.yarns.length, 3), 8));

  useEffect(() => {
    if (!open) {
      setImg(null);
      setError(null);
    }
  }, [open]);

  const aspect = stitchAspect(doc.gauge);
  const rows = useMemo(
    () => (img ? Math.min(LIMITS.rows.max, rowsForImage(cols, img.naturalWidth, img.naturalHeight, aspect)) : 0),
    [img, cols, aspect],
  );

  const chart = useMemo(() => {
    if (!img || rows <= 0) return null;
    return buildChart(sampleImage(img, cols, rows), cols, rows, colors);
  }, [img, cols, rows, colors]);

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
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError("Não consegui abrir essa imagem.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }, []);

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
      <DialogContent className="sm:max-w-lg">
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
            <input type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="Imagem escolhida" className="h-24 w-24 rounded-lg border border-border object-contain" />
              <div className="flex-1 space-y-3">
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
                    <span className="text-xs text-muted-foreground">{colors}</span>
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
              </div>
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
              A altura segue a proporção do ponto do seu gauge. Áreas transparentes ficam sem ponto.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {img && (
            <Button variant="ghost" onClick={() => setImg(null)}>
              Trocar imagem
            </Button>
          )}
          <Button onClick={confirm} disabled={!chart || chart.palette.length === 0}>
            Usar como gráfico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
