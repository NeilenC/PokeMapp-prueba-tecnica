"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Map,
  NavigationControl,
  setWorkerUrl,
  type Map as MapLibreMap,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PokemonSheet } from "@/components/pokemon/pokemon-sheet";
import { usePokemonList } from "@/hooks/use-pokemon-list";
import { useMediaQuery } from "@/hooks/use-media-query";
import { COARSE_POINTER_QUERY, sheetFlyOffset } from "@/lib/layout-mode";
import { TiltControl } from "@/lib/tilt-control";
import {
  discover,
  getServerSnapshot as getServerDiscovered,
  getSnapshot as getDiscovered,
  resetDiscovered,
  subscribe as subscribeDiscovered,
} from "@/lib/discovered-store";
import { isCryPlaying, playCry, stopCry } from "@/lib/cry";
import { DEFAULT_FILTERS, matchingIds, type Filters } from "@/lib/filters";
import { MAX_POKEMON } from "@/lib/pokeapi";
import {
  addToTeam,
  getCompanionSnapshot as getCompanion,
  getServerCompanionSnapshot as getServerCompanion,
  setCompanion,
  getServerSnapshot as getServerTeam,
  getSnapshot as getTeam,
  removeFromTeam,
  resetTeam,
  subscribe as subscribeTeam,
} from "@/lib/team-store";
import { applyPokemonTheme } from "@/lib/map-theme";
import { applyArgentineLabels } from "@/lib/map-labels";
import { addNeighborsMask } from "@/lib/map-mask";
import { addZoneLayers } from "@/lib/map-zones";
import { spawnPosition } from "@/lib/spawn";
import type { PokemonListItem, PokemonPage } from "@/types/pokemon";
import { Companion } from "./companion";
import { ExpeditionDock } from "./expedition-dock";
import { FiltersPanel } from "./filters-panel";
import { WeatherOverlay } from "./weather-overlay";
import { MiniMap } from "./mini-map";
import { MiniMapToggle } from "./mini-map-toggle";
import { PikachuPeek } from "./pikachu-peek";
import { PokedexHud } from "./pokedex-hud";
import { PokemonMarkers } from "./pokemon-markers";
import { RadarOverlay } from "./radar-overlay";
import { WelcomeModal, type GuideMode } from "./welcome-modal";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome-seen";
import { useTutorial } from "@/hooks/use-tutorial";
import { TUTORIAL_TIPS } from "@/lib/tutorial-tips";

// MapLibre v6 con bundler: hay que indicar dónde está el worker, una sola vez
// y antes de crear el Map.
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

/** Calma necesaria para que el compañero se dé vuelta y mire de frente. */
const MOVING_IDLE_MS = 600;

/** Separación mínima entre dos gritos del compañero al descubrir. */
const PIKACHU_ID = 25;
const COMPANION_CRY_GAP_MS = 1500;

