import { config } from "./config";

const TOKEN_KEY = "kessler_admin_token";

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

// ── Token do admin (só no browser) ───────────────────────────────────
export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${config.apiUrl}${path}`, { ...options, headers });

  if (!res.ok) {
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
    const token = getToken();
    const res = await fetch(`${config.apiUrl}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText, status: res.status }));
      throw new ApiError({ ...body, status: body.status ?? res.status });
    }
    return res.json() as Promise<T>;
  },
};
