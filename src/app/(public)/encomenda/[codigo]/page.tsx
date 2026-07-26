import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MessageCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { StatusTimeline, type TimelineStep } from "@/components/orders/status-timeline";
import { TrackLookupForm } from "@/components/orders/track-lookup-form";
import { commissionService } from "@/services/commissions";
import { catalogService } from "@/services/catalog";
import { whatsappLink } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { safe } from "@/lib/fetch-safe";
import { type Product } from "@/types/catalog";
import { type Commission, type CommissionStatus } from "@/types/orders";

export const metadata: Metadata = { title: "Acompanhar encomenda" };

async function getCommission(code: string): Promise<Commission | null> {
  try {
    return await commissionService.track(code, { cache: "no-store" });
  } catch {
    return null;
  }
}

// Jornada feliz da encomenda; Recusada é tratada à parte.
const flow: { status: CommissionStatus; step: TimelineStep }[] = [
  {
    status: "Nova",
    step: {
      label: "Ideia recebida",
      description: "Recebi sua encomenda! Em breve dou uma olhada com carinho.",
    },
  },
  {
    status: "EmAnalise",
    step: {
      label: "Em análise",
      description: "Estou estudando os detalhes, fios e cores para montar seu orçamento.",
    },
  },
  {
    status: "OrcamentoEnviado",
    step: {
      label: "Orçamento enviado",
      description: "Confira seu WhatsApp — te mandei o valor e o prazo da peça.",
    },
  },
  {
    status: "Aprovada",
    step: {
      label: "Aprovada",
      description: "Orçamento aprovado! Sua peça entrou na fila do ateliê.",
    },
  },
  {
    status: "EmProducao",
    step: {
      label: "Em produção",
      description: "Sua peça está nascendo, ponto a ponto. 🧶",
    },
  },
  {
    status: "Concluida",
    step: { label: "Prontinha", description: "Sua peça está pronta! Vamos combinar a entrega." },
  },
];

export default async function EncomendaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const commission = await getCommission(codigo);

  if (!commission) {
    return (
      <>
        <PageHeader
          title="Encomenda não encontrada"
          subtitle={`Não achei nada com o código "${codigo}". Confira se digitou certinho e tente de novo.`}
        />
        <Container className="max-w-md space-y-3 pb-16">
          <div className="rounded-2xl border border-border bg-card p-6">
            <TrackLookupForm />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Códigos de encomenda começam com ENC; pedidos da lojinha começam com KES.
          </p>
        </Container>
      </>
    );
  }

  const refused = commission.status === "Recusada";
  const currentIndex = Math.max(flow.findIndex((f) => f.status === commission.status), 0);
  const waMessage = `Olá! Sobre a minha encomenda ${commission.code} — podemos conversar?`;

  // Encomenda que partiu de uma peça do site: mostra a peça de referência (best-effort).
  const referenceProduct: Product | null = commission.referenceProductSlug
    ? await safe<Product | null>(
        () =>
          catalogService.getProductBySlug(commission.referenceProductSlug!, {
            next: { revalidate: 60 },
          }),
        null,
      )
    : null;

  return (
    <>
      <PageHeader
        title={`Encomenda ${commission.code}`}
        subtitle={`Enviada em ${new Date(commission.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`}
      />
      <Container className="max-w-2xl space-y-5 pb-16">
        {refused ? (
          <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium">Esta encomenda não seguiu adiante.</p>
                <p className="text-sm text-muted-foreground">
                  Às vezes o prazo ou o tipo de peça não encaixam na agenda do ateliê — mas adoraria
                  pensar em outra ideia com você.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/encomendar">Enviar uma nova ideia</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 font-heading text-lg">Onde sua encomenda está</h2>
            <StatusTimeline
              steps={flow.map((f) => f.step)}
              currentIndex={currentIndex}
              completed={commission.status === "Concluida"}
            />
          </div>
        )}

        {/* Orçamento em destaque quando já existe */}
        {!refused && commission.quotedPrice != null && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Orçamento</p>
              <p className="font-heading text-2xl text-primary">
                {formatPrice(commission.quotedPrice)}
              </p>
            </div>
            {commission.status === "OrcamentoEnviado" && (
              <Button asChild>
                <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Responder no WhatsApp
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Peça da galeria que originou a encomenda */}
        {referenceProduct && (
          <Link
            href={`/peca/${referenceProduct.slug}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            {referenceProduct.images[0]?.url && (
              <Image
                src={referenceProduct.images[0].url}
                alt={referenceProduct.name}
                width={64}
                height={64}
                className="warm-img size-16 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Peça de referência
              </p>
              <p className="truncate font-heading text-base">{referenceProduct.name}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        )}

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg">O que você pediu</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {commission.description}
          </p>
          {(commission.desiredCategory || commission.colors || commission.size) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {commission.desiredCategory && (
                <Badge variant="secondary">{commission.desiredCategory}</Badge>
              )}
              {commission.colors && <Badge variant="outline">Cores: {commission.colors}</Badge>}
              {commission.size && <Badge variant="outline">Tamanho: {commission.size}</Badge>}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Quer ajustar algo ou tirar uma dúvida?{" "}
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
