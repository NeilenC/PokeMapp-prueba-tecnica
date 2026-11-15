"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudFog, CloudRain } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { setRainIntensity } from "@/lib/rain-sound";
import { LITORAL, weatherAt } from "@/lib/weather";

/** Umbrales de los carteles, con histéresis para que no parpadeen en el borde. */
const FOG_ON = 0.25;
const RAIN_LIGHT = 0.12;
const RAIN_HEAVY = 0.6;
const HYSTERESIS = 0.08;

/** Gotas dibujadas con lluvia plena (se usan menos cuanto menos llueve). */
const MAX_DROPS = 320;
/** Desplazamiento horizontal por cada píxel de caída: el viento inclina la lluvia. */
const WIND = 0.2;

type RainLevel = 0 | 1 | 2;

/** Nivel de lluvia con histéresis: sube en el umbral, baja un poco antes. */
function nextRainLevel(prev: RainLevel, rain: number): RainLevel {
  const up = (level: RainLevel) => (level === 2 ? RAIN_HEAVY : RAIN_LIGHT);
  let level = prev;
  while (level < 2 && rain > up((level + 1) as RainLevel)) level++;
  while (level > 0 && rain < up(level) - HYSTERESIS) level--;
  return level;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

const makeDrop = (w: number, h: number, anywhere: boolean): Drop => {
  const len = 12 + Math.random() * 16;
  return {
    // Se reparte un poco a la izquierda: el viento las arrastra hacia la derecha.
    x: Math.random() * (w + h * WIND) - h * WIND,
    y: anywhere ? Math.random() * h : -len,
    len,
    speed: 14 + Math.random() * 12,
  };
};

/**
 * Clima sobre el mapa: niebla del Litoral y lluvia según el mapa de
 * precipitación. Las capas siguen al clima del centro de la cámara; las
 * opacidades y las gotas se escriben por DOM/canvas, sin re-render por frame.
 * El radar sufre el clima aparte (ver `radar-overlay`).
 */
export function WeatherOverlay({ map }: { map: MapLibreMap }) {
  const fogRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fogOn, setFogOn] = useState(false);
  const [rainLevel, setRainLevel] = useState<RainLevel>(0);

  useEffect(() => {
    const fogEl = fogRef.current;
    const tintEl = tintRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!fogEl || !tintEl || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const drops = Array.from({ length: MAX_DROPS }, () => makeDrop(w, h, true));
    let rain = 0;
    let frame = 0;
    let last = 0;

    const draw = (now: number) => {
      if (rain < 0.02) {
        ctx.clearRect(0, 0, w, h);
        frame = 0; // sin lluvia el bucle se detiene hasta que vuelva a llover
        return;
      }
      const dt = Math.min((now - last) / 16.7, 3); // 1 = un frame a 60 fps
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(214, 228, 255, ${0.22 + 0.4 * rain})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const count = Math.round(MAX_DROPS * rain);
      for (let i = 0; i < count; i++) {
        const d = drops[i];
        d.y += d.speed * dt;
        d.x += d.speed * WIND * dt;
        if (d.y > h || d.x > w + 40) Object.assign(d, makeDrop(w, h, false));
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * WIND, d.y + d.len);
      }
      ctx.stroke();
      frame = requestAnimationFrame(draw);
    };

    let shownFog = -1;
    let shownRain = -1;
    let level: RainLevel = 0;
    let fogNotice = false;

    const update = () => {
      const weather = weatherAt(map);
      if (Math.abs(weather.fog - shownFog) > 0.004) {
        shownFog = weather.fog;
        fogEl.style.opacity = String(weather.fog);
      }
      rain = weather.rain;
      if (Math.abs(rain - shownRain) > 0.004) {
        shownRain = rain;
        setRainIntensity(rain);
        // Cielo cubierto: el velo oscurece un poco aunque no haya gotas (movimiento reducido).
        tintEl.style.opacity = String(rain);
      }
      if (!frame && !reduced && rain >= 0.02) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }

      const nextFog = fogNotice ? weather.fog > FOG_ON - HYSTERESIS : weather.fog > FOG_ON;
      if (nextFog !== fogNotice) {
        fogNotice = nextFog;
        setFogOn(nextFog);
      }
      const nextLevel = nextRainLevel(level, rain);
      if (nextLevel !== level) {
        level = nextLevel;
        setRainLevel(nextLevel);
      }
    };

    update();
    map.on("move", update);
    return () => {
      map.off("move", update);
      setRainIntensity(0);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  const rainLabel = rainLevel === 2 ? "Lluvia fuerte" : "Lluvia";
  const notices = [
    ...(rainLevel > 0 ? [{ key: "rain", label: rainLabel, rain: true }] : []),
    ...(fogOn ? [{ key: "fog", label: LITORAL.label, rain: false }] : []),
  ];

  return (
    <>
      {/* Niebla */}
      <div
        ref={fogRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-0"
      >
        {/* Desenfoque suave: lo que queda debajo se ve "lejos". */}
        <div className="absolute inset-0 backdrop-blur-[3px]" />
        {/* Dos capas de bruma que derivan en sentidos opuestos. */}
        <div className="fog-layer fog-a absolute -inset-[25%]" />
        <div className="fog-layer fog-b absolute -inset-[25%]" />
        {/* Velo general, más claro en el centro para no perder del todo el radar. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(226,232,240,0.22) 0%, rgba(226,232,240,0.62) 70%)",
          }}
        />
      </div>

      {/* Lluvia: cielo cubierto y gotas */}
      <div
        ref={tintRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-0"
        style={{ background: "rgba(30, 41, 59, 0.34)" }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] size-full"
      />

      <div className="pointer-events-none absolute top-16 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1.5">
        <AnimatePresence>
          {notices.map(({ key, label, rain: isRain }) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 rounded-full bg-slate-900/85 px-3 py-1 text-xs text-slate-100 shadow-lg backdrop-blur"
            >
              {isRain ? (
                <CloudRain className="size-4 text-sky-300" aria-hidden="true" />
              ) : (
                <CloudFog className="size-4 text-slate-300" aria-hidden="true" />
              )}
              <span>
                <span className="font-semibold">{label}</span>
                <span className="text-slate-400"> · radar reducido</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {notices.length > 0
          ? `${notices.map((n) => n.label).join(" y ")}: el radar tiene menos alcance`
          : ""}
      </div>
    </>
  );
}
