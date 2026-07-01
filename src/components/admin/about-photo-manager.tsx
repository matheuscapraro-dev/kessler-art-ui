"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { contentService } from "@/services/content";
import { ApiError } from "@/lib/api-client";
import type { AboutPhoto } from "@/types/content";

const MAX_SIZE = 10 * 1024 * 1024;

export function AboutPhotoManager({ photos }: { photos: AboutPhoto[] }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-content"] });
  const ordered = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);

  async function upload(fileList: FileList | File[]) {
    const imgs = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const valid = imgs.filter((f) => f.size <= MAX_SIZE);
    if (valid.length < imgs.length) toast.error("Algumas fotos acima de 10MB foram ignoradas.");
    if (valid.length === 0) {
      toast.error("Selecione arquivos de imagem.");
      return;
    }
    let ok = 0;
    for (let i = 0; i < valid.length; i++) {
      setProgress({ done: i, total: valid.length });
      try {
        await contentService.uploadAboutPhoto(valid[i]);
        ok++;
      } catch (e) {
        toast.error(e instanceof ApiError ? (e.detail ?? "Falha no upload") : "Falha no upload");
      }
    }
    setProgress(null);
    if (ok > 0) {
      toast.success(ok === 1 ? "Foto adicionada." : `${ok} fotos adicionadas.`);
      invalidate();
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await contentService.removeAboutPhoto(id);
      invalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? (e.detail ?? "Falha ao remover") : "Falha ao remover");
    } finally {
      setBusyId(null);
    }
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && fileRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm">Enviando {progress.done + 1} de {progress.total}...</p>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste fotos aqui ou clique</p>
            <p className="text-xs text-muted-foreground">
              A 1ª foto vira o destaque; as demais, a mini-galeria · até 10MB cada
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {ordered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {ordered.map((img, i) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={img.url} alt={img.caption ?? ""} fill sizes="120px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold text-primary-foreground shadow">
                  destaque
                </span>
              )}
              {busyId === img.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(img.id)}
                disabled={busyId !== null}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground shadow hover:text-destructive"
                aria-label="Remover foto"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
