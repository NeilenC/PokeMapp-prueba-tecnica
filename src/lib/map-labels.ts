import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl";

const MALVINAS = "Malvinas Argentinas";

/**
 * Las etiquetas vienen en inglés desde las teselas ("Falkland Islands"). Acá se
 * reemplaza el nombre de las islas por "Malvinas Argentinas" envolviendo el
 * `text-field` de cada capa de texto: si el nombre contiene "Falkland" o
 * "Malvinas" se muestra la denominación argentina; el resto queda igual.
 */
export function applyArgentineLabels(map: MapLibreMap): void {
  const name: ExpressionSpecification = [
    "coalesce",
    ["get", "name_en"],
    ["get", "name"],
    "",
  ];
  const isMalvinas: ExpressionSpecification = [
    "any",
    ["in", "Falkland", name],
    ["in", "Malvinas", name],
  ];

  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const original = map.getLayoutProperty(layer.id, "text-field");
    // Solo expresiones: un texto fijo no es un nombre de lugar.
    if (!Array.isArray(original)) continue;
    map.setLayoutProperty(layer.id, "text-field", [
      "case",
      isMalvinas,
      MALVINAS,
      original,
    ] as ExpressionSpecification);
  }
}
