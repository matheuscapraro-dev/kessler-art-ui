import { commissionStatusOrder, type CommissionStatus, type WorkPriority } from "@/types/orders";

/** Info de prazo p/ destacar cartões próximos do vencimento (estilo ADO). */
export function deadlineInfo(iso?: string | null) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const label = due.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const tone: "overdue" | "soon" | "normal" =
    days < 0 ? "overdue" : days <= 7 ? "soon" : "normal";
  const relative =
    days < 0
      ? `Atrasado ${-days}d`
      : days === 0
        ? "Entrega hoje"
        : days === 1
          ? "Entrega amanhã"
          : days <= 7
            ? `Faltam ${days}d`
            : label;
  return { days, label, relative, tone };
}

/** Cor da bolinha de prioridade. */
export const priorityDot: Record<WorkPriority, string> = {
  Alta: "bg-destructive",
  Normal: "bg-chart-3",
  Baixa: "bg-muted-foreground/40",
};

/** Cor da borda lateral do cartão conforme a prioridade (via style inline p/ vencer o border base). */
export const priorityAccentColor: Record<WorkPriority, string> = {
  Alta: "var(--destructive)",
  Normal: "transparent",
  Baixa: "color-mix(in oklch, var(--muted-foreground), transparent 65%)",
};

/** Tom da faixa de cada coluna do quadro — quentinho e variado. */
export const columnAccent: Record<CommissionStatus, string> = {
  Nova: "bg-chart-3",
  EmAnalise: "bg-chart-5",
  OrcamentoEnviado: "bg-chart-4",
  Aprovada: "bg-accent",
  EmProducao: "bg-primary",
  Concluida: "bg-chart-2",
  Recusada: "bg-muted-foreground/40",
};

/** Etapas "para frente" do fluxo (Recusada é um desvio, fica de fora). */
const progression: CommissionStatus[] = commissionStatusOrder.filter((s) => s !== "Recusada");

/** Próximo estágio do fluxo, ou null se já concluído/recusado. */
export function nextStatus(status: CommissionStatus): CommissionStatus | null {
  const i = progression.indexOf(status);
  if (i === -1 || i === progression.length - 1) return null;
  return progression[i + 1];
}

/** Iniciais do cliente p/ o "avatar" do cartão. */
export function initials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
