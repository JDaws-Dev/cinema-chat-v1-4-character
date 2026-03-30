// Game state persistence for Friday Night Vault

import { type Quest, type QuestState, VINNY_QUESTS, QUEST_PROPS, ALL_QUESTS, CUSTOMER_SIDE_QUESTS } from "./quest-system";

// ── Membership Tier System ──────────────────────────────────

export const MEMBERSHIP_TIERS = [
  { name: "Bronze", minXP: 0, color: "#cd7f32", emoji: "🟫" },
  { name: "Silver", minXP: 200, color: "#c0c0c0", emoji: "⬜" },
  { name: "Gold", minXP: 500, color: "#ffd700", emoji: "🟨" },
  { name: "Platinum", minXP: 1000, color: "#e5e4e2", emoji: "💎" },
];

export function getTotalXP(): number {
  return parseInt(localStorage.getItem("fnv_total_xp") || "0", 10);
}

export function addXP(amount: number): { newTotal: number; tierUp: boolean; newTier: string } {
  const oldXP = getTotalXP();
  const newXP = oldXP + amount;
  localStorage.setItem("fnv_total_xp", String(newXP));
  const oldTier = getMembershipTier(oldXP);
  const newTier = getMembershipTier(newXP);
  return { newTotal: newXP, tierUp: newTier.name !== oldTier.name, newTier: newTier.name };
}

export function getMembershipTier(xp?: number) {
  const total = xp ?? getTotalXP();
  let tier = MEMBERSHIP_TIERS[0];
  for (const t of MEMBERSHIP_TIERS) {
    if (total >= t.minXP) tier = t;
  }
  return tier;
}

export function getNextTier() {
  const current = getMembershipTier();
  const idx = MEMBERSHIP_TIERS.indexOf(current);
  return idx < MEMBERSHIP_TIERS.length - 1 ? MEMBERSHIP_TIERS[idx + 1] : null;
}

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
  { id: "hoverboard", name: "Hoverboard", movie: "Back to the Future Part II", rarity: "legendary", emoji: "\uD83D\uDEF9", unlockedBy: "movie_night_10" },
  { id: "lightsaber", name: "Lightsaber", movie: "Star Wars", rarity: "legendary", emoji: "\u2694\uFE0F", unlockedBy: "speed_run" },
  { id: "one_ring", name: "The One Ring", movie: "The Lord of the Rings", rarity: "legendary", emoji: "\uD83D\uDC8D", unlockedBy: "movie_night_15" },
  { id: "infinity_gauntlet", name: "Infinity Gauntlet", movie: "Avengers: Infinity War", rarity: "legendary", emoji: "\uD83E\uDEF0", unlockedBy: "perfect_streak_5" },
  { id: "wilson", name: "Wilson", movie: "Cast Away", rarity: "legendary", emoji: "\uD83C\uDFD0", unlockedBy: "movie_night_20" },
  // Rare (5)
  { id: "proton_pack", name: "Proton Pack", movie: "Ghostbusters", rarity: "rare", emoji: "\uD83D\uDC7B", unlockedBy: "movie_night_5" },
  { id: "amber_cane", name: "Amber Cane", movie: "Jurassic Park", rarity: "rare", emoji: "\uD83E\uDD95", unlockedBy: "movie_night_7" },
  { id: "et_finger", name: "E.T.'s Finger", movie: "E.T. the Extra-Terrestrial", rarity: "rare", emoji: "\u261D\uFE0F", unlockedBy: "speed_run_3" },
  { id: "briefcase", name: "Briefcase", movie: "Pulp Fiction", rarity: "rare", emoji: "\uD83D\uDCBC", unlockedBy: "movie_night_8" },
  { id: "whip", name: "Bullwhip", movie: "Indiana Jones", rarity: "rare", emoji: "\uD83E\uDD20", unlockedBy: "speed_run_5" },
  // Uncommon (5)
  { id: "nike_mags", name: "Nike MAGs", movie: "Back to the Future", rarity: "uncommon", emoji: "\uD83D\uDC5F", unlockedBy: "movie_night_1" },
  { id: "golden_ticket", name: "Golden Ticket", movie: "Willy Wonka & the Chocolate Factory", rarity: "uncommon", emoji: "\uD83C\uDFAB", unlockedBy: "movie_night_3" },
  { id: "gizmo", name: "Gizmo", movie: "Gremlins", rarity: "uncommon", emoji: "\uD83D\uDC3E", unlockedBy: "movie_night_2" },
  { id: "red_pill", name: "Red Pill", movie: "The Matrix", rarity: "uncommon", emoji: "\uD83D\uDC8A", unlockedBy: "speed_run_1" },
  { id: "neuralyzer", name: "Neuralyzer", movie: "Men in Black", rarity: "uncommon", emoji: "\uD83D\uDD26", unlockedBy: "movie_night_4" },
  // Quest reward props (4)
  ...QUEST_PROPS,
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

// ── Quest State Management ──────────────────────────────────

const QUEST_STORAGE_KEY = "fnv_quest_state";

const DEFAULT_QUEST_STATE: QuestState = {
  activeQuests: [],
  completedQuests: [],
  questProgress: {},
};

