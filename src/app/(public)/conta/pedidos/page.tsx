"use client";

import Link from "next/link";
import { Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCommissions, useMyOrders } from "@/hooks/use-account";
import { formatPrice } from "@/lib/format";
import { commissionStatusLabel, orderStatusLabel } from "@/types/orders";
import type { Commission, Order } from "@/types/orders";

type TimelineItem =
  | { kind: "pedido"; code: string; createdAt: string; order: Order }
  | { kind: "encomenda"; code: string; createdAt: string; commission: Commission };

export default function MyOrdersPage() {
  const { data: orders, isLoading: loadingOrders } = useMyOrders();
  const { data: commissions, isLoading: loadingCommissions } = useMyCommissions();
  const isLoading = loadingOrders || loadingCommissions;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  // Pedidos (peça pronta) e encomendas (sob medida) são coisas diferentes por trás, mas
  // pra quem compra é tudo "o que eu pedi da Kessler" — mostramos juntos, por data.
  const items: TimelineItem[] = [
    ...(orders ?? []).map((order): TimelineItem => ({
      kind: "pedido",
      code: order.code,
      createdAt: order.createdAt,
      order,
    })),
    ...(commissions ?? []).map((commission): TimelineItem => ({
      kind: "encomenda",
      code: commission.code,
      createdAt: commission.createdAt,
      commission,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Package className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Você ainda não tem pedidos por aqui.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos e encomendas feitos como convidado aparecem depois que você confirma seu e-mail.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/galeria">Ver a galeria</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/encomendar">Fazer uma encomenda</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) =>
        item.kind === "pedido" ? (
          <Link
            key={item.code}
            href={`/pedido/${item.order.code}`}
            className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="font-heading text-lg text-primary">{item.order.code}</span>
                <Badge variant="outline" className="rounded-full">
                  <Package className="size-3" /> Pedido
                </Badge>
              </span>
              <Badge variant="secondary" className="rounded-full">
                {orderStatusLabel[item.order.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(item.order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
              {item.order.items.reduce((sum, i) => sum + i.quantity, 0)} item(ns) ·{" "}
              <span className="font-medium text-foreground">{formatPrice(item.order.totalAmount)}</span>
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {item.order.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
            </p>
          </Link>
        ) : (
          <Link
            key={item.code}
            href={`/encomenda/${item.commission.code}`}
            className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="font-heading text-lg text-primary">{item.commission.code}</span>
                <Badge variant="outline" className="rounded-full">
                  <Sparkles className="size-3" /> Encomenda
                </Badge>
              </span>
              <Badge variant="secondary" className="rounded-full">
                {commissionStatusLabel[item.commission.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(item.commission.createdAt).toLocaleDateString("pt-BR")}
              {item.commission.quotedPrice != null && (
                <>
                  {" "}
                  · orçamento:{" "}
                  <span className="font-medium text-foreground">
                    {formatPrice(item.commission.quotedPrice)}
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.commission.description}
            </p>
          </Link>
        )
      )}
    </div>
  );
}
