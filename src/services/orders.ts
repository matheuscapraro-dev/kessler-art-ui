import { api } from "@/lib/api-client";
import type { Order, OrderStatus, OrderSummary } from "@/types/orders";

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}

export const orderService = {
  create: (payload: CreateOrderPayload): Promise<Order> => api.post<Order>("/api/orders", payload),

  track: (code: string, options?: RequestInit): Promise<Order> =>
    api.get<Order>(`/api/orders/track/${code}`, options),

  // Admin
  list: (status?: OrderStatus): Promise<OrderSummary[]> =>
    api.get<OrderSummary[]>(`/api/orders${status ? `?status=${status}` : ""}`),

  updateStatus: (id: string, status: OrderStatus): Promise<void> =>
    api.put<void>(`/api/orders/${id}/status`, { status }),

  markPaid: (id: string): Promise<void> => api.put<void>(`/api/orders/${id}/paid`),
};
