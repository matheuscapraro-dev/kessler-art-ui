"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/components/cart/cart-provider";

export function AddToCartButton({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size="lg"
      onClick={() => {
        add(product);
        setAdded(true);
        toast.success(`"${product.name}" foi para o carrinho.`);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? (
        <>
          <Check className="size-4" /> Adicionado
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" /> Adicionar ao carrinho
        </>
      )}
    </Button>
  );
}
