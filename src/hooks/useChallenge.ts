"use client";

import { useState, useEffect, useCallback } from "react";
import { getShelfMovies } from "@/components/game3d/Store";
import { getPropsCount, PROPS, unlockProp, hasProp, type MovieProp, loadGameState, recordChallengeCompletion } from "@/lib/game-state";
import { type MovieClue, MOVIE_CLUES } from "@/lib/movie-clues";
import { playSFX, playRandomLine, playVinnyLine } from "@/lib/audio";

export type ChallengeMovie = { title: string; genre: string };
export type ChallengeType = "movie_night" | "speed_run" | "vinnys_mystery";

export interface ChallengeState {
  movies: ChallengeMovie[];
  startTime: number;
  hintsUsed: Set<number>;
  type: ChallengeType;
  timeLimit?: number;
}

export interface UseChallengeReturn {
  // Challenge state
  challenge: ChallengeState | null;
  setChallenge: React.Dispatch<React.SetStateAction<ChallengeState | null>>;
  challengeComplete: number | null;
  setChallengeComplete: React.Dispatch<React.SetStateAction<number | null>>;
  challengeTimer: number;

  // Props
  propsCount: { unlocked: number; total: number };
  setPropsCount: React.Dispatch<React.SetStateAction<{ unlocked: number; total: number }>>;
  rewardProp: MovieProp | null;
  setRewardProp: React.Dispatch<React.SetStateAction<MovieProp | null>>;

  // Vinny's Mystery
  mysteryClue: MovieClue | null;
  setMysteryClue: React.Dispatch<React.SetStateAction<MovieClue | null>>;
  mysteryHintsUsed: number;
  setMysteryHintsUsed: React.Dispatch<React.SetStateAction<number>>;
  mysteryWrongMsg: string | null;
  setMysteryWrongMsg: React.Dispatch<React.SetStateAction<string | null>>;

  // Actions
  startChallenge: (challengeType?: ChallengeType) => void;
  startMystery: () => void;
}

export function useChallenge(
  setHeldMovies: React.Dispatch<React.SetStateAction<{ id: number; title: string; posterUrl: string; genre: string; slotKey?: string }[]>>,
  setHeldSnacks: React.Dispatch<React.SetStateAction<{ name: string; emoji: string }[]>>,
): UseChallengeReturn {
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [challengeComplete, setChallengeComplete] = useState<number | null>(null);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [propsCount, setPropsCount] = useState({ unlocked: 0, total: 15 });
  const [rewardProp, setRewardProp] = useState<MovieProp | null>(null);

  // Vinny's Mystery state
  const [mysteryClue, setMysteryClue] = useState<MovieClue | null>(null);
  const [mysteryHintsUsed, setMysteryHintsUsed] = useState(0);
  const [mysteryWrongMsg, setMysteryWrongMsg] = useState<string | null>(null);

  // Load props count on mount
  useEffect(() => {
    setPropsCount(getPropsCount());
  }, []);

  // Update challenge timer every second + check speed run timeout
  useEffect(() => {
    if (!challenge) { setChallengeTimer(0); return; }
    const iv = setInterval(() => {
      const elapsed = Math.round((Date.now() - challenge.startTime) / 1000);
      setChallengeTimer(elapsed);
      // Speed run timeout
      if (challenge.timeLimit && elapsed >= challenge.timeLimit) {
        setChallenge(null);
        setHeldMovies([]);
        setChallengeComplete(-1); // -1 signals timeout/failure
        playSFX("challenge_fail");
        playRandomLine("challenge_fail");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [challenge, setHeldMovies]);

  // Start a challenge (movie_night or speed_run)
  const startChallenge = useCallback((challengeType: ChallengeType = "movie_night") => {
    if (challenge) return;
    const shelfMovies = getShelfMovies();
    if (shelfMovies.length < 3) return;
    const shuffled = [...shelfMovies].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const usedGenres = new Set<string>();
    const picks: ChallengeMovie[] = [];
    for (const m of shuffled) {
      if (picks.length >= 3) break;
      if (seen.has(m.title.toLowerCase()) || usedGenres.has(m.genre)) continue;
      seen.add(m.title.toLowerCase());
      usedGenres.add(m.genre);
      picks.push({ title: m.title, genre: m.genre });
    }
    for (const m of shuffled) {
      if (picks.length >= 3) break;
      if (seen.has(m.title.toLowerCase())) continue;
      seen.add(m.title.toLowerCase());
      picks.push({ title: m.title, genre: m.genre });
    }
    if (picks.length < 3) return;
    setHeldMovies([]);
    setHeldSnacks([]);
    playSFX("challenge_start");
    // Vinny actually NAMES the movies — much better than a generic "go go go!"
    // Subtitle fires from playVinnyLine, so player sees the list even if audio
    // is muted or still loading.
    const titles = picks.map(p => p.title);
    const list = titles.length === 3
      ? `${titles[0]}, ${titles[1]}, and ${titles[2]}`
      : titles.join(", ");
    const intro = challengeType === "speed_run"
      ? `60 seconds on the clock — find ${list}. Go!`
      : `Tonight's picks — see if you can grab ${list}.`;
    playVinnyLine(intro, "Vinny");
    setChallenge({
      movies: picks,
      startTime: Date.now(),
      hintsUsed: new Set(),
      type: challengeType,
      timeLimit: challengeType === "speed_run" ? 60 : undefined,
    });
  }, [challenge, setHeldMovies, setHeldSnacks]);

  // Start Vinny's Mystery
  const startMystery = useCallback(() => {
    const shelfMovies = getShelfMovies();
    const available = MOVIE_CLUES.filter(c =>
      shelfMovies.some(m => m.title.toLowerCase().includes(c.movieTitle.toLowerCase()))
    );
    if (available.length === 0) return;
    const clue = available[Math.floor(Math.random() * available.length)];
    setMysteryClue(clue);
    setMysteryHintsUsed(0);
    setMysteryWrongMsg(null);
    setHeldMovies([]);
    playSFX("challenge_start");
    // Vinny actually says the cryptic clue out loud (subtitle + voice).
    playVinnyLine(`Here's one for you: ${clue.clue} Bring me the movie when you've got it.`, "Vinny");
  }, [setHeldMovies]);

  return {
    challenge,
    setChallenge,
    challengeComplete,
    setChallengeComplete,
    challengeTimer,
    propsCount,
    setPropsCount,
    rewardProp,
    setRewardProp,
    mysteryClue,
    setMysteryClue,
    mysteryHintsUsed,
    setMysteryHintsUsed,
    mysteryWrongMsg,
    setMysteryWrongMsg,
    startChallenge,
    startMystery,
  };
}
