"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { spawnPosition } from "@/lib/spawn";
import type { PokemonListItem } from "@/types/pokemon";

/** Segundos que tarda el barrido en dar una vuelta completa. */
const SWEEP_PERIOD_MS = 6000;
/** Tope por frame: si la pestaña estuvo en segundo plano no se revela todo de golpe. */
const MAX_STEP_DEG = 40;
/**
 * El radar mide lo mismo en pantalla a cualquier zoom, así que alejado cubriría
 * medio país. Solo existe (y descubre) desde RADAR_MIN_ZOOM; entre
 * RADAR_FADE_START_ZOOM y ese valor aparece con un fundido. A zoom 6,5 el
 * círculo abarca unos 150–200 km.
 */
const RADAR_MIN_ZOOM = 6.5;
const RADAR_FADE_START_ZOOM = 6;
/** El marcador se ancla abajo: su centro visual está ~24 px sobre el punto. */
const MARKER_CENTER_OFFSET_PX = 24;

interface Props {
  map: MapLibreMap;
  items: PokemonListItem[];
  discovered: ReadonlySet<number>;
  onDiscover: (ids: number[]) => void;
}

/** ¿Está `angle` en el arco (from, to]? Maneja el cruce por 360°. */
function inArc(angle: number, from: number, to: number): boolean {
  return from <= to ? angle > from && angle <= to : angle > from || angle <= to;
}

/**
 * Radar HUD fijo al centro de la pantalla. Un haz gira y revela los Pokémon
 * que cruza dentro del círculo. Como la cámara deriva sola, el radar descubre
 * mientras el mapa "planea". El ángulo se mueve por DOM (sin re-render de
 * React) y el mismo valor decide qué se descubre, así no se desfasan.
 */
export function RadarOverlay({ map, items, discovered, onDiscover }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ items, discovered, onDiscover });
  useEffect(() => {
    latest.current = { items, discovered, onDiscover };
  });

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const beam = beamRef.current;
    if (!root || !ring || !beam) return;

    // Sin movimiento: no hay haz; se revela todo lo que entra en el círculo.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let radius = ring.clientWidth / 2;
    const observer = new ResizeObserver(() => {
      radius = ring.clientWidth / 2;
    });
    observer.observe(ring);

    const container = map.getContainer();
    const lngLats = new Map<number, [number, number]>();
    let angle = 0;
    let last = performance.now();
    let frame = 0;
    let shownOpacity = -1;

    const tick = (now: number) => {
      const step = Math.min(((now - last) / SWEEP_PERIOD_MS) * 360, MAX_STEP_DEG);
      last = now;
      const prev = angle;
      angle = (angle + step) % 360;
      if (!reduced) beam.style.transform = `rotate(${angle}deg)`;

      // Fundido según el zoom; alejado, el radar no se ve ni descubre.
      const zoom = map.getZoom();
      const opacity = Math.min(
        Math.max(
          (zoom - RADAR_FADE_START_ZOOM) / (RADAR_MIN_ZOOM - RADAR_FADE_START_ZOOM),
          0,
        ),
        1,
      );
      if (opacity !== shownOpacity) {
        shownOpacity = opacity;
        root.style.opacity = String(opacity);
      }
      if (zoom < RADAR_MIN_ZOOM) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const cx = container.clientWidth / 2;
      const cy = container.clientHeight / 2;
      const { items, discovered, onDiscover } = latest.current;
      const found: number[] = [];

      for (const item of items) {
        if (discovered.has(item.id)) continue;
        let lngLat = lngLats.get(item.id);
        if (!lngLat) {
          lngLat = spawnPosition(item.id, item.types);
          lngLats.set(item.id, lngLat);
        }
        const p = map.project(lngLat);
        const dx = p.x - cx;
        const dy = p.y - MARKER_CENTER_OFFSET_PX - cy;
        if (dx * dx + dy * dy > radius * radius) continue;

        if (!reduced) {
          // Ángulo horario desde arriba, igual que la rotación CSS del haz.
          const a = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
          if (!inArc(a, prev, angle)) continue;
        }
        found.push(item.id);
      }

      if (found.length > 0) onDiscover(found);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] grid place-items-center opacity-0"
    >
      <div
        ref={ringRef}
        className="relative aspect-square rounded-full border border-yellow-300/40 bg-yellow-300/[0.04] shadow-[0_0_60px_rgba(250,204,21,0.12)]"
        style={{ width: "clamp(220px, 56vmin, 440px)" }}
      >
        <div className="absolute inset-[25%] rounded-full border border-yellow-300/20" />
        <div className="absolute inset-[50%] rounded-full border border-yellow-300/30" />
        <div className="absolute top-0 left-1/2 h-full w-px bg-yellow-300/15" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-yellow-300/15" />
        <div
          ref={beamRef}
          className="absolute inset-0 rounded-full will-change-transform motion-reduce:hidden"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(250,204,21,0.35) 358deg, rgba(250,204,21,0.85) 360deg)",
          }}
        />
      </div>
    </div>
  );
}
