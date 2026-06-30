import Image from "next/image";
import { cn } from "@/lib/utils";
import { YarnBall } from "@/components/decor";

type Tint = "terracotta" | "sage" | "cream";

const tints: Record<Tint, string> = {
  terracotta: "from-primary/20 via-secondary/30 to-accent/25",
  sage: "from-accent/35 via-muted to-secondary/40",
  cream: "from-secondary/50 via-muted to-primary/12",
};

interface AboutPhotoProps {
  /** Caminho da imagem (ex.: "/sobre/atelie.jpg"). Sem isso, mostra um placeholder temático. */
  src?: string;
  alt?: string;
  caption?: string;
  tint?: Tint;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Slot de foto da página Sobre. Renderiza a imagem (com tom quente + zoom no hover)
 * ou, enquanto não houver foto, um placeholder bonito no tema. A altura/aspecto
 * vem pela className (ex.: "aspect-[4/5]").
 */
export function AboutPhoto({
  src,
  alt = "",
  caption,
  tint = "cream",
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
}: AboutPhotoProps) {
  return (
    <figure className={cn("group relative overflow-hidden rounded-[2rem] shadow-soft", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover warm-img transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br", tints[tint])}>
          <YarnBall className="size-16 text-primary/30" />
        </div>
      )}

      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-4 text-sm font-medium text-background">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
