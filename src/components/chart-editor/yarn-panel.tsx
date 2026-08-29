"use client";

// Lista de fios: escolher o ativo, renomear, trocar cor, remover, adicionar.

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIMITS, type Yarn } from "@/lib/chart-editor/model";
import { contrastText } from "@/lib/chart-editor/stitches";
import { cellGlyph, type CellLabel } from "@/lib/chart-editor/render-grid";

interface Props {
  yarns: Yarn[];
  active: number;
  label: CellLabel;
  onSelect: (index: number) => void;
  onChange: (index: number, patch: Partial<Yarn>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function YarnPanel({ yarns, active, label, onSelect, onChange, onRemove, onAdd }: Props) {
  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {yarns.map((yarn, i) => {
          const selected = i === active;
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-1.5 transition-colors",
                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Selecionar fio ${i + 1}`}
                aria-pressed={selected}
                className="relative size-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10"
                style={{ backgroundColor: yarn.hex }}
              >
                <span
                  className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                  style={{ color: contrastText(yarn.hex) }}
                >
                  {cellGlyph(i, label === "none" ? "number" : label)}
                </span>
                <input
                  type="color"
                  value={yarn.hex}
                  onChange={(e) => onChange(i, { hex: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Cor do fio ${i + 1}`}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </button>
              <input
                value={yarn.name}
                onChange={(e) => onChange(i, { name: e.target.value })}
                onFocus={() => onSelect(i)}
                placeholder={`Fio ${i + 1}`}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onRemove(i)}
                disabled={yarns.length <= 1}
                aria-label={`Remover fio ${i + 1}`}
                className="text-muted-foreground"
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onAdd}
        disabled={yarns.length >= LIMITS.yarns.max}
      >
        <Plus /> Adicionar fio
      </Button>
      <p className="text-xs text-muted-foreground">Clique no quadradinho para trocar a cor.</p>
    </div>
  );
}
