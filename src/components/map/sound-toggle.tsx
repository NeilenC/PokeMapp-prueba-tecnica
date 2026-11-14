"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getMutedSnapshot,
  getServerMutedSnapshot,
  setCriesMuted,
  subscribeMuted,
} from "@/lib/cry";
import { cn } from "@/lib/utils";

/** Activa o silencia los gritos de los Pokémon (se recuerda entre visitas). */
export function SoundToggle({ className }: { className?: string }) {
  const muted = useSyncExternalStore(
    subscribeMuted,
    getMutedSnapshot,
    getServerMutedSnapshot,
  );
  const label = muted ? "Activar sonidos" : "Silenciar sonidos";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={() => setCriesMuted(!muted)}
          className={cn(
            "pointer-events-auto h-auto w-11 shrink-0 rounded-xl bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800 hover:text-white",
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
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
