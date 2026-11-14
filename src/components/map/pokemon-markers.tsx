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
  /** Solo los descubiertos se ven completos y se pueden abrir. */
  discovered: ReadonlySet<number>;
  /** Ids que cumplen los filtros; `null` = sin filtros. Solo afecta a los descubiertos. */
  visibleIds: ReadonlySet<number> | null;
  onSelect: (item: PokemonListItem) => void;
}

function createMarkerElement(
  item: PokemonListItem,
  onSelect: (item: PokemonListItem) => void,
): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  // Nace como silueta; el efecto de sincronización lo revela si corresponde.
  el.className = "pokemon-marker is-undiscovered";
  el.disabled = true;
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("aria-label", item.name);
  el.style.setProperty("--type-color", typeColor(item.types[0] ?? ""));
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect(item);
  });
  el.addEventListener("animationend", (e) => {
    if (e.animationName === "discover-flash") el.classList.remove("just-discovered");
  });

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
export function PokemonMarkers({
  map,
  items,
  selectedId,
  discovered,
  visibleIds,
  onSelect,
}: Props) {
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
      const found = discovered.has(id);
      const wasFound = el.classList.contains("is-discovered");

      el.classList.toggle("is-discovered", found);
      el.classList.toggle("is-undiscovered", !found);
      el.toggleAttribute("disabled", !found); // fuera del foco y sin clicks
      if (found) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");

      // Animación de revelado solo en descubrimientos nuevos, no al restaurar
      // los guardados (`synced` marca que el marcador ya tuvo su primer pase).
      if (found && !wasFound && el.dataset.synced) el.classList.add("just-discovered");
      el.dataset.synced = "1";

      // Las siluetas no se filtran: si no, el filtro delataría sus tipos/stats.
      const filteredOut = found && visibleIds !== null && !visibleIds.has(id);
      el.classList.toggle("is-filtered-out", filteredOut);
      el.toggleAttribute("disabled", !found || filteredOut);

      el.classList.toggle("is-selected", id === selectedId);
      el.setAttribute("aria-pressed", String(id === selectedId));
    }
  }, [items, selectedId, discovered, visibleIds]);

  useEffect(() => {
    const current = markers.current;
    return () => {
      for (const marker of current.values()) marker.remove();
      current.clear();
    };
  }, [map]);

  return null;
}
