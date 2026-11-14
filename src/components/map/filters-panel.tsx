"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListFilter, MapPin, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { playCry } from "@/lib/cry";
import { DEFAULT_FILTERS, isFiltering, type Filters } from "@/lib/filters";
import { TEAM_SIZE } from "@/lib/team-store";
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
  /** Ids del equipo de expedición y alternador (suma o quita). */
  team: readonly number[];
  onToggleTeam: (id: number) => void;
  /** Cuántos de los descubiertos cumplen los filtros (o `null` sin filtros). */
  matchCount: number | null;
  /** Progreso de la Pokédex que se muestra en el botón. */
  count: number;
  total: number;
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
  { key: "found", label: "Tengo" },
  { key: "missing", label: "Faltan" },
];

/** Botón de icono de una fila, con tooltip (también cuando está deshabilitado). */
function RowAction({
  label,
  onClick,
  disabled,
  pressed,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      {/* El span recibe el hover: un botón deshabilitado no emite eventos. */}
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={cn("text-slate-400 hover:text-yellow-300", className)}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

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
  team,
  onToggleTeam,
  matchCount,
  count,
  total,
}: Props) {
  const [open, setOpen] = useState(false);
  const progress = total > 0 ? Math.min(count / total, 1) : 0;
  const [playing, setPlaying] = useState<number | null>(null);
  const [view, setView] = useState<View>("all");
  const panelId = useId();
  const active = isFiltering(filters);
  const teamFull = team.length >= TEAM_SIZE;

  // Un Pokémon de dos tipos aparece en ambas secciones. El contador de cada
  // sección es "descubiertos / total del tipo" y no cambia con el selector
  // Todos/Tengo/Faltan, que solo decide qué filas se listan.
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

  const hear = (item: PokemonListItem) => {
    playCry(item.id);
    setPlaying(item.id);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="pointer-events-none absolute inset-y-3 left-3 z-[2] flex w-80 max-w-[calc(100vw-24px)] flex-col items-start gap-2 max-lg:pb-[88px]">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`Pokédex: ${count} de ${total} descubiertos. ${open ? "Cerrar" : "Abrir"} filtros`}
          className={cn(
            "pointer-events-auto h-auto shrink-0 rounded-xl py-2 bg-slate-900/85 font-semibold text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800 hover:text-white",
            active && "ring-2 ring-yellow-300",
          )}
        >
          <ListFilter aria-hidden="true" />
          {/* Contador de Pokédex: reemplaza al texto del botón. */}
          <span className="flex w-32 flex-col gap-1 text-left">
            <span className="flex items-baseline justify-between text-xs">
              <span className="font-semibold tracking-wide text-yellow-300">
                POKÉDEX
              </span>
              <span className="tabular-nums">
                <span className="text-sm font-bold">{count}</span> / {total}
              </span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full origin-left rounded-full bg-yellow-300 transition-transform duration-500"
                style={{ transform: `scaleX(${progress})` }}
              />
            </span>
          </span>
          {/* {active && matchCount !== null && (
            <Badge className="rounded-md px-1.5 tabular-nums">{matchCount}</Badge>
          )} */}
        </Button>

        <AnimatePresence>
          {open && (
            <motion.section
              id={panelId}
              aria-label="Pokédex"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 text-slate-200 shadow-xl backdrop-blur"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2.5">
                <h2 className="text-sm font-semibold text-slate-100">Explorar</h2>
                <div className="flex items-center gap-1">
                  {active && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onChange(DEFAULT_FILTERS)}
                      className="text-yellow-300 hover:text-yellow-200"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar panel"
                    className="text-slate-400 hover:text-white"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="shrink-0 px-3 pt-2">
                <ToggleGroup
                  type="multiple"
                  spacing={1}
                  aria-label="Filtrar por tipo"
                  value={[...filters.types]}
                  onValueChange={(types) =>
                    onChange({ ...filters, types: new Set(types) })
                  }
                  className="grid w-full grid-cols-4 gap-1"
                >
                  {TYPES.map((type) => (
                    <ToggleGroupItem
                      key={type}
                      value={type}
                      aria-label={typeLabel(type)}
                      // El color del tipo entra como variable: la barra lateral
                      // siempre lo muestra y el fondo se llena al activarse.
                      style={{ "--c": typeColor(type) } as React.CSSProperties}
                      className="h-7 w-full rounded-md border border-l-[3px] border-white/10 border-l-(--c) px-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white data-[state=on]:border-(--c) data-[state=on]:bg-(--c) data-[state=on]:text-slate-900"
                    >
                      <span className="truncate">{typeLabel(type)}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <Tabs
                value={view}
                onValueChange={(v) => setView(v as View)}
                className="min-h-0 flex-1 gap-0 pt-2"
              >
                <div className="shrink-0 px-3 pb-2">
                  <TabsList className="grid h-8 w-full grid-cols-3 bg-white/[0.06]">
                    {VIEWS.map(({ key, label }) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="text-xs text-slate-300 data-[state=active]:border-transparent data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                      >
                        {label}
                        <Badge
                          variant="secondary"
                          className="rounded-md px-1 py-0 text-[10px] text-slate-300 tabular-nums"
                        >
                          {counts[key]}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent
                  value={view}
                  className="min-h-0 flex-1 overflow-hidden border-t border-white/10"
                >
                  <ScrollArea className="h-full">
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
                            const inTeam = team.includes(item.id);
                            return (
                              <li
                                key={item.id}
                                className="flex items-center gap-0.5 pr-3 pl-1"
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
                                  <>
                                    <RowAction
                                      label={
                                        inTeam
                                          ? "Quitar del equipo"
                                          : teamFull
                                            ? "Equipo completo"
                                            : "Agregar al equipo"
                                      }
                                      pressed={inTeam}
                                      disabled={!inTeam && teamFull}
                                      onClick={() => onToggleTeam(item.id)}
                                      className={cn(inTeam && "text-yellow-300")}
                                    >
                                      <Star
                                        className="size-4"
                                        fill={inTeam ? "currentColor" : "none"}
                                        aria-hidden="true"
                                      />
                                    </RowAction>
                                    <RowAction
                                      label="Ver en el mapa"
                                      onClick={() => onLocate(item)}
                                    >
                                      <MapPin className="size-4" aria-hidden="true" />
                                    </RowAction>
                                  </>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
