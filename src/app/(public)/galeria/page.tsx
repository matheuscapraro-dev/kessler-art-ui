import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { catalogService } from "@/services/catalog";
import { safe } from "@/lib/fetch-safe";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Galeria",
  description: "O portfólio de peças de crochê feitas à mão por Kessler.",
};

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  const [products, categories] = await Promise.all([
    safe(() => catalogService.listProducts({ categorySlug: categoria }, { next: { revalidate: 60 } }), []),
    safe(() => catalogService.listCategories({ next: { revalidate: 60 } }), []),
  ]);

  return (
    <>
      <PageHeader
        title="Galeria"
        subtitle="Cada peça é única, feita ponto a ponto. Explore as criações e inspire-se para a sua encomenda."
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-8">
        <CategoryFilter categories={categories} basePath="/galeria" current={categoria} />
        <ProductGrid
          products={products}
          emptyMessage="As peças aparecerão aqui assim que forem publicadas."
        />
      </div>
    </>
  );
}
