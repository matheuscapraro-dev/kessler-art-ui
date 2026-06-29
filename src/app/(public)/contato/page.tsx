import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ContactWhatsAppForm } from "@/components/contact-whatsapp-form";

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
      <div className="mx-auto grid max-w-3xl gap-6 px-4 pb-12">
        <ContactWhatsAppForm />
      </div>
    </>
  );
}
