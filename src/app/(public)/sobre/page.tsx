import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Package, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutPhoto } from "@/components/about/about-photo";
import { YarnBall } from "@/components/decor";
import { Reveal } from "@/components/motion/reveal";
import { AnimatedStitch } from "@/components/motion/animated-stitch";
import { contentService } from "@/services/content";
import { safe } from "@/lib/fetch-safe";
import type { SiteContent } from "@/types/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "A alma por trás dos fios da Kessler Art Crochê: criação consciente, feita à mão, um ponto de cada vez.",
};

// Fallback quando ainda não há conteúdo cadastrado.
const defaults = {
  aboutTitle: "Crochê com propósito e carinho",
  aboutIntro:
    "Num mundo acelerado, a Kessler Art Crochê é um refúgio de criação consciente. " +
    "Cada ponto é uma pequena meditação; cada peça, uma história contada com fios e mãos pacientes. " +
    "Aqui o tempo é ingrediente — não obstáculo.",
  aboutStoryTitle: "Nossa história",
  aboutStory:
    "Tudo começou com uma agulha, um novelo e a vontade de criar com as próprias mãos. " +
    "A Kessler Art Crochê nasceu desse encontro entre afeto e ofício.\n\n" +
    "Não fazemos só peças — fazemos pequenas heranças táteis. Cada criação celebra a beleza do " +
    "feito à mão e a imperfeição perfeita que só o trabalho artesanal carrega.",
};

const galeriaPlaceholder = [
  { caption: "No ateliê", tint: "terracotta" as const },
  { caption: "Fios naturais", tint: "sage" as const },
  { caption: "Detalhes à mão", tint: "cream" as const },
  { caption: "Cores da estação", tint: "terracotta" as const },
];

const tints = ["terracotta", "sage", "cream"] as const;

const processo = [
  {
    icon: Heart,
    title: "Escolha dos fios",
    desc: "Fios selecionados com carinho, priorizando qualidade e toque macio — a base de uma peça que dura.",
  },
  {
    icon: Sparkles,
    title: "Feito à mão",
    desc: "Cada peça é tecida ponto a ponto. Um processo calmo e meditativo — não existem duas iguais.",
  },
  {
    icon: Package,
    title: "Acabamento & carinho",
    desc: "Revisão dos detalhes, um toque final e embalagem afetuosa. Pronta para virar história na sua casa.",
  },
];

const valores = ["Feito à mão", "Peça única", "Fibras de qualidade", "Sob medida", "Com tempo e carinho"];

