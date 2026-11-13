"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map,
  NavigationControl,
  setWorkerUrl,
  type Map as MapLibreMap,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PokemonDrawer } from "@/components/pokemon/pokemon-drawer";
import { usePokemonList } from "@/hooks/use-pokemon-list";
import { spawnPosition } from "@/lib/spawn";
import type { PokemonListItem, PokemonPage } from "@/types/pokemon";
import { PokemonMarkers } from "./pokemon-markers";

/** Ancho del panel de detalle; debe coincidir con `.pokemon-drawer` en CSS. */
const DRAWER_WIDTH = 380;

// MapLibre v6 con bundler: hay que indicar dónde está el worker, una sola vez
// y antes de crear el Map.
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

/** Grados por píxel de scroll al rotar/inclinar con Alt + dos dedos. */
const ALT_ROTATE_SPEED = 0.3;
const ALT_PITCH_SPEED = 0.2;

/** Constante de tiempo del zoom: más alto = desliza más antes de frenar. */
const ZOOM_SMOOTH_MS = 140;
/** Niveles de zoom por píxel de scroll: ~0.33 por "click" de rueda (100 px). */
const WHEEL_ZOOM_RATE = 1 / 300;
const PINCH_ZOOM_RATE = 1 / 100;

/** Evento `gesture*` de Safari; no está en los tipos DOM de TypeScript. */
interface GestureLikeEvent extends UIEvent {
  rotation: number;
  scale: number;
}

const DEM_SOURCE = "terrain-dem";
/** Calma necesaria antes de que la cámara vuelva a derivar. */
const DRIFT_RESUME_MS = 8000;

// Centro aproximado de Argentina (algo al oeste para que se vean Los Andes)
const ARGENTINA_CENTER: [number, number] = [-66, -37];
const ARGENTINA_BOUNDS: [[number, number], [number, number]] = [
  [-90, -60],
  [-40, -15],
];

