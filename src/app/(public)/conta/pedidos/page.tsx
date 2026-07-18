"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyOrders } from "@/hooks/use-account";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/types/orders";

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Package className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Você ainda não tem pedidos por aqui.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos feitos como convidado aparecem depois que você confirma seu e-mail.
        </p>
        <Button asChild className="mt-6">
          <Link href="/galeria">Ver a galeria</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/pedido/${order.code}`}
          className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-heading text-lg text-primary">{order.code}</span>
            <Badge variant="secondary" className="rounded-full">
              {orderStatusLabel[order.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(ns) ·{" "}
            <span className="font-medium text-foreground">{formatPrice(order.totalAmount)}</span>
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
          </p>
        </Link>
      ))}
    </div>
  );
}
