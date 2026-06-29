"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/catalog";

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  const [activeId, setActiveId] = useState(
    sorted.find((i) => i.isCover)?.id ?? sorted[0]?.id
  );
  const current = sorted.find((i) => i.id === activeId) ?? sorted[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        sem foto
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <Image
          src={current.url}
          alt={current.altText ?? alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveId(img.id)}
              aria-label="Ver foto"
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                img.id === activeId ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
