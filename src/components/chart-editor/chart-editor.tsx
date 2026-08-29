"use client";

// Editor de gráficos de crochê/tricô. O que muda entre as duas técnicas está
// no `CraftSpec`; este componente é o mesmo pros dois.
//
// Layout: cabeçalho (nome + arquivo) · preview do tecido · grade editável com
// barra de ferramentas · barra lateral (grade, gauge, fios, receita).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Download,
  Eraser,
  FileDown,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  ImagePlus,
  Minus,
  PaintBucket,
  Paintbrush,
  Pipette,
  Plus,
  Printer,
  Redo2,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALL_THEME_YARNS, CRAFTS } from "@/lib/chart-editor/crafts";
import {
  addYarn,
  clearDoc,
  computeRecipe,
  EMPTY_CELL,
  flipDoc,
  floodFill,
  fromJson,
  LIMITS,
  linePoints,
  mirroredPoints,
  paintCells,
  recipeToCsv,
  removeYarn,
  resizeDoc,
  shiftDoc,
  toJson,
  updateYarn,
  type ChartDoc,
  type Craft,
  type Mirror,
  type Point,
} from "@/lib/chart-editor/model";
import { cellGlyph, drawGrid, gridMetrics, pointToCell, type CellLabel } from "@/lib/chart-editor/render-grid";
import { drawPreview } from "@/lib/chart-editor/render-preview";
import { contrastText } from "@/lib/chart-editor/stitches";
import { useChartDoc } from "./use-chart-doc";
import { YarnPanel } from "./yarn-panel";
import { ImportImageDialog, type ImportResult } from "./import-image-dialog";

type Tool = "brush" | "bucket" | "picker" | "eraser";

const TOOLS: { key: Tool; label: string; shortcut: string; icon: typeof Paintbrush }[] = [
  { key: "brush", label: "Pincel", shortcut: "B", icon: Paintbrush },
  { key: "bucket", label: "Balde", shortcut: "G", icon: PaintBucket },
  { key: "picker", label: "Conta-gotas", shortcut: "I", icon: Pipette },
  { key: "eraser", label: "Borracha (sem ponto)", shortcut: "E", icon: Eraser },
];

const ZOOM_STEPS = [8, 10, 12, 14, 16, 18, 22, 26, 30, 36, 44];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");

