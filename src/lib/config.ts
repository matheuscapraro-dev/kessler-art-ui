/** Configuração de runtime do frontend (valores públicos via NEXT_PUBLIC_*). */
export const config = {
  /** Base da API .NET. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5120",
  /** URL canônica do site (para metadata/OG). */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

// WhatsApp gerenciável: começa do env e é sobrescrito pelo conteúdo do site
// (ContentProvider) quando a artista o cadastra no painel.
let runtimeWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

/** Atualiza o número usado por `whatsappLink` (chamado pelo ContentProvider). */
export function setRuntimeWhatsApp(value: string | null | undefined) {
  if (value && value.trim()) runtimeWhatsApp = value.replace(/\D/g, "");
}

export function getWhatsApp(): string {
  return runtimeWhatsApp;
}

/** Monta um link wa.me com mensagem pré-preenchida. */
export function whatsappLink(message: string): string {
  const base = runtimeWhatsApp ? `https://wa.me/${runtimeWhatsApp}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
