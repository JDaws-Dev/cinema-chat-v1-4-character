// Game state persistence for Friday Night Vault

export interface MovieProp {
  id: string;
  name: string;
  movie: string;
  rarity: "uncommon" | "rare" | "legendary";
  emoji: string;
  unlockedBy: string;
}

export const PROPS: MovieProp[] = [
  // Legendary (5)
  { id: "hoverboard", name: "Hoverboard", movie: "Back to the Future Part II", rarity: "legendary", emoji: "🛹", unlockedBy: "movie_night_10" },
  { id: "lightsaber", name: "Lightsaber", movie: "Star Wars", rarity: "legendary", emoji: "⚔️", unlockedBy: "speed_run" },
  { id: "one_ring", name: "The One Ring", movie: "The Lord of the Rings", rarity: "legendary", emoji: "💍", unlockedBy: "movie_night_15" },
  { id: "infinity_gauntlet", name: "Infinity Gauntlet", movie: "Avengers: Infinity War", rarity: "legendary", emoji: "🫰", unlockedBy: "perfect_streak_5" },
  { id: "wilson", name: "Wilson", movie: "Cast Away", rarity: "legendary", emoji: "🏐", unlockedBy: "movie_night_20" },
  // Rare (5)
  { id: "proton_pack", name: "Proton Pack", movie: "Ghostbusters", rarity: "rare", emoji: "👻", unlockedBy: "movie_night_5" },
  { id: "amber_cane", name: "Amber Cane", movie: "Jurassic Park", rarity: "rare", emoji: "🦕", unlockedBy: "movie_night_7" },
  { id: "et_finger", name: "E.T.'s Finger", movie: "E.T. the Extra-Terrestrial", rarity: "rare", emoji: "👆", unlockedBy: "speed_run_3" },
  { id: "briefcase", name: "Briefcase", movie: "Pulp Fiction", rarity: "rare", emoji: "💼", unlockedBy: "movie_night_8" },
  { id: "whip", name: "Bullwhip", movie: "Indiana Jones", rarity: "rare", emoji: "🤠", unlockedBy: "speed_run_5" },
  // Uncommon (5)
  { id: "nike_mags", name: "Nike MAGs", movie: "Back to the Future", rarity: "uncommon", emoji: "👟", unlockedBy: "movie_night_1" },
  { id: "golden_ticket", name: "Golden Ticket", movie: "Willy Wonka & the Chocolate Factory", rarity: "uncommon", emoji: "🎫", unlockedBy: "movie_night_3" },
  { id: "gizmo", name: "Gizmo", movie: "Gremlins", rarity: "uncommon", emoji: "🐾", unlockedBy: "movie_night_2" },
  { id: "red_pill", name: "Red Pill", movie: "The Matrix", rarity: "uncommon", emoji: "💊", unlockedBy: "speed_run_1" },
  { id: "neuralyzer", name: "Neuralyzer", movie: "Men in Black", rarity: "uncommon", emoji: "🔦", unlockedBy: "movie_night_4" },
];

export interface GameState {
  unlockedProps: string[];
  challengesCompleted: number;
  bestTime: number | null;
  totalMoviesFound: number;
  challengeCompletions: Record<string, number>;
}

const STORAGE_KEY = "fnv_game_state";

const DEFAULT_STATE: GameState = {
  unlockedProps: [],
  challengesCompleted: 0,
  bestTime: null,
  totalMoviesFound: 0,
  challengeCompletions: {},
};

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, unlockedProps: [], challengeCompletions: {} };
    const parsed = JSON.parse(raw);
    return {
      unlockedProps: Array.isArray(parsed.unlockedProps) ? parsed.unlockedProps : [],
      challengesCompleted: typeof parsed.challengesCompleted === "number" ? parsed.challengesCompleted : 0,
      bestTime: typeof parsed.bestTime === "number" ? parsed.bestTime : null,
      totalMoviesFound: typeof parsed.totalMoviesFound === "number" ? parsed.totalMoviesFound : 0,
      challengeCompletions: parsed.challengeCompletions && typeof parsed.challengeCompletions === "object" && !Array.isArray(parsed.challengeCompletions)
        ? parsed.challengeCompletions
        : {},
    };
  } catch {
    return { ...DEFAULT_STATE, unlockedProps: [], challengeCompletions: {} };
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable - fail silently
  }
}

export function unlockProp(propId: string): void {
  const state = loadGameState();
  if (!state.unlockedProps.includes(propId)) {
    state.unlockedProps.push(propId);
    saveGameState(state);
  }
}

export function hasProp(propId: string): boolean {
  const state = loadGameState();
  return state.unlockedProps.includes(propId);
}

export function recordChallengeCompletion(type: string, timeSeconds: number): void {
  const state = loadGameState();
  state.challengesCompleted += 1;
  state.challengeCompletions[type] = (state.challengeCompletions[type] || 0) + 1;
  if (state.bestTime === null || timeSeconds < state.bestTime) {
    state.bestTime = timeSeconds;
  }
  saveGameState(state);
}

export function resetGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable - fail silently
  }
}

export function getPropsCount(): { unlocked: number; total: number } {
  const state = loadGameState();
  return {
    unlocked: state.unlockedProps.length,
    total: PROPS.length,
  };
}
