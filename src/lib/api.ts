import type {
  MovieInfo,
  StreamingProviders,
  FilmDetail,
  TrendingMovie,
  SearchResponse,
  RecommendationSection,
} from "./types";

export async function fetchMovie(
  title: string,
  year?: number
): Promise<{ movie: MovieInfo | null; providers: StreamingProviders | null }> {
  const params = new URLSearchParams({ title });
  if (year) params.set("year", String(year));
  const res = await fetch(`/api/movie?${params}`);
  return res.json();
}

export async function fetchFilmDetail(id: number): Promise<{ film: FilmDetail }> {
  const res = await fetch(`/api/film-detail?id=${id}`);
  return res.json();
}

export async function fetchTrending(
  window: "day" | "week" = "week"
): Promise<{ movies: TrendingMovie[] }> {
  const res = await fetch(`/api/trending?window=${window}`);
  return res.json();
}

export async function fetchSearch(params: {
  query?: string;
  decade?: string;
  genreId?: string;
  ratingMin?: number;
  language?: string;
  page?: number;
}): Promise<SearchResponse> {
  const sp = new URLSearchParams();
  if (params.query) sp.set("query", params.query);
  if (params.decade) sp.set("decade", params.decade);
  if (params.genreId) sp.set("genreId", params.genreId);
  if (params.ratingMin) sp.set("ratingMin", String(params.ratingMin));
  if (params.language) sp.set("language", params.language);
  if (params.page) sp.set("page", String(params.page));
  const res = await fetch(`/api/search?${sp}`);
  return res.json();
}

export async function fetchRecommendations(
  ratings: Array<{ tmdbId?: number; genre?: string; rating: number }>,
  preferences: Array<{ key: string; value: string }>
): Promise<{ sections: RecommendationSection[] }> {
  const res = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ratings, preferences }),
  });
  return res.json();
}
