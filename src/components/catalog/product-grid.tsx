import { ProductCard } from "@/components/catalog/product-card";
import type { ProductSummary } from "@/types/catalog";

export function ProductGrid({
  products,
  emptyMessage = "Nenhuma peça por aqui ainda.",
}: {
  products: ProductSummary[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
