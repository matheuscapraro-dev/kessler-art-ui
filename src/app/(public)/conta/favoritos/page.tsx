"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/catalog/product-card";
import { useFavorites } from "@/hooks/use-favorites";

export default function MyFavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!favorites?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Heart className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Nenhuma peça favoritada ainda.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Toque no coração das peças que você amar para guardá-las aqui. 🤎
        </p>
        <Button asChild className="mt-6">
          <Link href="/galeria">Explorar a galeria</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {favorites.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
