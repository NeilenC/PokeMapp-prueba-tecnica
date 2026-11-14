"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Tope visual de la barra. El máximo real de Gen 1 es 255 (Chansey, PS), pero
 * casi todo queda entre 40 y 130: con 255 las barras serían todas cortas.
 */
const BAR_MAX = 200;
/** Retraso entre barras consecutivas (efecto escalonado). */
const STAGGER_S = 0.07;

interface Props {
  label: string;
  value: number;
  color: string;
  /** Posición en la lista; define el retraso de la animación. */
  index: number;
}

/** Barra de estadística que se llena de 0 al valor al montarse. */
export function StatBar({ label, value, color, index }: Props) {
  const reduced = useReducedMotion();
  const fill = Math.min(value / BAR_MAX, 1);

  return (
    <li className="grid grid-cols-[4.75rem_2rem_1fr] items-center gap-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-bold tabular-nums">{value}</span>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        aria-hidden="true"
      >
        {/* scaleX en vez de width: se anima en el compositor, sin relayout. */}
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ backgroundColor: color }}
          initial={{ scaleX: reduced ? fill : 0 }}
          animate={{ scaleX: fill }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 0.7,
                  delay: 0.15 + index * STAGGER_S,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        />
      </div>
    </li>
  );
}
