import { ChartEditor } from "@/components/chart-editor/chart-editor";

// `?importar=1` (vindo do hub) abre o editor já com o diálogo de imagem aberto.
export default async function GraficoCrochePage({
  searchParams,
}: {
  searchParams: Promise<{ importar?: string }>;
}) {
  const { importar } = await searchParams;
  return <ChartEditor craft="croche" startImporting={importar === "1"} />;
}
