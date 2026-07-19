"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { CommissionPieceDialog } from "@/components/orders/commission-piece-dialog";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { whatsappLink } from "@/lib/config";
import { formatFromPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

/**
 * Bloco de compra da página da peça: preço, seletor de tamanho (quando a peça
 * tem tamanhos com preços próprios) e ações. Client component — o resto da
 * página continua renderizado no servidor.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const variants = [...product.variants].sort((a, b) => a.displayOrder - b.displayOrder);
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  const isReady = product.availability === "ReadyToBuy";
  const price = selected ? selected.price : product.price;

  // Sob encomenda o valor é um ponto de partida; com tamanho selecionado é o do tamanho.
  const priceLabel =
    !isReady && !selected ? formatFromPrice(price) : formatPrice(price);

  const waMessage = selected
    ? `Olá! Tenho interesse na peça "${product.name}" (tamanho ${selected.name}). Pode me contar mais?`
    : `Olá! Tenho interesse na peça "${product.name}". Pode me contar mais?`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xl font-medium text-primary">
          {priceLabel}
          {!isReady && selected && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (valor estimado — confirmamos no orçamento)
            </span>
          )}
        </p>
        <FavoriteButton productId={product.id} className="size-10 shrink-0 border border-border/60 [&_svg]:size-5" />
      </div>

      {variants.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Tamanho
            {selected && <span className="ml-1.5 text-muted-foreground">· {selected.name}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selectedId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center rounded-xl border px-4 py-2 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-soft"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span className="text-sm font-semibold">{variant.name}</span>
                  <span className="text-xs">{formatPrice(variant.price)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        {isReady ? (
          <>
            <AddToCartButton
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: price ?? 0,
                coverImageUrl: product.images[0]?.url ?? null,
                variantId: selected?.id ?? null,
                variantName: selected?.name ?? null,
              }}
            />
            {/* Qualquer peça é encomendável — pronta também vira "essa, mas na minha cor". */}
            <CommissionPieceDialog
              product={product}
              defaultVariant={selected}
              trigger={
                <Button size="lg" variant="outline">
                  Encomendar sob medida
                </Button>
              }
            />
          </>
        ) : (
          <CommissionPieceDialog
            product={product}
            defaultVariant={selected}
            trigger={<Button size="lg">Encomendar esta peça</Button>}
          />
        )}
        <Button asChild size="lg" variant="outline">
          <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
