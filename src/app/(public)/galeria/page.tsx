import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { AvailabilityFilter } from "@/components/catalog/availability-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { catalogService } from "@/services/catalog";
import { safe } from "@/lib/fetch-safe";
import { availabilityFromSlug } from "@/types/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Peças de crochê feitas à mão por Kessler — prontas para entrega ou sob encomenda.",
};

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; disponibilidade?: string }>;
}) {
  const { categoria, disponibilidade } = await searchParams;
  const availability = disponibilidade ? availabilityFromSlug[disponibilidade] : undefined;

  const [products, categories] = await Promise.all([
    safe(
      () =>
        catalogService.listProducts(
          { categorySlug: categoria, availability },
          { next: { revalidate: 60 } }
        ),
      []
    ),
    safe(() => catalogService.listCategories({ next: { revalidate: 60 } }), []),
  ]);

  return (
    <>
      <PageHeader
        title="Galeria"
        subtitle="Cada peça é única, feita ponto a ponto. Leve uma que já está pronta ou encomende a sua, do seu jeito."
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Disponibilidade
            </p>
            <AvailabilityFilter basePath="/galeria" categoria={categoria} current={disponibilidade} />
          </div>
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Categoria
              </p>
              <CategoryFilter
                categories={categories}
                basePath="/galeria"
                current={categoria}
                disponibilidade={disponibilidade}
              />
            </div>
          )}
        </div>

        {products.length > 0 && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {products.length === 1 ? "1 peça encontrada" : `${products.length} peças encontradas`}
          </p>
        )}

        <ProductGrid
          products={products}
          emptyMessage="Nenhuma peça com esses filtros por enquanto — que tal encomendar a sua?"
        />
      </div>
    </>
  );
}
