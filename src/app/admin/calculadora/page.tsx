"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calculator as CalculatorIcon, Plus, Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pricingService } from "@/services/pricing";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import type { PricingSettings } from "@/types/pricing";

/** Faixas de metragem por tipo de peça (dados de referência da comunidade de crochê). */
const YARN_PRESETS = [
  { id: "amigurumi-p", label: "Amigurumi pequeno", min: 50, max: 150 },
  { id: "amigurumi-m", label: "Amigurumi médio", min: 150, max: 350 },
  { id: "amigurumi-g", label: "Amigurumi grande", min: 350, max: 600 },
  { id: "touca", label: "Touca / gorro", min: 150, max: 300 },
  { id: "cachecol", label: "Cachecol", min: 300, max: 500 },
  { id: "manta-bebe", label: "Manta de bebê", min: 800, max: 1200 },
  { id: "manta-casal", label: "Manta casal / xale", min: 1500, max: 2500 },
  { id: "bolsa", label: "Bolsa", min: 300, max: 600 },
] as const;

const SAFETY_BUFFER = 0.15; // 10–15% de folga sobre a estimativa, prática comum entre crocheteiras

interface MaterialItem {
  id: string;
  name: string;
  cost: string;
}

let materialSeq = 0;
const newMaterial = (name = "", cost = ""): MaterialItem => ({
  id: `m${Date.now()}-${materialSeq++}`,
  name,
  cost,
});

