const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

export function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not configured");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetch(url.toString());
}

export function posterUrl(path: string | null, size = "w342"): string | null {
  return path ? `${TMDB_IMAGE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE}/w1280${path}` : null;
}

export function logoUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE}/w92${path}` : null;
}
