"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Plus, X } from "lucide-react";
import { spriteUrl } from "@/lib/pokeapi";
import { TEAM_SIZE } from "@/lib/team-store";
import { typeColor } from "@/lib/type-colors";
import type { TutorialTipDef } from "@/lib/tutorial-tips";
import { cn } from "@/lib/utils";
import { TutorialTip } from "./tutorial-tip";
import type { PokemonListItem } from "@/types/pokemon";

interface Props {
  /** Ids del equipo, en orden. */
  team: readonly number[];
  items: PokemonListItem[];
  /** Hay un Pokémon abierto: el panel ocupa el costado/borde inferior. */
  sheetOpen: boolean;
  /** Abre el detalle, vuela hasta el Pokémon y suena su grito. */
  onLocate: (item: PokemonListItem) => void;
  onRemove: (id: number) => void;
  /** Compañero activo (uno del equipo) y cómo cambiarlo. */
  companion: number | null;
  onCompanion: (id: number | null) => void;
  /** Mensaje del tutorial activo (o `null`) y cómo cerrarlo. */
  tip: TutorialTipDef | null;
  onTipDismiss: (id: string) => void;
}

/** Dock con los 6 espacios del equipo de expedición, abajo al centro. */
export function ExpeditionDock({
  team,
  items,
  sheetOpen,
  onLocate,
  onRemove,
  companion,
  onCompanion,
  tip,
  onTipDismiss,
}: Props) {
  // El mensaje que explica el corazón resalta el del primer favorito.
  const heartTip = tip?.anchor === "dock-first-heart";
  const byId = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  return (
    <section
      aria-label={`Equipo de expedición, ${team.length} de ${TEAM_SIZE}`}
      className={cn(
        "absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[1] flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-col items-center gap-1 rounded-2xl bg-slate-900/85 px-2.5 pt-1.5 pb-2 shadow-lg backdrop-blur transition-[left,opacity] duration-300",
        // Con bottom sheet el dock se oculta (el sheet ocupa ese borde); con
        // drawer lateral (380 px) se centra en lo que queda libre.
        sheetOpen &&
          "sheet-bottom:pointer-events-none sheet-bottom:opacity-0 sheet-side:left-[calc(50%-190px)]",
      )}
    >
      <TutorialTip
        tip={tip}
        anchor="dock-title"
        onDismiss={onTipDismiss}
        className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2"
      />
      <TutorialTip
        tip={tip}
        anchor="dock-first-heart"
        onDismiss={onTipDismiss}
        className="absolute bottom-full left-0 mb-4"
      />
      <h2 className="text-[10px] font-semibold tracking-wide text-yellow-300">
        EQUIPO{" "}
        <span className="tabular-nums text-slate-300">
          {team.length}/{TEAM_SIZE}
        </span>
      </h2>
      <ul className="flex gap-1.5">
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const id = team[i];
          const item = id === undefined ? undefined : byId.get(id);
          return (
            <li key={i} className="relative">
              <AnimatePresence mode="popLayout" initial={false}>
                {id === undefined ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid size-11 place-items-center rounded-full border-2 border-dashed border-white/25 text-white/30"
                    aria-label="Espacio libre"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.button
                    key={id}
                    type="button"
                    disabled={!item}
                    onClick={() => item && onLocate(item)}
                    aria-label={item ? `Ver a ${item.name}` : "Cargando Pokémon"}
                    title={item?.name}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="block size-11 rounded-full border-[3px] bg-slate-800 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                    style={{ borderColor: typeColor(item?.types[0] ?? "") }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- sprite externo de tamaño fijo */}
                    <img
                      src={item?.spriteUrl ?? spriteUrl(id)}
                      alt=""
                      width={44}
                      height={44}
                      draggable={false}
                      className="size-full [image-rendering:pixelated]"
                    />
                  </motion.button>
                )}
              </AnimatePresence>
              {id !== undefined && (
                <>
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    aria-label={`Quitar a ${item?.name ?? "Pokémon"} del equipo`}
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-slate-950 p-0 leading-none text-slate-300 ring-1 ring-white/30 after:absolute after:-inset-1 after:content-[''] pointer-coarse:size-6 pointer-coarse:after:-inset-2.5 hover:text-white focus-visible:outline-2 focus-visible:outline-yellow-300"
                  >
                    <X className="block size-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tip && heartTip) onTipDismiss(tip.id);
                      onCompanion(companion === id ? null : id);
                    }}
                    aria-pressed={companion === id}
                    aria-label={
                      companion === id
                        ? `${item?.name ?? "Pokémon"} es tu compañero (tocá para soltarlo)`
                        : `Elegir a ${item?.name ?? "Pokémon"} como compañero`
                    }
                    title={companion === id ? "Tu compañero" : "Elegir como compañero"}
                    className={cn(
                      "absolute -bottom-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-slate-950 p-0 leading-none ring-1 ring-white/30 after:absolute after:-inset-1 after:content-[''] pointer-coarse:size-6 pointer-coarse:after:-inset-2.5 focus-visible:outline-2 focus-visible:outline-yellow-300",
                      // Mientras el mensaje explica el corazón, se resalta el del primer favorito.
                      heartTip &&
                        i === 0 &&
                        "ring-2 ring-yellow-300 motion-safe:animate-pulse",
                      companion === id
                        ? "text-pink-400"
                        : "text-slate-400 hover:text-pink-300",
                    )}
                  >
                    <Heart
                      className="block size-3"
                      fill={companion === id ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