/** Converte texto de input (aceita vírgula) em número não-negativo; inválido vira 0. */
function num(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function CalculadoraPage() {
  const [tab, setTab] = useState("preco");
  const [materials, setMaterials] = useState<MaterialItem[]>([newMaterial()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold">
          <CalculatorIcon className="size-6 text-primary" /> Calculadora
        </h1>
        <p className="text-sm text-muted-foreground">
          Precifique uma peça sem chute e estime quanto de fio ela vai levar.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="preco">Preço</TabsTrigger>
          <TabsTrigger value="fio">Fio</TabsTrigger>
        </TabsList>

        <TabsContent value="preco" className="mt-6">
          <PriceCalculator materials={materials} setMaterials={setMaterials} />
        </TabsContent>

        <TabsContent value="fio" className="mt-6">
          <YarnCalculator
            onUseInPrice={(name, cost) => {
              setMaterials((prev) => [newMaterial(name, cost), ...prev.filter((m) => m.name || m.cost)]);
              setTab("preco");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Aba Preço ──────────────────────────────────────────────────────

function PriceCalculator({
  materials,
  setMaterials,
}: {
  materials: MaterialItem[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
}) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => pricingService.getSettings(),
  });

  const [hourlyRate, setHourlyRate] = useState("25");
  const [overheadPercent, setOverheadPercent] = useState("15");
  const [profitMarginPercent, setProfitMarginPercent] = useState("30");
  const [paymentFeePercent, setPaymentFeePercent] = useState("0");
  const [hours, setHours] = useState("");

  // Pré-carrega os padrões salvos assim que chegam (mesmo padrão de admin/conteudo).
  useEffect(() => {
    if (!data) return;
    setHourlyRate(String(data.hourlyRate));
    setOverheadPercent(String(data.overheadPercent));
    setProfitMarginPercent(String(data.profitMarginPercent));
    setPaymentFeePercent(String(data.paymentFeePercent));
  }, [data]);

  const saveDefaults = useMutation<PricingSettings, ApiError, void>({
    mutationFn: () =>
      pricingService.updateSettings({
        hourlyRate: num(hourlyRate),
        overheadPercent: num(overheadPercent),
        profitMarginPercent: num(profitMarginPercent),
        paymentFeePercent: Math.min(num(paymentFeePercent), 99),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["pricing-settings"], updated);
      toast.success("Padrões salvos — já vêm pré-preenchidos da próxima vez.");
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível salvar os padrões."),
  });

  const addMaterial = () => setMaterials((m) => [...m, newMaterial()]);
  const removeMaterial = (id: string) =>
    setMaterials((m) => (m.length > 1 ? m.filter((i) => i.id !== id) : m));
  const setMaterial = (id: string, patch: Partial<MaterialItem>) =>
    setMaterials((m) => m.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const result = useMemo(() => {
    const materialsCost = materials.reduce((sum, m) => sum + num(m.cost), 0);
    const labor = num(hours) * num(hourlyRate);
    const overhead = labor * (num(overheadPercent) / 100);
    const subtotal = materialsCost + labor + overhead;
    const withMargin = subtotal * (1 + num(profitMarginPercent) / 100);
    // Trava a taxa em 99% — a fórmula divide por (1 - taxa), 100% derrubaria em divisão por zero.
    const fee = Math.min(num(paymentFeePercent), 99);
    const finalPrice = withMargin / (1 - fee / 100);
    return { materialsCost, labor, overhead, subtotal, withMargin, finalPrice };
  }, [materials, hours, hourlyRate, overheadPercent, profitMarginPercent, paymentFeePercent]);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Controles */}
      <div className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Materiais</p>
            <Button type="button" size="xs" variant="outline" onClick={addMaterial}>
              <Plus className="size-3.5" /> Item
            </Button>
          </div>
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center gap-1.5">
                <Input
                  placeholder="Ex.: fio, enchimento..."
                  value={m.name}
                  onChange={(e) => setMaterial(m.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  inputMode="decimal"
                  placeholder="R$"
                  value={m.cost}
                  onChange={(e) => setMaterial(m.id, { cost: e.target.value })}
                  className="w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeMaterial(m.id)}
                  disabled={materials.length === 1}
                  aria-label="Remover material"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <Field label="Horas trabalhadas">
            <Input inputMode="decimal" placeholder="Ex.: 4" value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Meus padrões</p>
          </div>
          <Field label="Valor por hora" hint="R$">
            <Input inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </Field>
          <Field label="Overhead" hint="% sobre a mão de obra — embalagem, luz, fotos...">
            <Input inputMode="decimal" value={overheadPercent} onChange={(e) => setOverheadPercent(e.target.value)} />
          </Field>
          <Field label="Margem de lucro" hint="%">
            <Input inputMode="decimal" value={profitMarginPercent} onChange={(e) => setProfitMarginPercent(e.target.value)} />
          </Field>
          <Field label="Taxa de pagamento" hint="% — 0 se for só Pix">
            <Input inputMode="decimal" value={paymentFeePercent} onChange={(e) => setPaymentFeePercent(e.target.value)} />
          </Field>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => saveDefaults.mutate()}
            disabled={saveDefaults.isPending}
          >
            {saveDefaults.isPending ? "Salvando..." : "Salvar como padrão"}
          </Button>
        </div>
      </div>

      {/* Resultado */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preço sugerido</p>
          <p className="mt-1 font-heading text-4xl font-semibold text-primary">
            {formatPrice(result.finalPrice)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-heading text-lg">Como cheguei nesse valor</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Materiais</dt>
            <dd className="text-right font-medium">{formatPrice(result.materialsCost)}</dd>
            <dt className="text-muted-foreground">Mão de obra</dt>
            <dd className="text-right font-medium">{formatPrice(result.labor)}</dd>
            <dt className="text-muted-foreground">Overhead</dt>
            <dd className="text-right font-medium">{formatPrice(result.overhead)}</dd>
            <dt className="border-t border-border pt-1.5 text-muted-foreground">Subtotal</dt>
            <dd className="border-t border-border pt-1.5 text-right font-medium">
              {formatPrice(result.subtotal)}
            </dd>
            <dt className="text-muted-foreground">Com margem de lucro</dt>
            <dd className="text-right font-medium">{formatPrice(result.withMargin)}</dd>
            <dt className="border-t border-border pt-1.5 text-muted-foreground">Preço final</dt>
            <dd className="border-t border-border pt-1.5 text-right font-semibold text-primary">
              {formatPrice(result.finalPrice)}
            </dd>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Fórmula: (materiais + mão de obra + overhead) × (1 + margem) ÷ (1 − taxa de pagamento).
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Aba Fio ────────────────────────────────────────────────────────

function YarnCalculator({ onUseInPrice }: { onUseInPrice: (name: string, cost: string) => void }) {
  const [presetId, setPresetId] = useState<string>(YARN_PRESETS[0].id);
  const [pricePer100m, setPricePer100m] = useState("");

  const preset = YARN_PRESETS.find((p) => p.id === presetId) ?? YARN_PRESETS[0];
  const bufferedMin = Math.ceil(preset.min * (1 + SAFETY_BUFFER));
  const bufferedMax = Math.ceil(preset.max * (1 + SAFETY_BUFFER));

  const estimatedCost = useMemo(() => {
    const price = num(pricePer100m);
    if (price <= 0) return null;
    return { min: (bufferedMin / 100) * price, max: (bufferedMax / 100) * price };
  }, [pricePer100m, bufferedMin, bufferedMax]);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <Field label="Tipo de peça">
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YARN_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Preço do fio" hint="R$ a cada 100m (opcional)">
          <Input
            inputMode="decimal"
            placeholder="Ex.: 8,50"
            value={pricePer100m}
            onChange={(e) => setPricePer100m(e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Metragem recomendada (com folga)
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold text-primary">
            {bufferedMin}–{bufferedMax} m
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimativa base: {preset.min}–{preset.max} m, +15% de folga de segurança.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-heading text-lg">
            <span className="inline-flex items-center gap-2">
              <Scale className="size-4 text-primary" /> Custo estimado do fio
            </span>
          </p>
          {estimatedCost ? (
            <>
              <p className="mt-3 text-2xl font-semibold">
                {formatPrice(estimatedCost.min)} – {formatPrice(estimatedCost.max)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() =>
                  onUseInPrice(
                    `Fio (${preset.label})`,
                    ((estimatedCost.min + estimatedCost.max) / 2).toFixed(2)
                  )
                }
              >
                Usar na calculadora de preço
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Informe o preço do fio a cada 100m para estimar o custo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
