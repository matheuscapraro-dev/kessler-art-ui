import { api } from "@/lib/api-client";
import type { Commission, CommissionStatus, CommissionSummary } from "@/types/orders";

export interface CreateCommissionPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  desiredCategory?: string;
  colors?: string;
  size?: string;
  desiredDeadline?: string | null;
  referenceProductSlug?: string;
}

export const commissionService = {
  create: (payload: CreateCommissionPayload): Promise<Commission> =>
    api.post<Commission>("/api/commissions", payload),

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
