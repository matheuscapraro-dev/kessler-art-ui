import { YarnBall } from "@/components/decor";

const ITEMS = [
  "feito à mão",
  "com amor",
  "sob encomenda",
  "peça única",
  "fio a fio",
  "feito com calma",
];

function Group() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((t) => (
        <span
          key={t}
          className="flex items-center gap-3 px-5 text-sm font-medium uppercase tracking-[0.22em]"
        >
          {t}
          <YarnBall className="size-4 opacity-70" />
        </span>
      ))}
    </div>
  );
}

/** Faixa decorativa deslizante (pausa no hover; estática com reduced-motion). */
export function HandmadeRibbon() {
  return (
    <div className="ribbon-marquee overflow-hidden border-y border-primary/15 bg-primary/[0.06] py-3 text-primary/80">
      <div className="ribbon-track flex w-max">
        <Group />
        <Group />
      </div>
    </div>
  );
}
