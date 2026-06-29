"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orderService } from "@/services/orders";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, type OrderStatus } from "@/types/orders";

const statuses = Object.keys(orderStatusLabel) as OrderStatus[];

export default function AdminPedidosPage() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => orderService.list(),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  const updateStatus = useMutation<unknown, ApiError, { id: string; status: OrderStatus }>({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Status atualizado.");
    },
    onError: (e) => toast.error(e.detail ?? "Falha ao atualizar."),
  });

  const markPaid = useMutation<unknown, ApiError, string>({
    mutationFn: (id) => orderService.markPaid(id),
    onSuccess: () => {
      invalidate();
      toast.success("Pedido marcado como pago.");
    },
    onError: (e) => toast.error(e.detail ?? "Falha ao marcar pago."),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Pedidos</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido ainda.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {o.code} · {o.customerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {o.itemCount} item(s) · {formatPrice(o.totalAmount)} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <Badge variant={o.paymentStatus === "Pago" ? "default" : "secondary"}>
                {o.paymentStatus}
              </Badge>

              <Select
                value={o.status}
                onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v as OrderStatus })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {o.paymentStatus !== "Pago" && (
                <Button size="sm" variant="outline" onClick={() => markPaid.mutate(o.id)}>
                  Marcar pago
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