/** Grados por píxel de scroll al rotar/inclinar con Alt + dos dedos. */
const ALT_ROTATE_SPEED = 0.3;
const ALT_PITCH_SPEED = 0.2;
// Atajos de teclado
const KEY_ROTATE_DEG_S = 140; // grados por segundo
const KEY_ZOOM_S = 3.5; // niveles de zoom por segundo
const KEY_BACK_PX_S = 1100; // píxeles por segundo
const KEY_SMOOTH_MS = 70; // inercia de aceleración/frenado

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
  const { items, total, error, retry } = usePokemonList(initialPage);
  // Descubrimiento: persiste en localStorage y se lee solo en el cliente.
  const discovered = useSyncExternalStore(
    subscribeDiscovered,
    getDiscovered,
    getServerDiscovered,
  );
  // Equipo de expedición: también persiste en localStorage.
  const team = useSyncExternalStore(
    subscribeTeam,
    getTeam,
    getServerTeam,
  );
  const toggleTeam = useCallback((id: number) => {
    if (getTeam().includes(id)) removeFromTeam(id);
    else addToTeam(id);
  }, []);
  const showMiniMap = useMediaQuery("(min-width: 640px)");
  const [miniOpen, setMiniOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const visibleIds = useMemo(() => matchingIds(items, filters), [items, filters]);
  const matchCount = useMemo(() => {
    if (!visibleIds) return null;
    let n = 0;
    for (const id of visibleIds) if (discovered.has(id)) n++;
    return n;
  }, [visibleIds, discovered]);
  const companion = useSyncExternalStore(
    subscribeTeam,
    getCompanion,
    getServerCompanion,
  );
  const [recent, setRecent] = useState<PokemonListItem | null>(null);
  // Cada descubrimiento sube `cheer`: el compañero salta de alegría.
  const [cheer, setCheer] = useState(0);
  const [moving, setMoving] = useState(false);
  // Cerrada al renderizar (SSR/hidratación); la bienvenida se abre solo en la
  // primera visita, y las instrucciones se vuelven a abrir desde el botón.
  const [guide, setGuide] = useState<GuideMode | null>(null);
  useEffect(() => {
    if (hasSeenWelcome()) return;
    markWelcomeSeen();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage solo existe en el cliente
    setGuide("welcome");
  }, []);
  // Mensajes arcade del tutorial: esperan a que se cierre el popup de bienvenida.
  const tutorialCtx = useMemo(() => ({ teamSize: team.length }), [team.length]);
  const {
    active: activeTip,
    dismiss: dismissTip,
    reset: resetTutorial,
  } = useTutorial(TUTORIAL_TIPS, tutorialCtx, guide !== null);
  const [pikachuPeek, setPikachuPeek] = useState(0);
  const lastCompanionCry = useRef(0);
  const handleDiscover = useCallback(
    (ids: number[]) => {
      discover(ids);
      const last = items.find((p) => p.id === ids[ids.length - 1]);
      if (last) setRecent(last);

      // Pikachu asoma desde abajo y suena su grito (pisa al del compañero).
      if (ids.includes(PIKACHU_ID)) {
        setPikachuPeek((n) => n + 1);
        lastCompanionCry.current = performance.now();
        playCry(PIKACHU_ID);
      }

      const buddy = getCompanion();
      if (buddy === null) return;
      setCheer((n) => n + 1);
      // Un solo grito por tanda y como mucho uno cada 1,5 s; si ya suena
      // otro (p. ej. uno que elegiste vos), no se lo corta.
      const now = performance.now();
      if (now - lastCompanionCry.current < COMPANION_CRY_GAP_MS) return;
      if (isCryPlaying()) return;
      lastCompanionCry.current = now;
      playCry(buddy);
    },
    [items],
  );
  const clearRecent = useCallback(() => setRecent(null), []);
  // El mapa se expone por estado (tras `load`) para que los hijos lo usen.
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [selected, setSelected] = useState<PokemonListItem | null>(null);
  const selectedId = selected?.id ?? null;
  const closeDrawer = useCallback(() => setSelected(null), []);
  const handleSelect = useCallback((item: PokemonListItem) => {
    setSelected(item);
    playCry(item.id);
  }, []);
  // Reiniciar: borra progreso, equipo y compañero, y limpia lo que quedaba en
  // pantalla (detalle abierto, aviso, filtros, salto del compañero). Los ajustes
  // (silencio) se conservan.
  const handleReset = useCallback(() => {
    stopCry();
    resetDiscovered();
    resetTeam();
    resetTutorial();
    setSelected(null);
    setRecent(null);
    setCheer(0);
    setFilters(DEFAULT_FILTERS);
    setGuide("welcome");
  }, [resetTutorial]);

  // Selección -> vuelo suave hacia el marcador, con offset para que el panel
  // (a la derecha en pantallas anchas) no lo tape.
  useEffect(() => {
    if (!map || !selected) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({
      center: spawnPosition(selected.id, selected.types),
      zoom: Math.max(map.getZoom(), 8),
      // Vertical si el panel es un bottom sheet, horizontal si es lateral.
      offset: sheetFlyOffset(),
      duration: reduced ? 0 : 1800,
      essential: false,
    });
  }, [map, selected]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Táctil (móvil/tablet): menos carga gráfica y sin deriva automática, que
    // además de gastar batería compite con el gesto del dedo.
    const coarse = window.matchMedia(COARSE_POINTER_QUERY).matches;
    const smallScreen = window.innerWidth < 640;

    const map = new Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: ARGENTINA_CENTER,
      // En un teléfono en portrait, zoom 5 muestra solo un tercio del país.
      zoom: smallScreen ? 4.2 : 5,
      minZoom: 3,
      pitch: coarse ? 45 : 60,
      maxPitch: coarse ? 60 : 75,
      // Pantallas de 3x pintan 2,25 veces más píxeles que de 2x sin verse mejor.
      ...(coarse && { pixelRatio: Math.min(window.devicePixelRatio, 2) }),
      maxBounds: ARGENTINA_BOUNDS,
      // La atribución es obligatoria por licencia (OSM/OpenFreeMap): no se
      // quita, pero queda reducida al botón "i" en vez del texto largo.
      attributionControl: { compact: true },
    });

    // En táctil se hace zoom pellizcando: solo queda la brújula (que también
    // muestra la inclinación y vuelve al norte con un toque).
    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: !coarse,
        visualizePitch: true,
      }),
      "top-right",
    );
    // En táctil, además, botones para inclinar la cámara (el gesto de dos dedos
    // no siempre se reconoce). Se apilan debajo de la brújula.
    if (coarse) map.addControl(new TiltControl(), "top-right");

    // --- Terreno 3D + atmósfera -------------------------------------------
    map.on("load", () => {
      setMap(map);
      // MapLibre abre la atribución al inicio; la dejamos plegada (solo "i").
      const attrib = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
      attrib?.classList.remove("maplibregl-compact-show");
      attrib?.removeAttribute("open");
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

      // Paleta propia y zonas de spawn (halos bajo el relieve, nombres arriba).
      applyPokemonTheme(map);
      applyArgentineLabels(map);
      addZoneLayers(map, "relief-hillshade");
      // Los países vecinos se atenúan (sobre el relieve, bajo las etiquetas).
      addNeighborsMask(map, firstLabel);

      map.setTerrain({ source: DEM_SOURCE, exaggeration: coarse ? 1.3 : 1.6 });
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
      if (!reducedMotion && !coarse) resumeTimer = setTimeout(startDrift, delay);
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
    // iOS también dispara gesture* al pellizcar con los dedos sobre la pantalla;
    // ahí rota MapLibre por su cuenta (touchZoomRotate), y manejarlo dos veces
    // haría temblar la cámara. Por eso se ignora mientras haya dedos tocando.
    let activeTouches = 0;
    const trackTouches = (e: TouchEvent) => {
      activeTouches = e.touches.length;
    };
    canvasContainer.addEventListener("touchstart", trackTouches, { passive: true });
    canvasContainer.addEventListener("touchend", trackTouches, { passive: true });
    canvasContainer.addEventListener("touchcancel", trackTouches, { passive: true });

    let gestureStartBearing = 0;
    const onGestureStart = (e: Event) => {
      if (activeTouches > 0) return;
      e.preventDefault();
      markInteracting();
      gestureStartBearing = map.getBearing();
    };
    const onGestureChange = (e: Event) => {
      if (activeTouches > 0) return;
      e.preventDefault();
      const { rotation } = e as GestureLikeEvent;
      map.jumpTo({ bearing: gestureStartBearing - rotation });
    };
    canvasContainer.addEventListener("gesturestart", onGestureStart);
    canvasContainer.addEventListener("gesturechange", onGestureChange);

    // --- Atajos de teclado ------------------------------------------------------
    //  Alt + ← / →  : rotar la cámara
    //  Alt + ↑ / ↓  : acercar / alejar
    //  ↓ (sin Alt)  : retroceder la cámara a la misma altura (zoom y pitch fijos)
    // Mientras la tecla está apretada, un bucle por frame mueve la cámara con
    // velocidad que acelera y frena suavemente (sin saltos).
    const pressed = new Set<string>();
    let altHeld = false;
    let vRot = 0;
    let vZoom = 0;
    let vBack = 0;
    let keyFrame = 0;
    let keyLast = 0;

    const dirs = () => ({
      rot: altHeld
        ? Number(pressed.has("ArrowRight")) - Number(pressed.has("ArrowLeft"))
        : 0,
      zoom: altHeld
        ? Number(pressed.has("ArrowUp")) - Number(pressed.has("ArrowDown"))
        : 0,
      back: !altHeld && pressed.has("ArrowDown") ? 1 : 0,
    });

    const stepKeys = (now: number) => {
      const dt = Math.min(now - keyLast, 50);
      keyLast = now;
      const d = dirs();
      const k = 1 - Math.exp(-dt / KEY_SMOOTH_MS);
      vRot += (d.rot * KEY_ROTATE_DEG_S - vRot) * k;
      vZoom += (d.zoom * KEY_ZOOM_S - vZoom) * k;
      vBack += (d.back * KEY_BACK_PX_S - vBack) * k;

      const idle =
        Math.abs(vRot) < 0.05 && Math.abs(vZoom) < 0.0005 && Math.abs(vBack) < 0.5;
      if (idle && !d.rot && !d.zoom && !d.back) {
        vRot = vZoom = vBack = 0;
        keyFrame = 0;
        return;
      }
      const sec = dt / 1000;
      if (vRot) map.setBearing(map.getBearing() + vRot * sec);
      if (vZoom) map.setZoom(map.getZoom() + vZoom * sec);
      if (vBack) map.panBy([0, vBack * sec], { animate: false });
      keyFrame = requestAnimationFrame(stepKeys);
    };

    const startKeys = () => {
      markInteracting();
      if (keyFrame) return;
      keyLast = performance.now();
      keyFrame = requestAnimationFrame(stepKeys);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      )
        return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      altHeld = e.altKey;
      if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
      const d = (pressed.add(e.key), dirs());
      if (!d.rot && !d.zoom && !d.back) return; // combinación sin atajo
      e.preventDefault();
      startKeys();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      altHeld = e.altKey;
      pressed.delete(e.key);
    };
    const onBlur = () => {
      pressed.clear();
      altHeld = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

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

    // --- ¿La cámara se mueve? (para el compañero) -----------------------------
    // La deriva automática no cuenta: casi siempre está activa y el compañero
    // quedaría siempre de espaldas. Sí cuentan arrastrar, zoom, rotar y los
    // vuelos. Se vuelve a "quieto" tras un rato sin movimiento.
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const markMoving = () => {
      if (driftActive) return;
      setMoving(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setMoving(false), MOVING_IDLE_MS);
    };
    map.on("move", markMoving);

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(resumeTimer);
      cancelAnimationFrame(zoomFrame);
      canvasContainer.removeEventListener("wheel", onWheelCapture, {
        capture: true,
      });
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cancelAnimationFrame(keyFrame);
      canvasContainer.removeEventListener("touchstart", trackTouches);
      canvasContainer.removeEventListener("touchend", trackTouches);
      canvasContainer.removeEventListener("touchcancel", trackTouches);
      canvasContainer.removeEventListener("gesturestart", onGestureStart);
      canvasContainer.removeEventListener("gesturechange", onGestureChange);
      setMap(null);
      map.remove();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {map && (
        <>
          <PokemonMarkers
            map={map}
            items={items}
            selectedId={selectedId}
            discovered={discovered}
            visibleIds={visibleIds}
            onSelect={handleSelect}
          />
          {/* Antes del radar y del compañero: el clima queda debajo de ellos. */}
          <WeatherOverlay map={map} />
          <RadarOverlay
            map={map}
            items={items}
            discovered={discovered}
            onDiscover={handleDiscover}
          />
          <Companion
            id={companion}
            cheer={cheer}
            moving={moving}
            sheetOpen={selectedId !== null}
          />
          {/* En móvil solo se monta si se pide: un segundo contexto WebGL pesa. */}
          {showMiniMap ? (
            <MiniMap map={map} sheetOpen={selectedId !== null} />
          ) : (
            <>
              <MiniMapToggle
                open={miniOpen}
                onToggle={() => setMiniOpen((v) => !v)}
                sheetOpen={selectedId !== null}
              />
              {miniOpen && (
                <MiniMap map={map} sheetOpen={selectedId !== null} raised />
              )}
            </>
          )}
        </>
      )}
      <FiltersPanel
        items={items}
        discovered={discovered}
        onLocate={handleSelect}
        team={team}
        onToggleTeam={toggleTeam}
        filters={filters}
        onChange={setFilters}
        matchCount={matchCount}
        count={discovered.size}
        total={total ?? MAX_POKEMON}
        onReset={handleReset}
        onHelp={() => setGuide("help")}
      />
      <PokedexHud
        recent={recent}
        onRecentDone={clearRecent}
      />
      <ExpeditionDock
        team={team}
        items={items}
        sheetOpen={selectedId !== null}
        onLocate={handleSelect}
        onRemove={removeFromTeam}
        companion={companion}
        onCompanion={setCompanion}
        tip={activeTip}
        onTipDismiss={dismissTip}
      />
      <PokemonSheet
        selectedId={selectedId}
        onClose={closeDrawer}
        team={team}
        onToggleTeam={toggleTeam}
      />
      <PikachuPeek trigger={pikachuPeek} />
      <WelcomeModal mode={guide} onClose={() => setGuide(null)} />
      {/* Solo aparece si falla la carga; el progreso normal no se muestra. */}
      {error && (
        <div
          role="alert"
          // Sobre el dock en móvil (el dock ocupa el borde inferior).
          className="absolute bottom-[calc(7rem+env(safe-area-inset-bottom))] left-3 z-[2] flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-lg bg-slate-900/90 py-2 pr-2 pl-3 text-sm text-slate-200 shadow-lg backdrop-blur sm:bottom-3"
        >
          <span>No se pudieron cargar todos los Pokémon.</span>
          <button
            type="button"
            onClick={retry}
            className="min-h-11 shrink-0 rounded-md bg-white/10 px-3 font-semibold text-yellow-300 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-yellow-300"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
