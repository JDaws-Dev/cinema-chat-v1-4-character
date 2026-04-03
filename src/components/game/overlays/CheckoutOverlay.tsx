"use client";

import { type HeldMovie, type HeldSnack } from "@/hooks/useInventory";
import { loadGameState, saveGameState } from "@/lib/game-state";
import { type Overlay } from "@/hooks/useOverlay";

export type ScoreItem = { label: string; points: number };

export function calculateMovieNightScore(movies: HeldMovie[], snacks: HeldSnack[]): { score: number; breakdown: ScoreItem[] } {
  let score = 0;
  const breakdown: ScoreItem[] = [];

  // Base: movies
  if (movies.length === 1) { score += 50; breakdown.push({ label: "Quick Night", points: 50 }); }
  if (movies.length === 2) { score += 120; breakdown.push({ label: "Double Feature", points: 120 }); }
  if (movies.length >= 3) { score += 200; breakdown.push({ label: "Marathon!", points: 200 }); }

  // Genre variety
  const genres = new Set(movies.map(m => m.genre).filter(Boolean));
  if (genres.size === movies.length && movies.length > 1) {
    score += 50; breakdown.push({ label: "Genre Variety", points: 50 });
  }

  // Snack bonus
  if (snacks.length > 0) {
    const snackPts = snacks.length * 25;
    score += snackPts; breakdown.push({ label: `${snacks.length} Snack(s)`, points: snackPts });
  }

  // Big feast
  if (snacks.length >= 3) {
    score += 50; breakdown.push({ label: "Feast Mode!", points: 50 });
  }

  // Snack pairing bonuses
  const snackNames = snacks.map(s => s.name.toLowerCase());
  const movieGenres = movies.map(m => m.genre.toLowerCase());
  const candyNames = ["m&ms", "skittles", "junior mints", "twizzlers", "gummy bears", "milk duds", "nerds", "hot tamales", "swedish fish", "reese's pieces", "raisinets", "sour patch kids", "red vines", "butterfinger", "cookie"];
  const sodaNames = ["soda"];
  const hasPopcorn = snackNames.some(s => s.includes("popcorn"));
  const hasCandy = snackNames.some(s => candyNames.some(c => s.includes(c)));
  const hasSoda = snackNames.some(s => sodaNames.some(c => s.includes(c)));

  if (movieGenres.includes("horror") && hasPopcorn) {
    score += 30; breakdown.push({ label: "Scream & Munch", points: 30 });
  }
  if (movieGenres.includes("comedy") && hasCandy) {
    score += 20; breakdown.push({ label: "Sugar Rush", points: 20 });
  }
  if (movieGenres.includes("action") && hasSoda) {
    score += 25; breakdown.push({ label: "Adrenaline Fuel", points: 25 });
  }

  return { score, breakdown };
}

interface CheckoutOverlayProps {
  heldMovies: HeldMovie[];
  heldSnacks: HeldSnack[];
  removeHeldMovie: (id: number) => void;
  setHeldMovies: React.Dispatch<React.SetStateAction<HeldMovie[]>>;
  setHeldSnacks: React.Dispatch<React.SetStateAction<HeldSnack[]>>;
  setOverlay: (o: Overlay) => void;
}

export function CheckoutOverlay({ heldMovies, heldSnacks, removeHeldMovie, setHeldMovies, setHeldSnacks, setOverlay }: CheckoutOverlayProps) {
  const { score: movieNightScore, breakdown: scoreBreakdown } = calculateMovieNightScore(heldMovies, heldSnacks);
  const prevHigh = parseInt(localStorage.getItem("fnv_high_score") || "0");
  const isNewHigh = movieNightScore > prevHigh;
  if (isNewHigh) localStorage.setItem("fnv_high_score", String(movieNightScore));

  return (
    <div className="g3-overlay g3-overlay-center g3-checkout-overlay">
      <div className="g3-receipt">
        <div className="g3-receipt-header">
          <pre>FRIDAY NIGHT VIDEO</pre>
          <pre>YOUR NEIGHBORHOOD VIDEO STORE</pre>
          <pre>================================</pre>
        </div>
        <div className="g3-receipt-items">
          {heldMovies.map((movie, i) => (
            <div key={i} className="g3-receipt-item">
              <span>{"\uD83C\uDFAC"} {movie.title}</span>
              <span className="g3-receipt-item-actions">
                <span>$2.99</span>
                <button className="g3-receipt-remove" onClick={() => removeHeldMovie(movie.id)}>PUT BACK</button>
              </span>
            </div>
          ))}
          {heldSnacks.map((snack, i) => (
            <div key={i} className="g3-receipt-item">
              <span>{snack.emoji} {snack.name}</span>
              <span>$1.50</span>
            </div>
          ))}
        </div>
        <pre>================================</pre>
        <div className="g3-receipt-total">
          <span>TOTAL</span>
          <span>${(heldMovies.length * 2.99 + heldSnacks.length * 1.50).toFixed(2)}</span>
        </div>
        <pre>================================</pre>
        <div className="g3-receipt-score">
          <div className="g3-receipt-score-label">MOVIE NIGHT SCORE</div>
          <div className="g3-score-big">{movieNightScore}</div>
          {isNewHigh && <div className="g3-score-newhigh">NEW HIGH SCORE!</div>}
          <div className="g3-score-breakdown">
            {scoreBreakdown.map((item, i) => (
              <div key={i}>{item.label}: +{item.points}</div>
            ))}
          </div>
          <div className="g3-score-xp">+{Math.floor(movieNightScore / 10)} XP</div>
        </div>
        <pre>================================</pre>
        <pre>HAVE A GREAT FRIDAY NIGHT!</pre>
        <pre>BE KIND, REWIND</pre>
        <div className="g3-receipt-buttons">
          <button className="g3-receipt-btn g3-receipt-btn-primary" onClick={() => {
            const state = loadGameState();
            state.totalMoviesFound += heldMovies.length;
            saveGameState(state);
            setOverlay("none");
            setHeldMovies([]);
            setHeldSnacks([]);
          }}>
            LEAVE THE STORE
          </button>
          <button className="g3-receipt-btn g3-receipt-btn-secondary" onClick={() => setOverlay("none")}>
            KEEP BROWSING
          </button>
        </div>
      </div>
    </div>
  );
}
