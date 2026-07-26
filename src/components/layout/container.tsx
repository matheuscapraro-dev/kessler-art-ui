import { cn } from "@/lib/utils";

/**
 * Container padrão das páginas: largura máxima + gutter responsivo num só lugar.
 * Ajustes de layout (ex.: gutter maior em telas grandes) passam a valer no site
 * inteiro sem caçar `mx-auto max-w-* px-4` espalhado pelos arquivos.
 */
const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  as: Tag = "div",
  size = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside";
  size?: keyof typeof sizes;
}) {
  return (
    <Tag
      className={cn("mx-auto w-full px-4 sm:px-6", sizes[size], className)}
      {...props}
    />
  );
}
