"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { animatedSpriteUrl, backSpriteUrl, spriteUrl } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface Props {
  /** Id del compañero activo; `null` = no se muestra nada. */
  id: number | null;
  /** Sube cada vez que se descubre algo: dispara el saltito de alegría. */
  cheer: number;
  /** La cámara se está moviendo: se lo ve de espaldas, como si caminara. */
  moving: boolean;
  /** Hay un Pokémon abierto: el panel ocupa el costado/borde inferior. */
  sheetOpen: boolean;
}

/**
 * Compañero activo, abajo a la derecha (a la izquierda del minimapa). De
 * frente cuando el mapa está quieto y de espaldas mientras la cámara se mueve.
 * No intercepta clicks.
 */
export function Companion({ id, cheer, moving, sheetOpen }: Props) {
  const reduced = useReducedMotion();
  // URLs cuyo GIF falló al cargar: caen al sprite estático.
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  if (id === null) return null;

  const front = reduced ? spriteUrl(id) : animatedSpriteUrl(id);
  const back = reduced ? backSpriteUrl(id) : animatedSpriteUrl(id, true);
  const fallback = (url: string, isBack: boolean) =>
    broken.has(url) ? (isBack ? backSpriteUrl(id) : spriteUrl(id)) : url;

  // Las dos vistas están montadas siempre y solo se alterna cuál se ve: así
  // el giro es instantáneo, sin esperar a que cargue el GIF.
  const views = [
    { url: front, isBack: false, shown: !moving },
    { url: back, isBack: true, shown: moving },
  ];

  return (
    <div
      aria-hidden="true"
      className={cn(
        // Móvil: chico, sobre el dock y a la derecha (sin minimapa). Desde `sm`
        // vuelve al costado del minimapa, abajo a la derecha.
        "pointer-events-none absolute right-2 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[1] size-24 transition-[right,opacity] duration-300 sm:right-[140px] sm:bottom-9 sm:size-32 lg:right-[160px] lg:size-40",
        // Con bottom sheet se oculta; con drawer lateral sigue al minimapa, que
        // se corre a la izquierda del panel de detalle.
        sheetOpen && "sheet-bottom:opacity-0 sheet-side:right-[540px]",
      )}
    >
      <div className="absolute bottom-1 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-black/30 blur-sm" />
      <motion.div
        key={`${id}-${cheer}`}
        className="absolute inset-0"
        initial={cheer === 0 || reduced ? false : { y: 0, scale: 1 }}
        animate={
          cheer === 0 || reduced
            ? undefined
            : { y: [0, -22, 0, -8, 0], scale: [1, 1.15, 1, 1.06, 1] }
        }
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {views.map(({ url, isBack, shown }) => (
          // eslint-disable-next-line @next/next/no-img-element -- sprite externo animado (GIF)
          <img
            key={isBack ? "back" : "front"}
            src={fallback(url, isBack)}
            alt=""
            draggable={false}
            onError={() => setBroken((s) => new Set(s).add(url))}
            className={cn(
              "absolute inset-0 size-full object-contain object-bottom [image-rendering:pixelated] drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]",
              // Los sprites de frente ya miran a la izquierda (hacia el mapa);
              // los de espaldas hay que espejarlos para que se alejen hacia allá.
              isBack && "-scale-x-100",
              !shown && "invisible",
            )}
          />
        ))}
      </motion.div>
    </div>
  );
}
