"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminCatalogService } from "@/services/admin-catalog";
import { ApiError } from "@/lib/api-client";
import { availabilityLabel } from "@/types/catalog";
import { formatPrice } from "@/lib/format";

export default function AdminProdutosPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminCatalogService.listProducts(),
  });

  const remove = useMutation<unknown, ApiError, string>({
    mutationFn: (id) => adminCatalogService.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Peça removida.");
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível remover."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Peças</h1>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus className="size-4" /> Nova peça
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma peça cadastrada.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.coverImageUrl && (
                  <Image src={p.coverImageUrl} alt={p.name} fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.categoryName} · {availabilityLabel[p.availability]}
                  {p.price != null && ` · ${formatPrice(p.price)}`}
                </p>
              </div>
              {p.isFeatured && <Badge variant="secondary">destaque</Badge>}
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="icon-sm" aria-label="Editar">
                  <Link href={`/admin/produtos/${p.id}`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover"
                  onClick={() => {
                    if (confirm(`Remover a peça "${p.name}"?`)) remove.mutate(p.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
