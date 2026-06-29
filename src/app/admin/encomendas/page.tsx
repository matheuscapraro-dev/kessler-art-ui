"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { commissionService } from "@/services/commissions";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/config";
import {
  commissionStatusLabel,
  type CommissionStatus,
  type CommissionSummary,
} from "@/types/orders";

const statuses = Object.keys(commissionStatusLabel) as CommissionStatus[];

const emptyCreate = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  description: "",
  desiredCategory: "",
  colors: "",
  size: "",
  desiredDeadline: "",
  quotedPrice: "",
};

export default function AdminEncomendasPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<CommissionSummary | null>(null);
  const [status, setStatus] = useState<CommissionStatus>("Nova");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: () => commissionService.list(),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-commissions"] });

  // Detalhe completo (com fotos de referência) ao abrir o "Gerenciar".
  const { data: detail } = useQuery({
    queryKey: ["admin-commission", selected?.code],
    queryFn: () => commissionService.track(selected!.code),
    enabled: !!selected,
  });

  const save = useMutation<unknown, ApiError, void>({
    mutationFn: async () => {
      if (!selected) return;
      if (price.trim() !== "") await commissionService.sendQuote(selected.id, Number(price));
      await commissionService.update(selected.id, status, notes || undefined);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Encomenda atualizada.");
      setSelected(null);
    },
    onError: (e) => toast.error(e.detail ?? "Falha ao salvar."),
  });

  const create = useMutation<unknown, ApiError, void>({
    mutationFn: async () => {
      const created = await commissionService.create({
        customerName: createForm.customerName,
        customerEmail: createForm.customerEmail || undefined,
        customerPhone: createForm.customerPhone,
        description: createForm.description,
        desiredCategory: createForm.desiredCategory || undefined,
        colors: createForm.colors || undefined,
        size: createForm.size || undefined,
        desiredDeadline: createForm.desiredDeadline || null,
      });
      if (createForm.quotedPrice.trim() !== "") {
        await commissionService.sendQuote(created.id, Number(createForm.quotedPrice));
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Encomenda criada.");
      setCreateOpen(false);
      setCreateForm(emptyCreate);
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível criar."),
  });

  function openManage(c: CommissionSummary) {
    setSelected(c);
    setStatus(c.status);
    setPrice(c.quotedPrice != null ? String(c.quotedPrice) : "");
    setNotes("");
  }

  const createValid =
    createForm.customerName.trim() !== "" &&
    createForm.customerPhone.trim() !== "" &&
    createForm.description.trim().length >= 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Encomendas</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nova encomenda
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : commissions.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma encomenda ainda.</p>
      ) : (
        <ul className="space-y-3">
          {commissions.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {c.code} · {c.customerName}
                </p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
              </div>
              {c.quotedPrice != null && <Badge variant="secondary">{formatPrice(c.quotedPrice)}</Badge>}
              <Badge>{commissionStatusLabel[c.status]}</Badge>
              <Button size="sm" variant="outline" onClick={() => openManage(c)}>
                Gerenciar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Gerenciar ── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Encomenda {selected?.code}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* contato */}
              {detail && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{detail.customerName}</span>
                  {detail.customerEmail && <span className="text-muted-foreground">· {detail.customerEmail}</span>}
                  <Button asChild size="xs" variant="outline" className="ml-auto">
                    <a href={whatsappLink(`Olá! Sobre a encomenda ${detail.code}...`)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-3.5" /> WhatsApp
                    </a>
                  </Button>
                </div>
              )}

              <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {detail?.description ?? selected.description}
              </p>

              {detail && (detail.desiredCategory || detail.colors || detail.size || detail.desiredDeadline) && (
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {detail.desiredCategory && <div><dt className="text-muted-foreground">Tipo</dt><dd>{detail.desiredCategory}</dd></div>}
                  {detail.colors && <div><dt className="text-muted-foreground">Cores</dt><dd>{detail.colors}</dd></div>}
                  {detail.size && <div><dt className="text-muted-foreground">Tamanho</dt><dd>{detail.size}</dd></div>}
                  {detail.desiredDeadline && (
                    <div><dt className="text-muted-foreground">Prazo</dt><dd>{new Date(detail.desiredDeadline).toLocaleDateString("pt-BR")}</dd></div>
                  )}
                </dl>
              )}

              {/* fotos de referência */}
              {detail && detail.referenceImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fotos de referência</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {detail.referenceImages.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                        <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CommissionStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{commissionStatusLabel[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Orçamento (R$)</Label>
                <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Deixe em branco para não alterar" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Nova encomenda (manual) ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova encomenda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cn">Cliente *</Label>
                <Input id="cn" value={createForm.customerName} onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp">WhatsApp *</Label>
                <Input id="cp" value={createForm.customerPhone} onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })} placeholder="(47) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce">E-mail</Label>
                <Input id="ce" type="email" value={createForm.customerEmail} onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })} placeholder="opcional" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cd">O que a cliente quer *</Label>
              <Textarea id="cd" rows={3} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Descreva a peça (mín. 10 caracteres)" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct">Tipo</Label>
                <Input id="ct" value={createForm.desiredCategory} onChange={(e) => setCreateForm({ ...createForm, desiredCategory: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc">Cores</Label>
                <Input id="cc" value={createForm.colors} onChange={(e) => setCreateForm({ ...createForm, colors: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs">Tamanho</Label>
                <Input id="cs" value={createForm.size} onChange={(e) => setCreateForm({ ...createForm, size: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Prazo</Label>
                <DatePicker value={createForm.desiredDeadline} onChange={(v) => setCreateForm({ ...createForm, desiredDeadline: v })} placeholder="Opcional" disablePast />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cq">Orçamento (R$)</Label>
                <Input id="cq" type="number" step="0.01" value={createForm.quotedPrice} onChange={(e) => setCreateForm({ ...createForm, quotedPrice: e.target.value })} placeholder="Opcional — já envia o orçamento" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !createValid}>
              {create.isPending ? "Criando..." : "Criar encomenda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
