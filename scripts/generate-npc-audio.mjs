/**
 * generate-npc-audio.mjs — Pre-generate all NPC dialogue lines as static MP3 files
 * via ElevenLabs text-to-speech API.
 *
 * Sources:
 *   1. src/lib/era-npc-scripts.ts        — era-specific conversation topic `lines` arrays
 *   2. src/lib/npc-behavior.ts           — generic CONVERSATION_TOPICS `lines` arrays
 *   3. src/lib/npc-dialogues.ts          — Vinny/Charlie/Customer dialogue tree NPC lines
 *   4. src/lib/npc-customer-dialogues.ts — personality-driven npcResponse + followUp.npcText
 *   5. src/lib/npc-conversations.ts      — overheard NPC-NPC conversation `text` fields
 *   6. src/lib/npc-personalities.ts      — personality greetings
 *
 * Voice configs are defined inline (copied from npc-voices.ts).
 * Outputs MP3s to public/sounds/npc/{md5(voiceId:text)}.mp3.
 *
 * Usage: node scripts/generate-npc-audio.mjs
 */

import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const OUTPUT_DIR = path.join(ROOT, "public", "sounds", "npc");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const SRC_LIB = path.join(ROOT, "src", "lib");

const MAX_CONCURRENCY = 2;

// ═══════════════════════════════════════════════════════════════
// §1 — Inline voice configs (from npc-voices.ts)
// ═══════════════════════════════════════════════════════════════

const MODEL = "eleven_flash_v2_5";

/** @type {Record<string, {voiceId:string, stability:number, similarityBoost:number, style?:number}>} */
const VOICES = {
  movie_buff:   { voiceId: "nPczCjzI2devNBz1zQrb", stability: 0.5, similarityBoost: 0.75 },
  parent:       { voiceId: "XrExE9yKIg1WjnnlVkGX", stability: 0.4, similarityBoost: 0.75 },
  teenager:     { voiceId: "FGY2WhTYpPnrIDTdsKH5", stability: 0.3, similarityBoost: 0.75 },
  couple_m:     { voiceId: "cjVigY5qzO86Huf0OWal", stability: 0.5, similarityBoost: 0.75 },
  couple_f:     { voiceId: "cgSgspJ2msm6clMCkdW9", stability: 0.4, similarityBoost: 0.75 },
  regular:      { voiceId: "SAz9YHcvj6GT2YYXdXww", stability: 0.5, similarityBoost: 0.75 },
  newbie:       { voiceId: "FGY2WhTYpPnrIDTdsKH5", stability: 0.4, similarityBoost: 0.75 },
  kid:          { voiceId: "FGY2WhTYpPnrIDTdsKH5", stability: 0.2, similarityBoost: 0.75, style: 0.6 },
  critic:       { voiceId: "JBFqnCBsd6RMkjVDRZzb", stability: 0.7, similarityBoost: 0.75, style: 0.2 },
  vinny:        { voiceId: "IKne3meq5aSn9XLyUdCD", stability: 0.3, similarityBoost: 0.75, style: 0.4 },
  charlie:      { voiceId: "TX3LPaxmHKxFdv7VOQHJ", stability: 0.4, similarityBoost: 0.75, style: 0.5 },
  pizza_clerk:  { voiceId: "iP95p4xoKVk53GoZ742B", stability: 0.5, similarityBoost: 0.75 },
  laundromat_attendant: { voiceId: "CwhRBWXzGAHq8TQ4Fs17", stability: 0.5, similarityBoost: 0.75 },
};

// ═══════════════════════════════════════════════════════════════
// §2 — Load API key from .env.local
// ═══════════════════════════════════════════════════════════════

async function loadApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const text = await readFile(ENV_PATH, "utf8");
  const m = text.match(/^ELEVENLABS_API_KEY=(.+)$/m);
  if (!m) throw new Error("ELEVENLABS_API_KEY not found in .env.local or environment");
  return m[1].trim();
}

// ═══════════════════════════════════════════════════════════════
// §3 — Dialogue extraction (regex-parse TS source files)
// ═══════════════════════════════════════════════════════════════

/**
 * Extract quoted strings from `lines: [...]` arrays in era-npc-scripts.ts
 * and npc-behavior.ts CONVERSATION_TOPICS. These are ambient NPC-NPC chatter
 * lines — simple string arrays.
 */