export default async function SobrePage() {
  const content = await safe<SiteContent | null>(
    () => contentService.get({ next: { revalidate: 60 } }),
    null
  );

  const aboutTitle = content?.aboutTitle?.trim() || defaults.aboutTitle;
  const aboutIntro = content?.aboutIntro?.trim() || defaults.aboutIntro;
  const storyTitle = content?.aboutStoryTitle?.trim() || defaults.aboutStoryTitle;
  const story = content?.aboutStory?.trim() || defaults.aboutStory;
  const storyParagraphs = story.split(/\n\n+/);
  const photos = content?.aboutPhotos ?? [];
  const heroPhoto = photos[0];
  const galeria = photos.slice(1); // as demais fotos viram a mini-galeria

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-40 size-72 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <Reveal className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary shadow-soft">
              <YarnBall className="size-4" /> a alma por trás dos fios
            </p>
            <h1 className="font-heading text-5xl font-semibold leading-[1.05] text-balance md:text-6xl">
              {aboutTitle}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              {aboutIntro}
            </p>
          </Reveal>

          <Reveal delay={0.15} className="relative mx-auto w-full max-w-md">
            <div aria-hidden className="blob absolute -inset-3 -z-10 animate-float border-2 border-dashed border-primary/25" />
            <AboutPhoto
              src={heroPhoto?.url}
              alt={heroPhoto?.caption ?? "Kessler Art Crochê"}
              tint="terracotta"
              caption={heroPhoto?.caption ?? "Feito à mão, com tempo"}
              priority
              className="aspect-[4/5] rotate-1 transition-transform duration-700 hover:rotate-0"
            />
            <YarnBall className="absolute -right-3 -top-3 size-12 animate-float text-primary drop-shadow" />
          </Reveal>
        </div>
      </section>

      {/* ── Mini-galeria do ateliê ── */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <Reveal className="mb-6 text-center">
          <h2 className="flex items-center justify-center gap-2 font-heading text-2xl font-semibold">
            <YarnBall className="size-5 text-primary" /> Momentos do ateliê
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(galeria.length > 0
            ? galeria.map((p, i) => ({ key: p.id, src: p.url, caption: p.caption ?? undefined, tint: tints[i % tints.length] }))
            : galeriaPlaceholder.map((g) => ({ key: g.caption, src: undefined, caption: g.caption, tint: g.tint }))
          ).map((g, i) => (
            <Reveal key={g.key} delay={i * 0.08}>
              <AboutPhoto
                src={g.src}
                tint={g.tint}
                caption={g.caption}
                sizes="(max-width: 768px) 50vw, 25vw"
                className="aspect-square"
              />
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <AnimatedStitch />
      </div>

      {/* ── Nossa História ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="overflow-hidden rounded-[2.5rem] bg-secondary/30 p-6 shadow-soft md:p-12">
          <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
            <Reveal className="w-full space-y-5 md:w-1/2">
              <h2 className="font-heading text-3xl font-semibold text-primary">{storyTitle}</h2>
              {storyParagraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </Reveal>

            <div className="w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <Reveal>
                  <AboutPhoto src={photos[1]?.url} tint="cream" sizes="(max-width: 768px) 50vw, 25vw" className="aspect-[3/4]" />
                </Reveal>
                <Reveal delay={0.12}>
                  <AboutPhoto src={photos[2]?.url} tint="sage" sizes="(max-width: 768px) 50vw, 25vw" className="aspect-[3/4] translate-y-6" />
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O Processo ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 text-center">
        <Reveal className="mx-auto mb-12 max-w-xl space-y-3">
          <h2 className="font-heading text-3xl font-semibold text-primary">O processo</h2>
          <p className="text-lg text-muted-foreground">Lento. Cuidadoso. Autêntico.</p>
        </Reveal>

        <div className="relative">
          {/* linha pontilhada de fundo (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 top-8 hidden h-0 w-full border-t-2 border-dashed border-primary/25 md:block"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {processo.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.12}>
                <div className="relative flex h-full flex-col items-center gap-3 rounded-3xl bg-card p-7 shadow-soft">
                  <span className="z-10 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                    <Icon className="size-6" />
                  </span>
                  <span className="font-heading text-sm text-primary/50">passo {i + 1}</span>
                  <h3 className="font-heading text-xl">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Valores + CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-14 text-center text-primary-foreground shadow-soft-lg md:py-20">
            <YarnBall className="absolute -left-6 -top-6 size-28 text-primary-foreground/10" />
            <Scissors className="absolute right-8 top-10 size-10 text-primary-foreground/10" />
            <YarnBall className="absolute -bottom-8 right-10 size-32 text-primary-foreground/10" />

            <div className="relative space-y-8">
              <h2 className="font-heading text-3xl font-semibold md:text-4xl">Aquilo em que acreditamos</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {valores.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-background/15 px-5 py-2 text-sm font-medium backdrop-blur-sm"
                  >
                    {v}
                  </span>
                ))}
              </div>
              <p className="mx-auto max-w-xl text-primary-foreground/85">
                Cada fio carrega intenção. Que tal levar uma peça feita só pra você — ou imaginar
                a sua próxima encomenda?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" variant="secondary" className="shadow-soft">
                  <Link href="/encomendar">Fazer uma encomenda</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href="/galeria">Ver a galeria</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
