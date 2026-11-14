import type { PokemonListItem } from "@/types/pokemon";

export interface Filters {
  /** Tipos elegidos; vacío = todos. Basta con tener uno de ellos. */
  types: ReadonlySet<string>;
}

export const DEFAULT_FILTERS: Filters = { types: new Set() };

export function isFiltering(f: Filters): boolean {
  return f.types.size > 0;
}

/** Ids que cumplen los filtros, o `null` si no hay ninguno activo. */
export function matchingIds(
  items: PokemonListItem[],
  f: Filters,
): Set<number> | null {
  if (!isFiltering(f)) return null;
  const ids = new Set<number>();
  for (const item of items) {
    if (item.types.some((t) => f.types.has(t))) ids.add(item.id);
  }
  return ids;
}
