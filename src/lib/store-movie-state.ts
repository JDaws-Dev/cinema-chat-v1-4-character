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

export interface ReturnableMovieSlot {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  slotKey: string;
  displayIndex: number;
}

export interface SeededStoreMovieState {
  missingSlotKeys: string[];
  recentReturns: ReturnableMovieSlot[];
}

export interface SlotBackedMovie {
  slotKey?: string;
}

export interface ReturnableMovieLike extends SlotBackedMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
}

export interface StoreMovieSlotBuckets {
  heldSlotKeys: string[];
  recentReturnSlotKeys: string[];
  checkedOutSlotKeys: string[];
  unavailableSlotKeys: string[];
}

function seedStateFromSlots(
  slots: StoreMovieSlot[],
  seed: string,
  options?: {
    missingCount?: number;
    recentReturnCount?: number;
  }
): SeededStoreMovieState {
  const missingCount = options?.missingCount ?? 8;
  const recentReturnCount = options?.recentReturnCount ?? 4;
  const random = createSeededRandom(seed);
  const shuffled = [...slots].sort(() => random() - 0.5);
  const picked = shuffled.slice(0, missingCount);

  return {
    missingSlotKeys: picked.map((movie) => movie.slotKey),
    recentReturns: picked.slice(0, recentReturnCount).map((movie, index) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      genre: movie.genre,
      slotKey: movie.slotKey,
      displayIndex: index,
    })),
  };
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
  return seedStateFromSlots(getCanonicalShelfSlotsForEra(eraId), `${eraId}:${seed}`, options);
}

export function seedStoreMovieStateFromSlots(
  slots: StoreMovieSlot[],
  seed: string,
  options?: {
    missingCount?: number;
    recentReturnCount?: number;
  }
): SeededStoreMovieState {
  return seedStateFromSlots(slots, seed, options);
}

export function getMovieSlotKeys<T extends SlotBackedMovie>(movies: T[]): string[] {
  return movies.flatMap((movie) => (movie.slotKey ? [movie.slotKey] : []));
}

export function mergeRecentReturnMovies<T extends ReturnableMovieLike>(
  existing: ReturnableMovieSlot[],
  incoming: T[],
  limit = 8,
): ReturnableMovieSlot[] {
  const merged = [...existing];
  const seen = new Set<string>();
  const usedDisplayIndexes = new Set<number>(existing.map((movie) => movie.displayIndex));

  for (const movie of existing) {
    seen.add(movie.slotKey);
  }

  for (const movie of incoming) {
    if (!movie.slotKey || seen.has(movie.slotKey)) continue;
    let displayIndex = 0;
    while (usedDisplayIndexes.has(displayIndex)) displayIndex++;
    usedDisplayIndexes.add(displayIndex);
    seen.add(movie.slotKey);
    merged.push({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      genre: movie.genre,
      slotKey: movie.slotKey,
      displayIndex,
    });
    if (merged.length >= limit) break;
  }

  merged.sort((a, b) => a.displayIndex - b.displayIndex);
  return merged;
}

export function removeRecentReturnMovie<T extends SlotBackedMovie>(
  existing: T[],
  slotKey?: string,
): T[] {
  if (!slotKey) return existing;
  return existing.filter((movie) => movie.slotKey !== slotKey);
}

export function getStoreMovieSlotBuckets<T extends SlotBackedMovie>(
  state: SeededStoreMovieState,
  heldMovies: T[],
): StoreMovieSlotBuckets {
  const heldSlotKeys = getMovieSlotKeys(heldMovies);
  const recentReturnSlotKeys = getMovieSlotKeys(state.recentReturns);
  const checkedOutSlotKeys = [...state.missingSlotKeys];

  return {
    heldSlotKeys,
    recentReturnSlotKeys,
    checkedOutSlotKeys,
    unavailableSlotKeys: Array.from(new Set([...checkedOutSlotKeys, ...heldSlotKeys])),
  };
}

export function putBackHeldMovies<T extends ReturnableMovieLike>(
  state: SeededStoreMovieState,
  heldMovies: T[],
  limit = 8,
): SeededStoreMovieState {
  const checkedOut = new Set(state.missingSlotKeys);
  const returningToRecent = heldMovies.filter(
    (movie): movie is T & { slotKey: string } => Boolean(movie.slotKey && checkedOut.has(movie.slotKey))
  );

  if (returningToRecent.length === 0) return state;

  return {
    ...state,
    recentReturns: mergeRecentReturnMovies(state.recentReturns, returningToRecent, limit),
  };
}

export function returnHeldMovies<T extends ReturnableMovieLike>(
  state: SeededStoreMovieState,
  heldMovies: T[],
  limit = 8,
): SeededStoreMovieState {
  const slotMovies = heldMovies.filter(
    (movie): movie is T & { slotKey: string } => Boolean(movie.slotKey)
  );

  if (slotMovies.length === 0) return state;

  return {
    missingSlotKeys: Array.from(new Set([...state.missingSlotKeys, ...slotMovies.map((movie) => movie.slotKey)])),
    recentReturns: mergeRecentReturnMovies(state.recentReturns, slotMovies, limit),
  };
}

export function checkoutHeldMovies<T extends SlotBackedMovie>(
  state: SeededStoreMovieState,
  heldMovies: T[],
): SeededStoreMovieState {
  const slotKeys = getMovieSlotKeys(heldMovies);
  if (slotKeys.length === 0) return state;

  return {
    missingSlotKeys: Array.from(new Set([...state.missingSlotKeys, ...slotKeys])),
    recentReturns: state.recentReturns.filter((movie) => !slotKeys.includes(movie.slotKey)),
  };
}