/** Campo numérico que só aplica no blur/Enter (evita redimensionar a cada tecla) e com −/+. */
function NumberField({
  label,
  value,
  min,
  max,
  onCommit,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Math.round(Number(text.replace(",", ".")));
    if (!Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    const v = Math.min(max, Math.max(min, n));
    setText(String(v));
    if (v !== value) onCommit(v);
  };
  const step = (d: number) => {
    const v = Math.min(max, Math.max(min, value + d));
    if (v !== value) onCommit(v);
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon-sm" onClick={() => step(-1)} disabled={value <= min} aria-label={`Diminuir ${label}`}>
          <Minus />
        </Button>
        <Input
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-7 w-14 px-1 text-center tabular-nums"
          aria-label={label}
        />
        <Button type="button" variant="outline" size="icon-sm" onClick={() => step(1)} disabled={value >= max} aria-label={`Aumentar ${label}`}>
          <Plus />
        </Button>
        {suffix && <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3 rounded-2xl border border-border bg-card p-4", className)}>
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </section>
  );
}

export function ChartEditor({ craft }: { craft: Craft }) {
  const api = useChartDoc(craft);
  const { spec, doc, ready, update, replace, undo, redo, canUndo, canRedo } = api;
  const other = CRAFTS[craft === "croche" ? "trico" : "croche"];

  const [tool, setTool] = useState<Tool>("brush");
  const [activeYarn, setActiveYarn] = useState(1);
  const [mirror, setMirror] = useState<Mirror>({ horizontal: false, vertical: false });
  const [zoomIdx, setZoomIdx] = useState(6); // 22px
  const [label, setLabel] = useState<CellLabel>("number");
  const [showNumbers, setShowNumbers] = useState(true);
  const [hover, setHover] = useState<Point | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRepeat, setPreviewRepeat] = useState(true);
  const [showRepeatLines, setShowRepeatLines] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stroke = useRef<{ active: boolean; last: Point | null; value: number }>({ active: false, last: null, value: 0 });

  const cell = ZOOM_STEPS[zoomIdx];
  const metrics = useMemo(() => gridMetrics(doc, { cell, showNumbers }), [doc, cell, showNumbers]);
  const recipe = useMemo(() => computeRecipe(doc), [doc]);
  const safeActive = Math.min(activeYarn, doc.yarns.length - 1);

  // ─── Desenho ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas || !ready) return;
    drawGrid(canvas, doc, { cell, label, showNumbers });
  }, [doc, cell, label, showNumbers, ready]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(metrics.width * dpr);
    canvas.height = Math.round(metrics.height * dpr);
    canvas.style.width = `${metrics.width}px`;
    canvas.style.height = `${metrics.height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, metrics.width, metrics.height);
    if (!hover) return;
    const pts = mirroredPoints(doc, hover, mirror);
    for (const p of pts) {
      ctx.strokeStyle = p === hover ? "rgba(194,100,63,0.95)" : "rgba(194,100,63,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(metrics.padLeft + p.col * cell + 1, metrics.padTop + p.row * cell + 1, cell - 2, cell - 2);
    }
  }, [hover, metrics, cell, doc, mirror]);

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setPreviewWidth(Math.max(0, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !ready || previewWidth <= 0) return;
    const raf = requestAnimationFrame(() => {
      drawPreview(canvas, doc, spec, {
        maxWidth: previewWidth,
        zoom: previewZoom,
        showRepeatLines,
        repeat: previewRepeat,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [doc, spec, ready, previewWidth, previewZoom, showRepeatLines, previewRepeat]);

  // ─── Pintura ─────────────────────────────────────────────────────────
  const cellFromEvent = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
      const rect = e.currentTarget.getBoundingClientRect();
      return pointToCell(doc, metrics, e.clientX - rect.left, e.clientY - rect.top);
    },
    [doc, metrics],
  );

  const applyStroke = useCallback(
    (from: Point | null, to: Point, value: number, record: boolean) => {
      const pts = (from ? linePoints(from, to) : [to]).flatMap((p) => mirroredPoints(doc, p, mirror));
      update((d) => {
        const cells = paintCells(d, pts, value);
        return cells === d.cells ? d : { ...d, cells };
      }, record);
    },
    [doc, mirror, update],
  );

  const pick = useCallback(
    (p: Point) => {
      const v = doc.cells[p.row * doc.cols + p.col];
      if (v === EMPTY_CELL) {
        setTool("eraser");
      } else {
        setActiveYarn(v);
        setTool("brush");
      }
    },
    [doc],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
    const p = cellFromEvent(e);
    if (!p) return;
    e.preventDefault();
    // Botão direito = conta-gotas rápido
    if (e.button === 2 || tool === "picker") {
      pick(p);
      return;
    }
    const value = tool === "eraser" ? EMPTY_CELL : safeActive;
    if (tool === "bucket") {
      const pts = mirroredPoints(doc, p, mirror);
      update((d) => {
        let cells = d.cells;
        let cur = d;
        for (const q of pts) {
          cells = floodFill(cur, q, value);
          cur = { ...cur, cells };
        }
        return cells === d.cells ? d : cur;
      });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = { active: true, last: p, value };
    applyStroke(null, p, value, true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = cellFromEvent(e);
    setHover((h) => (h?.col === p?.col && h?.row === p?.row ? h : p));
    const s = stroke.current;
    if (!s.active || !p) return;
    if (s.last && s.last.col === p.col && s.last.row === p.row) return;
    applyStroke(s.last, p, s.value, false);
    s.last = p;
  };

  const endStroke = () => {
    stroke.current.active = false;
    stroke.current.last = null;
  };

  // ─── Atalhos ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod) return;
      const k = e.key.toLowerCase();
      if (k === "b") setTool("brush");
      else if (k === "g") setTool("bucket");
      else if (k === "i") setTool("picker");
      else if (k === "e") setTool("eraser");
      else if (k === "h") setMirror((m) => ({ ...m, horizontal: !m.horizontal }));
      else if (k === "v") setMirror((m) => ({ ...m, vertical: !m.vertical }));
      else if (k === "[") setZoomIdx((z) => Math.max(0, z - 1));
      else if (k === "]") setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1));
      else if (/^[1-9]$/.test(k)) {
        const i = Number(k) - 1;
        if (i < doc.yarns.length) {
          setActiveYarn(i);
          setTool("brush");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc.yarns.length, undo, redo]);

  // ─── Arquivo ─────────────────────────────────────────────────────────
  const fileBase = `grafico-${craft}-${slug(doc.name) || "sem-nome"}`;

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(toJson(doc), null, 0)], { type: "application/json" });
    downloadBlob(blob, `${fileBase}.json`);
    toast.success("Gráfico salvo no seu computador.");
  };

  const openJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const parsed = fromJson(raw, craft);
      if (parsed) {
        replace(parsed);
        toast.success("Gráfico aberto.");
        return;
      }
      const any = fromJson(raw);
      if (any) {
        toast.error(`Esse arquivo é um gráfico de ${CRAFTS[any.craft].shortTitle.toLowerCase()} — abra no editor de ${CRAFTS[any.craft].shortTitle.toLowerCase()}.`);
      } else {
        toast.error("Esse arquivo não é um gráfico válido.");
      }
    } catch {
      toast.error("Não consegui ler esse arquivo.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onImport = (r: ImportResult) => {
    replace({ ...doc, cols: r.cols, rows: r.rows, yarns: r.yarns, cells: r.cells });
    setActiveYarn(0);
    toast.success(`Imagem importada: ${r.cols} × ${r.rows} ${spec.stitchWordPlural}.`);
  };

  const exportPng = (which: "chart" | "preview") => {
    const canvas = which === "chart" ? gridCanvasRef.current : previewRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${fileBase}-${which === "chart" ? "grafico" : "tecido"}.png`);
    }, "image/png");
  };

  const exportCsv = () => {
    const blob = new Blob(["﻿" + recipeToCsv(doc, recipe)], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `${fileBase}-receita.csv`);
  };

  const newDoc = () => {
    api.reset();
    setActiveYarn(1);
    toast("Gráfico novo. Ctrl+Z desfaz.");
  };

  const onAddYarn = () => {
    const used = new Set(doc.yarns.map((y) => y.hex));
    const next =
      ALL_THEME_YARNS.find((y) => !used.has(y.hex)) ??
      ({ name: `Fio ${doc.yarns.length + 1}`, hex: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}` });
    update((d) => addYarn(d, { ...next }), false);
    setActiveYarn(doc.yarns.length);
    setTool("brush");
  };

  const onRemoveYarn = (i: number) => {
    update((d) => removeYarn(d, i));
    setActiveYarn((a) => (a > i ? a - 1 : a === i ? 0 : a));
  };

  const stitchMm = {
    w: (100 / doc.gauge.stitches).toFixed(1).replace(".", ","),
    h: (100 / doc.gauge.rows).toFixed(1).replace(".", ","),
  };

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          aside, nav, [data-noprint] { display: none !important; }
          [data-print-area] { break-inside: avoid; }
          main { max-width: none !important; padding: 0 !important; }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-3" data-noprint>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin/grafico" className="hover:text-foreground">
              Gráficos
            </Link>
            <span>/</span>
            <span>{spec.shortTitle}</span>
            <span>·</span>
            <Link href={`/admin/grafico/${other.key}`} className="underline-offset-4 hover:underline">
              ir para {other.shortTitle.toLowerCase()}
            </Link>
          </div>
          <h1 className="font-heading text-2xl font-semibold">{spec.title}</h1>
          <p className="text-sm text-muted-foreground">{spec.technique}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={doc.name}
            onChange={(e) => update((d) => ({ ...d, name: e.target.value }), false)}
            placeholder="Nome do gráfico"
            className="h-8 w-44"
            aria-label="Nome do gráfico"
          />
          <Button variant="outline" onClick={newDoc}>
            <Plus /> Novo
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <FolderOpen /> Abrir
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void openJson(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={saveJson}>
            <Save /> Salvar
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <ImagePlus /> Importar imagem
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download /> Exportar <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportPng("chart")}>
                <Download /> Gráfico (PNG)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPng("preview")}>
                <Download /> Tecido (PNG)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv}>
                <FileDown /> Receita (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer /> Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Preview + grade */}
        <div className="min-w-0 space-y-5" data-print-area>
          <section className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2" data-noprint>
              <p className="text-sm font-semibold">
                Tecido{" "}
                <span className="font-normal text-muted-foreground">
                  · {doc.cols * (previewRepeat ? doc.repeatsX : 1)} × {doc.rows * (previewRepeat ? doc.repeatsY : 1)}{" "}
                  {spec.stitchWordPlural}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant={previewRepeat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setPreviewRepeat((v) => !v)}
                  aria-pressed={previewRepeat}
                >
                  Repetições
                </Button>
                <Button
                  variant={showRepeatLines ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowRepeatLines((v) => !v)}
                  aria-pressed={showRepeatLines}
                  disabled={!previewRepeat}
                >
                  Divisórias
                </Button>
                <div className="ml-1 flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => setPreviewZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} disabled={previewZoom <= 1} aria-label="Diminuir zoom do tecido">
                    <ZoomOut />
                  </Button>
                  <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">{Math.round(previewZoom * 100)}%</span>
                  <Button variant="outline" size="icon-sm" onClick={() => setPreviewZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))} disabled={previewZoom >= 4} aria-label="Aumentar zoom do tecido">
                    <ZoomIn />
                  </Button>
                </div>
              </div>
            </div>
            <div ref={previewWrapRef} className="overflow-auto rounded-xl bg-[#3a2f2a]">
              <canvas ref={previewRef} className="block" aria-label="Prévia do tecido" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            {/* Barra de ferramentas */}
            <div className="mb-3 flex flex-wrap items-center gap-2" data-noprint>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                {TOOLS.map((t) => (
                  <Button
                    key={t.key}
                    variant={tool === t.key ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setTool(t.key)}
                    aria-label={`${t.label} (${t.shortcut})`}
                    aria-pressed={tool === t.key}
                    title={`${t.label} (${t.shortcut})`}
                  >
                    <t.icon />
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <Button
                  variant={mirror.horizontal ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setMirror((m) => ({ ...m, horizontal: !m.horizontal }))}
                  aria-pressed={mirror.horizontal}
                  aria-label="Espelhar ao pintar: horizontal (H)"
                  title="Espelhar ao pintar: horizontal (H)"
                >
                  <FlipHorizontal2 />
                </Button>
                <Button
                  variant={mirror.vertical ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setMirror((m) => ({ ...m, vertical: !m.vertical }))}
                  aria-pressed={mirror.vertical}
                  aria-label="Espelhar ao pintar: vertical (V)"
                  title="Espelhar ao pintar: vertical (V)"
                >
                  <FlipVertical2 />
                </Button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Desfazer (Ctrl+Z)" title="Desfazer (Ctrl+Z)">
                  <Undo2 />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Refazer (Ctrl+Shift+Z)" title="Refazer (Ctrl+Shift+Z)">
                  <Redo2 />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Transformar <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => update((d) => flipDoc(d, "horizontal"))}>
                    <FlipHorizontal2 /> Inverter horizontal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => update((d) => flipDoc(d, "vertical"))}>
                    <FlipVertical2 /> Inverter vertical
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => update((d) => shiftDoc(d, 0, -1))}>
                    <ArrowUp /> Deslocar para cima
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => update((d) => shiftDoc(d, 0, 1))}>
                    <ArrowDown /> Deslocar para baixo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => update((d) => shiftDoc(d, -1, 0))}>
                    <ArrowLeft /> Deslocar para a esquerda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => update((d) => shiftDoc(d, 1, 0))}>
                    <ArrowRight /> Deslocar para a direita
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => update(clearDoc)} className="text-destructive">
                    <Trash2 /> Limpar tudo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Select value={label} onValueChange={(v) => setLabel(v as CellLabel)}>
                  <SelectTrigger size="sm" className="w-32" aria-label="Legenda nas células">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Números</SelectItem>
                    <SelectItem value="letter">Letras</SelectItem>
                    <SelectItem value="none">Sem legenda</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showNumbers ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowNumbers((v) => !v)}
                  aria-pressed={showNumbers}
                >
                  Numeração
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => setZoomIdx((z) => Math.max(0, z - 1))} disabled={zoomIdx === 0} aria-label="Diminuir zoom da grade ([)">
                    <ZoomOut />
                  </Button>
                  <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">{cell}px</span>
                  <Button variant="outline" size="icon-sm" onClick={() => setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Aumentar zoom da grade (])">
                    <ZoomIn />
                  </Button>
                </div>
              </div>
            </div>

            {/* Fio ativo */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm" data-noprint>
              <span className="text-muted-foreground">Pintando com</span>
              {tool === "eraser" ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-0.5 text-xs">
                  <Eraser className="size-3.5" /> sem ponto
                </span>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-foreground/10"
                  style={{ backgroundColor: doc.yarns[safeActive]?.hex, color: contrastText(doc.yarns[safeActive]?.hex ?? "#fff") }}
                  onClick={() => setActiveYarn((a) => (a + 1) % doc.yarns.length)}
                  title="Trocar para o próximo fio"
                >
                  {cellGlyph(safeActive, label === "none" ? "number" : label)} · {doc.yarns[safeActive]?.name || `Fio ${safeActive + 1}`}
                </button>
              )}
              <span className="text-xs text-muted-foreground">
                · arraste para pintar · botão direito = conta-gotas · teclas 1–9 trocam o fio
              </span>
            </div>

            <div className="overflow-auto rounded-xl border border-border bg-white">
              <div className="relative w-max" style={{ touchAction: "none" }}>
                <canvas ref={gridCanvasRef} className="block" aria-label="Gráfico" />
                <canvas
                  ref={overlayRef}
                  className={cn("absolute left-0 top-0 block", tool === "picker" ? "cursor-copy" : "cursor-crosshair")}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endStroke}
                  onPointerCancel={endStroke}
                  onPointerLeave={() => setHover(null)}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Barra lateral */}
        <div className="space-y-4">
          <Panel title="Grade" className="print:hidden">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label={spec.stitchWordPlural[0].toUpperCase() + spec.stitchWordPlural.slice(1)}
                value={doc.cols}
                min={LIMITS.cols.min}
                max={LIMITS.cols.max}
                onCommit={(v) => update((d) => resizeDoc(d, v, d.rows))}
              />
              <NumberField
                label="Carreiras"
                value={doc.rows}
                min={LIMITS.rows.min}
                max={LIMITS.rows.max}
                onCommit={(v) => update((d) => resizeDoc(d, d.cols, v))}
              />
              <NumberField
                label="Repetir na largura"
                value={doc.repeatsX}
                min={LIMITS.repeats.min}
                max={LIMITS.repeats.max}
                onCommit={(v) => update((d) => ({ ...d, repeatsX: v }), false)}
              />
              <NumberField
                label="Repetir na altura"
                value={doc.repeatsY}
                min={LIMITS.repeats.min}
                max={LIMITS.repeats.max}
                onCommit={(v) => update((d) => ({ ...d, repeatsY: v }), false)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ao crescer, o desenho fica ancorado embaixo e à esquerda (carreira 1 é a de baixo).
            </p>
          </Panel>

          <Panel title="Amostra (gauge)" className="print:hidden">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label={`${spec.stitchWordPlural[0].toUpperCase() + spec.stitchWordPlural.slice(1)} em 10 cm`}
                value={doc.gauge.stitches}
                min={LIMITS.gauge.min}
                max={LIMITS.gauge.max}
                onCommit={(v) => update((d) => ({ ...d, gauge: { ...d.gauge, stitches: v } }), false)}
              />
              <NumberField
                label="Carreiras em 10 cm"
                value={doc.gauge.rows}
                min={LIMITS.gauge.min}
                max={LIMITS.gauge.max}
                onCommit={(v) => update((d) => ({ ...d, gauge: { ...d.gauge, rows: v } }), false)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Cada {spec.stitchWord} ≈ {stitchMm.w} × {stitchMm.h} mm. É o que dá a proporção do tecido no preview.
            </p>
          </Panel>

          <Panel title={`Fios (${doc.yarns.length})`} className="print:hidden">
            <YarnPanel
              yarns={doc.yarns}
              active={safeActive}
              label={label}
              onSelect={(i) => {
                setActiveYarn(i);
                if (tool === "eraser" || tool === "picker") setTool("brush");
              }}
              onChange={(i, patch) => update((d) => updateYarn(d, i, patch), false)}
              onRemove={onRemoveYarn}
              onAdd={onAddYarn}
            />
          </Panel>

          <Panel title="Receita">
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Motivo</dt>
              <dd className="text-right font-medium tabular-nums">
                {doc.cols} × {doc.rows} {spec.stitchWordPlural}
              </dd>
              <dt className="text-muted-foreground">Com repetições</dt>
              <dd className="text-right font-medium tabular-nums">
                {doc.cols * doc.repeatsX} × {doc.rows * doc.repeatsY}
              </dd>
              <dt className="text-muted-foreground">Total de {spec.stitchWordPlural}</dt>
              <dd className="text-right font-medium tabular-nums">{fmt(recipe.total)}</dd>
              <dt className="text-muted-foreground">Tamanho final ≈</dt>
              <dd className="text-right font-medium tabular-nums">
                {fmt1(recipe.finishedCm.width)} × {fmt1(recipe.finishedCm.height)} cm
              </dd>
            </dl>
            <ul className="space-y-1.5 border-t border-border pt-3">
              {recipe.usage.map((u) => (
                <li key={u.index} className="flex items-center gap-2 text-sm">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-foreground/10"
                    style={{ backgroundColor: u.yarn.hex, color: contrastText(u.yarn.hex) }}
                  >
                    {cellGlyph(u.index, label === "none" ? "number" : label)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{u.yarn.name || `Fio ${u.index + 1}`}</span>
                  <span className="tabular-nums">{fmt(u.total)}</span>
                  <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">{u.percent.toFixed(0)}%</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{spec.readingHint}</p>
          </Panel>
        </div>
      </div>

      <ImportImageDialog open={importOpen} onOpenChange={setImportOpen} doc={doc} onImport={onImport} />
    </div>
  );
}
