"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PokemonListItem } from "@/types/pokemon";

const TOAST_MS = 2800;

interface Props {
  count: number;
  total: number;
  /** Último Pokémon descubierto (muestra el aviso); `null` = sin aviso. */
  recent: PokemonListItem | null;
  onRecentDone: () => void;
}

/** Contador de Pokédex (abajo a la izquierda) y aviso de nuevo descubrimiento. */
export function PokedexHud({ count, total, recent, onRecentDone }: Props) {
  useEffect(() => {
    if (!recent) return;
    const timer = setTimeout(onRecentDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [recent, onRecentDone]);

  const progress = total > 0 ? Math.min(count / total, 1) : 0;

  return (
    <>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1] w-40 rounded-xl bg-slate-900/85 px-3 py-2 text-slate-200 shadow-lg backdrop-blur">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold tracking-wide text-yellow-300">POKÉDEX</span>
          <span className="tabular-nums">
            <span className="text-sm font-bold">{count}</span> / {total}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full origin-left rounded-full bg-yellow-300 transition-transform duration-500"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

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
