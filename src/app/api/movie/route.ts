import { getCatalogMovieInfo } from "@/lib/curated-movie-catalog";
import { tmdbFetch, posterUrl, logoUrl } from "@/lib/tmdb";
import type { MovieInfo, StreamingProviders, Provider } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const year = searchParams.get("year");

  if (!title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  try {
    const catalog = getCatalogMovieInfo(title, year ? parseInt(year) : null);
    if (catalog.movie) {
      return Response.json(catalog);
    }

    const params: Record<string, string> = { query: title };
    if (year) params.year = year;

    const searchRes = await tmdbFetch("/search/movie", params);
    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      return Response.json({ movie: null, providers: null });
    }

    const m = searchData.results[0];
    const movie: MovieInfo = {
      id: m.id,
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
      posterPath: m.poster_path,
      posterUrl: posterUrl(m.poster_path),
      overview: m.overview || "",
      voteAverage: m.vote_average || 0,
    };

    // Fetch streaming providers
    let providers: StreamingProviders | null = null;
    try {
      const provRes = await tmdbFetch(`/movie/${m.id}/watch/providers`);
      const provData = await provRes.json();
      const us = provData.results?.US;
      if (us) {
        const mapProviders = (list: Array<{ provider_id: number; provider_name: string; logo_path: string | null }> | undefined): Provider[] =>
          (list || []).map((p) => ({
            id: p.provider_id,
            name: p.provider_name,
            logoPath: logoUrl(p.logo_path),
          }));

        providers = {
          flatrate: mapProviders(us.flatrate),
          rent: mapProviders(us.rent),
          buy: mapProviders(us.buy),
          link: us.link || null,
        };
      }
    } catch {
      // providers optional
    }

    return Response.json({ movie, providers });
  } catch (err) {
    console.error("Movie API error:", err);
    return Response.json({ error: "Failed to fetch movie data" }, { status: 500 });
  }
}
