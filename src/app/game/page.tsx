"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { DialogueBox } from "@/components/game3d/DialogueOverlay";
import { ShelfBrowser } from "@/components/game/ShelfBrowser";
import { FilmDetailModal } from "@/components/FilmDetailModal";
import { RewardOverlay } from "@/components/game/RewardOverlay";
import {
  SCENARIOS, QUOTES, SYNOPSES,
  getSeen, markSeen, addCorrectAnswer, addWrongAnswer,
  type Scenario, type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { fetchSearch, fetchTrending } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { getShelfMovies } from "@/components/game3d/Store";
import { loadGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, type MovieProp } from "@/lib/game-state";
import "./game.css";

const MobileControls = dynamic(() => import("@/components/game3d/MobileControls").then(m => ({ default: m.MobileControls })), { ssr: false });

const Canvas = dynamic(() => import("@react-three/fiber").then(m => ({ default: m.Canvas })), { ssr: false });
const Store = dynamic(() => import("@/components/game3d/Store").then(m => ({ default: m.Store })), { ssr: false });
const FirstPersonControls = dynamic(() => import("@/components/game3d/FirstPerson").then(m => ({ default: m.FirstPersonControls })), { ssr: false });
const InteractionSystem = dynamic(() => import("@/components/game3d/Interaction").then(m => ({ default: m.InteractionSystem })), { ssr: false });

const GENRE_IDS: Record<string, string> = { horror: "27", scifi: "878", comedy: "35", drama: "18", action: "28", classics: "36", family: "10751", new: "trending" };
const STATS_KEY = "vnv_stats";
function loadStats(): Record<string, number> { try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; } }
function saveStats(s: Record<string, number>) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

type Overlay = "none" | "dialogue" | "shelf" | "film_detail" | "pick" | "quote" | "synopsis" | "challenge_select";

