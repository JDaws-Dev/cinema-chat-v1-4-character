"use client";

import type { PuzzleData } from "@/hooks/usePuzzle";
import type { SearchResult } from "@/lib/types";

interface PuzzleOverlayProps {
  puzzle: PuzzleData;
  puzzleClue: number;
  puzzleGuess: string;
  puzzleResults: SearchResult[];
  puzzleWon: boolean | null;
  puzzleBackdropReady: boolean;
  puzzleBlur: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startPuzzle: () => Promise<void>;
  handlePuzzleSearch: (q: string) => void;
  submitPuzzleGuess: (title: string, id: number) => void;
  skipPuzzleClue: () => void;
  closeOverlay: () => void;
}

export function PuzzleOverlay({
  puzzle, puzzleClue, puzzleGuess, puzzleResults, puzzleWon,
  puzzleBackdropReady, puzzleBlur, inputRef,
  startPuzzle, handlePuzzleSearch, submitPuzzleGuess, skipPuzzleClue, closeOverlay,
}: PuzzleOverlayProps) {
  return (
    <div className="g3-puzzle-overlay">
      {puzzle.backdrop && puzzleBackdropReady && (
        <div className="vf-backdrop" style={{ backgroundImage: `url(${puzzle.backdrop})`, filter: `blur(${puzzleBlur}px) brightness(0.6)` }} />
      )}
      <div className="vf-scrim" />
      <div className="g3-puzzle-content">
        <div className="g3-puzzle-top">
          <button className="vf-back" onClick={closeOverlay}>{"\u2715"} Close</button>
          <div className="vf-star-track">
            {[5,4,3,2,1].map(s => <span key={s} className={`vf-star ${puzzleWon === null && s <= 5 - puzzleClue ? "vf-star-lit" : ""} ${puzzleWon && s <= 5 - puzzleClue ? "vf-star-won" : ""}`}>{"\u2605"}</span>)}
          </div>
          <span className="vf-clue-num">{puzzleWon === null ? `${puzzleClue + 1}/5` : ""}</span>
        </div>

        {puzzleWon === null ? (
          <>
            <div className="vf-clue-stack">
              <div className="vf-clue-item vf-clue-vinny">
                <div className="vf-v-badge">V</div>
                <p className="vf-clue-poetic">&ldquo;{puzzle.clues[0]}&rdquo;</p>
              </div>
              {puzzleClue >= 1 && <div className="vf-clue-item vf-clue-fact-item"><span className="vf-clue-tag">GENRE</span><span className="vf-clue-val">{puzzle.clues[1]}</span></div>}
              {puzzleClue >= 2 && <div className="vf-clue-item vf-clue-fact-item"><span className="vf-clue-tag">STARRING</span><span className="vf-clue-val">{puzzle.clues[2]}</span></div>}
              {puzzleClue >= 3 && <div className="vf-clue-item vf-clue-tagline"><span className="vf-clue-tag">TAGLINE</span><p className="vf-clue-tagline-text">&ldquo;{puzzle.clues[3]}&rdquo;</p></div>}
              {puzzleClue >= 4 && puzzle.poster && <div className="vf-clue-item vf-clue-poster-reveal"><img src={puzzle.poster} alt="" className="vf-poster-big" /></div>}
            </div>
            <div className="vf-input-bottom">
              <div className="vf-input-wrap">
                <input ref={inputRef} type="text" className="vf-input" placeholder="Type a movie title..." value={puzzleGuess} onChange={e => handlePuzzleSearch(e.target.value)} autoComplete="off" />
                <button className="vf-skip" onClick={skipPuzzleClue}>{puzzleClue < 4 ? "Skip \u2192" : "Give up"}</button>
              </div>
              {puzzleResults.length > 0 && (
                <div className="vf-results">
                  {puzzleResults.map(r => (
                    <button key={r.id} className="vf-result" onClick={() => submitPuzzleGuess(r.title, r.id)}>
                      {r.posterUrl && <img src={r.posterUrl} alt="" className="vf-result-poster" />}
                      <span className="vf-result-title">{r.title}</span>
                      {r.year && <span className="vf-result-year">({r.year})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="vf-reveal">
            <div className="vf-reveal-card">
              {puzzle.poster && <img src={puzzle.poster} className="vf-reveal-poster" alt="" />}
              <div className="vf-reveal-info">
                <h2 className="vf-reveal-title">{puzzle.answer.title as string}</h2>
                <p className="vf-reveal-meta">{puzzle.answer.year as number} &bull; {puzzle.answer.director as string}</p>
              </div>
            </div>
            <div className={`vf-score-banner ${puzzleWon ? "vf-score-win" : "vf-score-lose"}`}>
              {puzzleWon ? `\u2B50 Got it on Clue ${puzzleClue + 1}!` : `Missed it \u2014 ${puzzle.answer.title as string}`}
            </div>
            <div className="g3-puzzle-actions">
              <button className="vf-btn vf-btn-primary" onClick={startPuzzle}>Another Round</button>
              <button className="vf-btn vf-btn-secondary" onClick={closeOverlay}>Back to Store</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
