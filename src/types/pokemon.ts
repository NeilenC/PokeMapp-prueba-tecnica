/** Elemento mínimo que devuelve `GET /pokemon` de PokéAPI. */
export interface PokemonListItem {
  id: number;
  name: string;
  /** Sprite chico, armado desde el id (no cuesta ningún request extra). */
  spriteUrl: string;
  /** Tipos, el principal primero. Definen en qué bioma aparece. */
  types: string[];
}

/** Una página de la lista, lista para serializar entre servidor y cliente. */
export interface PokemonPage {
  items: PokemonListItem[];
  /** Total de Pokémon disponibles en la app (acotado por MAX_POKEMON). */
  total: number;
  /** Offset de la siguiente página, o `null` si ya no quedan. */
  nextOffset: number | null;
}

/** Detalle de un Pokémon, ya limpio, para mostrar al tocar un marcador. */
export interface PokemonDetail {
  id: number;
  name: string;
  /** Tipos en inglés tal como los da PokéAPI (p. ej. "grass", "poison"). */
  types: string[];
  heightM: number;
  weightKg: number;
  artworkUrl: string;
  /** Texto del Pokédex sin saltos raros; `null` si no hay en es ni en en. */
  description: string | null;
  descriptionLang: "es" | "en" | null;
}
