/**
 * sentiment.ts — Sentiment scoring system for NPC interactions.
 *
 * Analyzes player text for positive/negative tone, maps to XP deltas,
 * and tracks per-NPC rapport in localStorage.
 */

// ═══════════════════════════════════════════════════════════════
// §1 — PATTERN DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface SentimentPattern {
  regex: RegExp;
  score: number;
  label: string;
}

const POSITIVE_PATTERNS: SentimentPattern[] = [
  { regex: /\b(thanks|thank\s*you|thx|ty)\b/i, score: 2, label: 'gratitude' },
  { regex: /\b(you'?re\s+the\s+best|you'?re\s+awesome|you'?re\s+great)\b/i, score: 3, label: 'compliment' },
  { regex: /\b(awesome|great|cool|nice|sweet|rad|love)\b/i, score: 1, label: 'positive-word' },
  { regex: /\b(please|could\s+you|would\s+you)\b/i, score: 1, label: 'polite' },
  { regex: /\b(help|recommend|suggest)\b/i, score: 1, label: 'engagement' },
];

const NEGATIVE_PATTERNS: SentimentPattern[] = [
  { regex: /\b(stupid|dumb|idiot|moron|loser)\b/i, score: -3, label: 'insult' },
  { regex: /\b(hate|suck|worst|terrible|awful)\b/i, score: -2, label: 'hostility' },
  { regex: /\b(shut\s+up|go\s+away|leave\s+me\s+alone)\b/i, score: -2, label: 'dismissal' },
  { regex: /\b(whatever|don'?t\s+care|who\s+cares)\b/i, score: -1, label: 'apathy' },
  { regex: /[!?]{3,}/, score: -1, label: 'aggressive-punctuation' },
  { regex: /[A-Z]{5,}/, score: -1, label: 'shouting' },
];

// ═══════════════════════════════════════════════════════════════
// §2 — SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════

export type Tone = 'friendly' | 'neutral' | 'rude' | 'hostile';

export interface SentimentResult {
  score: number;
  tone: Tone;
}

/**
 * Analyze a text string and return a sentiment score and tone.
 * Score is the sum of all matched pattern scores.
 * Tone is derived from the final score.
 */
export function analyzeSentiment(text: string): SentimentResult {
  let score = 0;

  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.regex.test(text)) {
      score += pattern.score;
    }
  }

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.regex.test(text)) {
      score += pattern.score;
    }
  }

  let tone: Tone;
  if (score >= 2) {
    tone = 'friendly';
  } else if (score >= 0) {
    tone = 'neutral';
  } else if (score >= -3) {
    tone = 'rude';
  } else {
    tone = 'hostile';
  }

  return { score, tone };
}

// ═══════════════════════════════════════════════════════════════
// §3 — XP DELTAS
// ═══════════════════════════════════════════════════════════════

const XP_DELTAS: Record<Tone, number> = {
  friendly: 5,
  neutral: 1,
  rude: -10,
  hostile: -25,
};

/**
 * Get the XP delta for a given tone.
 */
export function getXPDelta(tone: Tone): number {
  return XP_DELTAS[tone];
}

// ═══════════════════════════════════════════════════════════════
// §4 — PER-NPC RAPPORT TRACKING
// ═══════════════════════════════════════════════════════════════

const RAPPORT_STORAGE_KEY = 'fnv_npc_rapport';
const RAPPORT_MIN = -100;
const RAPPORT_MAX = 100;

/** Hostile threshold — NPC refuses to talk */
const HOSTILE_THRESHOLD = -50;
/** Friendly threshold — special dialogue unlocked */
const FRIENDLY_THRESHOLD = 50;

function clampRapport(value: number): number {
  return Math.max(RAPPORT_MIN, Math.min(RAPPORT_MAX, value));
}

function loadRapportMap(): Record<string, number> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(RAPPORT_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveRapportMap(map: Record<string, number>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(RAPPORT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Get the current rapport score for an NPC. Defaults to 0 (neutral).
 */
export function getNpcRapport(npcId: string): number {
  const map = loadRapportMap();
  return map[npcId] ?? 0;
}

/**
 * Update an NPC's rapport by the given delta. Clamped to [-100, +100].
 * Returns the new rapport value.
 */
export function updateNpcRapport(npcId: string, delta: number): number {
  const map = loadRapportMap();
  const current = map[npcId] ?? 0;
  const next = clampRapport(current + delta);
  map[npcId] = next;
  saveRapportMap(map);
  return next;
}

/**
 * Check if an NPC is hostile toward the player (rapport below -50).
 * Hostile NPCs refuse to talk.
 */
export function isNpcHostile(npcId: string): boolean {
  return getNpcRapport(npcId) <= HOSTILE_THRESHOLD;
}

/**
 * Check if an NPC is friendly toward the player (rapport above +50).
 * Friendly NPCs unlock special dialogue.
 */
export function isNpcFriendly(npcId: string): boolean {
  return getNpcRapport(npcId) >= FRIENDLY_THRESHOLD;
}
