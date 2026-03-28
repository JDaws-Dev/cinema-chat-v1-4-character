/**
 * Unified game state for the store-as-interface.
 * Single useReducer drives everything.
 */

export type OverlayType =
  | "shelf_browser"
  | "dialogue"
  | "friday_pick"
  | "quote"
  | "synopsis"
  | "prop_hunt_hud"
  | "collection"
  | "film_detail"
  | null;

export interface GameState {
  screen: "title" | "entrance" | "store";
  overlay: OverlayType;
  overlayGenre: string | null;      // for shelf_browser
  overlayFilmId: number | null;     // for film_detail

  // Player
  xp: number;
  streak: number;
  bestStreak: number;

  // Prop hunt
  propHuntActive: boolean;

  // Store cosmetic
  timeOfDay: string;
}

export type GameAction =
  | { type: "SET_SCREEN"; screen: GameState["screen"] }
  | { type: "OPEN_OVERLAY"; overlay: OverlayType; genre?: string; filmId?: number }
  | { type: "CLOSE_OVERLAY" }
  | { type: "ADD_XP"; amount: number }
  | { type: "CORRECT_ANSWER" }
  | { type: "WRONG_ANSWER" }
  | { type: "START_PROP_HUNT" }
  | { type: "END_PROP_HUNT" }
  | { type: "LOAD"; partial: Partial<GameState> };

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "evening";
  if (h >= 20 && h < 23) return "night";
  return "latenight";
}

export function createInitialState(): GameState {
  return {
    screen: "title",
    overlay: null,
    overlayGenre: null,
    overlayFilmId: null,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    propHuntActive: false,
    timeOfDay: getTimeOfDay(),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "OPEN_OVERLAY":
      return {
        ...state,
        overlay: action.overlay,
        overlayGenre: action.genre ?? null,
        overlayFilmId: action.filmId ?? null,
      };

    case "CLOSE_OVERLAY":
      return { ...state, overlay: null, overlayGenre: null, overlayFilmId: null };

    case "ADD_XP": {
      const xp = state.xp + action.amount;
      localStorage.setItem("fnv_xp", String(xp));
      return { ...state, xp };
    }

    case "CORRECT_ANSWER": {
      const streak = state.streak + 1;
      const bestStreak = Math.max(streak, state.bestStreak);
      return { ...state, streak, bestStreak };
    }

    case "WRONG_ANSWER":
      return { ...state, streak: 0 };

    case "START_PROP_HUNT":
      return { ...state, propHuntActive: true, overlay: null };

    case "END_PROP_HUNT":
      return { ...state, propHuntActive: false };

    case "LOAD":
      return { ...state, ...action.partial };

    default:
      return state;
  }
}

// ── Rank helpers ──────────────────────────────────────────
export const RANKS = [
  { name: "Just Browsing", min: 0, icon: "👀", tapesPerShelf: 6, neon: 0.6 },
  { name: "Regular", min: 50, icon: "🎬", tapesPerShelf: 8, neon: 0.7 },
  { name: "Film Buff", min: 150, icon: "🎥", tapesPerShelf: 10, neon: 0.85 },
  { name: "Cinephile", min: 300, icon: "🏆", tapesPerShelf: 12, neon: 0.95 },
  { name: "Honorary Manager", min: 500, icon: "⭐", tapesPerShelf: 14, neon: 1.0 },
];

export function getRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}
