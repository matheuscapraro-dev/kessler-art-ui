import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { catalogService } from "@/services/catalog";
import { safe } from "@/lib/fetch-safe";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Loja",
  description: "Peças de crochê prontas para entrega — escolha a sua e leve para casa.",
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  const [products, categories] = await Promise.all([
    safe(
      () =>
        catalogService.listProducts(
          { categorySlug: categoria, availability: "ReadyToBuy" },
          { next: { revalidate: 60 } }
        ),
      []
    ),
    safe(() => catalogService.listCategories({ next: { revalidate: 60 } }), []),
  ]);

  return (
    <>
      <PageHeader
        title="Loja"
        subtitle="Peças prontas para entrega imediata. Gostou de algo? É só finalizar — combinamos o resto pelo WhatsApp."
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-8">
        <CategoryFilter categories={categories} basePath="/loja" current={categoria} />
        <ProductGrid
          products={products}
          emptyMessage="Ainda não há peças prontas na loja — dá uma olhada na galeria ou faça uma encomenda."
        />
      </div>
    </>
  );
}
