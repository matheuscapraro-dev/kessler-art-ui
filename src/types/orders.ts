export type OrderStatus =
  | "Pendente" | "Confirmado" | "EmProducao" | "Enviado" | "Concluido" | "Cancelado";

export type CommissionStatus =
  | "Nova" | "EmAnalise" | "OrcamentoEnviado" | "Aprovada" | "EmProducao" | "Concluida" | "Recusada";

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

export interface Commission {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  desiredCategory?: string | null;
  colors?: string | null;
  size?: string | null;
  desiredDeadline?: string | null;
  referenceProductSlug?: string | null;
  quotedPrice?: number | null;
  status: CommissionStatus;
  adminNotes?: string | null;
  createdAt: string;
  referenceImages: CommissionImage[];
}

export interface CommissionSummary {
  id: string;
  code: string;
  customerName: string;
  description: string;
  status: CommissionStatus;
  quotedPrice?: number | null;
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
