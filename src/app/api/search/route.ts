import { discoverCatalogMovies, searchCatalogMovies } from "@/lib/curated-movie-catalog";
import { isTmdbConfigured, tmdbFetch, posterUrl } from "@/lib/tmdb";
import type { SearchResponse, SearchResult } from "@/lib/types";

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const decade = searchParams.get("decade");
  const genreId = searchParams.get("genreId");
  const ratingMin = searchParams.get("ratingMin");
  const language = searchParams.get("language");
  const releaseDateLte = searchParams.get("releaseDateLte");
  const releaseDateGte = searchParams.get("releaseDateGte");
  const page = searchParams.get("page") || "1";
  const numericPage = parseInt(page);

  try {
    if (query && !isTmdbConfigured()) {
      const localResults = searchCatalogMovies(query);
      return Response.json({
        results: localResults,
        totalResults: localResults.length,
        totalPages: 1,
        page: 1,
      } satisfies SearchResponse);
    }

    if (!query) {
      const hasHistoricalDateWindow =
        (releaseDateLte && Number(releaseDateLte.slice(0, 4)) <= 1999) ||
        (releaseDateGte && Number(releaseDateGte.slice(0, 4)) <= 1999) ||
        Boolean(decade) ||
        genreId === "classics";

      if (!isTmdbConfigured() || hasHistoricalDateWindow) {
        return Response.json(
          discoverCatalogMovies({
            decade,
            genreId,
            releaseDateGte,
            releaseDateLte,
            page: numericPage,
          })
        );
      }
    }

    let results: SearchResult[] = [];
    let totalResults = 0;
    let totalPages = 0;

    if (query) {
      // Text search
      const res = await tmdbFetch("/search/movie", { query, page });
      const data = await res.json();
      totalResults = data.total_results || 0;
      totalPages = data.total_pages || 0;

      results = (data.results || []).map((m: Record<string, unknown>) => ({
        id: m.id as number,
        title: m.title as string,
        year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
        posterUrl: posterUrl(m.poster_path as string | null),
        overview: (m.overview as string) || "",
        voteAverage: (m.vote_average as number) || 0,
        genre: ((m.genre_ids as number[]) || []).map((id) => GENRE_MAP[id] || "").filter(Boolean).join(", ") || "Film",
      }));
    } else {
      // Discover with filters
      const params: Record<string, string> = {
        sort_by: "vote_count.desc",
        page,
        "vote_count.gte": "50",
      };

      if (decade) {
        const start = parseInt(decade);
        params["primary_release_date.gte"] = `${start}-01-01`;
        params["primary_release_date.lte"] = `${start + 9}-12-31`;
      }
      if (genreId) params.with_genres = genreId;
      if (ratingMin) params["vote_average.gte"] = ratingMin;
      if (language) params.with_original_language = language;
      if (releaseDateLte) params["primary_release_date.lte"] = releaseDateLte;
      if (releaseDateGte) params["primary_release_date.gte"] = releaseDateGte;

      const res = await tmdbFetch("/discover/movie", params);
      const data = await res.json();
      totalResults = data.total_results || 0;
      totalPages = data.total_pages || 0;

      results = (data.results || []).map((m: Record<string, unknown>) => ({
        id: m.id as number,
        title: m.title as string,
        year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
        posterUrl: posterUrl(m.poster_path as string | null),
        overview: (m.overview as string) || "",
        voteAverage: (m.vote_average as number) || 0,
        genre: ((m.genre_ids as number[]) || []).map((id) => GENRE_MAP[id] || "").filter(Boolean).join(", ") || "Film",
      }));
    }

    const response: SearchResponse = {
      results,
      totalResults,
      totalPages,
      page: numericPage,
    };

    return Response.json(response);
  } catch (err) {
    console.error("Search error:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
