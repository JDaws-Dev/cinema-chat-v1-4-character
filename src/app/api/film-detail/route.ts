import { getCatalogFilmDetail } from "@/lib/curated-movie-catalog";
import { tmdbFetch, posterUrl, backdropUrl, logoUrl } from "@/lib/tmdb";
import type { FilmDetail, CastMember, CrewMember, MovieInfo, StreamingProviders, Provider } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const catalogFilm = getCatalogFilmDetail(Number(id));
    if (catalogFilm) {
      return Response.json({ film: catalogFilm });
    }

    // Parallel fetches for detail, credits, similar, providers
    const [detailRes, creditsRes, similarRes, providersRes] = await Promise.all([
      tmdbFetch(`/movie/${id}`),
      tmdbFetch(`/movie/${id}/credits`),
      tmdbFetch(`/movie/${id}/similar`),
      tmdbFetch(`/movie/${id}/watch/providers`),
    ]);

    const [detail, credits, similar, providersData] = await Promise.all([
      detailRes.json(),
      creditsRes.json(),
      similarRes.json(),
      providersRes.json(),
    ]);

    const cast: CastMember[] = (credits.cast || []).slice(0, 15).map((c: Record<string, unknown>) => ({
      id: c.id as number,
      name: c.name as string,
      character: c.character as string,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));

    const crew: CrewMember[] = (credits.crew || [])
      .filter((c: Record<string, unknown>) =>
        ["Director", "Writer", "Screenplay", "Director of Photography", "Original Music Composer"].includes(c.job as string)
      )
      .map((c: Record<string, unknown>) => ({
        id: c.id as number,
        name: c.name as string,
        job: c.job as string,
        profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

    const director = crew.find((c) => c.job === "Director")?.name || null;

    const similarFilms: MovieInfo[] = (similar.results || []).slice(0, 8).map((m: Record<string, unknown>) => ({
      id: m.id as number,
      title: m.title as string,
      year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
      posterPath: m.poster_path as string | null,
      posterUrl: posterUrl(m.poster_path as string | null),
      overview: (m.overview as string) || "",
      voteAverage: (m.vote_average as number) || 0,
    }));

    // Streaming providers
    const us = providersData.results?.US;
    const mapProviders = (list: Array<{ provider_id: number; provider_name: string; logo_path: string | null }> | undefined): Provider[] =>
      (list || []).map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logoPath: logoUrl(p.logo_path),
      }));

    const providers: StreamingProviders = us
      ? {
          flatrate: mapProviders(us.flatrate),
          rent: mapProviders(us.rent),
          buy: mapProviders(us.buy),
          link: us.link || null,
        }
      : { flatrate: [], rent: [], buy: [], link: null };

    const film: FilmDetail = {
      id: detail.id,
      title: detail.title,
      year: detail.release_date ? parseInt(detail.release_date.split("-")[0]) : null,
      overview: detail.overview || "",
      posterUrl: posterUrl(detail.poster_path),
      backdropUrl: backdropUrl(detail.backdrop_path),
      voteAverage: detail.vote_average || 0,
      voteCount: detail.vote_count || 0,
      runtime: detail.runtime || null,
      genres: (detail.genres || []).map((g: { name: string }) => g.name),
      director,
      cast,
      crew,
      productionCompanies: (detail.production_companies || []).map((c: { name: string }) => c.name),
      language: detail.original_language || "en",
      budget: detail.budget || null,
      revenue: detail.revenue || null,
      tagline: detail.tagline || null,
      similar: similarFilms,
      providers,
    };

    return Response.json({ film });
  } catch (err) {
    console.error("Film detail error:", err);
    return Response.json({ error: "Failed to fetch film details" }, { status: 500 });
  }
}
