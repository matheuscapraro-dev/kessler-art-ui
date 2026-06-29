import { cn } from "@/lib/utils";

/** Novelo de linha (motivo do tema). */
export function YarnBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5 9c4 1 9 5 11 9" />
      <path d="M3.6 13c5 0 10 3 12 7" />
      <path d="M9 3.6c1 4 5 9 9 11" />
      <path d="M14 3.1c1 5 4 9 7 11" />
    </svg>
  );
}

/** Casquinha de crochê — borda em semicírculos. Cor via classe text-*. */
export function CrochetTrim({ className }: { className?: string }) {
  return <div aria-hidden className={cn("crochet-trim w-full", className)} />;
}

/** Divisor decorativo: pontos tracejados com um novelo no centro. */
export function StitchDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 text-primary/45", className)} aria-hidden>
      <span className="h-0 flex-1 border-t-2 border-dashed border-current" />
      <YarnBall className="size-5 shrink-0" />
      <span className="h-0 flex-1 border-t-2 border-dashed border-current" />
    </div>
  );
}
