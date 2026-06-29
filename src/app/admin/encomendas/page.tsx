"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { commissionService } from "@/services/commissions";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { commissionStatusLabel, type CommissionStatus, type CommissionSummary } from "@/types/orders";

const statuses = Object.keys(commissionStatusLabel) as CommissionStatus[];

export default function AdminEncomendasPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<CommissionSummary | null>(null);
  const [status, setStatus] = useState<CommissionStatus>("Nova");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: () => commissionService.list(),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-commissions"] });

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

  function open(c: CommissionSummary) {
    setSelected(c);
    setStatus(c.status);
    setPrice(c.quotedPrice != null ? String(c.quotedPrice) : "");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Encomendas</h1>

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
              <Button size="sm" variant="outline" onClick={() => open(c)}>
                Gerenciar
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encomenda {selected?.code}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {selected.description}
              </p>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CommissionStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {commissionStatusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Orçamento (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
