import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Zonas de clima. Son independientes de las zonas de spawn: abarcan regiones
 * enteras y se definen como una unión de círculos (centro y radio en grados),
 * como las zonas de spawn, así que el borde queda suave y orgánico.
 */
export interface WeatherCircle {
  center: [lng: number, lat: number];
  /** Radio en grados de latitud. */
  radius: number;
  /** Intensidad en el centro (0 a 1); por defecto, 1. */
  weight?: number;
}

export interface WeatherZone {
  id: string;
  /** Nombre para mostrar ("Niebla del Litoral"). */
  label: string;
  circles: WeatherCircle[];
}

/** Litoral argentino: de Misiones al Delta, siguiendo el Paraná y el Uruguay. */
export const LITORAL: WeatherZone = {
  id: "litoral",
  label: "Niebla del Litoral",
  circles: [
    { center: [-55.4, -27.3], radius: 1.2 }, // Misiones
    { center: [-57.2, -28.5], radius: 1.7 }, // Corrientes (Iberá)
    { center: [-59.0, -27.4], radius: 1.4 }, // Chaco húmedo (Resistencia)
    { center: [-59.0, -32.0], radius: 1.6 }, // Entre Ríos
    { center: [-60.7, -31.5], radius: 1.5 }, // Santa Fe
    { center: [-59.2, -33.8], radius: 0.9 }, // Delta del Paraná
  ],
};

/**
 * Lluvia, a partir del mapa de precipitación anual 1981-2010 del SMN. El
 * `weight` sale del color: violeta y azul oscuro (más de ~800 mm) ≈ 0,8–1;
 * azul (500–800 mm) ≈ 0,6–0,75; celeste (300–500 mm) ≈ 0,35–0,45. Es una
 * aproximación con círculos, no una reproducción del mapa.
 */
export const LLUVIA: WeatherZone = {
  id: "lluvia",
  label: "Lluvia",
  circles: [
    // NEA: lo más lluvioso del país
    { center: [-54.6, -26.9], radius: 1.3, weight: 1 }, // Misiones
    { center: [-56.5, -28.3], radius: 1.6, weight: 0.85 }, // Corrientes
    { center: [-58.5, -27.0], radius: 1.5, weight: 0.8 }, // Chaco oriental y Formosa
    { center: [-61.5, -27.5], radius: 1.4, weight: 0.65 }, // Chaco central
    // Litoral sur y Pampa húmeda
    { center: [-59.0, -31.8], radius: 1.7, weight: 0.75 }, // Entre Ríos
    { center: [-60.8, -31.5], radius: 1.5, weight: 0.65 }, // Santa Fe
    { center: [-59.5, -34.8], radius: 1.5, weight: 0.6 }, // NE de Buenos Aires
    // Celeste: lluvias moderadas
    { center: [-63.5, -34.5], radius: 2.0, weight: 0.4 }, // Pampa central
    { center: [-64.0, -31.5], radius: 1.5, weight: 0.4 }, // Córdoba
    { center: [-60.5, -37.5], radius: 1.8, weight: 0.35 }, // Buenos Aires sur
    // Cordillera patagónica
    { center: [-71.3, -41.2], radius: 1.0, weight: 0.7 }, // Bariloche
    { center: [-71.7, -43.0], radius: 0.9, weight: 0.6 }, // Esquel
    { center: [-71.2, -38.3], radius: 0.9, weight: 0.6 }, // Caviahue
    { center: [-72.9, -49.5], radius: 1.0, weight: 0.55 }, // Hielos Continentales
  ],
};

/** Dentro de este múltiplo del radio el clima es pleno; se disipa hasta FADE_END. */
const FULL_UNTIL = 0.6;
const FADE_END = 1.3;
/** A este zoom o menos no hay clima; llega a su máximo en FULL_ZOOM. */
const MIN_ZOOM = 4.5;
const FULL_ZOOM = 6;
/** Los grados de longitud son más cortos que los de latitud (~cos 30°). */
const LNG_SCALE = 0.87;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Intensidad (0 a 1) de una zona en un punto: la del círculo que más pesa. */
function coverage(zone: WeatherZone, lng: number, lat: number): number {
  let value = 0;
  for (const { center, radius, weight = 1 } of zone.circles) {
    const d =
      Math.hypot((lng - center[0]) * LNG_SCALE, lat - center[1]) / radius;
    value = Math.max(value, weight * (1 - smoothstep(FULL_UNTIL, FADE_END, d)));
  }
  return value;
}

export const fogAt = (lng: number, lat: number) => coverage(LITORAL, lng, lat);
export const rainAt = (lng: number, lat: number) => coverage(LLUVIA, lng, lat);

export interface Weather {
  /** Niebla (0 a 1). */
  fog: number;
  /** Lluvia (0 a 1). */
  rain: number;
  /** Cuánto empeora el clima la visibilidad en conjunto (0 a 1). */
  severity: number;
}

/**
 * Clima que "siente" la cámara: el del punto central, atenuado al alejar el
 * zoom (con todo el país a la vista no tendría sentido nublarlo entero).
 */
export function weatherAt(map: MapLibreMap): Weather {
  const { lng, lat } = map.getCenter();
  const zoomFactor = smoothstep(MIN_ZOOM, FULL_ZOOM, map.getZoom());
  const fog = fogAt(lng, lat) * zoomFactor;
  const rain = rainAt(lng, lat) * zoomFactor;
  // Se combinan como probabilidades: dos climas suaves suman, pero sin pasar de 1.
  return { fog, rain, severity: 1 - (1 - fog) * (1 - rain) };
}
