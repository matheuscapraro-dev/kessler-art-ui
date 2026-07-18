import { api } from "@/lib/api-client";
import type { AuthResult } from "@/types/auth";

/**
 * Fluxos de conta que falam direto com a API (a sessão em si vive no NextAuth —
 * login/logout são signIn()/signOut() de next-auth/react).
 */
export const authService = {
  /** Cadastro por e-mail+senha. Depois do 200, o chamador faz signIn() para abrir a sessão. */
  register(data: { name: string; email: string; password: string; phone?: string }) {
    return api.post<AuthResult>("/api/auth/email/register", data);
  },

  /** Confirma o e-mail pelo token do link. */
  verifyEmail(token: string) {
    return api.post<void>("/api/auth/verify-email", { token });
  },

  /** Reenvia o link de verificação (resposta sempre genérica). */
  resendVerification(email: string) {
    return api.post<void>("/api/auth/resend-verification", { email });
  },

  /** Pede o link de redefinição de senha (resposta sempre genérica). */
  forgotPassword(email: string) {
    return api.post<void>("/api/auth/forgot-password", { email });
  },

  /** Define a nova senha a partir do link de reset. */
  resetPassword(token: string, newPassword: string) {
    return api.post<void>("/api/auth/reset-password", { token, newPassword });
  },
};
