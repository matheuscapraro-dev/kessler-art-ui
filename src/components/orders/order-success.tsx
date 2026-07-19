import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Celebrate } from "@/components/motion/celebrate";
import { whatsappLink } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/orders";

/** Confirmação de pedido enviado — código KES, CTA de WhatsApp e (convidado) convite de conta. */
export function OrderSuccess({ order, isGuest }: { order: Order; isGuest: boolean }) {
  const message =
    `Olá! Fiz o pedido ${order.code} no site ` +
    `(total ${formatPrice(order.totalAmount)}). Como combinamos o pagamento?`;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-border bg-card p-8 text-center">
        <Celebrate />
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h2 className="mt-4 font-heading text-2xl">Pedido recebido! 🧶</h2>
        <p className="mt-4 inline-block rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-2.5 font-heading text-2xl tracking-wide text-primary">
          {order.code}
        </p>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Guarde esse código para acompanhar seu pedido. Agora é só combinar o pagamento (Pix) pelo
          WhatsApp que eu separo tudo com carinho.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Combinar pagamento
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/pedido/${order.code}`}>Acompanhar pedido</Link>
          </Button>
        </div>
      </div>

      {/* Convite pós-compra: guest vira conta e o pedido entra no histórico ao verificar o e-mail. */}
      {isGuest && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
          <p className="text-sm text-foreground">
            Quer acompanhar tudo num só lugar? Crie sua conta com o mesmo e-mail e este pedido
            aparece no seu histórico. 🧶
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link
              href={`/cadastrar?email=${encodeURIComponent(order.customerEmail)}&callbackUrl=${encodeURIComponent("/conta/pedidos")}`}
            >
              Criar minha conta
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
