"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePokemonDetail } from "@/hooks/use-pokemon-detail";
import { PokemonSkeleton } from "./pokemon-skeleton";
import { TypeBadge } from "./type-badge";

interface Props {
  /** Id del Pokémon abierto; `null` = panel cerrado. */
  selectedId: number | null;
  onClose: () => void;
}

export function PokemonDrawer({ selectedId, onClose }: Props) {
  const reduced = useReducedMotion();
  const { status, detail, error, retry } = usePokemonDetail(selectedId);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Cierre con Esc y foco al botón de cerrar al abrir.
  useEffect(() => {
    if (selectedId === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onClose]);

  return (
    <AnimatePresence>
      {selectedId !== null && (
        <motion.aside
          key="drawer"
          className="pokemon-drawer"
          aria-label="Detalle del Pokémon"
          initial={reduced ? { opacity: 0 } : { x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { x: "100%", opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.3, ease: "easeOut" }}
        >
          <button
            ref={closeRef}
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ×
          </button>

          {status === "loading" && <PokemonSkeleton />}

          {status === "error" && (
            <div role="alert" className="drawer-error">
              <p>No se pudo cargar el Pokémon ({error}).</p>
              <button type="button" onClick={retry}>
                Reintentar
              </button>
            </div>
          )}

          {detail && (
            <div className="drawer-content">
              {/* eslint-disable-next-line @next/next/no-img-element -- artwork externo de tamaño fijo */}
              <img src={detail.artworkUrl} alt={detail.name} width={200} height={200} />
              <p className="drawer-number">N.º {String(detail.id).padStart(3, "0")}</p>
              <h2>{detail.name}</h2>
              <div className="drawer-types">
                {detail.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <dl className="drawer-measures">
                <div>
                  <dt>Altura</dt>
                  <dd>{detail.heightM.toLocaleString("es-AR")} m</dd>
                </div>
                <div>
                  <dt>Peso</dt>
                  <dd>{detail.weightKg.toLocaleString("es-AR")} kg</dd>
                </div>
              </dl>
              {detail.description && (
                <p lang={detail.descriptionLang ?? undefined}>
                  {detail.description}
                </p>
              )}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
