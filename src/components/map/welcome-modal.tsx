"use client";

import { Press_Start_2P } from "next/font/google";
import { useEffect, useRef, useState } from "react";

export const arcade = Press_Start_2P({ weight: "400", subsets: ["latin"] });

const GOLD =
  "linear-gradient(135deg,#8a6a00 0%,#f2cf3a 22%,#c9990a 45%,#ffe978 62%,#a67c00 85%,#e9bd1e 100%)";

/** Pieza de teclado ("keycap") con estilo arcade. */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={`${arcade.className} inline-flex min-w-7 items-center justify-center rounded-md border-b-4 border-amber-700 bg-yellow-300 px-1.5 py-1 text-[10px] leading-none text-slate-900`}
    >
      {children}
    </kbd>
  );
}

const SHORTCUTS: { keys: React.ReactNode; text: string }[] = [
  {
    keys: (
      <>
        <Key>Alt</Key>+<Key>←</Key>
        <Key>→</Key>
      </>
    ),
    text: "Girar la cámara",
  },
  {
    keys: (
      <>
        <Key>Alt</Key>+<Key>↑</Key>
      </>
    ),
    text: "Acercar",
  },
  {
    keys: (
      <>
        <Key>Alt</Key>+<Key>↓</Key>
      </>
    ),
    text: "Alejar",
  },
  { keys: <Key>↓</Key>, text: "Retroceder a la misma altura" },
  {
    keys: (
      <>
        <Key>Alt</Key>+<span className="text-[10px]">2 dedos</span>
      </>
    ),
    text: "Rotar e inclinar (trackpad)",
  },
  { keys: <Key>Rueda</Key>, text: "Zoom del mapa" },
  { keys: <Key>Clic</Key>, text: "Ver la ficha de un Pokémon" },
  { keys: <Key>Arrastrar</Key>, text: "Mover el mapa" },
];

/**
 * Popup de bienvenida al iniciar: carta Pokémon vacía (marco dorado) en formato
 * horizontal, con el entrenador asomando por el costado y los atajos de teclado.
 */
export type GuideMode = "welcome" | "help";

interface Props {
  /** `null` = cerrado. "welcome" al iniciar, "help" cuando se abre desde el botón. */
  mode: GuideMode | null;
  onClose: () => void;
}

export function WelcomeModal({ mode, onClose }: Props) {
  const open = mode !== null;
  const setOpen = (_: boolean) => onClose();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose es estable en la práctica
  }, [open]);

  if (!open) return null;
  const isHelp = mode === "help";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-x-hidden overflow-y-auto bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <style>{`
        @keyframes welcome-unfold {
          0%   { clip-path: inset(-60px calc(50% - 1.5px) -60px calc(50% - 1.5px)); filter: brightness(5); animation-timing-function: linear }
          22%  { clip-path: inset(-60px calc(50% - 1.5px) -60px calc(50% - 1.5px)); filter: brightness(5); animation-timing-function: cubic-bezier(.3,.7,.2,1) }
          100% { clip-path: inset(-60px -60px -60px -60px); filter: brightness(1) }
        }
        @keyframes welcome-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes welcome-blink { 50% { opacity: .35 } }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative my-auto w-[min(820px,94vw)]"
      >
        {/* Marco dorado de la carta */}
        <div
          className="rounded-2xl p-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          style={{
            background: GOLD,
            animation: "welcome-unfold .9s linear both",
          }}
        >
          <div className="rounded-xl bg-[#1d272b] p-3 shadow-[inset_0_0_18px_rgba(0,0,0,0.8)]">
            {/* Cabecera: medallón + barra de título */}
            <div className="relative mb-3 flex items-center gap-3 pl-14">
              <div
                className="absolute -top-5 -left-5 size-14 rounded-full border-2 border-amber-200/60 shadow-lg"
                style={{ background: GOLD }}
              >
                <svg viewBox="0 0 32 32" className="m-auto mt-2 size-9" aria-hidden="true">
                  <circle cx="16" cy="16" r="13" fill="#fff" stroke="#3a2a00" strokeWidth="2.5" />
                  <path d="M3 16a13 13 0 0 1 26 0z" fill="#e53935" stroke="#3a2a00" strokeWidth="2.5" />
                  <path d="M3 16h26" stroke="#3a2a00" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="4.5" fill="#fff" stroke="#3a2a00" strokeWidth="2.5" />
                </svg>
              </div>
              <div className="flex-1 rounded-full bg-[#2c383d] px-4 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
                <h2
                  id="welcome-title"
                  className={`${arcade.className} text-[11px] leading-snug tracking-wide text-yellow-300 sm:text-sm`}
                >
                  {isHelp ? "COMO JUGAR" : "¡BIENVENIDO, ENTRENADOR!"}
                </h2>
              </div>
              <div className="size-6 shrink-0 rounded-full bg-gradient-to-br from-slate-400 to-slate-900 ring-2 ring-slate-600" />
            </div>

            {/* Recuadro de la ilustración, a todo lo ancho */}
            <div
              className="rounded-md p-[4px]"
              style={{ background: GOLD }}
            >
              <div
                className="relative overflow-hidden rounded-[3px] px-4 py-4 pr-4 text-slate-100 sm:pr-44 sm:pl-6"
                style={{
                  background:
                    "radial-gradient(120% 90% at 20% 0%, #2f6fb5 0%, #15325f 55%, #0b1a38 100%)",
                }}
              >
                {/* Líneas de "pantalla" arcade */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(0,0,0,.6) 0 1px, transparent 1px 3px)",
                  }}
                />
                <p className="relative text-sm leading-relaxed text-slate-100">
                  {isHelp
                    ? "Un repaso rápido de los controles para moverte por el mapa."
                    : "Recorré Argentina y descubrí Pokémon de todo el país. Acercate a ellos con el radar, armá tu equipo de expedición y completá tu Pokedex."}
                </p>

                <h3
                  className={`${arcade.className} relative mt-4 mb-2 text-[10px] text-yellow-300`}
                >
                  ▶ CONTROLES
                </h3>
                <ul className="relative grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {SHORTCUTS.map((s) => (
                    <li key={s.text} className="flex items-center gap-2 text-xs">
                      <span className="flex shrink-0 items-center gap-1">
                        {s.keys}
                      </span>
                      <span className="text-slate-200">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pie: botón dorado */}
            <div className="mt-3 flex items-center flex-row-reverse justify-end gap-3">
              <span
                className={`${arcade.className} hidden text-[9px] text-slate-400 sm:inline`}
                style={{ animation: "welcome-blink 1.2s steps(2) infinite" }}
              >
                PRESIONÁ ENTER
              </span>
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen(false)}
                className={`${arcade.className} -skew-x-12 rounded-sm border-b-4 border-amber-800 px-6 py-2.5 text-[11px] text-slate-900 shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0.5`}
                style={{ background: GOLD }}
              >
                <span className="inline-block skew-x-12">
                  {isHelp ? "¡ENTENDIDO!" : "¡A EXPLORAR!"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* El entrenador asoma por el costado y sobresale de la carta */}
        <div
          aria-hidden="true"
          style={{ animation: "welcome-fade .35s ease-out .8s both" }}
          className="pointer-events-none absolute right-[-14px] bottom-[-16px] hidden aspect-[481/905] h-[112%] sm:block lg:-right-16"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ilustración estática local */}
          <img
            src="/ash-ketchum.webp"
            alt=""
            className="h-full w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}
