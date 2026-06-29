"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminCatalogService, type CategoryPayload } from "@/services/admin-catalog";
import { ApiError } from "@/lib/api-client";
import type { Category } from "@/types/catalog";

const empty: CategoryPayload = { name: "", description: "", displayOrder: 0, isPublished: true };

export default function AdminCategoriasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryPayload>(empty);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCatalogService.listCategories(),
  });

  const save = useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      editing
        ? adminCatalogService.updateCategory(editing.id, form)
        : adminCatalogService.createCategory(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
      setOpen(false);
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível salvar."),
  });

  const remove = useMutation<unknown, ApiError, string>({
    mutationFn: (id) => adminCatalogService.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categoria excluída.");
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível excluir."),
  });

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      displayOrder: c.displayOrder,
      isPublished: c.isPublished,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Categorias</h1>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma categoria ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  {c.name}{" "}
                  {!c.isPublished && <Badge variant="secondary" className="ml-1">oculta</Badge>}
                </p>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    if (confirm(`Excluir a categoria "${c.name}"?`)) remove.mutate(c.id);
                  }}
                  aria-label="Excluir"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Ordem de exibição</Label>
              <Input
                id="order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Visível no site
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
