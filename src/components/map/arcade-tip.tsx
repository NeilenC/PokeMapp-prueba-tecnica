"use client";

import { useEffect } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import { arcade } from "@/lib/arcade-font";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  /** Texto que se "tipea" letra por letra. */
  text: string;
  onDismiss: () => void;
  /** Posición horizontal de la flecha respecto al borde izquierdo del globo. */
  arrowLeft?: string;
  /** Posicionamiento y tamaño lo decide quien lo usa. */
  className?: string;
}

/**
 * Globo de ayuda estilo arcade, puramente de presentación: tipografía
 * pixelada, texto que se escribe solo, rebote y una flecha hacia abajo. No
 * sabe qué explica ni cuándo se muestra.
 */
export function ArcadeTip({
  title,
  text,
  onDismiss,
  arrowLeft = "50%",
  className,
}: Props) {
  const shown = useTypewriter(text);
  const done = shown >= text.length;

  // Enter cierra el mensaje, igual que en el popup de bienvenida.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-64 max-w-[calc(100vw-24px)] motion-safe:animate-[arcade-tip-in_.35s_steps(5)_both]",
        className,
      )}
    >
      <style>{`
        @keyframes arcade-tip-in { from { transform: scale(.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes arcade-tip-bob { 50% { transform: translateY(-4px) } }
        @keyframes arcade-tip-blink { 50% { opacity: 0 } }
      `}</style>
      <div className="motion-safe:animate-[arcade-tip-bob_1.2s_steps(2)_infinite]">
        <div
          className={`${arcade.className} relative rounded-md border-4 border-yellow-300 bg-slate-950 p-3 text-[9px] leading-relaxed text-slate-100 shadow-[0_0_0_2px_#78350f,0_8px_24px_rgba(0,0,0,.6)]`}
        >
          <p className="mb-1.5 text-yellow-300">{title}</p>
          {/* El texto completo va oculto para que el globo no cambie de alto. */}
          <p className="relative">
            <span className="invisible" aria-hidden="true">
              {text}
            </span>
            <span className="absolute inset-0" aria-hidden="true">
              {text.slice(0, shown)}
            </span>
            <span className="sr-only">{text}</span>
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2.5 ml-auto flex items-center gap-1 text-yellow-300 pointer-coarse:min-h-11 pointer-coarse:px-3 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span
              aria-hidden="true"
              style={done ? { animation: "arcade-tip-blink .8s steps(2) infinite" } : undefined}
            >
              ▶
            </span>
            OK
          </button>
          {/* Flecha hacia abajo con el mismo borde que el globo */}
          <span
            aria-hidden="true"
            className="absolute top-full size-3 -translate-x-1/2 -translate-y-[7px] rotate-45 border-r-4 border-b-4 border-yellow-300 bg-slate-950"
            style={{ left: arrowLeft }}
          />
        </div>
      </div>
    </div>
  );
}
