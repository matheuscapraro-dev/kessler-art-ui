"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminCatalogService } from "@/services/admin-catalog";
import { ApiError } from "@/lib/api-client";
import type { Product } from "@/types/catalog";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (igual ao RequestSizeLimit da API)

export function ProductImageManager({ product }: { product: Product }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-product", product.id] });
  const images = [...product.images].sort((a, b) => a.displayOrder - b.displayOrder);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Selecione arquivos de imagem.");
      return;
    }

    const tooBig = files.filter((f) => f.size > MAX_SIZE);
    const valid = files.filter((f) => f.size <= MAX_SIZE);
    if (tooBig.length > 0) toast.error(`${tooBig.length} foto(s) acima de 10MB foram ignoradas.`);
    if (valid.length === 0) return;

    // Sequencial: evita corrida na escolha de capa e concorrência no mesmo produto.
    let ok = 0;
    for (let i = 0; i < valid.length; i++) {
      setProgress({ done: i, total: valid.length });
      try {
        await adminCatalogService.uploadImage(product.id, valid[i]);
        ok++;
      } catch (e) {
        const msg = e instanceof ApiError ? e.detail : "Falha no upload";
        toast.error(`${valid[i].name}: ${msg ?? "Falha no upload"}`);
      }
    }
    setProgress(null);
    if (ok > 0) {
      toast.success(ok === 1 ? "Foto adicionada." : `${ok} fotos adicionadas.`);
      invalidate();
    }
  }

  async function removeImage(imageId: string) {
    setBusyId(imageId);
    try {
      await adminCatalogService.removeImage(product.id, imageId);
      invalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? (e.detail ?? "Falha ao remover") : "Falha ao remover");
    } finally {
      setBusyId(null);
    }
  }

  async function setCover(imageId: string) {
    setBusyId(imageId);
    try {
      await adminCatalogService.setCover(product.id, imageId);
      invalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? (e.detail ?? "Falha ao definir capa") : "Falha ao definir capa");
    } finally {
      setBusyId(null);
    }
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg">Fotos</h2>
        <span className="text-sm text-muted-foreground">{images.length} foto(s)</span>
      </div>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && fileRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Enviando {progress.done + 1} de {progress.total}...
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste fotos aqui ou clique para escolher</p>
            <p className="text-xs text-muted-foreground">Várias de uma vez · JPG/PNG/WebP · até 10MB cada</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Grade de fotos */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              <Image
                src={img.url}
                alt={img.altText ?? ""}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
              />

              {img.isCover && (
                <Badge className="absolute left-1.5 top-1.5 gap-1 px-1.5 py-0.5 text-[0.6rem] shadow">
                  <Star className="size-3" /> capa
                </Badge>
              )}

              {busyId === img.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}

              {/* Ações — sempre visíveis no toque, hover no desktop */}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                {!img.isCover && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="size-7 shadow"
                    onClick={() => setCover(img.id)}
                    disabled={busyId !== null}
                    aria-label="Definir como capa"
                    title="Definir como capa"
                  >
                    <Star className="size-3.5" />
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="destructive"
                  className="ml-auto size-7 shadow"
                  onClick={() => removeImage(img.id)}
                  disabled={busyId !== null}
                  aria-label="Remover foto"
                  title="Remover foto"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Atalho extra para adicionar */}
          <button
            type="button"
            onClick={() => !uploading && fileRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            aria-label="Adicionar mais fotos"
          >
            <ImagePlus className="size-6" />
          </button>
        </div>
      )}
    </div>
  );
}
