import { NextResponse } from "next/server";
import { consumetServer } from "@/lib/consumet-server";

export async function GET() {
  try {
    const [
      spotlight,
      topAiring,
      popular,
      recent,
      upcoming,
    ] = await Promise.all([
      consumetServer.fetchSpotlight().catch(() => ({ results: [] })),
      consumetServer.fetchTopAiring().catch(() => ({ results: [] })),
      consumetServer.fetchMostPopular().catch(() => ({ results: [] })),
      consumetServer.fetchRecentlyUpdated().catch(() => ({ results: [] })),
      consumetServer.fetchTopUpcoming().catch(() => ({ results: [] })),
    ]);

    return NextResponse.json({
      spotlight: spotlight.results ?? [],
      topAiring: topAiring.results ?? [],
      popular: popular.results ?? [],
      recent: recent.results ?? [],
      upcoming: upcoming.results ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch HiAnime home data",
      },
      { status: 500 }
    );
  }
}
