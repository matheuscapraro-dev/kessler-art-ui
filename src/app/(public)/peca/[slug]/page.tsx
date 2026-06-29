import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { catalogService } from "@/services/catalog";
import { whatsappLink } from "@/lib/config";
import { formatFromPrice, formatPrice } from "@/lib/format";
import { availabilityLabel, type Product } from "@/types/catalog";

export const revalidate = 60;

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await catalogService.getProductBySlug(slug, { next: { revalidate: 60 } });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Peça não encontrada" };

  return {
    title: product.name,
    description: product.description ?? `${product.name} — crochê feito à mão por Kessler.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const isReady = product.availability === "ReadyToBuy";
  const isMadeToOrder = product.availability === "MadeToOrder";

  const priceLabel = isReady
    ? formatPrice(product.price)
    : isMadeToOrder
      ? formatFromPrice(product.price)
      : null;

  const waMessage = `Olá! Tenho interesse na peça "${product.name}". Pode me contar mais?`;

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Link
        href="/galeria"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> voltar para a galeria
      </Link>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{availabilityLabel[product.availability]}</Badge>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                {product.categoryName}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-semibold md:text-4xl">{product.name}</h1>
            {priceLabel && (
              <p className="text-2xl font-medium text-primary">{priceLabel}</p>
            )}
          </div>

          {product.description && (
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {isMadeToOrder && product.leadTimeDays != null && (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> Prazo de produção: ~{product.leadTimeDays} dias
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {isReady ? (
              <AddToCartButton
                product={{
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price ?? 0,
                  coverImageUrl: product.images[0]?.url ?? null,
                }}
              />
            ) : (
              <Button asChild size="lg">
                <Link href={`/encomendar?ref=${product.slug}`}>
                  {isMadeToOrder ? "Encomendar esta peça" : "Encomendar algo parecido"}
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
