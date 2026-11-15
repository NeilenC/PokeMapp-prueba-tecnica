"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMutedSnapshot,
  getServerMutedSnapshot,
  setCriesMuted,
  subscribeMuted,
} from "@/lib/cry";
import { cn } from "@/lib/utils";
import { VolumeSlider } from "./volume-slider";

/**
 * Botón de sonido: activa o silencia (se recuerda entre visitas) y, al pasar el
 * mouse o enfocarlo, muestra el control de volumen general debajo.
 */
export function SoundToggle({ className }: { className?: string }) {
  const muted = useSyncExternalStore(
    subscribeMuted,
    getMutedSnapshot,
    getServerMutedSnapshot,
  );
  const label = muted ? "Activar sonidos" : "Silenciar sonidos";

  return (
    <div className="group relative flex">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        onClick={() => setCriesMuted(!muted)}
        className={cn(
          "pointer-events-auto h-auto w-9 sm:w-11 shrink-0 rounded-xl bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800 hover:text-white",
          muted && "text-slate-400",
          className,
        )}
      >
        {muted ? (
          <VolumeX aria-hidden="true" />
        ) : (
          <Volume2 aria-hidden="true" />
        )}
      </Button>
      {/* El relleno superior (pt-2) cubre el hueco: el hover no se corta al bajar. */}
      <div className="pointer-events-auto absolute top-full left-1/2 z-10 hidden -translate-x-1/2 pt-2 group-focus-within:block group-hover:block">
        <VolumeSlider onAdjust={() => setCriesMuted(false)} />
      </div>
    </div>
  );
}
