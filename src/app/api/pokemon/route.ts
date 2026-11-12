import type { NextRequest } from "next/server";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  fetchPokemonPage,
} from "@/lib/pokeapi";

/** Lee un entero no negativo de la query; `null` si no es válido. */
function intParam(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

// GET /api/pokemon?offset=20&limit=20 -> PokemonPage
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const offset = intParam(params.get("offset"), 0);
  const limit = intParam(params.get("limit"), DEFAULT_PAGE_SIZE);

  if (offset === null || limit === null || limit < 1) {
    return Response.json(
      { error: "offset y limit deben ser enteros (limit >= 1)" },
      { status: 400 },
    );
  }

  try {
    const page = await fetchPokemonPage(
      offset,
      Math.min(limit, MAX_PAGE_SIZE),
      request.signal,
    );
    return Response.json(page, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo obtener la lista de PokéAPI" },
      { status: 502 },
    );
  }
}
