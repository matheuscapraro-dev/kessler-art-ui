"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Hammer, LayoutGrid, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkCard } from "@/components/admin/kanban/work-card";
import { WorkSheet } from "@/components/admin/kanban/work-sheet";
import { columnAccent, deadlineInfo } from "@/components/admin/kanban/utils";
import {
  commissionService,
  type CommissionTaskInput,
  type CreateCommissionPayload,
  type UpdateCommissionPayload,
} from "@/services/commissions";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import {
  commissionStatusLabel,
  commissionStatusOrder,
  workTypeLabel,
  type CommissionStatus,
  type CommissionSummary,
  type WorkType,
} from "@/types/orders";

const QK = ["admin-commissions"] as const;
const workTypes = Object.keys(workTypeLabel) as WorkType[];

type SheetState = { mode: "create" | "edit"; status: CommissionStatus; code?: string };

export default function AdminAteliePage() {
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<WorkType | "all">("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: () => commissionService.list(),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: QK });

  // Detalhe completo (fotos, tarefas, contato) ao abrir um cartão para editar.
  const { data: detail } = useQuery({
    queryKey: ["admin-commission", sheet?.code],
    queryFn: () => commissionService.track(sheet!.code!),
    enabled: sheet?.mode === "edit" && !!sheet?.code,
    refetchOnWindowFocus: false,
  });

  // ── Mutações ───────────────────────────────────────────────────────
  const createMut = useMutation<unknown, ApiError, CreateCommissionPayload>({
    mutationFn: (payload) => commissionService.createAdmin(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Trabalho criado.");
      setSheet(null);
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível criar."),
  });

  const updateMut = useMutation<unknown, ApiError, { id: string; payload: UpdateCommissionPayload }>({
    mutationFn: ({ id, payload }) => commissionService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Trabalho atualizado.");
      setSheet(null);
    },
    onError: (e) => toast.error(e.detail ?? "Falha ao salvar."),
  });

  const tasksMut = useMutation<unknown, ApiError, { id: string; tasks: CommissionTaskInput[] }>({
    mutationFn: ({ id, tasks }) => commissionService.setTasks(id, tasks),
    onSuccess: () => invalidate(), // atualiza os contadores nos cartões
    onError: (e) => toast.error(e.detail ?? "Falha ao salvar a checklist."),
  });

  const deleteMut = useMutation<unknown, ApiError, string>({
    mutationFn: (id) => commissionService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Trabalho excluído.");
      setSheet(null);
    },
    onError: (e) => toast.error(e.detail ?? "Falha ao excluir."),
  });

  // Mover no quadro com atualização otimista.
  const moveMut = useMutation<
    unknown,
    ApiError,
    { id: string; status: CommissionStatus; position: number },
    { prev?: CommissionSummary[] }
  >({
    mutationFn: ({ id, status, position }) => commissionService.move(id, status, position),
    onMutate: async ({ id, status, position }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<CommissionSummary[]>(QK);
      qc.setQueryData<CommissionSummary[]>(QK, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, status, position } : c))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
      toast.error("Não foi possível mover o cartão.");
    },
    onSettled: () => invalidate(),
  });

  // ── Drag & drop ────────────────────────────────────────────────────
  function computePosition(status: CommissionStatus, beforeId: string | null): number {
    const list = commissions
      .filter((c) => c.status === status && c.id !== draggingId)
      .sort((a, b) => a.position - b.position);

    if (!beforeId) {
      const last = list.at(-1);
      return last ? last.position + 1 : Date.now();
    }
    const idx = list.findIndex((c) => c.id === beforeId);
    if (idx === -1) {
      const last = list.at(-1);
      return last ? last.position + 1 : Date.now();
    }
    const target = list[idx];
    const prev = list[idx - 1];
    return prev ? (prev.position + target.position) / 2 : target.position - 1;
  }

  function drop(status: CommissionStatus, beforeId: string | null) {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const current = commissions.find((c) => c.id === id);
    const position = computePosition(status, beforeId);
    // Evita chamada à toa quando solta no mesmo lugar.
    if (current && current.status === status && beforeId === null) {
      const colLast = commissions
        .filter((c) => c.status === status)
        .sort((a, b) => a.position - b.position)
        .at(-1);
      if (colLast?.id === id) return;
    }
    moveMut.mutate({ id, status, position });
  }

  const confirmDelete = (id: string) => setPendingDelete(id);

  // ── Filtro ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commissions.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        (c.title ?? "").toLowerCase().includes(q) ||
        (c.customerName ?? "").toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [commissions, typeFilter, search]);

  const byStatus = (status: CommissionStatus) =>
    filtered.filter((c) => c.status === status).sort((a, b) => a.position - b.position);

  // Soma dos orçamentos visíveis numa coluna (mostrada no cabeçalho).
  const columnTotal = (cards: CommissionSummary[]) =>
    cards.reduce((sum, c) => sum + (c.quotedPrice ?? 0), 0);

  // Resumo do topo — só conta o que está "em aberto" (não concluído/recusado).
  const stats = useMemo(() => {
    const open = commissions.filter((c) => c.status !== "Concluida" && c.status !== "Recusada");
    let overdue = 0;
    let soon = 0;
    for (const c of open) {
      const d = deadlineInfo(c.desiredDeadline);
      if (d?.tone === "overdue") overdue++;
      else if (d?.tone === "soon") soon++;
    }
    return {
      open: open.length,
      producing: commissions.filter((c) => c.status === "EmProducao").length,
      overdue,
      soon,
    };
  }, [commissions]);

  const saving = createMut.isPending || updateMut.isPending;

  const statItems = [
    { icon: LayoutGrid, label: "Em aberto", value: stats.open, tone: "default" as const },
    { icon: Hammer, label: "Em produção", value: stats.producing, tone: "default" as const },
    { icon: CalendarClock, label: "A vencer", value: stats.soon, tone: "soon" as const },
    { icon: AlertTriangle, label: "Atrasados", value: stats.overdue, tone: "overdue" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Ateliê</h1>
          <p className="text-sm text-muted-foreground">
            Suas encomendas e trabalhos, num quadro feito à mão. ✨
          </p>
        </div>
        <Button onClick={() => setSheet({ mode: "create", status: "Nova" })}>
          <Plus className="size-4" /> Novo trabalho
        </Button>
      </div>

      {/* resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft",
              tone === "overdue" && value > 0 && "border-destructive/30 bg-destructive/5",
              tone === "soon" && value > 0 && "border-chart-3/40 bg-chart-3/5",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                tone === "overdue" && value > 0
                  ? "bg-destructive/15 text-destructive"
                  : tone === "soon" && value > 0
                    ? "bg-chart-3/20 text-chart-4"
                    : "bg-secondary/60 text-primary",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-none">{value}</p>
              <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, título, cliente…"
            className="h-8 w-64 pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as WorkType | "all")}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {workTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {workTypeLabel[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* quadro */}
      {isLoading ? (
        <BoardSkeleton />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {commissionStatusOrder.map((status) => {
            const cards = byStatus(status);
            const total = columnTotal(cards);
            return (
              <section
                key={status}
                className="flex w-72 shrink-0 flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(status, null)}
              >
                {/* faixa de crochê no topo da coluna */}
                <div className={cn("crochet-trim", columnAccent[status].replace("bg-", "text-"))} />
                <header className="mb-2 mt-1.5 flex items-center gap-2 px-1">
                  <h2 className="text-sm font-semibold">{commissionStatusLabel[status]}</h2>
                  <span className="grid min-w-5 place-items-center rounded-full bg-secondary/60 px-1.5 text-xs font-medium text-secondary-foreground">
                    {cards.length}
                  </span>
                  {total > 0 && (
                    <span className="truncate text-[0.7rem] text-muted-foreground">{formatPrice(total)}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto text-muted-foreground hover:text-primary"
                    onClick={() => setSheet({ mode: "create", status })}
                    title="Novo trabalho nesta coluna"
                  >
                    <Plus />
                  </Button>
                </header>

                <div className="flex min-h-28 flex-1 flex-col gap-2 rounded-2xl bg-secondary/15 p-2 ring-1 ring-inset ring-border/40">
                  {cards.length === 0 ? (
                    <div className="m-1 grid flex-1 place-items-center rounded-xl border border-dashed border-border/70 px-2 py-8 text-center">
                      <p className="text-xs text-muted-foreground">Arraste um cartão para cá</p>
                    </div>
                  ) : (
                    cards.map((work) => (
                      <WorkCard
                        key={work.id}
                        work={work}
                        dragging={draggingId === work.id}
                        onOpen={() => setSheet({ mode: "edit", status: work.status, code: work.code })}
                        onDragStart={() => setDraggingId(work.id)}
                        onDragEnd={() => setDraggingId(null)}
                        onDropBefore={() => drop(status, work.id)}
                        onMoveTo={(to) => moveMut.mutate({ id: work.id, status: to, position: computePosition(to, null) })}
                        onDelete={() => confirmDelete(work.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <WorkSheet
        open={!!sheet}
        onOpenChange={(o) => !o && setSheet(null)}
        mode={sheet?.mode ?? "create"}
        detail={sheet?.mode === "edit" ? detail ?? null : null}
        defaultStatus={sheet?.status ?? "Nova"}
        saving={saving}
        onCreate={(payload) => createMut.mutate(payload)}
        onUpdate={(payload) => detail && updateMut.mutate({ id: detail.id, payload })}
        onSaveTasks={(tasks) => detail && tasksMut.mutate({ id: detail.id, tasks })}
        onDelete={() => detail && confirmDelete(detail.id)}
      />

      {/* confirmar exclusão (no tema, em vez do confirm nativo) */}
      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="size-4" />
              </span>
              Excluir trabalho
            </DialogTitle>
            <DialogDescription>
              Tem certeza? Esta ação não pode ser desfeita e o cartão sai do quadro para sempre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (pendingDelete) deleteMut.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, col) => (
        <div key={col} className="flex w-72 shrink-0 flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col gap-2 rounded-2xl bg-secondary/15 p-2">
            {Array.from({ length: 2 + (col % 2) }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
