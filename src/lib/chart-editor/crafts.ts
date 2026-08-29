// Tudo o que difere entre o editor de crochê e o de tricô mora aqui — o mesmo
// papel do `IExternalAuthProvider` no backend: o editor é um só, a técnica é
// um adaptador. Uma técnica nova (tunisiano, ponto alto...) = um spec novo.

import type { Craft, Gauge, Yarn } from "./model";
import { drawCrochetStitch, drawKnitStitch, type StitchDrawer } from "./stitches";

export interface CraftSpec {
  key: Craft;
  /** Título da página. */
  title: string;
  /** Nome curto pra menus/cards. */
  shortTitle: string;
  /** Técnica retratada no preview. */
  technique: string;
  description: string;
  /** Vocabulário: como a artista chama o ponto e a carreira. */
  stitchWord: string;
  stitchWordPlural: string;
  rowWord: string;
  rowWordPlural: string;
  defaultGauge: Gauge;
  defaultSize: { cols: number; rows: number };
  defaultYarns: Yarn[];
  drawStitch: StitchDrawer;
  /** Chave do rascunho no localStorage. */
  storageKey: string;
  /** Dica de leitura do gráfico exibida na receita. */
  readingHint: string;
}

// Paleta inicial segue os tons do tema (creme, terracota, sage, mostarda, castanho).
const THEME_YARNS: Yarn[] = [
  { name: "Creme", hex: "#f3ead9" },
  { name: "Terracota", hex: "#c2643f" },
  { name: "Sage", hex: "#8fa887" },
  { name: "Mostarda", hex: "#d4a24c" },
  { name: "Castanho", hex: "#6b4a3a" },
];

export const CRAFTS: Record<Craft, CraftSpec> = {
  croche: {
    key: "croche",
    title: "Gráfico de crochê",
    shortTitle: "Crochê",
    technique: "Tapestry crochet (ponto baixo)",
    description:
      "Desenhe ponto a ponto e veja o tecido em ponto baixo tomar forma — ideal pra tapestry, bolsas, amigurumi e tapetes.",
    stitchWord: "ponto",
    stitchWordPlural: "pontos",
    rowWord: "carreira",
    rowWordPlural: "carreiras",
    defaultGauge: { stitches: 16, rows: 18 },
    defaultSize: { cols: 20, rows: 20 },
    defaultYarns: THEME_YARNS.slice(0, 3),
    drawStitch: drawCrochetStitch,
    storageKey: "kessler:grafico:croche",
    readingHint:
      "Leia de baixo para cima. Em carreiras de ida e volta, as ímpares vão da direita para a esquerda e as pares no sentido contrário; em círculo, sempre da direita para a esquerda.",
  },
  trico: {
    key: "trico",
    title: "Gráfico de tricô",
    shortTitle: "Tricô",
    technique: "Jacquard / fair isle (ponto meia)",
    description:
      "Desenhe o motivo e veja a malha em ponto meia com as repetições — pra golas, punhos, gorros e blusas em jacquard.",
    stitchWord: "malha",
    stitchWordPlural: "malhas",
    rowWord: "carreira",
    rowWordPlural: "carreiras",
    defaultGauge: { stitches: 22, rows: 28 },
    defaultSize: { cols: 16, rows: 16 },
    defaultYarns: [
      { name: "Natural", hex: "#efe6d2" },
      { name: "Azul China", hex: "#5b84c4" },
      { name: "Manteiga", hex: "#e2b969" },
    ],
    drawStitch: drawKnitStitch,
    storageKey: "kessler:grafico:trico",
    readingHint:
      "Leia de baixo para cima. Carreiras do direito (ímpares) vão da direita para a esquerda; carreiras do avesso, da esquerda para a direita. Em círculo, todas da direita para a esquerda.",
  },
};

export const ALL_THEME_YARNS = THEME_YARNS;

export function isCraft(value: string): value is Craft {
  return value === "croche" || value === "trico";
}
