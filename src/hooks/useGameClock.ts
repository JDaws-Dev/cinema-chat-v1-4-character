"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────
const OPEN_TIME = 19.5;   // 7:30 PM
const CLOSE_TIME = 23;    // 11:00 PM
// 3.5 game-hours elapse every 15 real minutes (1 tick/sec)
const TICK_INCREMENT = 3.5 / (15 * 60);

const ANNOUNCEMENTS: { threshold: number; key: string; line: string }[] = [
  { threshold: 21,    key: "9pm",    line: "We close in two hours, folks! Make your selections!" },
  { threshold: 22,    key: "10pm",   line: "One hour to close! If you haven't picked a movie yet, now's the time!" },
  { threshold: 22.5,  key: "1030pm", line: "Half hour to close! Last call for rentals!" },
  { threshold: 22.75, key: "1045pm", line: "Fifteen minutes! I'm starting to shut down the registers!" },
];

// ── Pure helpers ─────────────────────────────────────────
export function formatGameTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Types ────────────────────────────────────────────────
export interface ClosingAnnouncement {
  key: string;
  line: string;
}

export interface UseGameClockOptions {
  /** Clock only ticks when the game is started and not loading */
  started: boolean;
  loading: boolean;
  /**
   * Called when Vinny should make a closing-time announcement.
   * `closed` is true when the store has fully closed (11 PM).
   */
  onClosingAnnouncement?: (announcement: ClosingAnnouncement, closed: boolean) => void;
  /** Current overlay state — announcements are suppressed when an overlay is active */
  overlay?: string;
}

export interface GameClockState {
  gameTime: number;
  formatGameTime: (hours: number) => string;
  isClosingSoon: boolean;
  /** Minutes remaining until the store closes (0 when closed) */
  minutesUntilClose: number;
  /** Human-readable countdown label */
  closeCountdownLabel: string;
  /** Max NPC count based on how close to closing */
  maxNpcs: number;
}

// ── Hook ─────────────────────────────────────────────────
export function useGameClock({
  started,
  loading,
  onClosingAnnouncement,
  overlay = "none",
}: UseGameClockOptions): GameClockState {
  const [gameTime, setGameTime] = useState(OPEN_TIME);
  const gameClockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingAnnouncedRef = useRef<Set<string>>(new Set());

  // Keep a ref to the callback so the effect doesn't re-run on every render
  const announcementCb = useRef(onClosingAnnouncement);
  useEffect(() => { announcementCb.current = onClosingAnnouncement; }, [onClosingAnnouncement]);

  // ── Tick the clock once per second ──────────────────────
  useEffect(() => {
    if (!started || loading) return;
    gameClockRef.current = setInterval(() => {
      setGameTime(prev => {
        const next = prev + TICK_INCREMENT;
        if (next >= CLOSE_TIME) return CLOSE_TIME;
        return next;
      });
    }, 1000);
    return () => { if (gameClockRef.current) clearInterval(gameClockRef.current); };
  }, [started, loading]);

  // ── Closing-time announcements ──────────────────────────
  useEffect(() => {
    if (gameTime >= CLOSE_TIME) {
      if (!closingAnnouncedRef.current.has("closed") && overlay === "none") {
        closingAnnouncedRef.current.add("closed");
        announcementCb.current?.({ key: "closed", line: "That's it, folks! We're closed! Time to check out!" }, true);
      }
      return;
    }
    for (const a of ANNOUNCEMENTS) {
      if (gameTime >= a.threshold && !closingAnnouncedRef.current.has(a.key)) {
        closingAnnouncedRef.current.add(a.key);
        announcementCb.current?.({ key: a.key, line: a.line }, false);
        break; // one announcement per tick
      }
    }
  }, [gameTime, overlay]);

  // ── Derived values ──────────────────────────────────────
  const minutesUntilClose = Math.max(0, Math.round((CLOSE_TIME - gameTime) * 60));
  const closeHours = Math.floor(minutesUntilClose / 60);
  const closeMinutes = minutesUntilClose % 60;
  const closeCountdownLabel = gameTime >= CLOSE_TIME
    ? "Closed for the night"
    : closeHours > 0
      ? `${closeHours}h ${closeMinutes.toString().padStart(2, "0")}m to close`
      : `${closeMinutes}m to close`;

  const isClosingSoon = gameTime >= 22;
  const maxNpcs = gameTime >= 22.75 ? 0 : gameTime >= 22.5 ? 2 : gameTime >= 22 ? 3 : 5;

  return {
    gameTime,
    formatGameTime,
    isClosingSoon,
    minutesUntilClose,
    closeCountdownLabel,
    maxNpcs,
  };
}
