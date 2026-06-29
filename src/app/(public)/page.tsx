import Link from "next/link";
import { ArrowRight, Heart, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import { YarnBall } from "@/components/decor";
import { Reveal } from "@/components/motion/reveal";
import { AnimatedStitch } from "@/components/motion/animated-stitch";
import { catalogService } from "@/services/catalog";
import type { ProductSummary } from "@/types/catalog";

export const revalidate = 60;

async function getFeatured(): Promise<ProductSummary[]> {
  try {
    return await catalogService.listProducts({ featuredOnly: true }, { next: { revalidate: 60 } });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = (await getFeatured()).slice(0, 8);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-16 top-32 size-72 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <Reveal className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-primary shadow-soft">
              <YarnBall className="size-4" /> feito à mão, com tempo e carinho
            </span>
            <h1 className="font-heading text-5xl leading-[1.02] font-semibold text-balance md:text-7xl">
              Peças de crochê com <span className="italic text-primary">alma</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              Amigurumis, mantas e decoração criados à mão por Kessler. Leve uma peça
              pronta ou encomende a sua, do seu jeito.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-soft">
                <Link href="/encomendar">
                  Fazer encomenda <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/galeria">Ver galeria</Link>
              </Button>
            </div>
          </Reveal>

          {/* arte do hero: forma orgânica + anel de pontos + novelo flutuante */}
          <Reveal delay={0.15} className="relative mx-auto aspect-square w-full max-w-md">
            <div className="blob absolute inset-0 -z-10 animate-float border-2 border-dashed border-primary/25" />
            <div className="blob flex h-full w-full items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-secondary via-muted to-accent/40 p-10 shadow-soft-lg">
              <p className="text-center font-heading text-2xl italic text-foreground/70">
                sua próxima peça favorita,
                <br /> feita à mão
              </p>
            </div>
            <YarnBall className="absolute -right-2 top-6 size-12 animate-float text-primary drop-shadow" />
            <Heart className="absolute -bottom-1 left-6 size-8 fill-primary/15 text-primary/60" />
          </Reveal>
        </div>
      </section>

      {/* ── Destaques ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-3xl font-semibold">
              <YarnBall className="size-6 text-primary" /> Em destaque
            </h2>
            <p className="mt-1 text-muted-foreground">Algumas das criações favoritas.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/galeria">
              ver tudo <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.06, 0.4)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-primary/30 bg-card/60 p-12 text-center text-muted-foreground shadow-soft">
            As peças em destaque aparecerão aqui em breve. 🧶
          </div>
        )}
      </section>

      <div className="mx-auto max-w-3xl px-4 py-4">
        <AnimatedStitch />
      </div>

      {/* ── Como funciona ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <h2 className="mb-10 text-center font-heading text-3xl font-semibold">Como funciona</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Heart, title: "Escolha ou imagine", desc: "Navegue pela galeria ou descreva a peça dos seus sonhos." },
              { icon: Sparkles, title: "A gente combina tudo", desc: "Cores, tamanho e prazo acertados pelo WhatsApp, com carinho." },
              { icon: Package, title: "Feito à mão pra você", desc: "Cada ponto é único — e chega prontinho até você." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.12}>
                <div className="relative h-full rounded-3xl bg-card p-7 shadow-soft">
                  <span className="absolute right-5 top-5 font-heading text-4xl text-primary/15">{i + 1}</span>
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-xl">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-14 text-center text-primary-foreground shadow-soft-lg md:py-20">
            <YarnBall className="absolute -left-6 -top-6 size-28 text-primary-foreground/10" />
            <YarnBall className="absolute -bottom-8 -right-4 size-32 text-primary-foreground/10" />
            <div className="relative">
              <h2 className="font-heading text-3xl font-semibold md:text-4xl">Tem uma ideia na cabeça?</h2>
              <p className="mx-auto mt-3 max-w-md text-primary-foreground/85">
                Conte o que você imaginou e eu transformo em crochê, sob medida.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-7 shadow-soft">
                <Link href="/encomendar">Começar minha encomenda</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
