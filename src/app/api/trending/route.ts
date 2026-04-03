import { getCatalogTrendingMovies } from "@/lib/curated-movie-catalog";
import { isTmdbConfigured, tmdbFetch, posterUrl } from "@/lib/tmdb";
import type { TrendingMovie } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const window = searchParams.get("window") || "week";

  try {
    if (!isTmdbConfigured()) {
      return Response.json({ movies: await getCatalogTrendingMovies() });
    }

    const res = await tmdbFetch(`/trending/movie/${window}`);
    const data = await res.json();

    const movies: TrendingMovie[] = (data.results || []).slice(0, 20).map((m: Record<string, unknown>) => ({
      id: m.id as number,
      title: m.title as string,
      year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
      posterUrl: posterUrl(m.poster_path as string | null),
      overview: (m.overview as string) || "",
      voteAverage: (m.vote_average as number) || 0,
      genreIds: (m.genre_ids as number[]) || [],
    }));

    return Response.json({ movies });
  } catch (err) {
    console.error("Trending error:", err);
    return Response.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
