"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePokemonDetail } from "@/hooks/use-pokemon-detail";
import { TEAM_SIZE } from "@/lib/team-store";
import { typeColor } from "@/lib/type-colors";
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

/**
 * Panel de detalle (shadcn Sheet). No es modal: sin overlay y sin cerrarse al
 * tocar afuera, para que el mapa siga usable mientras está abierto.
 */
export function PokemonSheet({ selectedId, onClose, team, onToggleTeam }: Props) {
  // Recordamos el último id para que el contenido no desaparezca mientras
  // el panel hace la animación de salida.
  const [shownId, setShownId] = useState(selectedId);
  if (selectedId !== null && selectedId !== shownId) setShownId(selectedId);

  const { status, detail, error, retry } = usePokemonDetail(shownId);
  const accent = typeColor(detail?.types[0] ?? "");

  return (
    <Sheet modal={false} open={selectedId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        className="w-full gap-0 overflow-y-auto border-white/10 text-foreground max-sm:inset-x-0 max-sm:top-auto max-sm:h-[55%] max-sm:rounded-t-2xl max-sm:border-t sm:w-[380px] sm:max-w-[380px]"
        style={{
          background: `linear-gradient(160deg, ${accent}55, #0f172af2 55%)`,
        }}
      >
        <SheetTitle className="sr-only">{detail?.name ?? "Pokémon"}</SheetTitle>
        <SheetDescription className="sr-only">
          Detalle del Pokémon seleccionado en el mapa
        </SheetDescription>

        {status === "loading" && <PokemonSkeleton />}

        {status === "error" && (
          <div role="alert" className="flex flex-col items-start gap-3 p-5 pt-16">
            <p>No se pudo cargar el Pokémon ({error}).</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              Reintentar
            </button>
          </div>
        )}

        {detail && (
          <div className="flex flex-col gap-3 p-5 pt-16">
            <div
              className="rounded-xl border-4 p-2"
              style={{ borderColor: accent, backgroundColor: `${accent}22` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- artwork externo de tamaño fijo */}
              <img
                src={detail.artworkUrl}
                alt={detail.name}
                width={200}
                height={200}
                className="mx-auto size-[200px]"
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
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