function extractLinesArrayStrings(source) {
  const results = [];
  const blockRe = /lines:\s*\[([\s\S]*?)\]/g;
  let block;
  while ((block = blockRe.exec(source)) !== null) {
    const strRe = /"([^"]{20,})"/g;
    let s;
    while ((s = strRe.exec(block[1])) !== null) {
      results.push(s[1]);
    }
  }
  return results;
}

/**
 * Extract npcResponse and followUp.npcText from npc-customer-dialogues.ts.
 * These are personality-driven customer NPC spoken lines.
 */
function extractCustomerDialogueNpcLines(source) {
  const results = [];
  const re = /(?:npcResponse|npcText):\s*"([^"]{20,})"/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    results.push(m[1]);
  }
  return results;
}

/**
 * Extract NPC-spoken lines from dialogue trees in npc-dialogues.ts.
 * Pattern: speaker: "Name", portrait: "X", text: "..."
 * Only captures the `text` from nodes where a speaker is set (NPC lines),
 * not player response `text` fields.
 */
function extractDialogueTreeNpcLines(source) {
  const results = [];
  const re = /speaker:\s*"(\w+)"[\s\S]*?text:\s*"([^"]{20,})"/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const speaker = m[1];
    const text = m[2];
    if (text.includes("${") || text.includes("__")) continue; // skip templates
    results.push({ speaker, text });
  }
  return results;
}

/**
 * Extract text fields from NPC_CONVERSATIONS in npc-conversations.ts.
 * Pattern: { speaker: "...", text: "...", delay: N }
 */
function extractConversationTextFields(source) {
  const results = [];
  const re = /speaker:\s*"(\w+)",\s*text:\s*"([^"]{20,})"/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    results.push({ speaker: m[1], text: m[2] });
  }
  return results;
}

/**
 * Extract personality greetings from npc-personalities.ts.
 * Pattern: greetings: ['...', '...'] or greetings: ["...", "..."]
 */
function extractPersonalityGreetings(source) {
  const results = [];
  const blockRe = /greetings:\s*\[([\s\S]*?)\]/g;
  let block;
  while ((block = blockRe.exec(source)) !== null) {
    // Single-quoted strings
    const sqRe = /'([^']{20,})'/g;
    let s;
    while ((s = sqRe.exec(block[1])) !== null) results.push(s[1]);
    // Double-quoted strings
    const dqRe = /"([^"]{20,})"/g;
    while ((s = dqRe.exec(block[1])) !== null) results.push(s[1]);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// §4 — Voice assignment
// ═══════════════════════════════════════════════════════════════

/**
 * Map a speaker name to a voice config key.
 */
function speakerToVoice(speaker) {
  const lower = (speaker || "").toLowerCase();
  if (lower === "vinny") return "vinny";
  if (lower === "charlie") return "charlie";
  if (lower === "kid") return "kid";
  if (lower === "teen") return "teenager";
  if (lower === "mom") return "parent";
  if (lower === "dad") return "regular";
  if (lower === "friend") return "teenager";
  // Customer, generic fallback
  return "regular";
}

// ═══════════════════════════════════════════════════════════════
// §5 — Hash + file helpers
// ═══════════════════════════════════════════════════════════════

function md5(voiceId, text) {
  return createHash("md5").update(`${voiceId}:${text}`).digest("hex");
}

