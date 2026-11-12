/** Elemento mínimo que devuelve `GET /pokemon` de PokéAPI. */
export interface PokemonListItem {
  id: number;
  name: string;
}

/** Una página de la lista, lista para serializar entre servidor y cliente. */
export interface PokemonPage {
  items: PokemonListItem[];
  /** Total de Pokémon disponibles en la app (acotado por MAX_POKEMON). */
  total: number;
  /** Offset de la siguiente página, o `null` si ya no quedan. */
  nextOffset: number | null;
}
