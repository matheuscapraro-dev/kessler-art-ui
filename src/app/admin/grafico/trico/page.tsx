import { ChartEditor } from "@/components/chart-editor/chart-editor";

// `?importar=1` (vindo do hub) abre o editor já com o diálogo de imagem aberto.
export default async function GraficoTricoPage({
  searchParams,
}: {
  searchParams: Promise<{ importar?: string }>;
}) {
  const { importar } = await searchParams;
  return <ChartEditor craft="trico" startImporting={importar === "1"} />;
}
