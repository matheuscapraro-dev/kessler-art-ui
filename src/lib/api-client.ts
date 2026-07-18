import { signOut } from "next-auth/react";
import { config } from "./config";
import { clearAccessTokenCache, getAccessToken } from "./session-token";

/** Erro estruturado da API, populado a partir do ProblemDetails do backend. */
export class ApiError extends Error {
  status?: number;
  detail?: string;
  errorCode?: string;

  constructor(body: { title?: string; detail?: string; status?: number; errorCode?: string }) {
    super(body.detail ?? body.title ?? "Falha na requisição");
    this.name = "ApiError";
    this.status = body.status;
    this.detail = body.detail;
    this.errorCode = body.errorCode;
  }
}

/** Sessão morta numa rota autenticada: encerra a sessão NextAuth e volta ao login. */
async function handleUnauthorized(): Promise<void> {
  clearAccessTokenCache();
  if (typeof window === "undefined") return;
  const isAdmin = window.location.pathname.startsWith("/admin");
  await signOut({ callbackUrl: isAdmin ? "/admin/login?expirado=1" : "/entrar?expirado=1" });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${config.apiUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && token) await handleUnauthorized();
    // 429 vem sem corpo do rate limiter — statusText em inglês não serve ao usuário.
    if (res.status === 429)
      throw new ApiError({ detail: "Muitas tentativas. Aguarde um minuto e tente de novo.", status: 429 });
    const body = await res.json().catch(() => ({ detail: res.statusText, status: res.status }));
    throw new ApiError({ ...body, status: body.status ?? res.status });
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "DELETE" }),

  /** Upload multipart — não define Content-Type (o browser cuida do boundary). */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const token = await getAccessToken();
    const res = await fetch(`${config.apiUrl}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      if (res.status === 401 && token) await handleUnauthorized();
      const body = await res.json().catch(() => ({ detail: res.statusText, status: res.status }));
      throw new ApiError({ ...body, status: body.status ?? res.status });
    }
    return res.json() as Promise<T>;
  },
};
