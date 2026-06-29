import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { commissionService } from "@/services/commissions";
import { formatPrice } from "@/lib/format";
import { commissionStatusLabel, type Commission } from "@/types/orders";

export const metadata: Metadata = { title: "Acompanhar encomenda" };

async function getCommission(code: string): Promise<Commission | null> {
  try {
    return await commissionService.track(code, { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function EncomendaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const commission = await getCommission(codigo);

  if (!commission) {
    return (
      <>
        <PageHeader title="Encomenda não encontrada" />
        <p className="mx-auto max-w-md px-4 pb-16 text-center text-muted-foreground">
          Confira o código <strong>{codigo}</strong> e tente novamente.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Encomenda ${commission.code}`} />
      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <Badge>{commissionStatusLabel[commission.status]}</Badge>
          {commission.quotedPrice != null && (
            <Badge variant="secondary">Orçamento: {formatPrice(commission.quotedPrice)}</Badge>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg">Seu pedido</h2>
          <p className="whitespace-pre-line text-muted-foreground">{commission.description}</p>
          <dl className="grid gap-2 pt-2 text-sm sm:grid-cols-2">
            {commission.desiredCategory && (
              <div><dt className="text-muted-foreground">Tipo</dt><dd>{commission.desiredCategory}</dd></div>
            )}
            {commission.colors && (
              <div><dt className="text-muted-foreground">Cores</dt><dd>{commission.colors}</dd></div>
            )}
            {commission.size && (
              <div><dt className="text-muted-foreground">Tamanho</dt><dd>{commission.size}</dd></div>
            )}
          </dl>
        </div>
      </div>
    </>
  );
}
