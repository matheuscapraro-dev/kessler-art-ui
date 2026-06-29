"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { YarnBall } from "@/components/decor";

// Onda suave (estilo linha de crochê) que se estica na largura disponível.
const WAVE =
  "M0 8 Q 6 3 12 8 T 24 8 T 36 8 T 48 8 T 60 8 T 72 8 T 84 8 T 96 8 T 108 8 T 120 8";

function Thread({ flip }: { flip?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 120 16"
      preserveAspectRatio="none"
      className={cn("h-4 flex-1", flip && "-scale-x-100")}
      fill="none"
      aria-hidden="true"
    >
      <motion.path
        d={WAVE}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </svg>
  );
}

/** Divisor animado: dois fios desenham até o centro e o novelo surge com mola. */
export function AnimatedStitch({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("flex items-center gap-3 text-primary/45", className)} aria-hidden>
      <Thread />
      <motion.span
        className="text-primary"
        initial={reduce ? false : { scale: 0, rotate: -120 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 13 }}
      >
        <YarnBall className="size-5" />
      </motion.span>
      <Thread flip />
    </div>
  );
}
