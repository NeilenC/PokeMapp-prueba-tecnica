"use client";

import { useEffect, useRef } from "react";
import { Map, type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { cn } from "@/lib/utils";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const AREA_SOURCE = "viewport-area";
/** Argentina continental, con un pequeño margen. */
const ARGENTINA_VIEW: [[number, number], [number, number]] = [
  [-74, -56],
  [-53, -21],
];
/**
 * Con el mapa inclinado la parte alta de la pantalla es cielo/horizonte y
 * `unproject` da valores absurdos. El borde superior del recuadro se toma a
 * esta fracción de la altura (el horizonte nunca baja de ~10 % con pitch ≤ 75).
 */
const TOP_EDGE = 0.4;

interface Props {
  map: MapLibreMap;
  /** Hay un Pokémon abierto: el panel ocupa el costado/borde inferior. */
  sheetOpen: boolean;
}

/**
 * Minimapa plano de todo el país, no interactivo salvo por el click (que
 * lleva la cámara principal hasta ahí). Dibuja el área visible del mapa
 * grande y un punto en su centro, así se sabe dónde se está aunque el zoom
 * sea muy alto.
 */
export function MiniMap({ map, sheetOpen }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mini = new Map({
      container,
      style: STYLE_URL,
      bounds: ARGENTINA_VIEW,
      fitBoundsOptions: { padding: 6 },
      interactive: false,
      attributionControl: false,
      // No se persiguen tiles de más: es solo una referencia.
      maxPitch: 0,
    });

    let frame = 0;
    let ready = false;

    const update = () => {
      frame = 0;
      if (!ready) return;
      const w = map.getContainer().clientWidth;
      const h = map.getContainer().clientHeight;
      const top = h * TOP_EDGE;
      const ring = [
        map.unproject([0, top]),
        map.unproject([w, top]),
        map.unproject([w, h]),
        map.unproject([0, h]),
      ].map((p) => [p.lng, p.lat]);
      ring.push(ring[0]);
      const c = map.getCenter();

      const source = mini.getSource(AREA_SOURCE) as GeoJSONSource | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [ring] },
          },
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [c.lng, c.lat] },
          },
        ],
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    mini.on("load", () => {
      mini.addSource(AREA_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      mini.addLayer({
        id: "viewport-fill",
        type: "fill",
        source: AREA_SOURCE,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#facc15", "fill-opacity": 0.25 },
      });
      mini.addLayer({
        id: "viewport-line",
        type: "line",
        source: AREA_SOURCE,
        filter: ["==", "$type", "Polygon"],
        paint: { "line-color": "#ef4444", "line-width": 2 },
      });
      mini.addLayer({
        id: "viewport-center",
        type: "circle",
        source: AREA_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 4,
          "circle-color": "#ef4444",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });
      ready = true;
      update();
    });

    map.on("move", schedule);
    map.on("resize", schedule);

    // Click: la cámara principal viaja hasta ese punto.
    mini.on("click", (e) => {
      map.flyTo({ center: e.lngLat, duration: 1200, essential: false });
    });

    return () => {
      cancelAnimationFrame(frame);
      map.off("move", schedule);
      map.off("resize", schedule);
      mini.remove();
    };
  }, [map]);

  return (
    <div
      aria-label="Minimapa de Argentina: tocá un punto para ir hasta ahí"
      role="img"
      className={cn(
        "absolute right-3 bottom-9 z-[1] h-[170px] w-[120px] overflow-hidden rounded-lg border-2 border-white/80 shadow-lg transition-[right,opacity] duration-300 lg:h-[200px] lg:w-[140px]",
        // Con bottom sheet se oculta; con drawer lateral (380 px + 12 de margen,
        // ver SHEET_SIDE_WIDTH) se corre a su izquierda.
        sheetOpen &&
          "sheet-bottom:pointer-events-none sheet-bottom:opacity-0 sheet-side:right-[392px]",
      )}
    >
      <div ref={containerRef} className="h-full w-full cursor-pointer" />
    </div>
  );
}
