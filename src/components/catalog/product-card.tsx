import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { YarnBall } from "@/components/decor";
import { formatFromPrice, formatPrice } from "@/lib/format";
import { availabilityLabel, type ProductSummary } from "@/types/catalog";

export function ProductCard({ product }: { product: ProductSummary }) {
  const priceLabel =
    product.availability === "MadeToOrder"
      ? formatFromPrice(product.price)
      : product.availability === "ReadyToBuy"
        ? formatPrice(product.price)
        : null;

  return (
    <Link
      href={`/peca/${product.slug}`}
      className="group block rounded-3xl border border-border/60 bg-card p-2.5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-muted">
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <YarnBall className="size-8" />
            <span className="text-xs">sem foto</span>
          </div>
        )}
        <Badge variant="secondary" className="absolute left-2.5 top-2.5 rounded-full shadow-soft">
          {availabilityLabel[product.availability]}
        </Badge>
      </div>

      <div className="space-y-0.5 px-1.5 pb-1 pt-3">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {product.categoryName}
        </p>
        <h3 className="font-heading text-lg leading-tight text-foreground">{product.name}</h3>
        {priceLabel && <p className="text-sm font-medium text-primary">{priceLabel}</p>}
      </div>
    </Link>
  );
}
