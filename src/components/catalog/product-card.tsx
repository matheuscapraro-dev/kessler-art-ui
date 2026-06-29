import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
    <Link href={`/peca/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        {product.coverImageUrl ? (
          <Image
            src={product.coverImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            sem foto
          </div>
        )}
        <Badge variant="secondary" className="absolute left-3 top-3 shadow-sm">
          {availabilityLabel[product.availability]}
        </Badge>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {product.categoryName}
        </p>
        <h3 className="font-heading text-lg leading-tight text-foreground">{product.name}</h3>
        {priceLabel && <p className="text-sm font-medium text-primary">{priceLabel}</p>}
      </div>
    </Link>
  );
}
