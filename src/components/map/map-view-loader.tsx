"use client";

import dynamic from "next/dynamic";
import type { PokemonPage } from "@/types/pokemon";

// MapLibre usa `window`: se carga solo en el cliente.
const MapView = dynamic(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#94a3b8",
        }}
      >
        Cargando mapa interactivo...
      </div>
    ),
  },
);

export function MapViewLoader({
  initialPage,
}: {
  initialPage: PokemonPage | null;
}) {
  return <MapView initialPage={initialPage} />;
}