export function MapView({ initialPage }: { initialPage: PokemonPage | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // La lista llega de a páginas; los marcadores se van sumando a medida que llegan.
  const { items, total, loading, error, retry } = usePokemonList(initialPage);
  // El mapa se expone por estado (tras `load`) para que los hijos lo usen.
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [selected, setSelected] = useState<PokemonListItem | null>(null);
  const selectedId = selected?.id ?? null;
  const closeDrawer = useCallback(() => setSelected(null), []);

  // Selección -> vuelo suave hacia el marcador, con offset para que el panel
  // (a la derecha en pantallas anchas) no lo tape.
  useEffect(() => {
    if (!map || !selected) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({
      center: spawnPosition(selected.id, selected.types),
      zoom: Math.max(map.getZoom(), 8),
      offset: window.innerWidth >= 768 ? [-DRAWER_WIDTH / 2, 0] : [0, -120],
      duration: reduced ? 0 : 1800,
      essential: false,
    });
  }, [map, selected]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: ARGENTINA_CENTER,
      zoom: 5,
      minZoom: 3,
      pitch: 60,
      maxPitch: 75,
      maxBounds: ARGENTINA_BOUNDS,
    });

    map.addControl(new NavigationControl({ showCompass: true }), "top-right");

    // --- Terreno 3D + atmósfera -------------------------------------------
    map.on("load", () => {
      setMap(map);
      map.addSource(DEM_SOURCE, {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
        attribution:
          '<a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles (AWS)</a>',
      });

      // Sombreado de relieve debajo de las etiquetas para que sigan legibles.
      const firstLabel = map
        .getStyle()
        .layers.find((layer) => layer.type === "symbol")?.id;
      map.addLayer(
        {
          id: "relief-hillshade",
          type: "hillshade",
          source: DEM_SOURCE,
          paint: { "hillshade-exaggeration": 0.45 },
        },
        firstLabel,
      );

      map.setTerrain({ source: DEM_SOURCE, exaggeration: 1.6 });
      map.setSky({
        "sky-color": "#7ab8f5",
        "horizon-color": "#dbeafe",
        "fog-color": "#e8eef7",
        "sky-horizon-blend": 0.6,
        "horizon-fog-blend": 0.6,
        "fog-ground-blend": 0.4,
      });
    });

    // --- Deriva suave de la cámara ("planeando") -----------------------------
    // Gira lentamente el rumbo mientras nadie toca el mapa; se detiene al
    // interactuar y se reanuda tras unos segundos de calma.
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let driftActive = false;
    let interacting = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const startDrift = () => {
      driftActive = true;
      map.easeTo({
        bearing: map.getBearing() + 25,
        duration: 20000,
        easing: (t) => t, // lineal: sin tirones entre tramos
      });
    };
    const scheduleDrift = (delay: number) => {
      clearTimeout(resumeTimer);
      if (!reducedMotion) resumeTimer = setTimeout(startDrift, delay);
    };

    const markInteracting = () => {
      interacting = true;
      clearTimeout(resumeTimer);
    };
    map.on("mousedown", markInteracting);
    map.on("touchstart", markInteracting);
    map.on("wheel", markInteracting);

    // --- Trackpad: dos dedos = desplazar la cámara ---------------------------
    // Por defecto MapLibre usa todo `wheel` para zoom. Acá distinguimos:
    //  - pellizco (ctrlKey)          -> zoom nativo de MapLibre
    //  - rueda de mouse (saltos ~100) -> zoom nativo de MapLibre
    //  - dos dedos (deltas chicos/continuos, con deltaX) -> panBy
    // Se "traba" la clasificación unos ms para que un gesto no cambie de modo
    // a mitad (p. ej. cuando acelera y los deltas crecen).
    let trackpadUntil = 0;
    const canvasContainer = map.getCanvasContainer();
    // --- Zoom con inercia -------------------------------------------------------
    // Cada evento de rueda/pellizco mueve un zoom *objetivo*; un bucle de
    // animación lo persigue con desaceleración exponencial (se frena
    // deslizando, sin cortes) y mantiene fijo el punto bajo el cursor.
    map.scrollZoom.disable();
    let zoomTarget = 0;
    let zoomAnchor: [number, number] = [0, 0];
    let zoomFrame = 0;
    let zoomLast = 0;

    const stepZoom = (now: number) => {
      const dt = Math.min(now - zoomLast, 50); // evita saltos tras pestañas inactivas
      zoomLast = now;
      const diff = zoomTarget - map.getZoom();
      const done = Math.abs(diff) < 0.002;
      const next = done
        ? zoomTarget
        : map.getZoom() + diff * (1 - Math.exp(-dt / ZOOM_SMOOTH_MS));
      map.zoomTo(next, { animate: false, around: map.unproject(zoomAnchor) });
      zoomFrame = done ? 0 : requestAnimationFrame(stepZoom);
    };

    const zoomBy = (e: WheelEvent, rate: number) => {
      e.preventDefault();
      e.stopPropagation();
      markInteracting();

      const rect = canvasContainer.getBoundingClientRect();
      zoomAnchor = [e.clientX - rect.left, e.clientY - rect.top];
      if (!zoomFrame) zoomTarget = map.getZoom();

      const delta = e.deltaY * (e.deltaMode === 1 ? 40 : 1); // líneas -> px
      zoomTarget = Math.min(
        map.getMaxZoom(),
        Math.max(map.getMinZoom(), zoomTarget - delta * rate),
      );

      if (reducedMotion) {
        map.zoomTo(zoomTarget, {
          animate: false,
          around: map.unproject(zoomAnchor),
        });
      } else if (!zoomFrame) {
        zoomLast = performance.now();
        zoomFrame = requestAnimationFrame(stepZoom);
      }
    };

    const onWheelCapture = (e: WheelEvent) => {
      if (e.altKey) {
        // Alt + dos dedos: horizontal rota, vertical inclina (funciona en
        // cualquier sistema, a diferencia del giro nativo de dos dedos).
        e.preventDefault();
        e.stopPropagation();
        markInteracting();
        map.jumpTo({
          bearing: map.getBearing() + e.deltaX * ALT_ROTATE_SPEED,
          pitch: Math.min(
            map.getMaxPitch(),
            Math.max(0, map.getPitch() + e.deltaY * ALT_PITCH_SPEED),
          ),
        });
        return;
      }
      if (e.ctrlKey) {
        zoomBy(e, PINCH_ZOOM_RATE); // pellizco
        return;
      }
      const now = performance.now();
      const looksLikeTrackpad =
        e.deltaMode === 0 &&
        (e.deltaX !== 0 ||
          !Number.isInteger(e.deltaY) ||
          Math.abs(e.deltaY) < 50);
      if (looksLikeTrackpad) trackpadUntil = now + 250;
      if (now > trackpadUntil) {
        zoomBy(e, WHEEL_ZOOM_RATE); // rueda de mouse
        return;
      }

      e.preventDefault();
      e.stopPropagation(); // que el scrollZoom de MapLibre no lo vea
      markInteracting();
      map.panBy([e.deltaX, e.deltaY], { animate: false });
    };
    canvasContainer.addEventListener("wheel", onWheelCapture, {
      capture: true,
      passive: false,
    });

    // Giro con dos dedos: solo Safari (macOS) lo expone, como eventos gesture*.
    // `rotation` es el ángulo acumulado desde gesturestart (horario = positivo).
    let gestureStartBearing = 0;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      markInteracting();
      gestureStartBearing = map.getBearing();
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const { rotation } = e as GestureLikeEvent;
      map.jumpTo({ bearing: gestureStartBearing - rotation });
    };
    canvasContainer.addEventListener("gesturestart", onGestureStart);
    canvasContainer.addEventListener("gesturechange", onGestureChange);

    map.on("movestart", () => clearTimeout(resumeTimer));
    map.on("moveend", () => {
      const wasDrift = driftActive;
      driftActive = false;
      if (wasDrift && !interacting) {
        startDrift(); // siguiente tramo, encadenado
      } else {
        interacting = false;
        scheduleDrift(DRIFT_RESUME_MS);
      }
    });

    scheduleDrift(2000);

    return () => {
      clearTimeout(resumeTimer);
      cancelAnimationFrame(zoomFrame);
      canvasContainer.removeEventListener("wheel", onWheelCapture, {
        capture: true,
      });
      canvasContainer.removeEventListener("gesturestart", onGestureStart);
      canvasContainer.removeEventListener("gesturechange", onGestureChange);
      setMap(null);
      map.remove();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {map && (
        <PokemonMarkers
          map={map}
          items={items}
          selectedId={selectedId}
          onSelect={setSelected}
        />
      )}
      <PokemonDrawer selectedId={selectedId} onClose={closeDrawer} />
      <div
        role="status"
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "6px 10px",
          borderRadius: 8,
          background: "rgba(15, 23, 42, 0.85)",
          color: "#e2e8f0",
          fontSize: 13,
        }}
      >
        {error ? (
          <>
            No se pudieron cargar todos los Pokémon.{" "}
            <button type="button" onClick={retry}>
              Reintentar
            </button>
          </>
        ) : (
          <>
            Pokémon: {items.length}
            {total ? ` / ${total}` : ""}
            {loading ? " · cargando…" : ""}
          </>
        )}
      </div>
    </div>
  );
}
