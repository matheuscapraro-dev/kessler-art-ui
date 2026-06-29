/** Configuração de runtime do frontend (valores públicos via NEXT_PUBLIC_*). */
export const config = {
  /** Base da API .NET. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5120",
  /** URL canônica do site (para metadata/OG). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** WhatsApp da artista no formato internacional só com dígitos, ex.: 5547999999999. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
} as const;

/** Monta um link wa.me com mensagem pré-preenchida. */
export function whatsappLink(message: string): string {
  const base = config.whatsapp ? `https://wa.me/${config.whatsapp}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
