"use client";

import { Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onToggle: () => void;
  /** Hay un Pokémon abierto: el bottom sheet tapa esta esquina. */
  sheetOpen: boolean;
}

/**
 * Solo móvil: abre y cierra el minimapa. Va justo arriba del botón de
 * atribución de OpenFreeMap (esquina inferior derecha).
 */
export function MiniMapToggle({ open, onToggle, sheetOpen }: Props) {
  const label = open ? "Ocultar minimapa" : "Mostrar minimapa";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={open}
      title={label}
      onClick={onToggle}
      className={cn(
        "absolute right-[10px] bottom-[52px] z-[2] grid size-9 place-items-center rounded-full bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur transition-opacity hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        open && "bg-yellow-300 text-slate-900 hover:bg-yellow-200",
        sheetOpen && "pointer-events-none opacity-0",
      )}
    >
      <MapIcon aria-hidden="true" className="size-5" />
    </button>
  );
}
