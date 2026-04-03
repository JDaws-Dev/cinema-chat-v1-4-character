"use client";

import { type Dispatch, type SetStateAction } from "react";
import { type HeldMovie } from "@/hooks/useInventory";
import { type ChallengeState } from "@/hooks/useChallenge";

interface MysteryClue {
  clue: string;
  hints: string[];
  movieTitle: string;
}

interface ChallengeHUDProps {
  hasOverlay: boolean;
  challenge: ChallengeState | null;
  challengeTimer: number;
  heldMovies: HeldMovie[];
  setChallenge: Dispatch<SetStateAction<ChallengeState | null>>;
  mysteryClue: MysteryClue | null;
  mysteryHintsUsed: number;
  setMysteryHintsUsed: Dispatch<SetStateAction<number>>;
  mysteryWrongMsg: string | null;
  challengeComplete: number | null;
  setChallengeComplete: (v: number | null) => void;
}

export function ChallengeHUD({
  hasOverlay, challenge, challengeTimer, heldMovies, setChallenge,
  mysteryClue, mysteryHintsUsed, setMysteryHintsUsed, mysteryWrongMsg,
  challengeComplete, setChallengeComplete,
}: ChallengeHUDProps) {
  return (
    <>
      {/* Movie Night Challenge — shopping list HUD */}
      {challenge && !hasOverlay && (
        <div className="g3-challenge-list">
          <div className="g3-challenge-header">MOVIE NIGHT LIST</div>
          {challenge.movies.map((cm, i) => {
            const found = heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase());
            const hintShown = challenge.hintsUsed.has(i);
            return (
              <div key={i} className={`g3-challenge-item ${found ? "g3-challenge-found" : ""}`}>
                <span>{found ? "\u2713" : "\u25CB"} {cm.title}</span>
                {!found && hintShown && (
                  <span className="g3-challenge-hint">Look in: {cm.genre}</span>
                )}
                {!found && !hintShown && (
                  <button className="g3-challenge-hint-btn" onClick={() => {
                    setChallenge(prev => {
                      if (!prev) return prev;
                      const hints = new Set(prev.hintsUsed);
                      hints.add(i);
                      return { ...prev, hintsUsed: hints };
                    });
                  }}>?</button>
                )}
              </div>
            );
          })}
          <div className="g3-challenge-timer" style={challenge.timeLimit && challengeTimer > (challenge.timeLimit - 15) ? { color: "#ef4444" } : undefined}>
            {challenge.timeLimit ? `${Math.max(0, challenge.timeLimit - challengeTimer)}s left` : `${challengeTimer}s`}
          </div>
        </div>
      )}

      {/* Vinny's Mystery HUD */}
      {mysteryClue && !hasOverlay && (
        <div className="g3-challenge-list">
          <div className="g3-challenge-header">VINNY&apos;S MYSTERY</div>
          <div className="g3-mystery-clue">&ldquo;{mysteryClue.clue}&rdquo;</div>
          {mysteryClue.hints.slice(0, mysteryHintsUsed).map((hint, i) => (
            <div key={i} className="g3-challenge-hint">{hint}</div>
          ))}
          {mysteryHintsUsed < mysteryClue.hints.length && (
            <button className="g3-challenge-hint-btn" style={{ marginTop: 6, width: "auto", borderRadius: 4, padding: "3px 10px" }} onClick={() => setMysteryHintsUsed(h => h + 1)}>
              ? Hint ({mysteryHintsUsed}/{mysteryClue.hints.length})
            </button>
          )}
          {mysteryWrongMsg && (
            <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 8, fontWeight: 600 }}>{mysteryWrongMsg}</div>
          )}
        </div>
      )}

      {/* Challenge complete overlay */}
      {challengeComplete !== null && (
        <div className="g3-challenge-complete" onClick={() => setChallengeComplete(null)}>
          <div className="g3-challenge-complete-card">
            <div className="g3-challenge-complete-icon">{challengeComplete === -1 ? "\u23F0" : challengeComplete === 0 ? "\uD83D\uDD0D" : "\uD83C\uDFAC"}</div>
            <div className="g3-challenge-complete-title">{challengeComplete === -1 ? "TIME'S UP!" : challengeComplete === 0 ? "MYSTERY SOLVED!" : "MOVIE NIGHT READY!"}</div>
            <div className="g3-challenge-complete-time">{challengeComplete === -1 ? "Better luck next time!" : challengeComplete === 0 ? "Vinny's impressed \u2014 you nailed it!" : `Found all movies in ${challengeComplete}s`}</div>
            <button className="g3-splash-btn" onClick={() => setChallengeComplete(null)} style={{ marginTop: 12, padding: "12px 24px", fontSize: "0.9rem" }}>
              {challengeComplete === -1 ? "TRY AGAIN" : "NICE!"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
