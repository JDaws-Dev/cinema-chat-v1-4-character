"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getCuratedShelfPosterData, getEraIdFromYears } from "@/lib/curated-movie-catalog";
import { STORE_LAYOUT } from "@/lib/store-layout";
import {
  useVHSState,
  pickUpTape as vhsPickUp,
  dropTape as vhsDrop,
  type VHSStateSnapshot,
} from "@/lib/vhs-state";

export type HeldMovie = { id: number; title: string; posterUrl: string; genre: string; slotKey?: string };
export type HeldSnack = { name: string; emoji: string };

/**
 * Derive the HeldMovie[] array from VHS state so the rest of the app
 * sees the same shape it always has.
 */
function heldMoviesFromVHS(state: VHSStateSnapshot): HeldMovie[] {
  return Object.values(state.tapes)
    .filter((t) => t.status === "held")
    .map((t) => ({
      id: t.id,
      title: t.title,
      posterUrl: t.posterUrl,
      genre: t.genre,
      slotKey: t.slotKey,
    }));
}

export function useInventory({ eraYears }: { eraYears: string }) {
  const vhs = useVHSState();

  // Derive heldMovies from VHS state — this is the canonical source now
  const heldMovies = heldMoviesFromVHS(vhs.state);

  const [pendingPickup, setPendingPickup] = useState<{ id: number; title: string; posterUrl: string; slotKey?: string } | null>(null);
  const [spawnedMissingSlotKeys, setSpawnedMissingSlotKeys] = useState<string[]>([]);
  const [recentReturns, setRecentReturns] = useState<HeldMovie[]>([]);
  const [heldSnacks, setHeldSnacks] = useState<HeldSnack[]>([]);
  const [pickupFlash, setPickupFlash] = useState(false);
  const [pickupTitle, setPickupTitle] = useState<string | null>(null);

  // Keep a ref to spawnedMissingSlotKeys so removeHeldMovie closure is current
  const spawnedRef = useRef(spawnedMissingSlotKeys);
  spawnedRef.current = spawnedMissingSlotKeys;

  /**
   * setHeldMovies — compatibility shim that accepts the same
   * React.Dispatch<SetStateAction<HeldMovie[]>> signature page.tsx and
   * useChallenge already use.
   *
   * Functional updaters receive the current held list; the result is
   * diffed against VHS state to issue pickUp / drop calls.
   */
  const setHeldMovies: React.Dispatch<React.SetStateAction<HeldMovie[]>> = useCallback(
    (action) => {
      const current = heldMoviesFromVHS(vhs.state);
      const next = typeof action === "function" ? action(current) : action;

      // Movies in current but not in next → drop them
      for (const movie of current) {
        if (!next.some((m) => m.id === movie.id)) {
          if (movie.slotKey) {
            vhs.dropTape(movie.slotKey);
          }
        }
      }

      // Movies in next but not in current → pick them up
      for (const movie of next) {
        if (!current.some((m) => m.id === movie.id)) {
          // We need a slotKey. If the movie has one, use it; otherwise
          // generate a synthetic key so vhs-state can track it.
          const slotKey = movie.slotKey || `pickup:${movie.id}`;
          vhs.pickUpTape(slotKey, {
            id: movie.id,
            title: movie.title,
            posterUrl: movie.posterUrl,
            genre: movie.genre,
          });
        }
      }
    },
    [vhs.state, vhs.dropTape, vhs.pickUpTape],
  );

  const removeHeldMovie = useCallback(
    (movieId: number) => {
      const current = heldMoviesFromVHS(vhs.state);
      const movie = current.find((m) => m.id === movieId);
      if (!movie) return;

      // Track recently returned movies for the shelf "checked out" cards
      if (movie.slotKey && spawnedRef.current.includes(movie.slotKey)) {
        setRecentReturns((existing) =>
          existing.some((m) => m.slotKey === movie.slotKey)
            ? existing
            : [movie, ...existing].slice(0, 8),
        );
      }

      if (movie.slotKey) {
        vhs.dropTape(movie.slotKey);
      }
    },
    [vhs.state, vhs.dropTape],
  );

  // Spawn missing slot keys from gondola shelves for the selected era
  useEffect(() => {
    let cancelled = false;
    const eraId = getEraIdFromYears(eraYears);

    async function loadGondolaCandidates() {
      const gondolaCandidates: Array<{ id: number; title: string; posterUrl: string; genre: string; slotKey: string }> = [];

      for (const obj of STORE_LAYOUT.objects) {
        if (obj.prefab !== "shelf/gondola") continue;
        const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
        const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;
        if (frontGenre) {
          const posters = await getCuratedShelfPosterData(frontGenre, eraId, `${obj.id}:front`, 18);
          for (let index = 0; index < posters.length; index++) {
            const movie = posters[index];
            gondolaCandidates.push({
              id: movie.id,
              title: movie.title,
              posterUrl: movie.url,
              genre: frontGenre,
              slotKey: `${obj.id}:front:${index}`,
            });
          }
        }
        if (backGenre) {
          const posters = await getCuratedShelfPosterData(backGenre, eraId, `${obj.id}:back`, 18);
          for (let index = 0; index < posters.length; index++) {
            const movie = posters[index];
            gondolaCandidates.push({
              id: movie.id,
              title: movie.title,
              posterUrl: movie.url,
              genre: backGenre,
              slotKey: `${obj.id}:back:${index}`,
            });
          }
        }
      }

      if (cancelled) return;

      const filtered = gondolaCandidates.filter((movie) => movie.posterUrl);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 8);
      setSpawnedMissingSlotKeys(picked.flatMap((movie) => movie.slotKey ? [movie.slotKey] : []));
      setRecentReturns(picked.slice(0, 4));
    }

    loadGondolaCandidates();
    return () => { cancelled = true; };
  }, [eraYears]);

  return {
    heldMovies,
    setHeldMovies,
    heldSnacks,
    setHeldSnacks,
    pendingPickup,
    setPendingPickup,
    spawnedMissingSlotKeys,
    recentReturns,
    setRecentReturns,
    pickupFlash,
    setPickupFlash,
    pickupTitle,
    setPickupTitle,
    removeHeldMovie,
  };
}
