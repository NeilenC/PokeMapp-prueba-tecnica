/**
 * Ubicación de cada Pokémon según su bioma (SPEC §1). El bioma sale de los
 * tipos del Pokémon; la posición exacta es determinista (PRNG con semilla = id),
 * así no cambia entre recargas ni entre usuarios.
 */

export interface SpawnZone {
  id: string;
  name: string;
  region: string;
  center: [lng: number, lat: number];
  /** Radio en grados (~111 km por grado). */
  radius: number;
  types: string[];
}

// Anclas sobre territorio argentino (hitos reales), no recuadros: así nada cae
// al mar ni en Chile. Cada tipo aparece en al menos una zona.
export const SPAWN_ZONES: SpawnZone[] = [
  // --- Patagonia: frío, estepa, glaciares --------------------------------
  { id: "perito-moreno", name: "Glaciar Perito Moreno", region: "Patagonia", center: [-73.0, -50.45], radius: 0.7, types: ["ice", "water"] },
  { id: "fitz-roy", name: "El Chaltén (Fitz Roy)", region: "Patagonia", center: [-72.9, -49.3], radius: 0.6, types: ["ice", "rock", "water", "steel"] },
  { id: "bariloche", name: "San Carlos de Bariloche", region: "Patagonia", center: [-71.3, -41.15], radius: 0.8, types: ["water", "ice", "rock"] },
  { id: "los-alerces", name: "Parque Los Alerces (Esquel)", region: "Patagonia", center: [-71.7, -42.85], radius: 0.6, types: ["water", "ice", "grass"] },
  { id: "ushuaia", name: "Ushuaia", region: "Patagonia", center: [-68.3, -54.8], radius: 0.6, types: ["ice", "steel", "water"] },
  { id: "caviahue", name: "Volcán Copahue (Caviahue)", region: "Patagonia", center: [-71.0, -37.9], radius: 0.6, types: ["fire", "rock", "ground", "ice"] },
  { id: "meseta", name: "Meseta patagónica", region: "Patagonia", center: [-69.0, -45.0], radius: 1.4, types: ["steel", "rock"] },
  { id: "comodoro", name: "Comodoro Rivadavia", region: "Patagonia", center: [-67.6, -45.9], radius: 0.7, types: ["steel", "rock", "normal"] },
  { id: "rio-gallegos", name: "Estepa de Santa Cruz", region: "Patagonia", center: [-69.3, -51.6], radius: 1.0, types: ["steel", "rock", "normal", "flying"] },
  { id: "valdes", name: "Puerto Madryn y Península Valdés", region: "Patagonia", center: [-65.2, -42.8], radius: 0.6, types: ["water", "flying", "normal"] },
  // --- Cuyo: montaña, árido -----------------------------------------------
  { id: "aconcagua", name: "Cordillera (Aconcagua)", region: "Cuyo", center: [-69.9, -32.65], radius: 0.8, types: ["rock", "fighting", "ground"] },
  { id: "cordon-plata", name: "Cordón del Plata", region: "Cuyo", center: [-69.35, -33.0], radius: 0.5, types: ["ice", "rock", "fighting"] },
  { id: "mendoza", name: "Valles de Mendoza", region: "Cuyo", center: [-68.5, -33.3], radius: 0.7, types: ["grass", "ground", "fire", "normal"] },
  { id: "atuel", name: "Cañón del Atuel (San Rafael)", region: "Cuyo", center: [-68.6, -35.0], radius: 0.6, types: ["rock", "water", "ground"] },
  { id: "valle-luna", name: "Ischigualasto (Valle de la Luna)", region: "Cuyo", center: [-67.9, -30.2], radius: 1.0, types: ["dragon", "ground", "fire", "rock"] },
  { id: "san-luis", name: "Sierras de San Luis", region: "Cuyo", center: [-66.0, -33.0], radius: 0.8, types: ["fighting", "rock", "ground", "normal"] },
  // --- NOA: altiplano, desierto, quebradas ---------------------------------
  { id: "humahuaca", name: "Quebrada de Humahuaca", region: "NOA", center: [-65.4, -23.5], radius: 0.9, types: ["ground", "rock", "poison", "fire"] },
  { id: "salinas", name: "Salinas Grandes", region: "NOA", center: [-65.8, -23.6], radius: 0.6, types: ["ground", "rock", "normal"] },
  { id: "yungas", name: "Yungas (Calilegua)", region: "NOA", center: [-64.8, -23.7], radius: 0.6, types: ["grass", "bug", "poison", "flying"] },
  { id: "cafayate", name: "Cafayate", region: "NOA", center: [-66.0, -26.1], radius: 0.7, types: ["fire", "ground", "rock", "poison"] },
  { id: "tafi", name: "Tafí del Valle", region: "NOA", center: [-65.7, -26.85], radius: 0.5, types: ["fairy", "ghost", "grass", "flying"] },
  { id: "fiambala", name: "Desierto de Fiambalá", region: "NOA", center: [-67.6, -27.7], radius: 0.8, types: ["fire", "ground", "rock"] },
  { id: "chaco-seco", name: "Chaco seco", region: "NOA", center: [-62.5, -26.5], radius: 1.3, types: ["ground", "fire", "poison", "bug", "ghost"] },
  { id: "santiago", name: "Monte santiagueño", region: "NOA", center: [-63.5, -28.0], radius: 0.8, types: ["fire", "ground", "normal"] },
  // --- NEA: selva, humedales -----------------------------------------------
  { id: "iguazu", name: "Cataratas del Iguazú", region: "NEA", center: [-54.4, -25.7], radius: 0.5, types: ["grass", "bug", "water", "poison"] },
  { id: "misiones", name: "Selva misionera", region: "NEA", center: [-55.4, -27.3], radius: 0.6, types: ["grass", "bug", "poison"] },
  { id: "ibera", name: "Esteros del Iberá", region: "NEA", center: [-57.2, -28.5], radius: 1.1, types: ["water", "grass", "bug", "poison"] },
  { id: "pilcomayo", name: "Bañados del Pilcomayo", region: "NEA", center: [-59.5, -25.2], radius: 1.0, types: ["water", "bug", "poison", "flying"] },
  { id: "chaco-humedo", name: "Chaco húmedo (Resistencia)", region: "NEA", center: [-59.0, -27.4], radius: 1.0, types: ["bug", "poison", "grass", "water"] },
  { id: "entre-rios", name: "Entre Ríos (Concordia)", region: "NEA", center: [-58.2, -31.4], radius: 0.6, types: ["grass", "water", "normal"] },
  // --- Pampa: llanura templada ---------------------------------------------
  { id: "buenos-aires", name: "Buenos Aires", region: "Pampa", center: [-58.8, -34.6], radius: 0.5, types: ["normal", "electric", "psychic"] },
  { id: "delta", name: "Delta del Paraná", region: "Pampa", center: [-59.0, -33.9], radius: 0.4, types: ["water", "grass", "bug"] },
  { id: "rosario", name: "Rosario y Santa Fe", region: "Pampa", center: [-60.9, -32.6], radius: 0.8, types: ["normal", "electric", "flying", "grass"] },
  { id: "pampa", name: "Llanura pampeana", region: "Pampa", center: [-63.5, -36.5], radius: 1.4, types: ["normal", "flying", "grass", "electric"] },
  { id: "tandil", name: "Sierras de Tandil", region: "Pampa", center: [-59.1, -37.3], radius: 0.5, types: ["rock", "normal", "fighting"] },
  { id: "mar-del-plata", name: "Mar del Plata", region: "Pampa", center: [-58.0, -37.9], radius: 0.4, types: ["water", "flying", "normal"] },
  { id: "bahia-blanca", name: "Bahía Blanca", region: "Pampa", center: [-62.6, -38.5], radius: 0.5, types: ["water", "flying", "normal"] },
  { id: "mar-chiquita", name: "Mar Chiquita", region: "Pampa", center: [-62.6, -30.7], radius: 0.6, types: ["water", "flying", "normal"] },
  // --- Centro / Córdoba: sierras -----------------------------------------
  { id: "sierras", name: "Sierras de Córdoba", region: "Centro", center: [-64.6, -31.6], radius: 0.7, types: ["psychic", "fairy", "normal", "ghost"] },
  { id: "capilla", name: "Capilla del Monte", region: "Centro", center: [-64.5, -30.85], radius: 0.4, types: ["psychic", "ghost", "fairy"] },
];

