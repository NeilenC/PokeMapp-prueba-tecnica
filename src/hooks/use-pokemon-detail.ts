"use client";

import { useCallback, useEffect, useState } from "react";
import type { PokemonDetail } from "@/types/pokemon";

/** Caché en memoria por id: reseleccionar un marcador no repite el request. */
const cache = new Map<number, PokemonDetail>();

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: PokemonDetail };

export interface PokemonDetailState {
  status: State["status"];
  detail: PokemonDetail | null;
  error: string | null;
  retry: () => void;
}

/** Pide el detalle de `id` bajo demanda (`null` = nada seleccionado). */
export function usePokemonDetail(id: number | null): PokemonDetailState {
  // El estado se guarda junto con el id al que pertenece: si cambia la
  // selección, un resultado viejo nunca se muestra como si fuera el nuevo.
  const [result, setResult] = useState<{ id: number; state: State } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (id === null || cache.has(id)) return;

    const controller = new AbortController();
    (async () => {
      setResult({ id, state: { status: "loading" } });
      try {
        const res = await fetch(`/api/pokemon/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const detail = (await res.json()) as PokemonDetail;
        cache.set(id, detail);
        setResult({ id, state: { status: "ready", detail } });
      } catch (e) {
        if (controller.signal.aborted) return;
        setResult({
          id,
          state: {
            status: "error",
            message: e instanceof Error ? e.message : "Error de red",
          },
        });
      }
    })();

    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const cached = id !== null ? cache.get(id) : undefined;
  const state: State = cached
    ? { status: "ready", detail: cached }
    : id === null
      ? { status: "idle" }
      : result?.id === id
        ? result.state
        : { status: "loading" };

  return {
    status: state.status,
    detail: state.status === "ready" ? state.detail : null,
    error: state.status === "error" ? state.message : null,
    retry,
  };
}
