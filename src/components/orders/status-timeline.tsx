import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { YarnBall } from "@/components/decor";

export interface TimelineStep {
  label: string;
  /** Mensagem amigável exibida quando este é o passo atual. */
  description?: string;
}

/**
 * Linha do tempo de status no estilo "ponto a ponto": círculos ligados por
 * pontos tracejados (running stitch). Passos concluídos ganham check, o atual
 * ganha um novelo com pulso suave.
 */
export function StatusTimeline({
  steps,
  currentIndex,
  completed = false,
}: {
  steps: TimelineStep[];
  /** Índice do passo atual (0-based). */
  currentIndex: number;
  /** Quando o fluxo terminou, o passo atual também aparece concluído. */
  completed?: boolean;
}) {
  return (
    <ol className="pt-1">
      {steps.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && completed);
        const current = i === currentIndex && !completed;
        const last = i === steps.length - 1;

        return (
          <li key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-4 top-9 h-[calc(100%-2.5rem)] -translate-x-1/2 border-l-2 border-dashed",
                  done ? "border-primary/50" : "border-border"
                )}
              />
            )}

            <span
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                current && "animate-pulse-ring border-primary text-primary",
                !done && !current && "border-border text-muted-foreground/40"
              )}
            >
              {done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : current ? (
                <YarnBall className="size-4" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>

            <div className="min-w-0 pt-1.5">
              <p
                className={cn(
                  "text-sm font-medium leading-none",
                  current && "text-primary",
                  !done && !current && "text-muted-foreground/60"
                )}
              >
                {step.label}
              </p>
              {current && step.description && (
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
