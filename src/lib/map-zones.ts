import type {
  GeoJSONSourceSpecification,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { SPAWN_ZONES, type SpawnZone } from "@/lib/spawn";
import { typeColor } from "@/lib/type-colors";

const SOURCE = "spawn-zones";
const FILL = "spawn-zones-fill";
const LINE = "spawn-zones-line";
const LABEL = "spawn-zones-label";

/**
 * Contorno de la zona con la misma fórmula que `spawnPosition` (círculo en
 * grados), para que el halo dibujado coincida con donde caen los marcadores.
 */
function zonePolygon({ center, radius }: SpawnZone, steps = 48): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([center[0] + Math.cos(a) * radius, center[1] + Math.sin(a) * radius]);
  }
  return ring;
}

function zonesGeoJSON(): Extract<
  GeoJSONSourceSpecification["data"],
  { type: "FeatureCollection" }
> {
  return {
    type: "FeatureCollection",
    features: SPAWN_ZONES.map((zone) => ({
      type: "Feature",
      properties: {
        name: zone.name,
        // El color sale del tipo principal que atrae la zona.
        color: typeColor(zone.types[0]),
      },
      geometry: { type: "Polygon", coordinates: [zonePolygon(zone)] },
    })),
  };
}

/**
 * Dibuja las zonas de spawn: halo de color del bioma y nombre del lugar.
 * Los rellenos van debajo del sombreado de relieve (`beforeId`) para que el
 * terreno siga marcando volumen; las etiquetas quedan arriba de todo.
 */
export function addZoneLayers(map: MapLibreMap, beforeId?: string): void {
  map.addSource(SOURCE, { type: "geojson", data: zonesGeoJSON() });

  map.addLayer(
    {
      id: FILL,
      type: "fill",
      source: SOURCE,
      paint: {
        "fill-color": ["get", "color"],
        // Más tenue al acercarse, para no tapar el mapa de calles.
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.28, 9, 0.1],
      },
    },
    beforeId,
  );
  map.addLayer(
    {
      id: LINE,
      type: "line",
      source: SOURCE,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.8,
        "line-dasharray": [2, 2],
      },
    },
    beforeId,
  );

  // Reusa la tipografía de las etiquetas del propio estilo (los glifos que
  // el proveedor sí sirve).
  const labelFont = map
    .getStyle()
    .layers.find(
      (l): l is SymbolLayerSpecification =>
        l.type === "symbol" && Boolean(l.layout?.["text-font"]),
    )?.layout?.["text-font"];

  map.addLayer({
    id: LABEL,
    type: "symbol",
    source: SOURCE,
    minzoom: 5.5,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-allow-overlap": false,
      ...(labelFont ? { "text-font": labelFont } : {}),
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(15, 23, 42, 0.85)",
      "text-halo-width": 1.6,
    },
  });
}
