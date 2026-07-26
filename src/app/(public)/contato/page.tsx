import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ContactWhatsAppForm } from "@/components/contact-whatsapp-form";
import { TrackLookupForm } from "@/components/orders/track-lookup-form";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Kessler Art Crochê pelo WhatsApp ou Instagram.",
};

export default function ContatoPage() {
  return (
    <>
      <PageHeader
        title="Vamos conversar"
        subtitle="Tire dúvidas, peça um orçamento ou só dê um oi. Respondo com carinho."
      />
      <Container size="narrow" className="grid gap-6 pb-12">
        <ContactWhatsAppForm />

        {/* Rastreio por código — âncora usada pelo link "Acompanhar pedido" do rodapé */}
        <section
          id="acompanhar"
          className="scroll-mt-24 space-y-3 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="flex items-center gap-2 font-heading text-lg">
            <PackageSearch className="size-5 text-primary" /> Já fez um pedido ou encomenda?
          </h2>
          <p className="text-sm text-muted-foreground">
            Digite o código que você recebeu na confirmação (começa com <strong>KES</strong> para
            pedidos e <strong>ENC</strong> para encomendas) e veja como ele está.
          </p>
          <TrackLookupForm />
        </section>
      </Container>
    </>
  );
}
