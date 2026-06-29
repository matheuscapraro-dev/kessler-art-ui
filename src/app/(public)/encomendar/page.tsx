import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CommissionForm } from "@/components/orders/commission-form";

export const metadata: Metadata = {
  title: "Fazer encomenda",
  description: "Encomende uma peça de crochê sob medida — do seu jeito, na sua cor.",
};

export default function EncomendarPage() {
  return (
    <>
      <PageHeader
        title="Fazer uma encomenda"
        subtitle="Conte o que você imaginou e eu transformo em crochê. Sem compromisso — combinamos tudo antes."
      />
      <div className="mx-auto max-w-2xl px-4 pb-12">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
          <CommissionForm />
        </Suspense>
      </div>
    </>
  );
}
