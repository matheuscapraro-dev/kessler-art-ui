import type { Metadata } from "next";
import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { StatusTimeline, type TimelineStep } from "@/components/orders/status-timeline";
import { TrackLookupForm } from "@/components/orders/track-lookup-form";
import { orderService } from "@/services/orders";
import { whatsappLink } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { type Order, type OrderStatus } from "@/types/orders";

export const metadata: Metadata = { title: "Acompanhar pedido" };

async function getOrder(code: string): Promise<Order | null> {
  try {
    return await orderService.track(code, { cache: "no-store" });
  } catch {
    return null;
  }
}

// Jornada feliz do pedido; Cancelado é tratado à parte.
const flow: { status: OrderStatus; step: TimelineStep }[] = [
  {
    status: "Pendente",
    step: {
      label: "Pedido recebido",
      description: "Recebi seu pedido! Agora é só combinar o pagamento pelo WhatsApp.",
    },
  },
  {
    status: "Confirmado",
    step: {
      label: "Confirmado",
      description: "Tudo certo com o pagamento — seu pedido entrou na fila de preparo.",
    },
  },
  {
    status: "EmProducao",
    step: {
      label: "Em preparo",
      description: "Sua peça está sendo preparada e embalada com todo o carinho.",
    },
  },
  {
    status: "Enviado",
    step: { label: "Enviado", description: "Seu pedido está a caminho!" },
  },
  {
    status: "Concluido",
    step: { label: "Entregue", description: "Chegou! Espero que ame cada pontinho." },
  },
];

export default async function PedidoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const order = await getOrder(codigo);

  if (!order) {
    return (
      <>
        <PageHeader
          title="Pedido não encontrado"
          subtitle={`Não achei nada com o código "${codigo}". Confira se digitou certinho e tente de novo.`}
        />
        <Container className="max-w-md space-y-3 pb-16">
          <div className="rounded-2xl border border-border bg-card p-6">
            <TrackLookupForm />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Códigos de pedido começam com KES; encomendas sob medida começam com ENC.
          </p>
        </Container>
      </>
    );
  }

  const cancelled = order.status === "Cancelado";
  const currentIndex = Math.max(flow.findIndex((f) => f.status === order.status), 0);
  const paid = order.paymentStatus === "Pago";
  const waMessage =
    `Olá! Sobre o meu pedido ${order.code} ` +
    `(total ${formatPrice(order.totalAmount)}) — podemos conversar?`;

  return (
    <>
      <PageHeader
        title={`Pedido ${order.code}`}
        subtitle={`Feito em ${new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`}
      />
      <Container className="max-w-2xl space-y-5 pb-16">
        {cancelled ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">Este pedido foi cancelado.</p>
              <p className="text-sm text-muted-foreground">
                Se ficou alguma dúvida, é só me chamar no WhatsApp — resolvemos juntinhos.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 font-heading text-lg">Onde seu pedido está</h2>
            <StatusTimeline
              steps={flow.map((f) => f.step)}
              currentIndex={currentIndex}
              completed={order.status === "Concluido"}
            />
          </div>
        )}

        {/* Situação do pagamento (manual via Pix/WhatsApp no v1) */}
        {!cancelled &&
          (paid ? (
            <p className="flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-sm">
              <CheckCircle2 className="size-4 text-primary" /> Pagamento confirmado — obrigada!
            </p>
          ) : (
            <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <p className="text-sm">
                <strong>Pagamento pendente.</strong> Sem pressa: é só me chamar no WhatsApp para
                combinarmos o Pix, que eu já separo tudo por aqui.
              </p>
              <Button asChild>
                <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Combinar pagamento
                </a>
              </Button>
            </div>
          ))}

        <div className="rounded-2xl border border-border bg-card">
          <h2 className="px-6 pt-5 font-heading text-lg">Itens do pedido</h2>
          <ul className="mt-2 divide-y divide-border">
            {order.items.map((item, i) => (
              <li
                key={`${item.productId}-${item.variantName ?? i}`}
                className="flex justify-between gap-2 px-6 py-3.5 text-sm"
              >
                <span>
                  <span className="text-muted-foreground">{item.quantity}×</span> {item.productName}
                  {item.variantName && (
                    <span className="text-muted-foreground"> · {item.variantName}</span>
                  )}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
            <li className="flex justify-between px-6 py-4 font-medium">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.totalAmount)}</span>
            </li>
          </ul>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Alguma dúvida sobre este pedido?{" "}
          <a
            href={whatsappLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Fale comigo no WhatsApp
          </a>
          .
        </p>
      </Container>
    </>
  );
}
