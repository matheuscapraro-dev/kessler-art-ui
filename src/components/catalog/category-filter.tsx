import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

/**
 * Barra de filtro por categoria. Usa links (?categoria=slug) para manter SSR/SEO —
 * sem estado de cliente.
 */
export function CategoryFilter({
  categories,
  basePath,
  current,
}: {
  categories: Category[];
  basePath: string;
  current?: string;
}) {
  if (categories.length === 0) return null;

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
    );

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={basePath} className={chip(!current)}>
        Todas
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`${basePath}?categoria=${category.slug}`}
          className={chip(current === category.slug)}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
