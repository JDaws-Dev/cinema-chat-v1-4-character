"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getShelfMovies } from "@/components/game3d/store-materials";
import { playSFX, playVinnyLine } from "@/lib/audio";
import { addXP, recordChallengeCompletion } from "@/lib/game-state";
import { STORE_LAYOUT } from "@/lib/store-layout";
import { type HeldMovie } from "@/hooks/useInventory";

export interface ReturnShiftTape {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  genreKey: string;
  slotKey: string;
}

interface UseReturnShiftParams {
  heldMovies: HeldMovie[];
  setHeldMovies: Dispatch<SetStateAction<HeldMovie[]>>;
  addNotification: (text: string) => void;
  handleTierUp: (result: { tierUp: boolean; newTier: string } | null) => void;
  triggerXpPopup: (amount: number) => void;
}

interface ShelfMovie {
  id: number;
  title: string;
  genre: string;
  posterUrl: string;
}

const SHIFT_DURATION_SECONDS = 180;
const SHIFT_TAPE_COUNT = 5;

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function toGenreKey(genre: string): string {
  return genre.trim().toLowerCase().replace(/[- ]/g, "");
}

function getVisibleShelfGenres(): Map<string, string> {
  const visibleGenres = new Map<string, string>();

  for (const obj of STORE_LAYOUT.objects) {
    if (!obj.id.startsWith("shelf-row")) continue;

    const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
    const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;

    if (frontGenre) visibleGenres.set(toGenreKey(frontGenre), frontGenre);
    if (backGenre) visibleGenres.set(toGenreKey(backGenre), backGenre);
  }

  return visibleGenres;
}

function pickShiftTapes(shelfMovies: ShelfMovie[]): ReturnShiftTape[] {
  const visibleGenres = getVisibleShelfGenres();
  const moviesByGenre = new Map<string, ShelfMovie[]>();

  for (const movie of shelfMovies) {
    const genreKey = toGenreKey(movie.genre);
    const existing = moviesByGenre.get(genreKey) ?? [];
    existing.push(movie);
    moviesByGenre.set(genreKey, existing);
  }

  const preferredGenres = shuffle(
    Array.from(visibleGenres.keys()).filter((genreKey) => (moviesByGenre.get(genreKey)?.length ?? 0) > 0),
  );
  const fallbackGenres = shuffle(
    Array.from(moviesByGenre.keys()).filter((genreKey) => !visibleGenres.has(genreKey)),
  );
  const pickedGenres = [...preferredGenres, ...fallbackGenres].slice(0, SHIFT_TAPE_COUNT);

  return pickedGenres.flatMap((genreKey) => {
    const options = shuffle(moviesByGenre.get(genreKey) ?? []);
    const movie = options[0];
    if (!movie) return [];

    return [{
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      genre: visibleGenres.get(genreKey) ?? movie.genre.toUpperCase(),
      genreKey,
      slotKey: `return-shift:${movie.id}`,
    }];
  });
}

export function useReturnShift({
  heldMovies,
  setHeldMovies,
  addNotification,
  handleTierUp,
  triggerXpPopup,
}: UseReturnShiftParams) {
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftTimer, setShiftTimer] = useState(SHIFT_DURATION_SECONDS);
  const [shiftTapes, setShiftTapes] = useState<ReturnShiftTape[]>([]);
  const deadlineRef = useRef<number | null>(null);
  const finishingRef = useRef(false);

  const returnedCount = useMemo(() => {
    if (shiftTapes.length === 0) return 0;
    const heldIds = new Set(heldMovies.map((movie) => movie.id));
    return shiftTapes.filter((tape) => !heldIds.has(tape.id)).length;
  }, [heldMovies, shiftTapes]);

  const resetShiftState = useCallback(() => {
    setShiftActive(false);
    setShiftTimer(SHIFT_DURATION_SECONDS);
    setShiftTapes([]);
    deadlineRef.current = null;
  }, []);

  const finishShift = useCallback((success: boolean) => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    const timeLeft = deadlineRef.current
      ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      : shiftTimer;

    if (success) {
      const xp = 50 + (timeLeft * 2);
      const result = addXP(xp);
      handleTierUp(result.tierUp ? { tierUp: true, newTier: result.newTier } : null);
      triggerXpPopup(xp);
      recordChallengeCompletion("return_shift", SHIFT_DURATION_SECONDS - timeLeft);
      playVinnyLine("Nice work. You earned your tip.", "Vinny");
      playSFX("challenge_complete");
      addNotification(`🎬 Return shift complete! +${xp} XP`);
    } else {
      playVinnyLine("Aw man, you didn't make it. Drop those tapes on the counter; we'll get to 'em tomorrow.", "Vinny");
      playSFX("challenge_fail");
      setHeldMovies([]);
      addNotification("Return shift failed.");
    }

    resetShiftState();
  }, [addNotification, handleTierUp, resetShiftState, setHeldMovies, shiftTimer, triggerXpPopup]);

  useEffect(() => {
    if (!shiftActive) return;

    const tick = () => {
      const remaining = deadlineRef.current
        ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
        : 0;

      setShiftTimer(remaining);
      if (remaining <= 0) {
        finishShift(false);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [finishShift, shiftActive]);

  useEffect(() => {
    if (!shiftActive || shiftTapes.length === 0) return;
    if (returnedCount >= shiftTapes.length) {
      const timeoutId = window.setTimeout(() => finishShift(true), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [finishShift, returnedCount, shiftActive, shiftTapes.length]);

  const startShift = useCallback(() => {
    if (shiftActive || heldMovies.length > 0) return false;

    const picks = pickShiftTapes(getShelfMovies());
    if (picks.length < SHIFT_TAPE_COUNT) {
      addNotification("Vinny's return bin is empty right now.");
      return false;
    }

    finishingRef.current = false;
    deadlineRef.current = Date.now() + (SHIFT_DURATION_SECONDS * 1000);
    setShiftTapes(picks);
    setShiftTimer(SHIFT_DURATION_SECONDS);
    setShiftActive(true);
    setHeldMovies(picks.map((tape) => ({
      id: tape.id,
      title: tape.title,
      posterUrl: tape.posterUrl,
      genre: tape.genreKey,
      slotKey: tape.slotKey,
    })));
    playSFX("challenge_start");
    playVinnyLine("Here's tonight's returns — 5 tapes, 3 minutes on the clock. Get 'em back where they belong.", "Vinny");
    return true;
  }, [addNotification, heldMovies.length, setHeldMovies, shiftActive]);

  const cancelShift = useCallback(() => {
    if (!shiftActive) return;
    finishingRef.current = false;
    setHeldMovies([]);
    resetShiftState();
  }, [resetShiftState, setHeldMovies, shiftActive]);

  return {
    shiftActive,
    shiftTimer,
    shiftTapes,
    returnedCount,
    startShift,
    cancelShift,
  };
}
