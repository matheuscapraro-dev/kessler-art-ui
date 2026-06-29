"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";

export default function CarrinhoPage() {
  const { items, setQuantity, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Seu carrinho" />
        <div className="mx-auto max-w-md px-4 pb-16 text-center">
          <p className="text-muted-foreground">Seu carrinho está vazio por enquanto.</p>
          <Button asChild className="mt-6">
            <Link href="/loja">Ver a loja</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Seu carrinho" />
      <div className="mx-auto grid max-w-4xl gap-8 px-4 pb-16 md:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 rounded-2xl border border-border bg-card p-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.coverImageUrl && (
                  <Image src={item.coverImageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/peca/${item.slug}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => remove(item.productId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      aria-label="Diminuir"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <span className="font-medium text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg">Resumo</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">Finalizar pedido</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            O pagamento é combinado por Pix/WhatsApp após o pedido.
          </p>
        </aside>
      </div>
    </>
  );
}
