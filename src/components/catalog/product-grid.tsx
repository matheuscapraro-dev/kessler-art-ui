import { ProductCard } from "@/components/catalog/product-card";
import { Reveal } from "@/components/motion/reveal";
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
      <div className="rounded-3xl border border-dashed border-primary/30 bg-card/60 p-12 text-center text-muted-foreground shadow-soft">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={Math.min(i * 0.06, 0.4)}>
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}
