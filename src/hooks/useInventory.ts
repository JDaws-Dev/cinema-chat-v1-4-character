"use client";

import { useState, useCallback, useEffect } from "react";
import { getCuratedShelfPosterData, getEraIdFromYears } from "@/lib/curated-movie-catalog";
import { STORE_LAYOUT } from "@/lib/store-layout";

export type HeldMovie = { id: number; title: string; posterUrl: string; genre: string; slotKey?: string };
export type HeldSnack = { name: string; emoji: string };

export function useInventory({ eraYears }: { eraYears: string }) {
  const [heldMovies, setHeldMovies] = useState<HeldMovie[]>([]);
  const [pendingPickup, setPendingPickup] = useState<{ id: number; title: string; posterUrl: string; slotKey?: string } | null>(null);
  const [spawnedMissingSlotKeys, setSpawnedMissingSlotKeys] = useState<string[]>([]);
  const [recentReturns, setRecentReturns] = useState<HeldMovie[]>([]);
  const [heldSnacks, setHeldSnacks] = useState<HeldSnack[]>([]);
  const [pickupFlash, setPickupFlash] = useState(false);
  const [pickupTitle, setPickupTitle] = useState<string | null>(null);

  const removeHeldMovie = useCallback((movieId: number) => {
    setHeldMovies((prev) => {
      const removeIndex = prev.findIndex((movie) => movie.id === movieId);
      if (removeIndex === -1) return prev;
      const [removed] = prev.slice(removeIndex, removeIndex + 1);
      if (removed?.slotKey && spawnedMissingSlotKeys.includes(removed.slotKey)) {
        setRecentReturns((existing) => existing.some((movie) => movie.slotKey === removed.slotKey) ? existing : [removed, ...existing].slice(0, 8));
      }
      return prev.filter((_, index) => index !== removeIndex);
    });
  }, [spawnedMissingSlotKeys]);

  // Spawn missing slot keys from gondola shelves for the selected era
  useEffect(() => {
    const eraId = getEraIdFromYears(eraYears);
    const gondolaCandidates = STORE_LAYOUT.objects.flatMap((obj) => {
      if (obj.prefab !== "shelf/gondola") return [];
      const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
      const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;
      const frontMovies = frontGenre
        ? getCuratedShelfPosterData(frontGenre, eraId, `${obj.id}:front`, 18).map((movie, index) => ({
            id: movie.id,
            title: movie.title,
            posterUrl: movie.url,
            genre: frontGenre,
            slotKey: `${obj.id}:front:${index}`,
          }))
        : [];
      const backMovies = backGenre
        ? getCuratedShelfPosterData(backGenre, eraId, `${obj.id}:back`, 18).map((movie, index) => ({
            id: movie.id,
            title: movie.title,
            posterUrl: movie.url,
            genre: backGenre,
            slotKey: `${obj.id}:back:${index}`,
          }))
        : [];
      return [...frontMovies, ...backMovies];
    }).filter((movie) => movie.posterUrl);

    const shuffled = [...gondolaCandidates].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 8);
    setSpawnedMissingSlotKeys(picked.flatMap((movie) => movie.slotKey ? [movie.slotKey] : []));
    setRecentReturns(picked.slice(0, 4));
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
