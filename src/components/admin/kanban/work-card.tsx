"use client";

import { useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Flame,
  ListChecks,
  MoreVertical,
  Paperclip,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/format";
import {
  commissionStatusLabel,
  commissionStatusOrder,
  workTypeEmoji,
  workTypeLabel,
  type CommissionStatus,
  type CommissionSummary,
} from "@/types/orders";
import { deadlineInfo, initials, nextStatus, priorityAccentColor, priorityDot } from "./utils";

interface WorkCardProps {
  work: CommissionSummary;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropBefore: () => void;
  onMoveTo: (status: CommissionStatus) => void;
  onDelete: () => void;
}

export function WorkCard({
  work,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDropBefore,
  onMoveTo,
  onDelete,
}: WorkCardProps) {
  const [over, setOver] = useState(false);
  const deadline = deadlineInfo(work.desiredDeadline);
  const next = nextStatus(work.status);
  const progress = work.taskCount > 0 ? Math.round((work.doneTaskCount / work.taskCount) * 100) : 0;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragging) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDropBefore();
      }}
    >
      {/* Linha de inserção quando outro cartão é arrastado por cima. */}
      {over && <div className="mb-2 h-1 animate-in fade-in-0 rounded-full bg-primary/60" />}

      <article
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onClick={onOpen}
        style={{ borderLeftColor: priorityAccentColor[work.priority], borderLeftWidth: 4 }}
        className={cn(
          "group cursor-grab rounded-2xl border border-border bg-card p-3 shadow-soft transition-all duration-200",
          "animate-in fade-in-0 slide-in-from-bottom-1",
          "hover:-translate-y-0.5 hover:shadow-soft-lg active:cursor-grabbing",
          dragging && "rotate-1 opacity-40",
        )}
      >
        {/* topo: tipo + título + ações */}
        <div className="flex items-start gap-2">
          <span
            className="grid size-6 shrink-0 place-items-center rounded-lg bg-secondary/50 text-sm leading-none"
            aria-hidden
            title={workTypeLabel[work.type]}
          >
            {workTypeEmoji[work.type]}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-medium leading-tight">
              {work.priority === "Alta" && <Flame className="size-3.5 shrink-0 text-destructive" />}
              <span className="truncate">{work.title?.trim() || work.code}</span>
            </p>
            <p className="truncate text-[0.7rem] text-muted-foreground">
              {work.title?.trim() ? `${work.code} · ` : ""}
              {workTypeLabel[work.type]}
            </p>
          </div>

          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            {next && (
              <Button
                variant="ghost"
                size="icon-xs"
                title={`Avançar para ${commissionStatusLabel[next]}`}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                onClick={() => onMoveTo(next)}
              >
                <ChevronRight />
                <span className="sr-only">Avançar etapa</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="-mr-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={work.status}
                  onValueChange={(v) => onMoveTo(v as CommissionStatus)}
                >
                  {commissionStatusOrder.map((s) => (
                    <DropdownMenuRadioItem key={s} value={s}>
                      {commissionStatusLabel[s]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* cliente */}
        {work.customerName && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[0.6rem] font-semibold text-primary">
              {initials(work.customerName)}
            </span>
            <span className="truncate text-xs text-muted-foreground">{work.customerName}</span>
          </div>
        )}

        {/* progresso da checklist */}
        {work.taskCount > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", progress === 100 ? "bg-chart-2" : "bg-primary/70")}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-[0.7rem] text-muted-foreground",
                progress === 100 && "text-chart-2",
              )}
            >
              <ListChecks className="size-3" /> {work.doneTaskCount}/{work.taskCount}
            </span>
          </div>
        )}

        {/* rodapé: prioridade, prazo, anexos, orçamento */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1" title={`Prioridade ${work.priority}`}>
            <span className={cn("size-2 rounded-full", priorityDot[work.priority])} />
            {work.priority}
          </span>

          {deadline && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5",
                deadline.tone === "overdue" && "bg-destructive/10 font-medium text-destructive",
                deadline.tone === "soon" && "bg-chart-3/15 text-chart-4",
              )}
            >
              <CalendarClock className="size-3" /> {deadline.relative}
            </span>
          )}

          {work.referenceImageCount > 0 && (
            <span className="flex items-center gap-1" title="Fotos de referência">
              <Paperclip className="size-3" /> {work.referenceImageCount}
            </span>
          )}

          {work.quotedPrice != null && (
            <span className="ml-auto font-semibold text-foreground">{formatPrice(work.quotedPrice)}</span>
          )}
        </div>
      </article>
    </div>
  );
}
