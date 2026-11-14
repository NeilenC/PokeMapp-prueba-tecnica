import type { NextRequest } from "next/server";
import { fetchPokemonDetail } from "@/lib/pokeapi";

// GET /api/pokemon/25 -> PokemonDetail
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;
  const id = Number(rawId);

  try {
    const detail = await fetchPokemonDetail(id, request.signal);
    if (!detail) {
      return Response.json(
        { error: "id debe ser un entero entre 1 y 151" },
        { status: 400 },
      );
    }
    return Response.json(detail, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[api/pokemon/[id]]", err);
    return Response.json(
      { error: "No se pudo obtener el Pokémon de PokéAPI" },
      { status: 502 },
    );
  }
}
