import type { PokemonPage } from "@/types/pokemon";

const POKEAPI_URL = "https://pokeapi.co/api/v2";

/** Solo Gen 1 (ids 1–151): mantiene el mapa liviano (ver SPEC §1). */
export const MAX_POKEMON = 151;
export const DEFAULT_PAGE_SIZE = 20;
/** Tope por request: evita que alguien pida la lista completa de una vez. */
export const MAX_PAGE_SIZE = 50;

interface PokeApiListResponse {
  results: { name: string; url: string }[];
}

/** "https://pokeapi.co/api/v2/pokemon/25/" -> 25 */
function idFromUrl(url: string): number {
  const id = Number(url.split("/").filter(Boolean).pop());
  if (!Number.isInteger(id)) throw new Error(`URL de Pokémon inválida: ${url}`);
  return id;
}

/**
 * Pide una página de `GET /pokemon`. Funciona en servidor (Server Components
 * y Route Handlers). Los parámetros se acotan para no salirse de Gen 1.
 */
export async function fetchPokemonPage(
  offset: number,
  limit: number = DEFAULT_PAGE_SIZE,
  signal?: AbortSignal,
): Promise<PokemonPage> {
  const safeOffset = Math.min(Math.max(0, Math.floor(offset)), MAX_POKEMON);
  const safeLimit = Math.min(
    Math.max(1, Math.floor(limit)),
    MAX_PAGE_SIZE,
    MAX_POKEMON - safeOffset,
  );

  if (safeLimit <= 0) return { items: [], total: MAX_POKEMON, nextOffset: null };

  const res = await fetch(
    `${POKEAPI_URL}/pokemon?offset=${safeOffset}&limit=${safeLimit}`,
    // La lista de Gen 1 casi no cambia: se cachea un día.
    { next: { revalidate: 60 * 60 * 24 }, signal },
  );
  if (!res.ok) throw new Error(`PokéAPI respondió ${res.status}`);

  const data = (await res.json()) as PokeApiListResponse;
  const items = data.results.map(({ name, url }) => ({
    id: idFromUrl(url),
    name,
  }));

  const next = safeOffset + items.length;
  return {
    items,
    total: MAX_POKEMON,
    nextOffset: next < MAX_POKEMON && items.length > 0 ? next : null,
  };
}
