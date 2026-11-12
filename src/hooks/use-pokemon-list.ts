"use client";

import { useCallback, useEffect, useState } from "react";
import type { PokemonListItem, PokemonPage } from "@/types/pokemon";

/** Pausa entre páginas: deja respirar al hilo principal y a la red. */
const PAGE_DELAY_MS = 250;

interface State {
  items: PokemonListItem[];
  total: number | null;
  nextOffset: number | null;
  error: string | null;
}

export interface PokemonListState {
  items: PokemonListItem[];
  total: number | null;
  /** `true` mientras quedan páginas por traer (y no hay error). */
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Trae la lista de Pokémon de a páginas. Parte de la primera página resuelta
 * en el servidor (si la hubo) y pide el resto de a una, sin bloquear la UI.
 */
export function usePokemonList(initialPage: PokemonPage | null): PokemonListState {
  const [state, setState] = useState<State>(() => ({
    items: initialPage?.items ?? [],
    total: initialPage?.total ?? null,
    nextOffset: initialPage ? initialPage.nextOffset : 0,
    error: null,
  }));

  const { nextOffset, error } = state;

  useEffect(() => {
    if (nextOffset === null || error) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pokemon?offset=${nextOffset}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const page = (await res.json()) as PokemonPage;

        setState((prev) => {
          const known = new Set(prev.items.map((p) => p.id));
          return {
            items: [...prev.items, ...page.items.filter((p) => !known.has(p.id))],
            total: page.total,
            nextOffset: page.nextOffset,
            error: null,
          };
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : "Error de red",
        }));
      }
    }, nextOffset === 0 ? 0 : PAGE_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [nextOffset, error]);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    items: state.items,
    total: state.total,
    loading: nextOffset !== null && !error,
    error,
    retry,
  };
}
