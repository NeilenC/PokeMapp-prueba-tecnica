"use client";

import { useEffect, useRef } from "react";
import { Marker, type Map as MapLibreMap } from "maplibre-gl";
import { spawnPosition } from "@/lib/spawn";
import { typeColor } from "@/lib/type-colors";
import type { PokemonListItem } from "@/types/pokemon";

interface Props {
  map: MapLibreMap;
  items: PokemonListItem[];
  selectedId: number | null;
  onSelect: (item: PokemonListItem) => void;
}

function createMarkerElement(
  item: PokemonListItem,
  onSelect: (item: PokemonListItem) => void,
): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "pokemon-marker";
  el.setAttribute("aria-label", item.name);
  el.style.setProperty("--type-color", typeColor(item.types[0] ?? ""));
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect(item);
  });
console.log("spawnPosition", spawnPosition)
  const img = document.createElement("img");
  img.src = item.spriteUrl;
  img.alt = "";
  img.width = 48;
  img.height = 48;
  img.loading = "lazy";
  img.draggable = false;
  el.append(img);
  return el;
}

/**
 * Dibuja un marcador por Pokémon sobre el mapa. No renderiza JSX: sincroniza
 * `maplibregl.Marker` con la lista (solo agrega los nuevos) y marca el elegido.
 */
export function PokemonMarkers({ map, items, selectedId, onSelect }: Props) {
  const markers = useRef(new Map<number, Marker>());
  // Evita recrear marcadores si el padre pasa un callback nuevo.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    for (const item of items) {
      if (markers.current.has(item.id)) continue;
      const el = createMarkerElement(item, (picked) => onSelectRef.current(picked));
      const marker = new Marker({ element: el, anchor: "bottom" })
        .setLngLat(spawnPosition(item.id, item.types))
        .addTo(map);
      markers.current.set(item.id, marker);
    }
  }, [map, items]);

  useEffect(() => {
    for (const [id, marker] of markers.current) {
      const el = marker.getElement();
      el.classList.toggle("is-selected", id === selectedId);
      el.setAttribute("aria-pressed", String(id === selectedId));
    }
  }, [items, selectedId]);

  useEffect(() => {
    const current = markers.current;
    return () => {
      for (const marker of current.values()) marker.remove();
      current.clear();
    };
  }, [map]);

  return null;
}
