"use client";

import { useId, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  getServerVolumeSnapshot,
  getVolumeSnapshot,
  setVolume,
  subscribeVolume,
} from "@/lib/volume-store";

interface Props {
  /** Se llama al mover el control (p. ej. para salir del silencio). */
  onAdjust?: () => void;
  className?: string;
}

/** Control del volumen general (gritos y lluvia). Solo presentación + store. */
export function VolumeSlider({ onAdjust, className }: Props) {
  const id = useId();
  const volume = useSyncExternalStore(
    subscribeVolume,
    getVolumeSnapshot,
    getServerVolumeSnapshot,
  );
  const percent = Math.round(volume * 100);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Volumen
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={(e) => {
          setVolume(Number(e.target.value) / 100);
          onAdjust?.();
        }}
        aria-valuetext={`${percent}%`}
        className="h-1.5 w-28 cursor-pointer accent-yellow-300 pointer-coarse:h-3"
      />
      <span className="w-9 text-right text-xs tabular-nums text-slate-300" aria-hidden="true">
        {percent}%
      </span>
    </div>
  );
}
