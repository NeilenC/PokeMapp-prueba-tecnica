import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Paleta "mundo Pokémon" sobre el estilo `liberty` de OpenFreeMap: tierra
 * cálida, verdes y azules más saturados. Se aplican con `setPaintProperty`,
 * así seguimos usando las teselas del proveedor sin hostear un estilo propio.
 * Las capas que el estilo no tenga se ignoran.
 */
const PAINT: {
  layer: string;
  prop: "background-color" | "fill-color" | "line-color";
  color: string;
}[] = [
  { layer: "background", prop: "background-color", color: "#ecdfb8" },
  { layer: "water", prop: "fill-color", color: "#3f9bf2" },
  { layer: "waterway_river", prop: "line-color", color: "#5db3ff" },
  { layer: "waterway_other", prop: "line-color", color: "#5db3ff" },
  { layer: "landcover_wood", prop: "fill-color", color: "#5fae5a" },
  { layer: "landcover_grass", prop: "fill-color", color: "#98d36a" },
  { layer: "park", prop: "fill-color", color: "#a9dd7a" },
  { layer: "landcover_sand", prop: "fill-color", color: "#f4d680" },
  { layer: "landcover_ice", prop: "fill-color", color: "#f0f9ff" },
];

export function applyPokemonTheme(map: MapLibreMap): void {
  for (const { layer, prop, color } of PAINT) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop, color);
  }
}
