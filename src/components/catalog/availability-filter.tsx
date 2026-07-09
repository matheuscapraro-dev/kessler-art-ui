import Link from "next/link";
import { cn } from "@/lib/utils";
import { availabilitySlug } from "@/types/catalog";

/**
 * Filtro por disponibilidade (Pronta entrega / Sob encomenda). Preserva o filtro de
 * categoria atual na URL e usa links para manter SSR/SEO — sem estado de cliente.
 */
export function AvailabilityFilter({
  basePath,
  categoria,
  current,
}: {
  basePath: string;
  categoria?: string;
  current?: string;
}) {
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground shadow-soft"
        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
    );

  const href = (disponibilidade?: string) => {
    const sp = new URLSearchParams();
    if (categoria) sp.set("categoria", categoria);
    if (disponibilidade) sp.set("disponibilidade", disponibilidade);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const options = [
    { label: "Tudo", slug: undefined },
    { label: "Pronta entrega", slug: availabilitySlug.ReadyToBuy },
    { label: "Sob encomenda", slug: availabilitySlug.MadeToOrder },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Link key={opt.label} href={href(opt.slug)} className={chip(current === opt.slug)}>
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
