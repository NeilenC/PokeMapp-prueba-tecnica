"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePokemonDetail } from "@/hooks/use-pokemon-detail";
import { typeColor } from "@/lib/type-colors";
import { PokemonSkeleton } from "./pokemon-skeleton";
import { TypeBadge } from "./type-badge";

interface Props {
  /** Id del Pokémon abierto; `null` = panel cerrado. */
  selectedId: number | null;
  onClose: () => void;
}

/**
 * Panel de detalle (shadcn Sheet). No es modal: sin overlay y sin cerrarse al
 * tocar afuera, para que el mapa siga usable mientras está abierto.
 */
export function PokemonSheet({ selectedId, onClose }: Props) {
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
          <div role="alert" className="flex flex-col items-start gap-3 p-5 pt-12">
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
          <div className="flex flex-col gap-3 p-5 pt-10">
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
