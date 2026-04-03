"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SearchResult } from "@/lib/types";
import type { Overlay } from "@/hooks/useOverlay";

export interface PuzzleData {
  clues: string[];
  movieId: number;
  backdrop: string | null;
  poster: string | null;
  answer: Record<string, unknown>;
}

const STATS_KEY = "vnv_stats";
function loadStats(): Record<string, number> { try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; } }
function saveStats(s: Record<string, number>) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

export interface UsePuzzleReturn {
  puzzle: PuzzleData | null;
  setPuzzle: React.Dispatch<React.SetStateAction<PuzzleData | null>>;
  puzzleClue: number;
  setPuzzleClue: React.Dispatch<React.SetStateAction<number>>;
  puzzleGuess: string;
  puzzleResults: SearchResult[];
  puzzleWon: boolean | null;
  puzzleBackdropReady: boolean;
  puzzleBlur: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  stats: Record<string, number>;
  setStats: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  startPuzzle: () => Promise<void>;
  handlePuzzleSearch: (q: string) => void;
  submitPuzzleGuess: (title: string, id: number) => void;
  skipPuzzleClue: () => void;
}

export function usePuzzle(setOverlay: (o: Overlay) => void): UsePuzzleReturn {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [puzzleClue, setPuzzleClue] = useState(0);
  const [puzzleGuess, setPuzzleGuess] = useState("");
  const [puzzleResults, setPuzzleResults] = useState<SearchResult[]>([]);
  const [puzzleWon, setPuzzleWon] = useState<boolean | null>(null);
  const [puzzleBackdropReady, setPuzzleBackdropReady] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<Record<string, number>>({});

  // Load stats from localStorage on mount
  useEffect(() => { setStats(loadStats()); }, []);

  const startPuzzle = useCallback(async () => {
    setOverlay("pick");
    setPuzzleClue(0); setPuzzleGuess(""); setPuzzleResults([]); setPuzzleWon(null); setPuzzleBackdropReady(false);
    try {
      const res = await fetch("/api/puzzle?mode=random");
      const data = await res.json();
      if (data.puzzle) {
        setPuzzle(data.puzzle);
        if (data.puzzle.backdrop) {
          const img = new Image();
          img.onload = () => setPuzzleBackdropReady(true);
          img.onerror = () => setPuzzleBackdropReady(true);
          img.src = data.puzzle.backdrop;
        } else setPuzzleBackdropReady(true);
        setTimeout(() => inputRef.current?.focus(), 500);
      }
    } catch { setOverlay("none"); }
  }, [setOverlay]);

  const handlePuzzleSearch = useCallback((q: string) => {
    setPuzzleGuess(q);
    clearTimeout(searchTimer.current);
    if (q.length < 2) { setPuzzleResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        setPuzzleResults((data.results || []).slice(0, 5).map((r: Record<string, unknown>) => ({
          id: r.id as number, title: r.title as string, year: r.year as number | null, posterUrl: r.posterUrl as string | null, overview: "", voteAverage: 0, genre: "",
        })));
      } catch {}
    }, 300);
  }, []);

  const submitPuzzleGuess = useCallback((title: string, id: number) => {
    if (!puzzle) return;
    setPuzzleGuess(""); setPuzzleResults([]);
    if (id === puzzle.movieId) {
      setPuzzleWon(true);
      const s = loadStats(); s.played = (s.played || 0) + 1; s.won = (s.won || 0) + 1; saveStats(s); setStats(s);
    } else {
      if (puzzleClue < 4) setPuzzleClue(c => c + 1);
      else { setPuzzleWon(false); const s = loadStats(); s.played = (s.played || 0) + 1; saveStats(s); setStats(s); }
    }
  }, [puzzle, puzzleClue]);

  const skipPuzzleClue = useCallback(() => {
    if (puzzleClue < 4) setPuzzleClue(c => c + 1);
    else { setPuzzleWon(false); const s = loadStats(); s.played = (s.played || 0) + 1; saveStats(s); setStats(s); }
  }, [puzzleClue]);

  const puzzleBlur = puzzleWon !== null ? 0 : [40, 28, 16, 6, 0][puzzleClue];

  return {
    puzzle, setPuzzle,
    puzzleClue, setPuzzleClue,
    puzzleGuess,
    puzzleResults,
    puzzleWon,
    puzzleBackdropReady,
    puzzleBlur,
    inputRef,
    stats, setStats,
    startPuzzle,
    handlePuzzleSearch,
    submitPuzzleGuess,
    skipPuzzleClue,
  };
}