const FALLBACK_ZONE = SPAWN_ZONES.find((z) => z.id === "pampa")!;

/** mulberry32: PRNG chico, rápido y reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Elige la zona con más tipos en común (Lapras, agua/hielo, cae en glaciares
 * y lagos patagónicos). Si hay empate, desempata el PRNG; sin coincidencias,
 * va a la llanura pampeana.
 */
export function pickZone(id: number, types: string[]): SpawnZone {
  const scored = SPAWN_ZONES.map((zone) => ({
    zone,
    score: types.filter((t) => zone.types.includes(t)).length,
  }));
  const best = Math.max(...scored.map((s) => s.score));
  if (best === 0) return FALLBACK_ZONE;
  const candidates = scored.filter((s) => s.score === best);
  const rand = mulberry32(id * 7919)();
  return candidates[Math.floor(rand * candidates.length)].zone;
}

export function spawnPosition(
  id: number,
  types: string[],
): [lng: number, lat: number] {
  const zone = pickZone(id, types);
  const rand = mulberry32(id * 104729);
  // Punto uniforme dentro del círculo (raíz para no amontonar en el centro).
  const angle = rand() * Math.PI * 2;
  const dist = Math.sqrt(rand()) * zone.radius;
  return [
    zone.center[0] + Math.cos(angle) * dist,
    zone.center[1] + Math.sin(angle) * dist,
  ];
}
