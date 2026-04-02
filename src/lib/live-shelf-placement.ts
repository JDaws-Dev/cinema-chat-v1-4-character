import { getPlacementKeysForGenre, type ShelfGenre } from "./curated-movie-catalog";
import { STORE_LAYOUT } from "./store-layout";
import type { StoreMovieSlot } from "./store-movie-state";

export interface LiveShelfPlacementMovie {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string;
  slotKey: string;
  placementKey: string;
}

interface FetchedMovie {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string;
}

interface PlacementRequest {
  genre: string;
  placementKey: string;
  count: number;
  shelfId: string;
}

const GENRE_MAP: Record<string, string> = {
  horror: "27",
  scifi: "878",
  "sci-fi": "878",
  comedy: "35",
  drama: "18",
  action: "28",
  classics: "classics",
  family: "10751",
  thriller: "53",
  romance: "10749",
  animated: "16",
  western: "37",
  adventure: "12",
  fantasy: "14",
  war: "10752",
  musical: "10402",
  kids: "10751",
  new: "",
};

const GENRE_ALIASES: Record<string, ShelfGenre> = {
  action: "action",
  adventure: "adventure",
  thriller: "thriller",
  comedy: "comedy",
  romance: "romance",
  horror: "horror",
  western: "western",
  musical: "musical",
  musicals: "musical",
  drama: "drama",
  classics: "classics",
  scifi: "scifi",
  "sci-fi": "scifi",
  sci_fi: "scifi",
  fantasy: "fantasy",
  kids: "kids",
  family: "family",
  new: "new",
  newreleases: "new",
  new_releases: "new",
  staff_picks: "new",
};

const PRESENT_SLOT_CACHE = new Map<string, Promise<StoreMovieSlot[]>>();

function normalizeGenreKey(input: string): ShelfGenre {
  const normalized = input.toLowerCase().replace(/[\s-]+/g, "");
  return GENRE_ALIASES[normalized] || "drama";
}

function uniqueMovies(movies: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    const id = Number(movie.id || 0);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return Boolean(movie.posterUrl);
  });
}

function getWallShelfSlotCount(width: number): number {
  return Math.max(1, Math.floor(width / 0.22)) * 3;
}

function getPresentPlacementRequests(): PlacementRequest[] {
  return STORE_LAYOUT.objects.flatMap((obj) => {
    if (obj.prefab === "shelf/gondola") {
      const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
      const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;
      return [
        frontGenre
          ? { genre: frontGenre, placementKey: `${obj.id}:front`, count: 18, shelfId: obj.id }
          : null,
        backGenre
          ? { genre: backGenre, placementKey: `${obj.id}:back`, count: 18, shelfId: obj.id }
          : null,
      ].filter((value): value is PlacementRequest => Boolean(value));
    }

    if (obj.prefab === "shelf/wall-run" && typeof obj.meta?.genre === "string") {
      const width =
        typeof obj.meta?.width === "number"
          ? obj.meta.width
          : obj.w ?? 6;
      return [{
        genre: obj.meta.genre,
        placementKey: obj.id,
        count: getWallShelfSlotCount(width),
        shelfId: obj.id,
      }];
    }

    if (obj.prefab === "shelf/new-releases-wall") {
      return [{ genre: "new", placementKey: obj.id, count: 10, shelfId: obj.id }];
    }

    return [];
  });
}

export async function fetchPresentShelfPlacementMovies(
  genreInput: string,
  years: string,
): Promise<FetchedMovie[]> {
  const genre = normalizeGenreKey(genreInput);
  const [startYear, endYear] = years.split("-");
  const genreId = GENRE_MAP[genreInput.toLowerCase()] ?? GENRE_MAP[genre];

  try {
    if (genre === "new") {
      const pages = await Promise.all([1, 2, 3].map((page) =>
        fetch(`/api/search?releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&ratingMin=5&page=${page}`).then((r) => r.json())
      ));
      const all = uniqueMovies(pages.flatMap((page) => page.results || []));
      return all.map((movie) => ({
        id: Number(movie.id || 0),
        title: String(movie.title || ""),
        year: typeof movie.year === "number" ? movie.year : null,
        posterUrl: String(movie.posterUrl || ""),
      }));
    }

    if (genre === "classics" || genreId === "classics") {
      const pages = await Promise.all([
        fetch(`/api/search?decade=1960&ratingMin=7&page=1`).then((r) => r.json()),
        fetch(`/api/search?decade=1950&ratingMin=7&page=1`).then((r) => r.json()),
        fetch(`/api/search?decade=1970&ratingMin=7&page=1`).then((r) => r.json()),
      ]);
      return uniqueMovies(pages.flatMap((page) => page.results || [])).map((movie) => ({
        id: Number(movie.id || 0),
        title: String(movie.title || ""),
        year: typeof movie.year === "number" ? movie.year : null,
        posterUrl: String(movie.posterUrl || ""),
      }));
    }

    if (!genreId) return [];

    const pages = await Promise.all([1, 2, 3].map((page) =>
      fetch(`/api/search?genreId=${genreId}&ratingMin=5&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=${page}`).then((r) => r.json())
    ));
    return uniqueMovies(pages.flatMap((page) => page.results || [])).map((movie) => ({
      id: Number(movie.id || 0),
      title: String(movie.title || ""),
      year: typeof movie.year === "number" ? movie.year : null,
      posterUrl: String(movie.posterUrl || ""),
    }));
  } catch {
    return [];
  }
}

export async function fetchAllPresentShelfSlots(
  years: string,
): Promise<StoreMovieSlot[]> {
  const cached = PRESENT_SLOT_CACHE.get(years);
  if (cached) return cached;

  const pending = (async () => {
    const requests = getPresentPlacementRequests();
    const genres = Array.from(new Set(requests.map((request) => normalizeGenreKey(request.genre))));
    const genrePools = new Map(
      await Promise.all(
        genres.map(async (genre) => [genre, await fetchPresentShelfPlacementMovies(genre, years)] as const)
      )
    );
    const usedMovieIds = new Set<number>();
    const slots: StoreMovieSlot[] = [];

    for (const request of requests) {
      const genre = normalizeGenreKey(request.genre);
      const pool = genrePools.get(genre) ?? [];
      const available =
        genre === "new"
          ? pool
          : pool.filter((movie) => !usedMovieIds.has(movie.id));
      const assigned = available.slice(0, request.count);

      assigned.forEach((movie, index) => {
        slots.push({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          genre: request.genre,
          slotKey: `${request.placementKey}:${index}`,
          shelfId: request.shelfId,
          placementKey: request.placementKey,
        });
        if (genre !== "new") {
          usedMovieIds.add(movie.id);
        }
      });
    }

    return slots;
  })();

  PRESENT_SLOT_CACHE.set(years, pending);
  return pending;
}

export async function fetchPresentShelfPlacementSlots(
  years: string,
  placementKey: string,
  count: number,
): Promise<StoreMovieSlot[]> {
  const slots = await fetchAllPresentShelfSlots(years);
  return slots
    .filter((slot) => slot.placementKey === placementKey)
    .sort((a, b) => a.slotKey.localeCompare(b.slotKey))
    .slice(0, count);
}
