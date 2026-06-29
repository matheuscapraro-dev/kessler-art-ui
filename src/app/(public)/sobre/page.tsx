import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça a história por trás da Kessler Art Crochê.",
};

export default function SobrePage() {
  return (
    <>
      <PageHeader title="Sobre" subtitle="A história por trás de cada ponto." />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-12 text-lg leading-relaxed text-muted-foreground">
        <p>
          A <strong className="text-foreground">Kessler Art Crochê</strong> nasceu do amor por
          transformar fios em peças cheias de afeto. Cada amigurumi, manta e item de decoração é
          feito à mão, com calma e atenção aos detalhes — do jeitinho que coisas feitas com carinho
          merecem.
        </p>
        <p>
          Acreditamos que o crochê é mais do que técnica: é tempo dedicado, é história, é presente.
          Por isso cada peça é pensada para durar e para contar a sua própria história na casa de
          quem a recebe.
        </p>
        <p>
          Quer uma peça única, do seu jeito, na sua cor favorita? É só fazer uma encomenda — a gente
          cria junto.
        </p>
        <div className="pt-2">
          <Button asChild size="lg">
            <Link href="/encomendar">Fazer uma encomenda</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
