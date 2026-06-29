"use client";

import { motion, useReducedMotion } from "motion/react";
import { Heart } from "lucide-react";

const HEARTS = [
  { x: -52, delay: 0, size: 18 },
  { x: -22, delay: 0.12, size: 14 },
  { x: 8, delay: 0.05, size: 20 },
  { x: 34, delay: 0.18, size: 14 },
  { x: 58, delay: 0.1, size: 16 },
];

/** Coraçõezinhos subindo — comemora um envio bem-sucedido. Toca uma vez. */
export function Celebrate() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center" aria-hidden>
      {HEARTS.map((h, i) => (
        <motion.span
          key={i}
          className="absolute text-primary"
          initial={{ opacity: 0, y: 12, x: h.x, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], y: -70, scale: 1 }}
          transition={{ duration: 1.7, delay: h.delay, ease: "easeOut" }}
        >
          <Heart style={{ width: h.size, height: h.size }} className="fill-primary/30" />
        </motion.span>
      ))}
    </div>
  );
}
