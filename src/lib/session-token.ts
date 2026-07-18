import { getSession } from "next-auth/react";

/**
 * Cache em memória do accessToken da sessão NextAuth. `getSession()` faz um fetch
 * a /api/auth/session por chamada — sem cache, cada request à API pagaria esse
 * roundtrip extra. Revalida sozinho perto da expiração (o refresh acontece no
 * callback jwt do servidor).
 */
let cached: { token: string; expiresAtMs: number } | null = null;

/** Margem para nunca usar um token nos últimos segundos de vida. */
const EXPIRY_MARGIN_MS = 60_000;

export async function getAccessToken(): Promise<string | null> {
  // Server components só consomem endpoints públicos — sem sessão no servidor.
  if (typeof window === "undefined") return null;

  if (cached && Date.now() < cached.expiresAtMs - EXPIRY_MARGIN_MS) {
    return cached.token;
  }

  const session = await getSession();
  if (!session?.accessToken || session.error) {
    cached = null;
    return null;
  }

  cached = {
    token: session.accessToken,
    expiresAtMs: (session.accessTokenExpiresAt ?? 0) * 1000,
  };
  return cached.token;
}

/** Invalida o cache (logout, troca de conta, 401). */
export function clearAccessTokenCache(): void {
  cached = null;
}
