/** Formata um valor em BRL. Retorna "Sob consulta" quando não há preço. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** "a partir de R$ X" para peças sob encomenda. */
export function formatFromPrice(value: number | null | undefined): string {
  return value == null ? "Sob consulta" : `a partir de ${formatPrice(value)}`;
}
