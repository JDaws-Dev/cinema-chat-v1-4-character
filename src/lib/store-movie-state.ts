import { getCatalogMovieById, getCuratedShelfPosterData, type EraId } from "./curated-movie-catalog";
import { STORE_LAYOUT } from "./store-layout";

export interface StoreMovieSlot {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string;
  genre: string;
  slotKey: string;
  shelfId: string;
  placementKey: string;
}

export interface SeededStoreMovieState {
  missingSlotKeys: string[];
  recentReturns: StoreMovieSlot[];
}

function createSeededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getCanonicalShelfSlotsForEra(eraId: EraId): StoreMovieSlot[] {
  return STORE_LAYOUT.objects.flatMap((obj) => {
    if (obj.prefab !== "shelf/gondola") return [];

    const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
    const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;

    const frontMovies = frontGenre
      ? getCuratedShelfPosterData(frontGenre, eraId, `${obj.id}:front`, 18).map((movie, index) => ({
          id: movie.id,
          title: movie.title,
          year: getCatalogMovieById(movie.id)?.year ?? null,
          posterUrl: movie.url,
          genre: frontGenre,
          slotKey: `${obj.id}:front:${index}`,
          shelfId: obj.id,
          placementKey: `${obj.id}:front`,
        }))
      : [];

    const backMovies = backGenre
      ? getCuratedShelfPosterData(backGenre, eraId, `${obj.id}:back`, 18).map((movie, index) => ({
          id: movie.id,
          title: movie.title,
          year: getCatalogMovieById(movie.id)?.year ?? null,
          posterUrl: movie.url,
          genre: backGenre,
          slotKey: `${obj.id}:back:${index}`,
          shelfId: obj.id,
          placementKey: `${obj.id}:back`,
        }))
      : [];

    return [...frontMovies, ...backMovies];
  }).filter((movie) => Boolean(movie.posterUrl));
}

export function getShelfPlacementSlotsForEra(
  eraId: EraId,
  genre: string,
  placementKey: string,
  count: number,
): StoreMovieSlot[] {
  return getCuratedShelfPosterData(genre, eraId, placementKey, count).map((movie, index) => {
    const catalogMovie = getCatalogMovieById(movie.id);
    const shelfId = placementKey.split(":")[0] || placementKey;
    return {
      id: movie.id,
      title: movie.title,
      year: catalogMovie?.year ?? null,
      posterUrl: movie.url,
      genre,
      slotKey: `${placementKey}:${index}`,
      shelfId,
      placementKey,
    };
  });
}

export function seedStoreMovieState(
  eraId: EraId,
  seed: string,
  options?: {
    missingCount?: number;
    recentReturnCount?: number;
  }
): SeededStoreMovieState {
  const missingCount = options?.missingCount ?? 8;
  const recentReturnCount = options?.recentReturnCount ?? 4;
  const random = createSeededRandom(`${eraId}:${seed}`);
  const shuffled = [...getCanonicalShelfSlotsForEra(eraId)].sort(() => random() - 0.5);
  const picked = shuffled.slice(0, missingCount);

  return {
    missingSlotKeys: picked.map((movie) => movie.slotKey),
    recentReturns: picked.slice(0, recentReturnCount),
  };
}