export function getQuestState(): QuestState {
  try {
    const raw = localStorage.getItem(QUEST_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_QUEST_STATE, activeQuests: [], completedQuests: [], questProgress: {} };
    const parsed = JSON.parse(raw);
    return {
      activeQuests: Array.isArray(parsed.activeQuests) ? parsed.activeQuests : [],
      completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : [],
      questProgress: parsed.questProgress && typeof parsed.questProgress === "object" && !Array.isArray(parsed.questProgress)
        ? parsed.questProgress
        : {},
    };
  } catch {
    return { ...DEFAULT_QUEST_STATE, activeQuests: [], completedQuests: [], questProgress: {} };
  }
}

function saveQuestState(state: QuestState): void {
  try {
    localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function startQuest(questId: string): void {
  const state = getQuestState();
  if (state.activeQuests.includes(questId) || state.completedQuests.includes(questId)) return;
  state.activeQuests.push(questId);
  // Initialize progress for all objectives
  const quest = ALL_QUESTS.find(q => q.id === questId);
  if (quest) {
    state.questProgress[questId] = {};
    for (const obj of quest.objectives) {
      state.questProgress[questId][obj.id] = false;
    }
  }
  saveQuestState(state);
}

export function completeObjective(questId: string, objectiveId: string): boolean {
  const state = getQuestState();
  if (!state.activeQuests.includes(questId)) return false;
  if (!state.questProgress[questId]) state.questProgress[questId] = {};
  if (state.questProgress[questId][objectiveId]) return false; // already done
  state.questProgress[questId][objectiveId] = true;
  saveQuestState(state);
  // Check if all objectives complete
  const quest = ALL_QUESTS.find(q => q.id === questId);
  if (quest) {
    const allDone = quest.objectives.every(obj => state.questProgress[questId][obj.id]);
    return allDone;
  }
  return false;
}

export function isQuestComplete(questId: string): boolean {
  const state = getQuestState();
  const quest = ALL_QUESTS.find(q => q.id === questId);
  if (!quest || !state.questProgress[questId]) return false;
  return quest.objectives.every(obj => state.questProgress[questId][obj.id]);
}

export function completeQuest(questId: string): { tierUp: boolean; newTier: string } | null {
  const state = getQuestState();
  if (!state.activeQuests.includes(questId)) return null;
  if (state.completedQuests.includes(questId)) return null;
  state.activeQuests = state.activeQuests.filter(id => id !== questId);
  state.completedQuests.push(questId);
  saveQuestState(state);
  // Grant reward prop if any
  const quest = ALL_QUESTS.find(q => q.id === questId);
  if (quest?.reward.propId) {
    unlockProp(quest.reward.propId);
  }
  // Grant XP and check for tier-up
  if (quest?.reward.xp) {
    const result = addXP(quest.reward.xp);
    return { tierUp: result.tierUp, newTier: result.newTier };
  }
  return null;
}

export function getAvailableQuests(): Quest[] {
  const state = getQuestState();
  return ALL_QUESTS.filter(quest => {
    // Already active or completed
    if (state.activeQuests.includes(quest.id)) return false;
    if (state.completedQuests.includes(quest.id)) return false;
    // Check unlock conditions
    if (quest.unlockCondition) {
      if (quest.unlockCondition.completedQuests) {
        for (const reqId of quest.unlockCondition.completedQuests) {
          if (!state.completedQuests.includes(reqId)) return false;
        }
      }
      if (quest.unlockCondition.minProps !== undefined) {
        const gs = loadGameState();
        if (gs.unlockedProps.length < quest.unlockCondition.minProps) return false;
      }
    }
    return true;
  });
}

export function getActiveQuests(): Quest[] {
  const state = getQuestState();
  return ALL_QUESTS.filter(q => state.activeQuests.includes(q.id));
}

export function getCompletedQuests(): Quest[] {
  const state = getQuestState();
  return ALL_QUESTS.filter(q => state.completedQuests.includes(q.id));
}

export function getActiveSideQuests(): Quest[] {
  const state = getQuestState();
  return CUSTOMER_SIDE_QUESTS.filter(q => state.activeQuests.includes(q.id));
}

export function isSideQuestActive(questId: string): boolean {
  const state = getQuestState();
  return state.activeQuests.includes(questId);
}

export function isSideQuestDone(questId: string): boolean {
  const state = getQuestState();
  return state.completedQuests.includes(questId);
}

export function getQuestProgress(questId: string): Record<string, boolean> {
  const state = getQuestState();
  return state.questProgress[questId] || {};
}

// ── Vinny Recommendation Reputation ──────────────────────

export function getVinnyReputation(): { followed: number; ignored: number } {
  return JSON.parse(localStorage.getItem("fnv_vinny_rep") || '{"followed":0,"ignored":0}');
}

export function recordVinnyRec(followed: boolean) {
  const rep = getVinnyReputation();
  if (followed) rep.followed++; else rep.ignored++;
  localStorage.setItem("fnv_vinny_rep", JSON.stringify(rep));
}

// ── NPC Relationship Memory ─────────────────────────────────

export function getNpcRelationship(npcType: string): number {
  try {
    const rels = JSON.parse(localStorage.getItem("fnv_npc_rels") || "{}");
    return rels[npcType] || 0;
  } catch {
    return 0;
  }
}

export function incrementNpcRelationship(npcType: string) {
  try {
    const rels = JSON.parse(localStorage.getItem("fnv_npc_rels") || "{}");
    rels[npcType] = (rels[npcType] || 0) + 1;
    localStorage.setItem("fnv_npc_rels", JSON.stringify(rels));
  } catch {
    // Storage unavailable - fail silently
  }
}
