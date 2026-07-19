import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Celebrate } from "@/components/motion/celebrate";
import { whatsappLink } from "@/lib/config";
import type { Commission } from "@/types/orders";

/**
 * Confirmação de encomenda enviada — reaproveitada pelo formulário de encomenda
 * personalizada (/encomendar) e pelo painel de encomenda de peça da galeria.
 * Mostra o código ENC, o CTA de WhatsApp e (para convidado) o convite de conta.
 */
export function CommissionSuccess({
  commission,
  isGuest,
}: {
  commission: Commission;
  isGuest: boolean;
}) {
  const message =
    `Olá! Acabei de enviar a encomenda ${commission.code} pelo site. ` +
    `Resumo: ${commission.description}`;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-border bg-card p-8 text-center">
        <Celebrate />
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h2 className="mt-4 font-heading text-2xl">Encomenda recebida! 🧶</h2>
        <p className="mt-4 inline-block rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-2.5 font-heading text-2xl tracking-wide text-primary">
          {commission.code}
        </p>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Guardei tudo certinho — esse é o seu código de acompanhamento. Vamos combinar os
          detalhes e o orçamento pelo WhatsApp.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Continuar no WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`/encomenda/${commission.code}`}>Acompanhar encomenda</a>
          </Button>
        </div>
      </div>

      {/* Convite pós-envio: guest vira conta e a encomenda entra no histórico ao verificar o e-mail. */}
      {isGuest && commission.customerEmail && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
          <p className="text-sm text-foreground">
            Quer acompanhar tudo num só lugar? Crie sua conta com o mesmo e-mail e esta encomenda
            aparece no seu histórico. 🧶
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <a
              href={`/cadastrar?email=${encodeURIComponent(commission.customerEmail)}&callbackUrl=${encodeURIComponent("/conta/encomendas")}`}
            >
              Criar minha conta
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
