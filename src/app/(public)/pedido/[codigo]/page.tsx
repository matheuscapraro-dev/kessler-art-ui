import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { orderService } from "@/services/orders";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, type Order } from "@/types/orders";

export const metadata: Metadata = { title: "Acompanhar pedido" };

async function getOrder(code: string): Promise<Order | null> {
  try {
    return await orderService.track(code, { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function PedidoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const order = await getOrder(codigo);

  if (!order) {
    return (
      <>
        <PageHeader title="Pedido não encontrado" />
        <p className="mx-auto max-w-md px-4 pb-16 text-center text-muted-foreground">
          Confira o código <strong>{codigo}</strong> e tente novamente.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Pedido ${order.code}`} />
      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <Badge>{orderStatusLabel[order.status]}</Badge>
          <Badge variant={order.paymentStatus === "Pago" ? "default" : "secondary"}>
            Pagamento: {order.paymentStatus}
          </Badge>
          <span className="ml-auto text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2 p-4 text-sm">
              <span>
                {item.quantity}× {item.productName}
              </span>
              <span>{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between p-4 font-medium">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </li>
        </ul>
      </div>
    </>
  );
}
