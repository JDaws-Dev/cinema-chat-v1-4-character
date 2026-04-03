"use client";

import { type Dispatch, type SetStateAction } from "react";
import { loadGameState } from "@/lib/game-state";
import { type ChallengeType } from "@/hooks/useChallenge";
import { type Overlay } from "@/hooks/useOverlay";

interface ChallengeSelectOverlayProps {
  startChallenge: (type: ChallengeType) => void;
  startMystery: () => void;
  setOverlay: Dispatch<SetStateAction<Overlay>>;
  closeOverlay: () => void;
}

export function ChallengeSelectOverlay({ startChallenge, startMystery, setOverlay, closeOverlay }: ChallengeSelectOverlayProps) {
  const gs = loadGameState();
  const movieNightCount = gs.challengeCompletions["movie_night"] || 0;
  const speedRunUnlocked = movieNightCount >= 3;
  const vinnyPickUnlocked = movieNightCount >= 5;

  return (
    <div className="g3-overlay g3-overlay-center">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">CHOOSE YOUR CHALLENGE</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
      </div>
      <div className="g3-overlay-body g3-challenge-select">
        {/* Movie Night — always unlocked */}
        <button className="g3-challenge-option" onClick={() => { startChallenge("movie_night"); setOverlay("none"); }}>
          <div className="g3-challenge-option-name">Movie Night</div>
          <div className="g3-challenge-option-desc">Find 3 movies from the shelves</div>
          <div className="g3-challenge-option-stats">Completed {movieNightCount} time{movieNightCount !== 1 ? "s" : ""}</div>
        </button>

        {/* Speed Run — unlocks after 3 Movie Night completions */}
        <button
          className={`g3-challenge-option ${!speedRunUnlocked ? "g3-challenge-option-locked" : ""}`}
          onClick={() => { if (speedRunUnlocked) { startChallenge("speed_run"); setOverlay("none"); } }}
          disabled={!speedRunUnlocked}
        >
          <div className="g3-challenge-option-name">Speed Run</div>
          <div className="g3-challenge-option-desc">Find 3 movies in under 60 seconds!</div>
          {speedRunUnlocked ? (
            <div className="g3-challenge-option-stats">Completed {gs.challengeCompletions["speed_run"] || 0} time{(gs.challengeCompletions["speed_run"] || 0) !== 1 ? "s" : ""}</div>
          ) : (
            <div className="g3-challenge-option-lock">Complete 3 Movie Nights to unlock</div>
          )}
        </button>

        {/* Vinny's Mystery — unlocks after 5 Movie Night completions */}
        <button
          className={`g3-challenge-option ${!vinnyPickUnlocked ? "g3-challenge-option-locked" : ""}`}
          onClick={() => { if (vinnyPickUnlocked) { startMystery(); setOverlay("none"); } }}
          disabled={!vinnyPickUnlocked}
        >
          <div className="g3-challenge-option-name">Vinny&apos;s Mystery</div>
          <div className="g3-challenge-option-desc">Vinny gives you a cryptic clue — find the movie on the shelves!</div>
          {vinnyPickUnlocked ? (
            <div className="g3-challenge-option-stats">Completed {gs.challengeCompletions["vinnys_mystery"] || 0} time{(gs.challengeCompletions["vinnys_mystery"] || 0) !== 1 ? "s" : ""}</div>
          ) : (
            <div className="g3-challenge-option-lock">Complete 5 Movie Nights to unlock</div>
          )}
        </button>
      </div>
    </div>
  );
}
