"use client";

import { type HeldMovie } from "@/hooks/useInventory";
import { type ReturnShiftTape } from "@/hooks/useReturnShift";

interface ReturnShiftHUDProps {
  hasOverlay: boolean;
  shiftActive: boolean;
  shiftTimer: number;
  shiftTapes: ReturnShiftTape[];
  heldMovies: HeldMovie[];
  returnedCount: number;
}

function formatShiftTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ReturnShiftHUD({
  hasOverlay,
  shiftActive,
  shiftTimer,
  shiftTapes,
  heldMovies,
  returnedCount,
}: ReturnShiftHUDProps) {
  if (!shiftActive || hasOverlay) return null;

  const heldIds = new Set(heldMovies.map((movie) => movie.id));

  return (
    <div className="g3-challenge-list g3-return-shift-list">
      <div className="g3-challenge-header">RETURN SHIFT</div>
      <div className="g3-return-shift-progress">
        <span>{returnedCount} / {shiftTapes.length} returned</span>
        <span
          className="g3-challenge-timer"
          style={shiftTimer <= 30 ? { color: "#ef4444" } : undefined}
        >
          {formatShiftTimer(shiftTimer)} left
        </span>
      </div>

      {shiftTapes.map((tape) => {
        const returned = !heldIds.has(tape.id);

        return (
          <div
            key={tape.slotKey}
            className={`g3-challenge-item g3-return-shift-item ${returned ? "g3-challenge-found" : ""}`}
          >
            <span>{returned ? "\u2713" : "\u25CB"} {tape.title}</span>
            <span className="g3-return-shift-genre">{tape.genre}</span>
          </div>
        );
      })}
    </div>
  );
}
