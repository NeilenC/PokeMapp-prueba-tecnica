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
  // Patagonia: frío, estepa, glaciares
  { id: "perito-moreno", name: "Glaciar Perito Moreno", region: "Patagonia", center: [-73.0, -50.45], radius: 0.9, types: ["ice", "water"] },
  { id: "bariloche", name: "San Carlos de Bariloche", region: "Patagonia", center: [-71.3, -41.15], radius: 0.8, types: ["water", "ice", "rock"] },
  { id: "ushuaia", name: "Ushuaia", region: "Patagonia", center: [-68.3, -54.8], radius: 0.6, types: ["ice", "steel", "water"] },
  { id: "meseta", name: "Meseta patagónica", region: "Patagonia", center: [-69.0, -45.0], radius: 1.6, types: ["steel", "rock"] },
  // Cuyo: montaña, árido
  { id: "aconcagua", name: "Cordillera (Aconcagua)", region: "Cuyo", center: [-69.9, -32.65], radius: 1.0, types: ["rock", "fighting", "dragon", "ground"] },
  { id: "valle-luna", name: "Valle de la Luna", region: "Cuyo", center: [-67.9, -30.2], radius: 1.0, types: ["ground", "fire", "rock", "fighting"] },
  // NOA: altiplano, desierto, quebradas
  { id: "humahuaca", name: "Quebrada de Humahuaca", region: "NOA", center: [-65.4, -23.5], radius: 0.8, types: ["ground", "rock", "poison", "fire"] },
  { id: "cafayate", name: "Cafayate", region: "NOA", center: [-66.0, -26.1], radius: 0.8, types: ["fire", "ground", "rock", "poison"] },
  // NEA: selva, humedales
  { id: "iguazu", name: "Cataratas del Iguazú", region: "NEA", center: [-54.4, -25.7], radius: 0.6, types: ["grass", "bug", "water", "poison"] },
  { id: "ibera", name: "Esteros del Iberá", region: "NEA", center: [-57.2, -28.5], radius: 0.9, types: ["water", "grass", "bug", "poison"] },
  // Pampa: llanura templada
  { id: "buenos-aires", name: "Buenos Aires", region: "Pampa", center: [-58.4, -34.6], radius: 0.5, types: ["normal", "electric"] },
  { id: "pampa", name: "Llanura pampeana", region: "Pampa", center: [-63.5, -36.5], radius: 1.6, types: ["normal", "flying", "grass", "electric"] },
  // Centro / Córdoba: sierras
  { id: "sierras", name: "Sierras de Córdoba", region: "Centro", center: [-64.6, -31.6], radius: 0.8, types: ["psychic", "fairy", "normal", "ghost"] },
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
