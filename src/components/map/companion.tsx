"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spriteUrl } from "@/lib/pokeapi";

interface Props {
  /** Id del compañero activo; `null` = no se muestra nada. */
  id: number | null;
  /** Sube cada vez que se descubre algo: dispara el saltito de alegría. */
  cheer: number;
}

/**
 * Compañero activo: su sprite flota en el centro de la pantalla, sobre el
 * radar. No intercepta clicks, así que el mapa se maneja igual que sin él.
 */
export function Companion({ id, cheer }: Props) {
  const reduced = useReducedMotion();
  if (id === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] grid place-items-center"
    >
      {/* Capa 1: flotación continua. Capa 2: salto al descubrir (se reinicia con `key`). */}
      <div className="companion-float">
        <motion.div
          key={`${id}-${cheer}`}
          initial={cheer === 0 || reduced ? false : { y: 0, scale: 1 }}
          animate={
            cheer === 0 || reduced
              ? undefined
              : { y: [0, -22, 0, -8, 0], scale: [1, 1.2, 1, 1.08, 1] }
          }
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- sprite externo de tamaño fijo */}
          <img
            src={spriteUrl(id)}
            alt=""
            width={64}
            height={64}
            draggable={false}
            className="size-16 [image-rendering:pixelated] drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
          />
        </motion.div>
      </div>
    </div>
  );
}
