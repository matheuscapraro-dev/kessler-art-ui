import { api } from "@/lib/api-client";
import type {
  Commission,
  CommissionStatus,
  CommissionSummary,
  WorkPriority,
  WorkType,
} from "@/types/orders";

export interface CommissionReferenceInput {
  storageKey: string;
  url: string;
}

export interface CreateCommissionPayload {
  description: string;
  type?: WorkType;
  title?: string;
  priority?: WorkPriority;
  status?: CommissionStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  desiredCategory?: string;
  colors?: string;
  size?: string;
  desiredDeadline?: string | null;
  quotedPrice?: number | null;
  referenceProductSlug?: string;
  referenceImages?: CommissionReferenceInput[];
}

export interface UpdateCommissionPayload {
  description: string;
  type: WorkType;
  title?: string;
  priority: WorkPriority;
  status: CommissionStatus;
  desiredCategory?: string;
  colors?: string;
  size?: string;
  desiredDeadline?: string | null;
  quotedPrice?: number | null;
  adminNotes?: string;
}

export interface CommissionTaskInput {
  title: string;
  isDone: boolean;
}

export const commissionService = {
  /** Encomenda pública (convidado) — sempre tipo Encomenda, exige contato. */
  create: (payload: CreateCommissionPayload): Promise<Commission> =>
    api.post<Commission>("/api/commissions", payload),

  /** Sobe uma imagem de referência (antes de criar) e devolve os identificadores. */
  uploadReferenceImage: (file: File): Promise<CommissionReferenceInput> => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload<CommissionReferenceInput>("/api/commissions/reference-images", fd);
  },

  track: (code: string, options?: RequestInit): Promise<Commission> =>
    api.get<Commission>(`/api/commissions/track/${code}`, options),

  // ── Admin ──────────────────────────────────────────────────────────
  list: (status?: CommissionStatus): Promise<CommissionSummary[]> =>
    api.get<CommissionSummary[]>(`/api/commissions${status ? `?status=${status}` : ""}`),

  /** Cria trabalho/encomenda pelo painel (cliente opcional). */
  createAdmin: (payload: CreateCommissionPayload): Promise<Commission> =>
    api.post<Commission>("/api/commissions/admin", payload),

  sendQuote: (id: string, price: number): Promise<Commission> =>
    api.put<Commission>(`/api/commissions/${id}/quote`, { price }),

  update: (id: string, payload: UpdateCommissionPayload): Promise<Commission> =>
    api.put<Commission>(`/api/commissions/${id}`, payload),

  /** Move o cartão no quadro (coluna + posição) — drag-and-drop. */
  move: (id: string, status: CommissionStatus, position: number): Promise<void> =>
    api.put<void>(`/api/commissions/${id}/move`, { status, position }),

  setTasks: (id: string, tasks: CommissionTaskInput[]): Promise<Commission> =>
    api.put<Commission>(`/api/commissions/${id}/tasks`, { tasks }),

  remove: (id: string): Promise<void> => api.del<void>(`/api/commissions/${id}`),
};