async function exists(fp) {
  try { await access(fp); return true; } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
// §6 — ElevenLabs TTS
// ═══════════════════════════════════════════════════════════════

async function callTTS(apiKey, voiceCfg, text) {
  const voiceSettings = {
    stability: voiceCfg.stability,
    similarity_boost: voiceCfg.similarityBoost,
  };
  if (voiceCfg.style) voiceSettings.style = voiceCfg.style;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceCfg.voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: voiceSettings,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ═══════════════════════════════════════════════════════════════
// §7 — Concurrency-limited worker pool
// ═══════════════════════════════════════════════════════════════

async function runPool(items, concurrency, fn) {
  let idx = 0;
  const errors = [];

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await fn(items[i], i);
      } catch (err) {
        errors.push({ item: items[i], error: err });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return errors;
}

// ═══════════════════════════════════════════════════════════════
// §8 — Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  // 0. Ensure output dir
  await mkdir(OUTPUT_DIR, { recursive: true });

  // 1. API key
  console.log("[1/7] Loading ELEVENLABS_API_KEY...");
  const apiKey = await loadApiKey();
  console.log("  OK");

  // 2. Read all source files
  console.log("[2/7] Reading source files...");
  const read = (f) => readFile(path.join(SRC_LIB, f), "utf8");
  const [eraScripts, behavior, dialogues, customerDialogues, conversations, personalities] =
    await Promise.all([
      read("era-npc-scripts.ts"),
      read("npc-behavior.ts"),
      read("npc-dialogues.ts"),
      read("npc-customer-dialogues.ts"),
      read("npc-conversations.ts"),
      read("npc-personalities.ts"),
    ]);
  console.log("  6 files loaded");

  // 3. Extract dialogue lines
  console.log("[3/7] Extracting dialogue lines...");

  /** @type {Map<string, {text:string, voiceKey:string}>} hash -> entry */
  const unique = new Map();

  function add(text, voiceKey) {
    const cfg = VOICES[voiceKey];
    if (!cfg) return;
    const hash = md5(cfg.voiceId, text);
    if (!unique.has(hash)) {
      unique.set(hash, { text, voiceKey, voiceId: cfg.voiceId, hash });
    }
  }

  // (a) era-npc-scripts.ts + npc-behavior.ts — ambient lines arrays (use regular voice)
  for (const text of extractLinesArrayStrings(eraScripts)) add(text, "regular");
  for (const text of extractLinesArrayStrings(behavior)) add(text, "regular");

  // (b) npc-customer-dialogues.ts — NPC response lines (use regular voice)
  for (const text of extractCustomerDialogueNpcLines(customerDialogues)) add(text, "regular");

  // (c) npc-dialogues.ts — dialogue tree NPC lines (voice by speaker)
  for (const { speaker, text } of extractDialogueTreeNpcLines(dialogues)) {
    add(text, speakerToVoice(speaker));
  }

  // (d) npc-conversations.ts — overheard conversation lines (voice by speaker)
  for (const { speaker, text } of extractConversationTextFields(conversations)) {
    add(text, speakerToVoice(speaker));
  }

  // (e) npc-personalities.ts — greetings (use regular voice)
  for (const text of extractPersonalityGreetings(personalities)) add(text, "regular");

  const entries = Array.from(unique.values());
  console.log(`  ${entries.length} unique voiceId:text combinations`);

  // 4. Filter out already-cached
  console.log("[4/7] Checking cache...");
  const toGenerate = [];
  for (const entry of entries) {
    const mp3 = path.join(OUTPUT_DIR, `${entry.hash}.mp3`);
    if (await exists(mp3)) continue;
    toGenerate.push(entry);
  }
  const cached = entries.length - toGenerate.length;
  console.log(`  ${cached} already cached, ${toGenerate.length} to generate`);

  // 5. Generate TTS
  if (toGenerate.length === 0) {
    console.log("[5/7] Nothing to generate — all cached.");
  } else {
    console.log(`[5/7] Generating ${toGenerate.length} MP3s (concurrency=${MAX_CONCURRENCY})...`);
    let done = 0;
    const errors = await runPool(toGenerate, MAX_CONCURRENCY, async (entry) => {
      const buf = await callTTS(apiKey, VOICES[entry.voiceKey], entry.text);
      await writeFile(path.join(OUTPUT_DIR, `${entry.hash}.mp3`), buf);
      done++;
      if (done % 10 === 0 || done === toGenerate.length) {
        console.log(`  ${done}/${toGenerate.length} done`);
      }
    });

    if (errors.length > 0) {
      console.error(`\n  ${errors.length} error(s):`);
      for (const { item, error } of errors) {
        console.error(`    [${item.hash}] "${item.text.slice(0, 60)}..." — ${error.message}`);
      }
    }

    const ok = toGenerate.length - errors.length;
    console.log(`  Generated ${ok} MP3s, ${errors.length} failed`);
  }

  // 6. Write manifest
  console.log("[6/7] Writing manifest.json...");
  const manifest = {};
  for (const entry of entries) {
    manifest[entry.hash] = {
      text: entry.text,
      voiceId: entry.voiceId,
      voiceKey: entry.voiceKey,
      file: `${entry.hash}.mp3`,
    };
  }
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`  ${Object.keys(manifest).length} entries -> ${MANIFEST_PATH}`);

  // 7. Summary
  console.log("[7/7] Done!");
  console.log(`  Total: ${entries.length} lines | Cached: ${cached} | Generated: ${toGenerate.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
