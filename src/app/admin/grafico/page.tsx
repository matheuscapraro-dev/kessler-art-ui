import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { CRAFTS } from "@/lib/chart-editor/crafts";

// Escolha da técnica: cada uma tem o seu editor (mesmo motor, preview e
// vocabulário próprios) e o seu rascunho salvo no navegador.
export default function GraficoHubPage() {
  const crafts = [CRAFTS.croche, CRAFTS.trico];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold">
          <LayoutGrid className="size-6 text-primary" /> Gráficos
        </h1>
        <p className="text-sm text-muted-foreground">
          Desenhe o motivo ponto a ponto, veja o tecido com as repetições e tire a receita — ou parta de uma imagem.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {crafts.map((c) => (
          <Link
            key={c.key}
            href={`/admin/grafico/${c.key}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <CraftSwatch craft={c.key} />
            <p className="mt-4 font-heading text-xl">{c.title}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.technique}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <p className="mt-4 text-sm font-medium text-primary group-hover:underline">Abrir editor →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Amostra estática (SVG) com a "cara" de cada técnica, sem depender de canvas. */
function CraftSwatch({ craft }: { craft: "croche" | "trico" }) {
  const cols = 9;
  const rows = 4;
  const w = 24;
  const h = craft === "trico" ? 19 : 22;
  const colors = craft === "trico" ? ["#efe6d2", "#5b84c4", "#e2b969"] : ["#f3ead9", "#c2643f", "#8fa887"];
  const motif = [
    [0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 2, 1, 0, 1, 2, 1, 0],
    [1, 2, 2, 2, 1, 2, 2, 2, 1],
    [0, 1, 2, 1, 0, 1, 2, 1, 0],
  ];
  return (
    <svg viewBox={`0 0 ${cols * w} ${rows * h}`} className="h-24 w-full rounded-xl bg-[#3a2f2a]" aria-hidden>
      {motif.map((row, r) =>
        row.map((v, c) => {
          const x = c * w;
          const y = r * h;
          const fill = colors[v];
          if (craft === "trico") {
            return (
              <g key={`${r}-${c}`} stroke={fill} strokeWidth={9} strokeLinecap="round" fill="none">
                <path d={`M${x + 5} ${y + 3} Q${x + 3} ${y + 14} ${x + 12} ${y + h + 8}`} />
                <path d={`M${x + 19} ${y + 3} Q${x + 21} ${y + 14} ${x + 12} ${y + h + 8}`} />
              </g>
            );
          }
          return (
            <g key={`${r}-${c}`} fill={fill}>
              <rect x={x + 1.5} y={y + 6} width={w - 3} height={h - 5} rx={5} />
              <ellipse cx={x + 8} cy={y + 5} rx={7} ry={3.6} transform={`rotate(-20 ${x + 8} ${y + 5})`} />
              <ellipse cx={x + 16} cy={y + 4} rx={7} ry={3.6} transform={`rotate(-20 ${x + 16} ${y + 4})`} />
            </g>
          );
        }),
      )}
    </svg>
  );
}
