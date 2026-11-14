/**
 * Ubicación de cada Pokémon según su bioma (SPEC §1). El bioma sale de los
 * tipos del Pokémon; todo el reparto es determinista (PRNG con semilla = id y
 * orden fijo), así no cambia entre recargas ni entre usuarios.
 *
 * El reparto se calcula una sola vez para los 151 a la vez (ver `buildLayout`):
 * cada uno prefiere la zona que mejor le queda por tipo, pero las zonas muy
 * cargadas pierden atractivo y las vacías ganan un bonus, y dentro de la zona
 * se ubica lo más lejos posible de los ya puestos. Así no se amontonan.
 *
 * Los Pokémon con tipo Agua solo eligen zonas que tengan agua y se ubican
 * sobre puntos de lagos, ríos anchos o mar (`water-spots.ts`), no en tierra.
 * Además, Agua+Hielo solo va a zonas con hielo (aguas heladas) y los demás
 * acuáticos solo a zonas sin hielo.
 */

import { GEN1_TYPES } from "@/lib/gen1-types";
import { WATER_SPOTS } from "@/lib/water-spots";

export interface SpawnZone {
  id: string;
  name: string;
  region: string;
  center: [lng: number, lat: number];
  /** Radio en grados (~111 km por grado). */
  radius: number;
  types: string[];
  /** Zona exclusiva: solo estos Pokémon (ids) viven acá y ellos la prefieren. */
  only?: number[];
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
  // Norte y centro de la Patagonia: estepa, volcanes y valles (antes casi vacío)
  { id: "neuquen", name: "Neuquén (Auca Mahuida)", region: "Patagonia", center: [-68.9, -38.3], radius: 0.9, types: ["fire", "ground", "rock", "steel"] },
  { id: "lanin", name: "San Martín de los Andes (Lanín)", region: "Patagonia", center: [-71.3, -40.15], radius: 0.45, types: ["water", "grass", "ice", "fairy"] },
  { id: "rio-negro", name: "Valle del Río Negro (Roca)", region: "Patagonia", center: [-67.7, -39.0], radius: 0.7, types: ["grass", "water", "normal", "bug"] },
  { id: "somuncura", name: "Meseta de Somuncurá", region: "Patagonia", center: [-67.0, -41.5], radius: 1.1, types: ["rock", "steel", "ground", "normal"] },
  { id: "cueva-manos", name: "Cueva de las Manos", region: "Patagonia", center: [-70.7, -47.15], radius: 0.7, types: ["rock", "ghost", "fighting", "normal"] },
  // Malvinas: mar helado del Atlántico Sur; Dewgong (#087), el "lobo marino".
  { id: "malvinas", name: "Islas Malvinas Argentinas", region: "Patagonia", center: [-59.0, -51.8], radius: 1.0, types: ["ice", "water"], only: [87] },
  // --- Cuyo: montaña, árido -----------------------------------------------
  { id: "payunia", name: "Payunia (Malargüe)", region: "Cuyo", center: [-69.3, -36.4], radius: 0.7, types: ["fire", "rock", "ground", "steel"] },
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
  { id: "lihue-calel", name: "Lihué Calel (La Pampa)", region: "Pampa", center: [-65.6, -38.1], radius: 0.8, types: ["rock", "ground", "normal", "flying", "fighting"] },
  { id: "mar-chiquita", name: "Mar Chiquita", region: "Pampa", center: [-62.6, -30.7], radius: 0.6, types: ["water", "flying", "normal"] },
  // --- Centro / Córdoba: sierras -----------------------------------------
  { id: "sierras", name: "Sierras de Córdoba", region: "Centro", center: [-64.6, -31.6], radius: 0.7, types: ["psychic", "fairy", "normal", "ghost"] },
  { id: "capilla", name: "Capilla del Monte", region: "Centro", center: [-64.5, -30.85], radius: 0.4, types: ["psychic", "ghost", "fairy"] },
];

const FALLBACK_ZONE = SPAWN_ZONES.find((z) => z.id === "pampa")!;

/** Distancia mínima buscada entre dos Pokémon, en grados de latitud (~33 km). */
const MIN_SPACING = 0.3;
/** Los grados de longitud son más cortos que los de latitud (~cos 30°). */
const LNG_SCALE = 0.87;
/** Puntos que se prueban por Pokémon; se queda con el más alejado de los demás. */
const CANDIDATES = 40;
/** Cuánto pesa un tipo en común, el tipo principal, la zona vacía y la carga. */
const PRIMARY_BONUS = 0.5;
const EMPTY_ZONE_BONUS = 0.8;
const LOAD_PENALTY = 2;

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

/** Puntos de agua de la zona (de los polígonos de agua del propio mapa), si los hay. */
const waterSpots = (zone: SpawnZone) => WATER_SPOTS[zone.id];

const isAquatic = (types: string[]) => types.includes("water");

/** Cuántos acuáticos caben en la zona: un cuarto de sus puntos, al menos uno. */
const waterCapacity = (zone: SpawnZone) =>
  Math.max(1, Math.round((waterSpots(zone)?.length ?? 0) / 4));

