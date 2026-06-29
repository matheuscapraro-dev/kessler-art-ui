import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-heading text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl">Esse pontinho se perdeu</h1>
      <p className="mt-2 text-muted-foreground">
        A página que você procura não existe (ou foi desfeita). Que tal voltar para o início?
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
