import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StitchDivider, YarnBall } from "@/components/decor";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <YarnBall className="size-14 animate-float text-primary/50" />
      <p className="mt-6 font-heading text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl">Esse pontinho se perdeu</h1>
      <p className="mt-2 text-muted-foreground">
        A página que você procura não existe (ou foi desfeita). Que tal voltar para o início?
      </p>
      <StitchDivider className="my-8 w-40" />
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/galeria">Ver a galeria</Link>
        </Button>
      </div>
    </div>
  );
}
