import { api } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";
import type { Commission, Order } from "@/types/orders";

/** Área logada: perfil, senha e histórico. */
export const accountService = {
  me() {
    return api.get<AuthUser>("/api/auth/me");
  },

  updateProfile(data: { name: string; phone?: string }) {
    return api.put<AuthUser>("/api/account/profile", data);
  },

  changePassword(data: { currentPassword?: string; newPassword: string }) {
    return api.put<void>("/api/account/password", data);
  },

  myOrders() {
    return api.get<Order[]>("/api/account/orders");
  },

  myCommissions() {
    return api.get<Commission[]>("/api/account/commissions");
  },
};
