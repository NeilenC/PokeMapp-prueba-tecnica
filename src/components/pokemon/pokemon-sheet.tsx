"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Star, Volume2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SHEET_BOTTOM_QUERY } from "@/lib/layout-mode";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePokemonDetail } from "@/hooks/use-pokemon-detail";
import { playCry } from "@/lib/cry";
import { TEAM_SIZE } from "@/lib/team-store";
import { typeColor } from "@/lib/type-colors";
import { cn } from "@/lib/utils";
import { PokemonSkeleton } from "./pokemon-skeleton";
import { StatBar } from "./stat-bar";
import { TypeBadge } from "./type-badge";

interface Props {
  /** Id del Pokémon abierto; `null` = panel cerrado. */
  selectedId: number | null;
  onClose: () => void;
  /** Ids del equipo de expedición y alternador (suma o quita). */
  team: readonly number[];
  onToggleTeam: (id: number) => void;
}

/** Cuánto hay que arrastrar el handle hacia abajo para cerrar el sheet. */
const DRAG_CLOSE_PX = 90;

/**
 * Panel de detalle (shadcn Sheet). No es modal: sin overlay y sin cerrarse al
 * tocar afuera, para que el mapa siga usable mientras está abierto.
 *
 * Según el dispositivo es un bottom sheet (mobile y tablet en portrait, con
 * handle para arrastrar y cerrar) o un drawer lateral derecho (ver
 * `layout-mode.ts`).
 */
export function PokemonSheet({ selectedId, onClose, team, onToggleTeam }: Props) {
  const open = selectedId !== null;
  const bottom = useMediaQuery(SHEET_BOTTOM_QUERY);

  // Recordamos el último id para que el contenido no desaparezca mientras
  // el panel hace la animación de salida.
  const [shownId, setShownId] = useState(selectedId);
  if (selectedId !== null && selectedId !== shownId) setShownId(selectedId);

  // Arrastre del handle: se anima con la propiedad `translate`, que se suma
  // al `transform` de la animación de entrada/salida sin pisarla.
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDragY(0); // al reabrir, vuelve a su lugar
  }

  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY - dragY;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onHandleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onHandleUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragging(false);
    if (dragY > DRAG_CLOSE_PX) onClose();
    else setDragY(0);
  };

  const { status, detail, error, retry } = usePokemonDetail(shownId);
  const accent = typeColor(detail?.types[0] ?? "");
  // Arriba, el botón de cerrar ocupa la esquina: el contenido deja ese espacio.
  const topPad = bottom ? "pt-12" : "pt-16";

  return (
    <Sheet modal={false} open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={bottom ? "bottom" : "right"}
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          "w-full gap-0 overflow-y-auto overscroll-contain border-white/10 text-foreground",
          bottom
            ? "mx-auto h-[55dvh] max-w-[640px] rounded-t-2xl"
            : "sm:w-[380px] sm:max-w-[380px]",
          dragging && "transition-none",
        )}
        style={{
          background: `linear-gradient(160deg, ${accent}55, #0f172af2 55%)`,
          translate: bottom && dragY > 0 ? `0 ${dragY}px` : undefined,
        }}
      >
        <SheetTitle className="sr-only">{detail?.name ?? "Pokémon"}</SheetTitle>
        <SheetDescription className="sr-only">
          Detalle del Pokémon seleccionado en el mapa
        </SheetDescription>

        {bottom && (
          // Handle: sticky de alto 0 para que no empuje el contenido al hacer scroll.
          <div className="sticky top-0 z-10 h-0">
            <div
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              aria-hidden="true"
              className="absolute inset-x-14 top-0 flex h-10 cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing"
            >
              <span className="h-1.5 w-10 rounded-full bg-white/35" />
            </div>
          </div>
        )}

        {status === "loading" && <PokemonSkeleton className={topPad} />}

        {status === "error" && (
          <div role="alert" className={cn("flex flex-col items-start gap-3 p-5", topPad)}>
            <p>No se pudo cargar el Pokémon ({error}).</p>
            <button
              type="button"
              onClick={retry}
              className="min-h-11 rounded-md bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
            >
              Reintentar
            </button>
          </div>
        )}

        {detail && (
          <div
            className={cn(
              "flex flex-col gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
              topPad,
            )}
          >
            <div
              className="relative rounded-xl border-4 p-2"
              style={{ borderColor: accent, backgroundColor: `${accent}22` }}
            >
              <button
                type="button"
                onClick={() => playCry(detail.id)}
                aria-label="Escuchar sonido"
                title="Escuchar sonido"
                className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-yellow-300"
              >
                <Volume2 className="size-4" aria-hidden="true" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- artwork externo de tamaño fijo */}
              <img
                src={detail.artworkUrl}
                alt={detail.name}
                width={200}
                height={200}
                className="mx-auto size-[clamp(120px,24dvh,200px)]"
              />
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold capitalize">{detail.name}</h2>
              <span className="text-sm text-muted-foreground">
                N.º {String(detail.id).padStart(3, "0")}
              </span>
            </div>

            <div className="flex gap-2">
              {detail.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>

            {(() => {
              const inTeam = team.includes(detail.id);
              const full = !inTeam && team.length >= TEAM_SIZE;
              return (
                <button
                  type="button"
                  onClick={() => onToggleTeam(detail.id)}
                  disabled={full}
                  aria-pressed={inTeam}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
                >
                  <Star
                    className={inTeam ? "size-4 text-yellow-300" : "size-4"}
                    fill={inTeam ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  {inTeam
                    ? "Quitar del equipo"
                    : full
                      ? `Equipo completo (${TEAM_SIZE}/${TEAM_SIZE})`
                      : "Agregar al equipo"}
                </button>
              );
            })()}

            {detail.description && (
              <p lang={detail.descriptionLang ?? undefined} className="text-sm leading-relaxed">
                {detail.description}
              </p>
            )}

            <dl className="mt-1 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
              <div>
                <dt className="text-xs text-muted-foreground">Altura</dt>
                <dd className="text-lg font-bold">
                  {detail.heightM.toLocaleString("es-AR")} m
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Peso</dt>
                <dd className="text-lg font-bold">
                  {detail.weightKg.toLocaleString("es-AR")} kg
                </dd>
              </div>
            </dl>

            {/* key = id: al cambiar de Pokémon las barras vuelven a llenarse. */}
            <section
              key={detail.id}
              aria-labelledby="stats-title"
              className="border-t border-white/10 pt-3"
            >
              <div className="mb-2 flex items-baseline justify-between">
                <h3 id="stats-title" className="text-sm font-semibold">
                  Estadísticas base
                </h3>
                <span className="text-xs text-muted-foreground">
                  Total{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {detail.stats.reduce((sum, s) => sum + s.base, 0)}
                  </span>
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {detail.stats.map((s, i) => (
                  <StatBar
                    key={s.key}
                    label={s.label}
                    value={s.base}
                    color={accent}
                    index={i}
                  />
                ))}
              </ul>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
