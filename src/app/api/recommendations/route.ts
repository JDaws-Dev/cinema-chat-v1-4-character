import { tmdbFetch, posterUrl } from "@/lib/tmdb";
import type { RecommendationSection, RecommendationItem } from "@/lib/types";

const GENRE_IDS: Record<string, number> = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, horror: 27,
  mystery: 9648, romance: 10749, "sci-fi": 878, thriller: 53, war: 10752, western: 37,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ratings: Array<{ tmdbId?: number; genre?: string; rating: number }> = body.ratings || [];
    const preferences: Array<{ key: string; value: string }> = body.preferences || [];

    const sections: RecommendationSection[] = [];

    // Section 1: Based on top-rated films
    const topRated = ratings.filter((r) => r.rating >= 4 && r.tmdbId);
    if (topRated.length > 0) {
      const pick = topRated[Math.floor(Math.random() * topRated.length)];
      try {
        const res = await tmdbFetch(`/movie/${pick.tmdbId}/recommendations`);
        const data = await res.json();
        const films: RecommendationItem[] = (data.results || []).slice(0, 6).map((m: Record<string, unknown>) => ({
          id: m.id as number,
          title: m.title as string,
          year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
          posterUrl: posterUrl(m.poster_path as string | null),
          overview: (m.overview as string) || "",
          voteAverage: (m.vote_average as number) || 0,
          reason: "Based on films you loved",
        }));
        if (films.length > 0) {
          sections.push({
            title: "Because You Loved...",
            subtitle: "Films picked based on your highest ratings",
            films,
          });
        }
      } catch { /* skip section */ }
    }

    // Section 2: Trending in preferred genres
    const likedGenres = preferences
      .filter((p) => p.key.startsWith("likes_") && p.value === "true")
      .map((p) => p.key.replace("likes_", ""))
      .filter((g) => GENRE_IDS[g]);

    if (likedGenres.length > 0) {
      const genre = likedGenres[Math.floor(Math.random() * likedGenres.length)];
      const genreId = GENRE_IDS[genre];
      try {
        const res = await tmdbFetch("/discover/movie", {
          with_genres: String(genreId),
          sort_by: "popularity.desc",
          "vote_count.gte": "100",
          "primary_release_date.gte": `${new Date().getFullYear() - 2}-01-01`,
        });
        const data = await res.json();
        const films: RecommendationItem[] = (data.results || []).slice(0, 6).map((m: Record<string, unknown>) => ({
          id: m.id as number,
          title: m.title as string,
          year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
          posterUrl: posterUrl(m.poster_path as string | null),
          overview: (m.overview as string) || "",
          voteAverage: (m.vote_average as number) || 0,
          reason: `Trending in ${genre}`,
        }));
        if (films.length > 0) {
          sections.push({
            title: `Trending in ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
            subtitle: `Hot picks in a genre you love`,
            films,
          });
        }
      } catch { /* skip section */ }
    }

    // Section 3: Hidden gems
    try {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const res = await tmdbFetch("/discover/movie", {
        sort_by: "vote_average.desc",
        "vote_count.gte": "200",
        "vote_count.lte": "2000",
        "vote_average.gte": "7.5",
        page: String(randomPage),
      });
      const data = await res.json();
      const shuffled = (data.results || []).sort(() => Math.random() - 0.5);
      const films: RecommendationItem[] = shuffled.slice(0, 6).map((m: Record<string, unknown>) => ({
        id: m.id as number,
        title: m.title as string,
        year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
        posterUrl: posterUrl(m.poster_path as string | null),
        overview: (m.overview as string) || "",
        voteAverage: (m.vote_average as number) || 0,
        reason: "Hidden gem",
      }));
      if (films.length > 0) {
        sections.push({
          title: "Hidden Gems",
          subtitle: "Critically loved films most people haven't seen",
          films,
        });
      }
    } catch { /* skip section */ }

    // Section 4: All-time classics
    try {
      const res = await tmdbFetch("/discover/movie", {
        sort_by: "vote_count.desc",
        "vote_average.gte": "8",
        "vote_count.gte": "5000",
      });
      const data = await res.json();
      const films: RecommendationItem[] = (data.results || []).slice(0, 6).map((m: Record<string, unknown>) => ({
        id: m.id as number,
        title: m.title as string,
        year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
        posterUrl: posterUrl(m.poster_path as string | null),
        overview: (m.overview as string) || "",
        voteAverage: (m.vote_average as number) || 0,
        reason: "All-time classic",
      }));
      if (films.length > 0) {
        sections.push({
          title: "The Essentials",
          subtitle: "All-time classics every film lover should see",
          films,
        });
      }
    } catch { /* skip section */ }

    return Response.json({ sections });
  } catch (err) {
    console.error("Recommendations error:", err);
    return Response.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
