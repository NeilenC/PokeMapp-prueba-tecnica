import type { Map as MapLibreMap } from "maplibre-gl";

const SOURCE = "neighbors";

/**
 * Atenúa la tierra de los países vecinos (Chile, Bolivia, Perú, Brasil,
 * Uruguay, Paraguay) para indicar que ahí no hay Pokémon disponibles. Solo
 * cubre tierra firme: el mar y las Islas Malvinas quedan sin tocar, porque un
 * contorno de baja resolución recortaría las costas con bordes rectos.
 *
 * Los polígonos son de Natural Earth 10m (dominio público), simplificados una
 * sola vez y servidos como archivo estático: `public/geo/neighbors.geojson`.
 */
export function addNeighborsMask(map: MapLibreMap, beforeId?: string): void {
  map.addSource(SOURCE, { type: "geojson", data: "/geo/neighbors.geojson" });
  map.addLayer(
    {
      id: "neighbors-mask",
      type: "fill",
      source: SOURCE,
      paint: {
        "fill-color": "#0b1020",
        "fill-opacity": 0.45,
      },
    },
    beforeId,
  );
}
