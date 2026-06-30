export type OrderStatus =
  | "Pendente" | "Confirmado" | "EmProducao" | "Enviado" | "Concluido" | "Cancelado";

export type CommissionStatus =
  | "Nova" | "EmAnalise" | "OrcamentoEnviado" | "Aprovada" | "EmProducao" | "Concluida" | "Recusada";

export type WorkType =
  | "Encomenda" | "ProjetoPessoal" | "Estoque" | "Amostra" | "Reparo" | "Presente" | "Evento" | "Estudo";

export type WorkPriority = "Baixa" | "Normal" | "Alta";

export type PaymentMethod = "Manual" | "Pix" | "Gateway";
export type PaymentStatus = "Pendente" | "Pago" | "Estornado";

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderSummary {
  id: string;
  code: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface CommissionImage {
  id: string;
  url: string;
}

export interface CommissionTask {
  id: string;
  title: string;
  isDone: boolean;
}

export interface Commission {
  id: string;
  code: string;
  type: WorkType;
  title?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  description: string;
  desiredCategory?: string | null;
  colors?: string | null;
  size?: string | null;
  desiredDeadline?: string | null;
  referenceProductSlug?: string | null;
  quotedPrice?: number | null;
  status: CommissionStatus;
  priority: WorkPriority;
  position: number;
  adminNotes?: string | null;
  createdAt: string;
  referenceImages: CommissionImage[];
  tasks: CommissionTask[];
}

export interface CommissionSummary {
  id: string;
  code: string;
  type: WorkType;
  title?: string | null;
  customerName?: string | null;
  description: string;
  status: CommissionStatus;
  priority: WorkPriority;
  position: number;
  quotedPrice?: number | null;
  desiredDeadline?: string | null;
  taskCount: number;
  doneTaskCount: number;
  referenceImageCount: number;
  createdAt: string;
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  Pendente: "Pendente",
  Confirmado: "Confirmado",
  EmProducao: "Em produção",
  Enviado: "Enviado",
  Concluido: "Concluído",
  Cancelado: "Cancelado",
};

export const commissionStatusLabel: Record<CommissionStatus, string> = {
  Nova: "Nova",
  EmAnalise: "Em análise",
  OrcamentoEnviado: "Orçamento enviado",
  Aprovada: "Aprovada",
  EmProducao: "Em produção",
  Concluida: "Concluída",
  Recusada: "Recusada",
};

/** Ordem das colunas no quadro do ateliê. */
export const commissionStatusOrder: CommissionStatus[] = [
  "Nova",
  "EmAnalise",
  "OrcamentoEnviado",
  "Aprovada",
  "EmProducao",
  "Concluida",
  "Recusada",
];

export const workTypeLabel: Record<WorkType, string> = {
  Encomenda: "Encomenda",
  ProjetoPessoal: "Projeto pessoal",
  Estoque: "Peça p/ loja",
  Amostra: "Amostra",
  Reparo: "Reparo",
  Presente: "Presente",
  Evento: "Evento/Feira",
  Estudo: "Estudo",
};

/** Emoji por tipo — dá um toque artesanal e ajuda a identificar o cartão de relance. */
export const workTypeEmoji: Record<WorkType, string> = {
  Encomenda: "🧶",
  ProjetoPessoal: "✨",
  Estoque: "🏷️",
  Amostra: "🎀",
  Reparo: "🪡",
  Presente: "🎁",
  Evento: "🎪",
  Estudo: "📚",
};

export const workPriorityLabel: Record<WorkPriority, string> = {
  Baixa: "Baixa",
  Normal: "Normal",
  Alta: "Alta",
};
