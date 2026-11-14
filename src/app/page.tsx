import { MapViewLoader } from "@/components/map/map-view-loader";
import { fetchPokemonPage } from "@/lib/pokeapi";
import type { PokemonPage } from "@/types/pokemon";

export default async function Home() {
  // Solo la primera página se pide en el servidor; el resto llega de a poco
  // desde el cliente. Si PokéAPI falla, el cliente reintenta desde cero.
  let initialPage: PokemonPage | null = null;
  try {
    initialPage = await fetchPokemonPage(0);
  } catch {
    initialPage = null;
  }

  return (
    <main className="h-dvh w-full">
      <MapViewLoader initialPage={initialPage} />
    </main>
  );
}
