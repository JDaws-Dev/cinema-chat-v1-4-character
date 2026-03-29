// ── Core Types ─────────────────────────────────────────────

export interface WatchlistItem {
  title: string;
  year: number | null;
  genre: string | null;
  tmdbId?: number | null;
  posterUrl?: string | null;
  overview?: string | null;
  addedAt: string;
}

export interface UserRating {
  title: string;
  year: number | null;
  tmdbId?: number | null;
  posterUrl?: string | null;
  rating: number; // 1-5
  review?: string | null;
  director?: string | null;
  genre?: string | null;
  ratedAt: string;
}

export interface MovieInfo {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  posterUrl: string | null;
  overview: string;
  voteAverage: number;
}

export interface StreamingProviders {
  flatrate: Provider[];
  rent: Provider[];
  buy: Provider[];
  link: string | null;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface TrendingMovie {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  voteAverage: number;
  genreIds?: number[];
}

// ── Film Detail Types ──────────────────────────────────────

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profilePath: string | null;
}

export interface FilmDetail {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  voteAverage: number;
  voteCount: number;
  runtime: number | null;
  genres: string[];
  director: string | null;
  cast: CastMember[];
  crew: CrewMember[];
  productionCompanies: string[];
  language: string;
  budget: number | null;
  revenue: number | null;
  tagline: string | null;
  similar: MovieInfo[];
  providers: StreamingProviders;
}

// ── Search Types ───────────────────────────────────────────

export interface SearchFilters {
  query: string;
  decade?: string;
  genreId?: string;
  language?: string;
  ratingMin?: number;
  ratingMax?: number;
  page?: number;
}

export interface SearchResult {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  voteAverage: number;
  genre: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  totalPages: number;
  page: number;
}

// ── Recommendation Types ───────────────────────────────────

export interface RecommendationItem {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  voteAverage: number;
  reason: string;
}

export interface RecommendationSection {
  title: string;
  subtitle: string;
  films: RecommendationItem[];
}

// ── Film title detected in chat messages ───────────────────

export interface DetectedFilm {
  title: string;
  year?: number;
  fullMatch: string;
}
