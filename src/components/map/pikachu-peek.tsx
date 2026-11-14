"use client";

import { useEffect, useState } from "react";
import { arcade } from "./welcome-modal";

const SHOW_MS = 5200;

interface Props {
  /** Contador: cada vez que cambia (y es > 0) Pikachu asoma desde abajo. */
  trigger: number;
}

/**
 * Ash y Pikachu asoman desde el borde inferior izquierdo, se quedan unos
 * segundos con un globo de diálogo ("lo había perdido") y vuelven a esconderse.
 */
export function PikachuPeek({ trigger }: Props) {
  // Visible desde que cambia `trigger` hasta que vence el temporizador.
  const [doneFor, setDoneFor] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    const t = setTimeout(() => setDoneFor(trigger), SHOW_MS);
    return () => clearTimeout(t);
  }, [trigger]);

  if (trigger === 0 || doneFor === trigger) return null;
  const shownFor = trigger;

  return (
    <div
      key={shownFor}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 left-0 z-40 w-[min(340px,62vw)]"
      style={{ animation: `pikachu-peek ${SHOW_MS}ms ease-in-out both` }}
    >
      <style>{`
        @keyframes pikachu-peek {
          0%   { transform: translateY(105%) }
          10%  { transform: translateY(0) }
          90%  { transform: translateY(0) }
          100% { transform: translateY(105%) }
        }
        @keyframes pikachu-bubble {
          0%   { opacity: 0; transform: scale(.6) translateY(8px) }
          70%  { opacity: 1; transform: scale(1.06) }
          100% { opacity: 1; transform: none }
        }
      `}</style>

      {/* Globo de diálogo sobre Pikachu */}
      <div
        className={`${arcade.className} absolute bottom-[78%] left-3 w-max max-w-[92%] origin-bottom-left rounded-xl border-[3px] border-slate-900 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-900 shadow-lg sm:text-xs`}
        style={{ animation: "pikachu-bubble .3s ease-out .55s both" }}
      >
        ¡Pikachu! ¡Acá estabas!
        <span
          className="absolute -bottom-[11px] left-8 size-0 border-x-[8px] border-t-[11px] border-x-transparent border-t-slate-900"
        />
        <span
          className="absolute -bottom-[6px] left-[34px] size-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-white"
        />
      </div>

      {/* La imagen tiene la mitad superior transparente: se recorta desde abajo. */}
      <div className="aspect-[1920/1100] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustración estática local */}
        <img
          src="/pikachu-ash.webp"
          alt=""
          className="size-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}
