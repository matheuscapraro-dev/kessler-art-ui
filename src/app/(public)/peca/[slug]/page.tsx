import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageCircle, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductCard } from "@/components/catalog/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { StitchDivider } from "@/components/decor";
import { catalogService } from "@/services/catalog";
import { safe } from "@/lib/fetch-safe";
import { whatsappLink } from "@/lib/config";
import { formatFromPrice, formatPrice } from "@/lib/format";
import { availabilityLabel, type Product, type ProductSummary } from "@/types/catalog";

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

/** Peças da mesma categoria (ou outras, se faltar) para o "você também pode gostar". */
async function getRelated(product: Product): Promise<ProductSummary[]> {
  const all = await safe(
    () => catalogService.listProducts({}, { next: { revalidate: 60 } }),
    [] as ProductSummary[]
  );
  const others = all.filter((p) => p.slug !== product.slug);
  const sameCategory = others.filter((p) => p.categoryName === product.categoryName);
  return [...sameCategory, ...others.filter((p) => !sameCategory.includes(p))].slice(0, 4);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const isReady = product.availability === "ReadyToBuy";

  const priceLabel = isReady ? formatPrice(product.price) : formatFromPrice(product.price);

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

          {!isReady && product.leadTimeDays != null && (
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
                <Link href={`/encomendar?ref=${product.slug}`}>Encomendar esta peça</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>

          {/* Por que comprar tranquila — como funciona a compra artesanal */}
          <ul className="space-y-3 rounded-2xl bg-secondary/30 p-5 text-sm">
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <strong>Peça única, feita à mão.</strong> Pequenas variações de cor e ponto fazem
                parte do charme.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <strong>Sem pagamento online.</strong> Você faz o pedido e combinamos o Pix e a
                entrega pelo WhatsApp.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Package className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <strong>Embalado com carinho</strong> — do ateliê direto para a sua casa.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Você também pode gostar ── */}
      {related.length > 0 && (
        <section className="mt-14">
          <StitchDivider className="mb-10" />
          <h2 className="mb-6 font-heading text-2xl font-semibold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
