/**
 * Só aceita caminhos internos como destino pós-login. Sem isto, um link
 * malicioso `/entrar?callbackUrl=https://phishing.com` mandaria o usuário
 * recém-autenticado para fora do site (open redirect).
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
