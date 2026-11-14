"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListFilter, MapPin, X } from "lucide-react";
import { playCry } from "@/lib/cry";
import {
  DEFAULT_FILTERS,
  isFiltering,
  type Filters,
} from "@/lib/filters";
import { typeColor, typeLabel } from "@/lib/type-colors";
import { cn } from "@/lib/utils";
import type { PokemonListItem } from "@/types/pokemon";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon",
];

interface Props {
  items: PokemonListItem[];
  discovered: ReadonlySet<number>;
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Abre el detalle del Pokémon y lleva la cámara hasta él. */
  onLocate: (item: PokemonListItem) => void;
  /** Cuántos de los descubiertos cumplen los filtros (o `null` sin filtros). */
  matchCount: number | null;
}

interface Group {
  type: string;
  members: PokemonListItem[];
  /** Total del tipo y cuántos están descubiertos, sin importar el selector. */
  total: number;
  found: number;
}

type View = "all" | "found" | "missing";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "found", label: "Descubiertos" },
  { key: "missing", label: "Faltan" },
];

/**
 * Botón flotante (arriba a la izquierda) que abre un panel lateral con los
 * Pokémon agrupados por tipo. Los filtros del panel también apagan los
 * marcadores del mapa.
 */
export function FiltersPanel({
  items,
  discovered,
  filters,
  onChange,
  onLocate,
  matchCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [view, setView] = useState<View>("all");
  const panelId = useId();
  const active = isFiltering(filters);

  // Un Pokémon de dos tipos aparece en ambas secciones. El contador de cada
  // sección es "descubiertos / total del tipo" y no cambia con el selector
  // Todos/Descubiertos/Faltan, que solo decide qué filas se listan.
  const groups = useMemo<Group[]>(() => {
    const result: Group[] = [];
    for (const type of TYPES) {
      if (filters.types.size > 0 && !filters.types.has(type)) continue;
      const all = items.filter((p) => p.types.includes(type));
      if (all.length === 0) continue;
      const members =
        view === "all"
          ? all
          : all.filter((p) => discovered.has(p.id) === (view === "found"));
      if (members.length === 0) continue;
      result.push({
        type,
        members,
        total: all.length,
        found: all.filter((p) => discovered.has(p.id)).length,
      });
    }
    return result;
  }, [items, discovered, filters.types, view]);

  // Conteo de Pokémon distintos (no por sección) dentro del filtro de tipo.
  const counts = useMemo(() => {
    let found = 0;
    let missing = 0;
    for (const p of items) {
      if (filters.types.size > 0 && !p.types.some((t) => filters.types.has(t))) {
        continue;
      }
      if (discovered.has(p.id)) found++;
      else missing++;
    }
    return { all: found + missing, found, missing };
  }, [items, discovered, filters.types]);

  const toggleType = (type: string) => {
    const types = new Set(filters.types);
    if (!types.delete(type)) types.add(type);
    onChange({ ...filters, types });
  };

  const hear = (item: PokemonListItem) => {
    playCry(item.id);
    setPlaying(item.id);
  };

  return (
    <div className="pointer-events-none absolute inset-y-3 left-3 z-[2] flex w-80 max-w-[calc(100vw-24px)] flex-col items-start gap-2 pb-[72px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "pointer-events-auto flex shrink-0 items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-2 text-sm font-semibold text-slate-100 shadow-lg backdrop-blur transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-yellow-300",
          active && "ring-2 ring-yellow-300",
        )}
      >
        <ListFilter className="size-4" aria-hidden="true" />
        Pokémon por tipo
        {active && matchCount !== null && (
          <span className="rounded-full bg-yellow-300 px-1.5 text-xs text-slate-900 tabular-nums">
            {matchCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id={panelId}
            aria-label="Pokémon por tipo"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex min-h-0 w-full flex-col overflow-hidden rounded-xl bg-slate-900/90 text-slate-200 shadow-xl backdrop-blur"
          >
            <div className="shrink-0 border-b border-white/10 p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide text-yellow-300">
                  FILTRAR Y EXPLORAR
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar panel"
                  className="rounded p-1 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-yellow-300"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Tipo">
                {TYPES.map((type) => {
                  const on = filters.types.has(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleType(type)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium transition-[background-color,color,transform] active:scale-95 focus-visible:outline-2 focus-visible:outline-yellow-300",
                        on
                          ? "border-transparent text-slate-900"
                          : "border-white/20 text-slate-200 hover:border-white/50",
                      )}
                      style={on ? { backgroundColor: typeColor(type) } : undefined}
                    >
                      {typeLabel(type)}
                    </button>
                  );
                })}
              </div>

              <div
                role="group"
                aria-label="Mostrar"
                className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1"
              >
                {VIEWS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={view === key}
                    onClick={() => setView(key)}
                    className={cn(
                      "rounded-md px-1 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-yellow-300",
                      view === key
                        ? "bg-yellow-300 text-slate-900"
                        : "text-slate-300 hover:bg-white/10",
                    )}
                  >
                    {label}{" "}
                    <span className="tabular-nums opacity-70">
                      {key === "all" ? counts.all : counts[key]}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!active}
                onClick={() => onChange(DEFAULT_FILTERS)}
                className="mt-3 w-full rounded-lg bg-white/10 py-1.5 text-xs font-semibold text-yellow-300 transition-colors hover:bg-white/20 disabled:cursor-default disabled:bg-white/5 disabled:text-slate-600 focus-visible:outline-2 focus-visible:outline-yellow-300"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {groups.length === 0 && (
                <p className="p-4 text-center text-sm text-slate-400">
                  {view === "missing"
                    ? "¡No te falta ninguno!"
                    : view === "found"
                      ? "Todavía no descubriste ninguno."
                      : "Ningún Pokémon coincide con estos filtros."}
                </p>
              )}
              {groups.map((group) => (
                <div key={group.type}>
                  <h3
                    className="sticky top-0 z-[1] flex items-center justify-between bg-slate-900/95 px-3 py-1.5 text-xs font-semibold backdrop-blur"
                    style={{ borderLeft: `4px solid ${typeColor(group.type)}` }}
                  >
                    <span>{typeLabel(group.type)}</span>
                    <span className="tabular-nums text-slate-400">
                      {group.found}/{group.total}
                    </span>
                  </h3>
                  <ul>
                    {group.members.map((item) => {
                      const found = discovered.has(item.id);
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-1 pr-2 pl-1"
                        >
                          <button
                            type="button"
                            disabled={!found}
                            onClick={() => hear(item)}
                            aria-label={
                              found
                                ? `Escuchar a ${item.name}`
                                : "Pokémon sin descubrir"
                            }
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-yellow-300",
                              found ? "hover:bg-white/10" : "cursor-default",
                              playing === item.id && found && "bg-white/10",
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- sprite externo de tamaño fijo */}
                            <img
                              src={item.spriteUrl}
                              alt=""
                              width={40}
                              height={40}
                              loading="lazy"
                              draggable={false}
                              className={cn(
                                "size-10 shrink-0 [image-rendering:pixelated]",
                                !found && "brightness-0 opacity-40",
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize">
                              {found ? item.name : "???"}
                            </span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              #{String(item.id).padStart(3, "0")}
                            </span>
                          </button>
                          {found && (
                            <button
                              type="button"
                              onClick={() => onLocate(item)}
                              aria-label={`Ver a ${item.name} en el mapa`}
                              title="Ver en el mapa"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-yellow-300 focus-visible:outline-2 focus-visible:outline-yellow-300"
                            >
                              <MapPin className="size-4" aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
