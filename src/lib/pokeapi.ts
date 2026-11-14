import type { PokemonDetail, PokemonPage } from "@/types/pokemon";

const POKEAPI_URL = "https://pokeapi.co/api/v2";
const SPRITES_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export const spriteUrl = (id: number) => `${SPRITES_URL}/${id}.png`;
export const artworkUrl = (id: number) =>
  `${SPRITES_URL}/other/official-artwork/${id}.png`;

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
  // TODO(debug): quitar. Muestra el JSON crudo que devuelve PokéAPI.
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[pokeapi] GET /pokemon?offset=${safeOffset}&limit=${safeLimit}`,
      JSON.stringify(data, null, 2),
    );
  }
  console.log("DATA: ", data);
  const typesById = await fetchTypesById(signal);
  const items = data.results.map(({ name, url }) => {
    const id = idFromUrl(url);
    return { id, name, spriteUrl: spriteUrl(id), types: typesById.get(id) ?? [] };
  });

  const next = safeOffset + items.length;
  return {
    items,
    total: MAX_POKEMON,
    nextOffset: next < MAX_POKEMON && items.length > 0 ? next : null,
  };
}

const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "steel", "fairy",
] as const;

interface PokeApiType {
  pokemon: { slot: number; pokemon: { url: string } }[];
}

/**
 * Tipos de cada Pokémon de Gen 1 (id -> tipos, el principal primero). Se arma
 * desde `/type/{name}` (17 requests, cacheados un día): la lista no los trae
 * y los necesitamos para ubicar cada Pokémon en su bioma.
 */
async function fetchTypesById(signal?: AbortSignal): Promise<Map<number, string[]>> {
  const responses = await Promise.all(
    ALL_TYPES.map(async (type) => {
      const res = await fetch(`${POKEAPI_URL}/type/${type}`, {
        next: { revalidate: 60 * 60 * 24 },
        signal,
      });
      if (!res.ok) throw new Error(`PokéAPI respondió ${res.status}`);
      return { type, data: (await res.json()) as PokeApiType };
    }),
  );

  const slots = new Map<number, { slot: number; type: string }[]>();
  for (const { type, data } of responses) {
    for (const { slot, pokemon } of data.pokemon) {
      const id = idFromUrl(pokemon.url);
      if (id > MAX_POKEMON) continue; // variantes (ids > 10000) y otras gens
      slots.set(id, [...(slots.get(id) ?? []), { slot, type }]);
    }
  }
  return new Map(
    [...slots].map(([id, list]) => [
      id,
      list.sort((a, b) => a.slot - b.slot).map((t) => t.type),
    ]),
  );
}

interface PokeApiPokemon {
  name: string;
  height: number; // decímetros
  weight: number; // hectogramos
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. esp.",
  "special-defense": "Def. esp.",
  speed: "Velocidad",
};

interface PokeApiSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
  }[];
}

/** Los textos del Pokédex traen \n, \f y guiones blandos: se normalizan. */
function cleanFlavorText(text: string): string {
  return text.replace(/[\n\f\r\u00ad]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Prefiere español y cae a inglés. Toma la entrada más reciente del idioma. */
function pickDescription(
  entries: PokeApiSpecies["flavor_text_entries"],
): Pick<PokemonDetail, "description" | "descriptionLang"> {
  for (const lang of ["es", "en"] as const) {
    const match = entries.findLast((e) => e.language.name === lang);
    if (match) {
      return {
        description: cleanFlavorText(match.flavor_text),
        descriptionLang: lang,
      };
    }
  }
  return { description: null, descriptionLang: null };
}

/**
 * Detalle de un Pokémon (Gen 1): junta `/pokemon/{id}` y `/pokemon-species/{id}`
 * en paralelo. Devuelve `null` si el id está fuera de rango.
 */
export async function fetchPokemonDetail(
  id: number,
  signal?: AbortSignal,
): Promise<PokemonDetail | null> {
  if (!Number.isInteger(id) || id < 1 || id > MAX_POKEMON) return null;

  const opts = { next: { revalidate: 60 * 60 * 24 }, signal };
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${POKEAPI_URL}/pokemon/${id}`, opts),
    fetch(`${POKEAPI_URL}/pokemon-species/${id}`, opts),
  ]);
  if (!pokemonRes.ok) throw new Error(`PokéAPI respondió ${pokemonRes.status}`);
  if (!speciesRes.ok) throw new Error(`PokéAPI respondió ${speciesRes.status}`);

  const pokemon = (await pokemonRes.json()) as PokeApiPokemon;
  const species = (await speciesRes.json()) as PokeApiSpecies;

  return {
    id,
    name: pokemon.name,
    types: pokemon.types.map((t) => t.type.name),
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    stats: pokemon.stats.map((s) => ({
      key: s.stat.name,
      label: STAT_LABELS[s.stat.name] ?? s.stat.name,
      base: s.base_stat,
    })),
    artworkUrl: artworkUrl(id),
    ...pickDescription(species.flavor_text_entries),
  };
}