const commonTypes = (zone: SpawnZone, types: string[]) =>
  types.filter((t) => zone.types.includes(t)).length;

/** Cuántos Pokémon caben en la zona con la separación mínima. */
const capacity = (zone: SpawnZone) =>
  Math.max(1, Math.round((Math.PI * zone.radius ** 2) / MIN_SPACING ** 2));

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot((a[0] - b[0]) * LNG_SCALE, a[1] - b[1]);

/**
 * Zona para un Pokémon: gana la que más tipos comparte (y su tipo principal),
 * pero una zona ya cargada cede ante otra apenas peor, y las vacías atraen.
 * Sin ninguna coincidencia va a la llanura pampeana.
 */
function chooseZone(
  id: number,
  types: string[],
  load: Map<string, number>,
  waterLoad: Map<string, number>,
) {
  const noise = mulberry32(id * 7919);
  const aquatic = isAquatic(types);
  let best: { zone: SpawnZone; value: number } | null = null;
  for (const zone of SPAWN_ZONES) {
    if (zone.only && !zone.only.includes(id)) continue;
    const common = commonTypes(zone, types);
    const jitter = noise() * 0.05; // desempate reproducible
    // Un acuático solo puede vivir donde hay agua; el resto, en cualquier zona.
    if (common === 0 || (aquatic && !waterSpots(zone))) continue;
    // Temperatura del agua: Agua+Hielo solo en aguas heladas (zona con hielo);
    // el resto de los acuáticos, en aguas no heladas (ej. Magikarp, no glaciar).
    if (aquatic && types.includes("ice") !== zone.types.includes("ice")) continue;
    // Los acuáticos se cuentan aparte: compiten por los puntos de agua, no por la tierra.
    const used = (aquatic ? waterLoad : load).get(zone.id) ?? 0;
    const cap = aquatic ? waterCapacity(zone) : capacity(zone);
    const value =
      common +
      (zone.types.includes(types[0]) ? PRIMARY_BONUS : 0) +
      (zone.only ? 10 : 0) +
      (used === 0 ? EMPTY_ZONE_BONUS : 0) -
      (LOAD_PENALTY * used) / cap +
      jitter;
    if (!best || value > best.value) best = { zone, value };
  }
  return best?.zone ?? FALLBACK_ZONE;
}

/**
 * Punto más alejado de los ya ubicados (best-candidate de Mitchell). Sin
 * `spots` prueba puntos al azar dentro del círculo de la zona; con `spots`
 * (acuáticos) elige solo entre esos puntos de agua.
 */
function farthestPoint(
  id: number,
  zone: SpawnZone,
  placed: [number, number][],
  spots?: readonly (readonly [number, number])[],
): [number, number] {
  const rand = mulberry32(id * 104729);
  let best: [number, number] = spots ? [spots[0][0], spots[0][1]] : zone.center;
  let bestGap = -1;
  const tries = spots ? spots.length : CANDIDATES;
  for (let i = 0; i < tries; i++) {
    let point: [number, number];
    if (spots) {
      point = [spots[i][0], spots[i][1]];
    } else {
      // Punto uniforme dentro del círculo (raíz para no amontonar en el centro).
      const angle = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * zone.radius;
      point = [
        zone.center[0] + Math.cos(angle) * dist,
        zone.center[1] + Math.sin(angle) * dist,
      ];
    }
    const gap = placed.reduce((min, p) => Math.min(min, distance(point, p)), Infinity);
    if (gap > bestGap) {
      bestGap = gap;
      best = point;
    }
  }
  return best;
}

interface Placement {
  zone: SpawnZone;
  position: [lng: number, lat: number];
}

let layout: Map<number, Placement> | null = null;

/** Reparte los 151 en orden de id; se calcula una vez y se reutiliza. */
function buildLayout(): Map<number, Placement> {
  const result = new Map<number, Placement>();
  const load = new Map<string, number>();
  const waterLoad = new Map<string, number>();
  const placed: [number, number][] = [];
  for (const [id, types] of GEN1_TYPES) {
    const zone = chooseZone(id, types, load, waterLoad);
    const spots = isAquatic(types) ? waterSpots(zone) : undefined;
    const position = farthestPoint(id, zone, placed, spots);
    const bucket = spots ? waterLoad : load;
    bucket.set(zone.id, (bucket.get(zone.id) ?? 0) + 1);
    placed.push(position);
    result.set(id, { zone, position });
  }
  return result;
}

const getLayout = () => (layout ??= buildLayout());

/** Zona asignada a un Pokémon (para ids fuera de Gen 1, la que mejor le calza). */
export function pickZone(id: number, types: string[]): SpawnZone {
  const placement = getLayout().get(id);
  if (placement) return placement.zone;
  return chooseZone(id, types, new Map(), new Map());
}

export function spawnPosition(
  id: number,
  types: string[],
): [lng: number, lat: number] {
  const placement = getLayout().get(id);
  if (placement) return placement.position;
  const zone = chooseZone(id, types, new Map(), new Map());
  return farthestPoint(id, zone, [], isAquatic(types) ? waterSpots(zone) : undefined);
}
