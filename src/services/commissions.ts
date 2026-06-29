import { api } from "@/lib/api-client";
import type { Commission, CommissionStatus, CommissionSummary } from "@/types/orders";

export interface CommissionReferenceInput {
  storageKey: string;
  url: string;
}

export interface CreateCommissionPayload {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  description: string;
  desiredCategory?: string;
  colors?: string;
  size?: string;
  desiredDeadline?: string | null;
  referenceProductSlug?: string;
  referenceImages?: CommissionReferenceInput[];
}

export const commissionService = {
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

  // Admin
  list: (status?: CommissionStatus): Promise<CommissionSummary[]> =>
    api.get<CommissionSummary[]>(`/api/commissions${status ? `?status=${status}` : ""}`),

  sendQuote: (id: string, price: number): Promise<Commission> =>
    api.put<Commission>(`/api/commissions/${id}/quote`, { price }),

  update: (id: string, status: CommissionStatus, adminNotes?: string): Promise<Commission> =>
    api.put<Commission>(`/api/commissions/${id}`, { status, adminNotes }),
};
