"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { commissionService, type CommissionReferenceInput } from "@/services/commissions";
import { ApiError } from "@/lib/api-client";

const MAX_SIZE = 10 * 1024 * 1024;

export function ReferenceImageUploader({
  value,
  onChange,
}: {
  value: CommissionReferenceInput[];
  onChange: (value: CommissionReferenceInput[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function upload(fileList: FileList | File[]) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error("Selecione arquivos de imagem.");
      return;
    }
    const valid = images.filter((f) => f.size <= MAX_SIZE);
    if (valid.length < images.length) toast.error("Algumas fotos acima de 10MB foram ignoradas.");
    if (valid.length === 0) return;

    const added: CommissionReferenceInput[] = [];
    for (let i = 0; i < valid.length; i++) {
      setProgress({ done: i, total: valid.length });
      try {
        added.push(await commissionService.uploadReferenceImage(valid[i]));
      } catch (e) {
        toast.error(e instanceof ApiError ? (e.detail ?? "Falha no upload") : "Falha no upload");
      }
    }
    setProgress(null);
    if (added.length) onChange([...value, ...added]);
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-3">
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
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
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
            <p className="text-sm font-medium">Arraste fotos de referência ou clique</p>
            <p className="text-xs text-muted-foreground">opcional · imagens até 10MB cada</p>
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

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((img) => (
            <div
              key={img.storageKey}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.storageKey !== img.storageKey))}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground shadow hover:text-destructive"
                aria-label="Remover"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
