/**
 * npc-voices.ts — ElevenLabs voice ID mapping for NPC personalities.
 *
 * Maps PersonalityType (from npc-personalities.ts) to ElevenLabs voice
 * configurations, and provides named voice configs for specific NPCs
 * like Vinny, Charlie, the pizza clerk, and laundromat attendant.
 */

import type { PersonalityType } from './npc-personalities';

// ═══════════════════════════════════════════════════════════════
// §1 — TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const NPC_VOICE_MODEL = 'eleven_flash_v2_5';

export interface VoiceConfig {
  voiceId: string;
  voiceName: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  model: string;
}

// ═══════════════════════════════════════════════════════════════
// §2 — PERSONALITY VOICE MAP
// ═══════════════════════════════════════════════════════════════

/** Couple has two voices — male and female */
export interface CoupleVoiceConfig {
  male: VoiceConfig;
  female: VoiceConfig;
}

const PERSONALITY_VOICES: Record<Exclude<PersonalityType, 'couple'>, VoiceConfig> & { couple: CoupleVoiceConfig } = {
  movie_buff: {
    voiceId: 'nPczCjzI2devNBz1zQrb',
    voiceName: 'Brian',
    stability: 0.5,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  parent: {
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    voiceName: 'Matilda',
    stability: 0.4,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  teenager: {
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    voiceName: 'Laura',
    stability: 0.3,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  couple: {
    male: {
      voiceId: 'cjVigY5qzO86Huf0OWal',
      voiceName: 'Eric',
      stability: 0.5,
      similarityBoost: 0.75,
      model: NPC_VOICE_MODEL,
    },
    female: {
      voiceId: 'cgSgspJ2msm6clMCkdW9',
      voiceName: 'Jessica',
      stability: 0.4,
      similarityBoost: 0.75,
      model: NPC_VOICE_MODEL,
    },
  },
  regular: {
    voiceId: 'SAz9YHcvj6GT2YYXdXww',
    voiceName: 'River',
    stability: 0.5,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  newbie: {
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    voiceName: 'Laura',
    stability: 0.4,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  kid: {
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    voiceName: 'Laura',
    stability: 0.2,
    similarityBoost: 0.75,
    style: 0.6,
    model: NPC_VOICE_MODEL,
  },
  critic: {
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    voiceName: 'George',
    stability: 0.7,
    similarityBoost: 0.75,
    style: 0.2,
    model: NPC_VOICE_MODEL,
  },
};

// ═══════════════════════════════════════════════════════════════
// §3 — NAMED NPC VOICES
// ═══════════════════════════════════════════════════════════════

type NamedNPC = 'vinny' | 'charlie' | 'pizza_clerk' | 'laundromat_attendant';

const NAMED_VOICES: Record<NamedNPC, VoiceConfig> = {
  vinny: {
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    voiceName: 'Vinny',
    stability: 0.3,
    similarityBoost: 0.75,
    style: 0.4,
    model: NPC_VOICE_MODEL,
  },
  charlie: {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    voiceName: 'Liam',
    stability: 0.4,
    similarityBoost: 0.75,
    style: 0.5,
    model: NPC_VOICE_MODEL,
  },
  pizza_clerk: {
    voiceId: 'iP95p4xoKVk53GoZ742B',
    voiceName: 'Chris',
    stability: 0.5,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
  laundromat_attendant: {
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
    voiceName: 'Roger',
    stability: 0.5,
    similarityBoost: 0.75,
    model: NPC_VOICE_MODEL,
  },
};

// ═══════════════════════════════════════════════════════════════
// §4 — PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get the voice configuration for a personality type.
 * For 'couple', returns the male voice by default.
 * Use getCoupleVoiceConfigs() for both voices.
 */
export function getVoiceConfig(personalityType: PersonalityType): VoiceConfig {
  if (personalityType === 'couple') {
    return PERSONALITY_VOICES.couple.male;
  }
  return PERSONALITY_VOICES[personalityType];
}

/**
 * Get both voice configs for the couple personality.
 */
export function getCoupleVoiceConfigs(): CoupleVoiceConfig {
  return PERSONALITY_VOICES.couple;
}

/**
 * Get the voice configuration for a named NPC (vinny, charlie, etc.).
 * Returns undefined if the name is not recognized.
 */
export function getNamedVoiceConfig(name: string): VoiceConfig | undefined {
  return NAMED_VOICES[name as NamedNPC];
}