export default function GamePage() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile('ontouchstart' in window || window.innerWidth < 768);
  }, []);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [shelfGenre, setShelfGenre] = useState("");
  const [filmId, setFilmId] = useState<number | null>(null);

  // Vinny's Five state
  const [puzzle, setPuzzle] = useState<{ clues: string[]; movieId: number; backdrop: string | null; poster: string | null; answer: Record<string, unknown> } | null>(null);
  const [puzzleClue, setPuzzleClue] = useState(0);
  const [puzzleGuess, setPuzzleGuess] = useState("");
  const [puzzleResults, setPuzzleResults] = useState<SearchResult[]>([]);
  const [puzzleWon, setPuzzleWon] = useState<boolean | null>(null);
  const [puzzleBackdropReady, setPuzzleBackdropReady] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quote/Synopsis state
  const [quote, setQuote] = useState<QuoteChallenge | null>(null);
  const [synopsis, setSynopsis] = useState<SynopsisChallenge | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [hintText, setHintText] = useState<string | null>(null);

  // VHS pickup inventory (multiple films)
  type HeldMovie = { id: number; title: string; posterUrl: string };
  const [heldMovies, setHeldMovies] = useState<HeldMovie[]>([]);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [pickupFlash, setPickupFlash] = useState(false);
  const [pickupTitle, setPickupTitle] = useState<string | null>(null);

  // Movie Night Challenge state
  type ChallengeMovie = { title: string; genre: string };
  const [challenge, setChallenge] = useState<{ movies: ChallengeMovie[]; startTime: number; hintsUsed: Set<number> } | null>(null);
  const [challengeComplete, setChallengeComplete] = useState<number | null>(null); // elapsed seconds
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [propsCount, setPropsCount] = useState({ unlocked: 0, total: 15 });
  const [rewardProp, setRewardProp] = useState<MovieProp | null>(null);

  // Load props count on mount
  useEffect(() => { setPropsCount(getPropsCount()); }, []);

  // Update challenge timer every second
  useEffect(() => {
    if (!challenge) { setChallengeTimer(0); return; }
    const iv = setInterval(() => setChallengeTimer(Math.round((Date.now() - challenge.startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [challenge]);

  useEffect(() => { setStats(loadStats()); }, []);

  // ── Hover callback from 3D interaction system ─────────
  const handleHover = useCallback((label: string | null) => {
    setHoverLabel(label);
  }, []);

  // ── Interaction handler from 3D world ──────────────────
  const handleInteract = useCallback((type: string, data?: string) => {
    if (overlay !== "none") return;

    if (type === "snack" && data) {
      // Pick up candy/snack item — don't exit pointer lock, stay in game
      try {
        const snack = JSON.parse(data);
        setHeldMovies(prev => {
          if (prev.some(m => m.title === `${snack.emoji} ${snack.name}`)) return prev;
          return [...prev, { id: Date.now(), title: `${snack.emoji} ${snack.name}`, posterUrl: "" }];
        });
        setPickupFlash(true);
        setPickupTitle(`${snack.emoji} ${snack.name}`);
        setTimeout(() => setPickupFlash(false), 800);
        setTimeout(() => setPickupTitle(null), 1500);
      } catch { /* ignore parse errors */ }
      return;
    }

    if (type === "vhs" && data) {
      // Pick up VHS tape — don't exit pointer lock, stay in game
      try {
        const movie = JSON.parse(data);
        // Don't add duplicates
        setHeldMovies(prev => {
          if (prev.some(m => m.id === movie.id)) return prev;
          return [...prev, { id: movie.id, title: movie.title, posterUrl: movie.posterUrl }];
        });
        setPickupFlash(true);
        setPickupTitle(movie.title);
        setTimeout(() => setPickupFlash(false), 800);
        setTimeout(() => setPickupTitle(null), 1500);
      } catch { /* ignore parse errors */ }
      return;
    }

    // Exit pointer lock when opening overlay
    document.exitPointerLock();

    if (type === "vinny") {
      // If in a challenge and have all movies, complete it
      if (challenge && heldMovies.length > 0) {
        const found = challenge.movies.filter(cm =>
          heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase())
        );
        if (found.length === challenge.movies.length) {
          const elapsed = Math.round((Date.now() - challenge.startTime) / 1000);
          setChallengeComplete(elapsed);
          setChallenge(null);
          setHeldMovies([]);
          // Record completion and check for prop unlocks
          recordChallengeCompletion("movie_night", elapsed);
          const state = loadGameState();
          const count = state.challengeCompletions["movie_night"] || 0;
          // Check which props should be unlocked based on completion count
          const milestones: Record<number, string> = { 1: "nike_mags", 2: "gizmo", 3: "golden_ticket", 4: "neuralyzer", 5: "proton_pack", 7: "amber_cane", 8: "briefcase", 10: "hoverboard", 15: "one_ring", 20: "wilson" };
          const propId = milestones[count];
          if (propId && !state.unlockedProps.includes(propId)) {
            unlockProp(propId);
            const prop = PROPS.find(p => p.id === propId);
            if (prop) setRewardProp(prop);
          }
          // Check speed run props
          if (elapsed <= 60 && !state.unlockedProps.includes("red_pill")) {
            unlockProp("red_pill");
            const prop = PROPS.find(p => p.id === "red_pill");
            if (prop) setRewardProp(prop);
          }
          setPropsCount(getPropsCount());
          document.exitPointerLock();
          return;
        }
      }
      // If holding movies (no challenge), show the first one's detail
      if (heldMovies.length > 0) {
        setFilmId(heldMovies[0].id);
        setOverlay("film_detail");
        return;
      }
      // Random: chat, quote, or synopsis
      const roll = Math.random();
      if (roll < 0.4) {
        setOverlay("dialogue");
      } else if (roll < 0.7) {
        setQuote(pickRandom(QUOTES, q => q.id));
        setQuizAnswer(null);
        setOverlay("quote");
      } else {
        setSynopsis(pickRandom(SYNOPSES, s => s.id));
        setQuizAnswer(null);
        setOverlay("synopsis");
      }
    } else if (type === "challenge") {
      // Open challenge selection overlay
      if (challenge) return; // already running
      setOverlay("challenge_select");
      return;
    } else if (type === "shelf") {
      setShelfGenre(data || "horror");
      setOverlay("shelf");
    } else if (type === "tv") {
      startPuzzle();
    }
  }, [overlay, heldMovies, challenge]);

  // ── Start a Movie Night Challenge ─────────────────────
  const startChallenge = useCallback(() => {
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
    setChallenge({ movies: picks, startTime: Date.now(), hintsUsed: new Set() });
    setOverlay("none");
  }, [challenge]);

  // ── Puzzle (Vinny's Five) ──────────────────────────────
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
  }, []);

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

  // ── Quiz answer ────────────────────────────────────────
  const handleQuizAnswer = useCallback((idx: number, correct: number, id: string) => {
    setQuizAnswer(idx);
    markSeen(id);
    if (idx === correct) addCorrectAnswer(); else addWrongAnswer();
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay("none");
    setPuzzle(null);
    setQuote(null);
    setSynopsis(null);
    setQuizAnswer(null);
  }, []);

  // Q or Backspace to close overlays (ESC exits pointer lock, so don't use it)
  useEffect(() => {
    if (overlay === "none") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q" || e.key === "Backspace") {
        e.preventDefault();
        closeOverlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay, closeOverlay]);

  // Screenshot helper — resizes to max 1280px wide for smaller file sizes
  const takeScreenshot = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const maxW = 1280;
    const scale = Math.min(1, maxW / canvas.width);
    const w = Math.round(canvas.width * scale);
    const h = Math.round(canvas.height * scale);
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0, w, h);
    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fnv-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.85);
  }, []);

  // C to take screenshot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "c" || e.key === "C") takeScreenshot();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [takeScreenshot]);

  // ── Splash ─────────────────────────────────────────────
  if (!started) {
    return (
      <div className="g3-splash">
        <div className="g3-splash-content">
          {/* Blockbuster-style torn ticket logo */}
          <div className="g3-logo">
            <div className="g3-logo-ticket">
              <div className="g3-logo-left" />
              <div className="g3-logo-right" />
            </div>
          </div>
          <h1 className="g3-splash-title">FRIDAY NIGHT<br/>VIDEO</h1>
          <p className="g3-splash-tagline">Your neighborhood video store</p>
          <button className="g3-splash-btn" onClick={() => { setStarted(true); setLoading(true); }}>ENTER THE STORE</button>
          <p className="g3-splash-hint">WASD to move &bull; Mouse to look &bull; Click to interact</p>
        </div>
      </div>
    );
  }

  const hasOverlay = overlay !== "none";
  const puzzleBlur = puzzleWon !== null ? 0 : [40, 28, 16, 6, 0][puzzleClue];

  return (
    <div className="g3-container">
      {/* 3D Canvas */}
      <Canvas
        shadows={false}
        gl={{ antialias: true, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true }}
        camera={{ fov: 70, near: 0.1, far: 50 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        style={{ background: "#0a0e18" }}
        onCreated={({ gl }) => { gl.setClearColor("#0a0e18"); setTimeout(() => setLoading(false), 500); }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#0a0e18", 20, 45]} />
          <Store isMobile={isMobile} />
          {!hasOverlay && <FirstPersonControls />}
          {!hasOverlay && <InteractionSystem onInteract={handleInteract} onHover={handleHover} />}
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      <div className={`g3-loading-overlay${!loading ? " g3-loaded" : ""}`}>
        <div className="g3-logo">
          <div className="g3-logo-ticket">
            <div className="g3-logo-left" />
            <div className="g3-logo-right" />
          </div>
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffd700", letterSpacing: "0.05em" }}>FRIDAY NIGHT VIDEO</h1>
        <p className="g3-loading-text">Opening the store...</p>
      </div>

      {/* Crosshair */}
      {!hasOverlay && <div className="g3-crosshair" />}

      {/* Hover label near crosshair */}
      {!hasOverlay && hoverLabel && (
        <div className="g3-hover-label">{hoverLabel}</div>
      )}

      {/* Pickup flash + title toast */}
      {pickupFlash && <div className="g3-pickup-flash" />}
      {pickupTitle && (
        <div className="g3-pickup-toast">
          <span className="g3-pickup-toast-icon">📼</span> {pickupTitle}
        </div>
      )}

      {/* Movie Night Challenge — shopping list HUD */}
      {challenge && !hasOverlay && (
        <div className="g3-challenge-list">
          <div className="g3-challenge-header">MOVIE NIGHT LIST</div>
          {challenge.movies.map((cm, i) => {
            const found = heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase());
            const hintShown = challenge.hintsUsed.has(i);
            return (
              <div key={i} className={`g3-challenge-item ${found ? "g3-challenge-found" : ""}`}>
                <span>{found ? "✓" : "○"} {cm.title}</span>
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
          <div className="g3-challenge-timer">
            {challengeTimer}s
          </div>
        </div>
      )}

      {/* Challenge complete overlay */}
      {challengeComplete !== null && (
        <div className="g3-challenge-complete" onClick={() => setChallengeComplete(null)}>
          <div className="g3-challenge-complete-card">
            <div className="g3-challenge-complete-icon">🎬</div>
            <div className="g3-challenge-complete-title">MOVIE NIGHT READY!</div>
            <div className="g3-challenge-complete-time">Found all movies in {challengeComplete}s</div>
            <button className="g3-splash-btn" onClick={() => setChallengeComplete(null)} style={{ marginTop: 12, padding: "12px 24px", fontSize: "0.9rem" }}>
              NICE!
            </button>
          </div>
        </div>
      )}

      {/* Challenge Selection Overlay */}
      {overlay === "challenge_select" && (() => {
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
              <button className="g3-challenge-option" onClick={() => { startChallenge(); }}>
                <div className="g3-challenge-option-name">Movie Night</div>
                <div className="g3-challenge-option-desc">Find 3 movies from the shelves</div>
                <div className="g3-challenge-option-stats">Completed {movieNightCount} time{movieNightCount !== 1 ? "s" : ""}</div>
              </button>

              {/* Speed Run — unlocks after 3 Movie Night completions */}
              <button
                className={`g3-challenge-option ${!speedRunUnlocked ? "g3-challenge-option-locked" : ""}`}
                onClick={() => { if (speedRunUnlocked) startChallenge(); }}
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

              {/* Vinny's Pick — unlocks after 5 Movie Night completions */}
              <button
                className="g3-challenge-option g3-challenge-option-locked"
                disabled
              >
                <div className="g3-challenge-option-name">Vinny&apos;s Pick</div>
                <div className="g3-challenge-option-desc">Vinny describes a movie — find it!</div>
                {vinnyPickUnlocked ? (
                  <div className="g3-challenge-option-lock">Coming soon</div>
                ) : (
                  <div className="g3-challenge-option-lock">Complete 5 Movie Nights to unlock</div>
                )}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Reward prop unlock overlay */}
      {rewardProp && (
        <RewardOverlay prop={rewardProp} onDismiss={() => setRewardProp(null)} />
      )}

      {/* Held movies inventory HUD */}
      {heldMovies.length > 0 && !hasOverlay && (
        <div className="g3-inventory">
          <div className="g3-inventory-label">RENTING ({heldMovies.length})</div>
          <div className="g3-inventory-stack">
            {heldMovies.map((movie) => (
              <div key={movie.id} className="g3-inventory-card">
                {movie.posterUrl && (
                  <img src={movie.posterUrl} alt={movie.title} className="g3-inventory-poster" />
                )}
                <div className="g3-inventory-title">{movie.title}</div>
                <button className="g3-inventory-remove" onClick={() => setHeldMovies(prev => prev.filter(m => m.id !== movie.id))}>✕</button>
              </div>
            ))}
          </div>
          <div className="g3-inventory-hint">Take to Vinny to check out</div>
          <button className="g3-inventory-drop" onClick={() => setHeldMovies([])}>DROP ALL</button>
        </div>
      )}

      {/* Mobile touch controls */}
      {!hasOverlay && <MobileControls />}

      {/* HUD */}
      <div className="g3-hud">
        <span className="g3-hud-title">FRIDAY NIGHT VIDEO</span>
        <span className="g3-hud-hint">
          {hasOverlay ? "Press Q or click ✕ to close" :
           heldMovies.length > 0 ? `Take your ${heldMovies.length === 1 ? "movie" : `${heldMovies.length} movies`} to Vinny!` :
           challenge ? "" :
           "WASD move · Click to interact"}
        </span>
        <div className="g3-hud-right">
          <div className="g3-props-badge">🏆 {propsCount.unlocked}/{propsCount.total}</div>
          <button className="g3-screenshot-btn" onClick={takeScreenshot}>📷</button>
        </div>
      </div>

      {/* ── OVERLAYS ────────────────────────────────────────── */}

      {/* Talk to Vinny (AI Chat) */}
      {overlay === "dialogue" && (
        <div className="g3-overlay">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">VINNY</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <DialogueBox onClose={closeOverlay} />
          </div>
        </div>
      )}

      {/* Shelf Browser */}
      {overlay === "shelf" && (
        <ShelfBrowser genre={shelfGenre} open onClose={closeOverlay} onFilmClick={(id) => { setFilmId(id); setOverlay("film_detail"); }} />
      )}

      {/* Film Detail */}
      {overlay === "film_detail" && (
        <FilmDetailModal filmId={filmId} onClose={closeOverlay} onSelectFilm={(id) => setFilmId(id)} />
      )}

      {/* Vinny's Five (Puzzle) */}
      {overlay === "pick" && puzzle && (
        <div className="g3-puzzle-overlay">
          {puzzle.backdrop && puzzleBackdropReady && (
            <div className="vf-backdrop" style={{ backgroundImage: `url(${puzzle.backdrop})`, filter: `blur(${puzzleBlur}px) brightness(0.6)` }} />
          )}
          <div className="vf-scrim" />
          <div className="g3-puzzle-content">
            <div className="g3-puzzle-top">
              <button className="vf-back" onClick={closeOverlay}>✕ Close</button>
              <div className="vf-star-track">
                {[5,4,3,2,1].map(s => <span key={s} className={`vf-star ${puzzleWon === null && s <= 5 - puzzleClue ? "vf-star-lit" : ""} ${puzzleWon && s <= 5 - puzzleClue ? "vf-star-won" : ""}`}>★</span>)}
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
                    <button className="vf-skip" onClick={skipPuzzleClue}>{puzzleClue < 4 ? "Skip →" : "Give up"}</button>
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
                  {puzzleWon ? `⭐ Got it on Clue ${puzzleClue + 1}!` : `Missed it — ${puzzle.answer.title as string}`}
                </div>
                <div className="g3-puzzle-actions">
                  <button className="vf-btn vf-btn-primary" onClick={startPuzzle}>Another Round</button>
                  <button className="vf-btn vf-btn-secondary" onClick={closeOverlay}>Back to Store</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote */}
      {overlay === "quote" && quote && (
        <div className="g3-overlay g3-overlay-center">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">NAME THAT QUOTE</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <div className="fnv-quote-display">&ldquo;{quote.quote}&rdquo;</div>
            <div className="fnv-options">
              {quote.options.map((opt, i) => (
                <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === quote.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                  onClick={() => quizAnswer === null && handleQuizAnswer(i, quote.correctIndex, quote.id)} disabled={quizAnswer !== null}>
                  <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <>
                <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                  <div className="fnv-vinny-avatar">V</div>
                  <div className="fnv-vinny-text"><p>{quizAnswer === quote.correctIndex ? quote.vinnyRight : quote.vinnyWrong}</p></div>
                </div>
                <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setQuote(pickRandom(QUOTES, q => q.id)); setQuizAnswer(null); }}>Next Quote</button>
                <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Synopsis */}
      {overlay === "synopsis" && synopsis && (
        <div className="g3-overlay g3-overlay-center">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">BACK OF THE BOX</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <div className="fnv-synopsis-display"><div className="fnv-synopsis-label">📼 TURN THE BOX OVER...</div><p>{synopsis.synopsis}</p></div>
            <div className="fnv-options">
              {synopsis.options.map((opt, i) => (
                <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === synopsis.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                  onClick={() => quizAnswer === null && handleQuizAnswer(i, synopsis.correctIndex, synopsis.id)} disabled={quizAnswer !== null}>
                  <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <>
                <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                  <div className="fnv-vinny-avatar">V</div>
                  <div className="fnv-vinny-text"><p>{quizAnswer === synopsis.correctIndex ? synopsis.vinnyRight : synopsis.vinnyWrong}</p></div>
                </div>
                <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setSynopsis(pickRandom(SYNOPSES, s => s.id)); setQuizAnswer(null); }}>Next Box</button>
                <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
