"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { accountService } from "@/services/account";

/** Perfil completo do backend (a sessão NextAuth guarda só um resumo). */
export function useProfile() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["account", "me"],
    queryFn: () => accountService.me(),
    enabled: status === "authenticated",
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { update } = useSession();
  return useMutation({
    mutationFn: accountService.updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account", "me"] });
      await update(); // ressincroniza nome/telefone na sessão NextAuth
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: accountService.changePassword });
}

export function useMyOrders() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["account", "orders"],
    queryFn: () => accountService.myOrders(),
    enabled: status === "authenticated",
  });
}

export function useMyCommissions() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["account", "commissions"],
    queryFn: () => accountService.myCommissions(),
    enabled: status === "authenticated",
  });
}
