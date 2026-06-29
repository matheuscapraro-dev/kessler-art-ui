import { api, clearToken, setToken } from "@/lib/api-client";
import type { AdminUser, AuthResult } from "@/types/auth";

const USER_KEY = "kessler_admin_user";

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const res = await api.post<AuthResult>("/api/auth/login", { email, password });
    setToken(res.token);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify({ name: res.name, email: res.email }));
    }
    return res;
  },

  logout() {
    clearToken();
    if (typeof window !== "undefined") localStorage.removeItem(USER_KEY);
  },

  getUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  },
};
