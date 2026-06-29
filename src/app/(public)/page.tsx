import Link from "next/link";
import { ArrowRight, Heart, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import { catalogService } from "@/services/catalog";
import type { ProductSummary } from "@/types/catalog";

// Revalida o catálogo a cada 60s (ISR) — bom para SEO e performance.
export const revalidate = 60;

async function getFeatured(): Promise<ProductSummary[]> {
  try {
    return await catalogService.listProducts(
      { featuredOnly: true },
      { next: { revalidate: 60 } }
    );
  } catch {
    return []; // API fora do ar não derruba a home
  }
}

export default async function HomePage() {
  const featured = (await getFeatured()).slice(0, 8);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="size-3.5" /> feito à mão, com tempo e carinho
            </span>
            <h1 className="font-heading text-4xl leading-[1.05] font-semibold text-balance md:text-6xl">
              Peças de crochê com alma
            </h1>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              Amigurumis, mantas e decoração criados à mão por Kessler. Leve uma peça
              pronta ou encomende a sua, do seu jeito.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/encomendar">
                  Fazer encomenda <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/galeria">Ver galeria</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-secondary via-muted to-accent/40 shadow-sm">
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="font-heading text-2xl text-foreground/70">
                sua próxima peça favorita,
                <br /> feita à mão
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Destaques ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold">Em destaque</h2>
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
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-muted-foreground">
            As peças em destaque aparecerão aqui em breve.
          </div>
        )}
      </section>

      {/* ── Como funciona ── */}
      <section className="bg-secondary/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
          {[
            { icon: Heart, title: "Escolha ou imagine", desc: "Navegue pela galeria ou descreva a peça dos seus sonhos." },
            { icon: Sparkles, title: "A gente combina tudo", desc: "Cores, tamanho e prazo acertados pelo WhatsApp, com carinho." },
            { icon: Package, title: "Feito à mão pra você", desc: "Cada ponto é único — e chega prontinho até você." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-card p-6 shadow-sm">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-xl">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-[2rem] bg-primary px-8 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="font-heading text-3xl font-semibold md:text-4xl">
            Tem uma ideia na cabeça?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Conte o que você imaginou e eu transformo em crochê, sob medida.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/encomendar">Começar minha encomenda</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
