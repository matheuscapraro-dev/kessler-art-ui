"use client";

import { useRef } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminCatalogService } from "@/services/admin-catalog";
import { ApiError } from "@/lib/api-client";
import type { Product } from "@/types/catalog";

export function ProductImageManager({ product }: { product: Product }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-product", product.id] });

  const upload = useMutation<unknown, ApiError, File>({
    mutationFn: (file) => adminCatalogService.uploadImage(product.id, file),
    onSuccess: () => {
      invalidate();
      toast.success("Foto adicionada.");
    },
    onError: (e) => toast.error(e.detail ?? "Falha no upload."),
  });

  const remove = useMutation<unknown, ApiError, string>({
    mutationFn: (imageId) => adminCatalogService.removeImage(product.id, imageId),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.detail ?? "Falha ao remover."),
  });

  const setCover = useMutation<unknown, ApiError, string>({
    mutationFn: (imageId) => adminCatalogService.setCover(product.id, imageId),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.detail ?? "Falha ao definir capa."),
  });

  const images = [...product.images].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg">Fotos</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
        >
          <ImagePlus className="size-4" /> {upload.isPending ? "Enviando..." : "Adicionar foto"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma foto ainda.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image src={img.url} alt={img.altText ?? ""} fill sizes="120px" className="object-cover" />
              {img.isCover && (
                <Badge className="absolute left-1 top-1 gap-1 px-1.5 py-0.5 text-[0.6rem]">
                  <Star className="size-3" /> capa
                </Badge>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isCover && (
                  <Button size="icon-xs" variant="secondary" onClick={() => setCover.mutate(img.id)} aria-label="Definir capa">
                    <Star className="size-3" />
                  </Button>
                )}
                <Button size="icon-xs" variant="destructive" onClick={() => remove.mutate(img.id)} aria-label="Remover">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
