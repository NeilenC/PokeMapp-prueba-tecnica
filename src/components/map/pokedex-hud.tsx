"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PokemonListItem } from "@/types/pokemon";

const TOAST_MS = 2800;

interface Props {
  /** Último Pokémon descubierto (muestra el aviso); `null` = sin aviso. */
  recent: PokemonListItem | null;
  onRecentDone: () => void;
}

/** Aviso de nuevo descubrimiento (el contador vive en el botón de filtros). */
export function PokedexHud({ recent, onRecentDone }: Props) {
  useEffect(() => {
    if (!recent) return;
    const timer = setTimeout(onRecentDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [recent, onRecentDone]);

  return (
    <>
      <div className="pointer-events-none absolute top-4 left-1/2 z-[2] -translate-x-1/2">
        <AnimatePresence>
          {recent && (
            <motion.div
              key={recent.id}
              initial={{ opacity: 0, y: -14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="flex items-center gap-2 rounded-full bg-slate-900/90 py-1 pr-4 pl-1 text-sm text-slate-100 shadow-lg backdrop-blur"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sprite externo de tamaño fijo */}
              <img
                src={recent.spriteUrl}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full bg-white/10 [image-rendering:pixelated]"
              />
              <span>
                <span className="text-xs text-yellow-300">¡Nuevo en la Pokédex!</span>
                <br />
                <span className="font-semibold capitalize">{recent.name}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Anuncio para lectores de pantalla */}
      <div role="status" aria-live="polite" className="sr-only">
        {recent ? `Descubriste a ${recent.name}` : ""}
      </div>
    </>
  );
}
