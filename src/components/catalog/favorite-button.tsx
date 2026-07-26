"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-favorites";

/**
 * Coração de favoritar nos cards e na página da peça. Update otimista via
 * useToggleFavorite; deslogado, leva ao login com a página atual de callback.
 */
export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { data: ids } = useFavoriteIds();
  const { toggle } = useToggleFavorite();
  const favorited = ids?.includes(productId) ?? false;

  return (
    <button
      type="button"
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorited}
      className={cn(
        // after:-inset-2 estende a área de toque para ~48px sem crescer o visual.
        "relative flex size-8 items-center justify-center rounded-full bg-background/85 shadow-soft backdrop-blur transition-transform after:absolute after:-inset-2 hover:scale-110 active:scale-95",
        className
      )}
      onClick={(e) => {
        // Dentro de <Link> do card: não navegar ao favoritar.
        e.preventDefault();
        e.stopPropagation();
        toggle(productId, favorited);
      }}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          favorited ? "fill-primary text-primary" : "text-muted-foreground"
        )}
      />
    </button>
  );
}
