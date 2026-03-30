import { ERA_CONVERSATIONS, type EraConversationSet } from './era-conversations';

let audioContext: AudioContext | null = null;
let isPlaying = false;
let muted = false;
let musicMuted = false;
let audioUnlocked = false;

// ── Current era for conversation selection ──
let currentEraId = "early90s";

export function setCurrentEra(eraId: string) {
  currentEraId = eraId;
}

export function getCurrentEra(): string {
  return currentEraId;
}

/** Map era years string (e.g. "1990-1993") to era ID */
export function eraYearsToId(years: string): string {
  if (years.startsWith("1987") || years.startsWith("1988") || years.startsWith("1989")) return "late80s";
  if (years.startsWith("1990") || years.startsWith("1991") || years.startsWith("1992") || years.startsWith("1993")) return "early90s";
  if (years.startsWith("1994") || years.startsWith("1995") || years.startsWith("1996")) return "mid90s";
  if (years.startsWith("1997") || years.startsWith("1998") || years.startsWith("1999")) return "late90s";
  return "present";
}

function getEraConversations(): EraConversationSet {
  return ERA_CONVERSATIONS[currentEraId] || ERA_CONVERSATIONS["early90s"];
}

// Subtitle callback — set by the game page to display subtitles
let subtitleCallback: ((text: string, duration: number) => void) | null = null;

// ── Spatial audio: NPC position registry & player listener ──
const npcPositions = new Map<string, { x: number; z: number }>();

export function registerNPCPosition(id: string, x: number, z: number) {
  npcPositions.set(id, { x, z });
}

export function unregisterNPCPosition(id: string) {
  npcPositions.delete(id);
}

export function setPlayerPosition(x: number, z: number) {
  if (!audioContext) return;
  const listener = audioContext.listener;
  if (listener.positionX) {
    listener.positionX.value = x;
    listener.positionY.value = 1.6;
    listener.positionZ.value = z;
  } else {
    listener.setPosition(x, 1.6, z);
  }
}

/** Pick a random registered NPC position, or fall back to a random spot. */
function pickRandomNPCPosition(): { x: number; z: number } {
  const positions = Array.from(npcPositions.values());
  if (positions.length > 0) {
    return positions[Math.floor(Math.random() * positions.length)];
  }
  // Fallback: random position within the store
  return { x: (Math.random() - 0.5) * 12, z: (Math.random() - 0.5) * 8 };
}

/** Create a PannerNode positioned at the given world coordinates. */
function createSpatialPanner(ctx: AudioContext, pos: { x: number; z: number }): PannerNode {
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 2;
  panner.maxDistance = 15;
  panner.rolloffFactor = 1;
  if (panner.positionX) {
    panner.positionX.value = pos.x;
    panner.positionY.value = 1.0;
    panner.positionZ.value = pos.z;
  } else {
    panner.setPosition(pos.x, 1.0, pos.z);
  }
  return panner;
}

export function setSubtitleHandler(cb: (text: string, duration: number) => void) {
  subtitleCallback = cb;
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) {
    stopAmbient();
  } else {
    startAmbient();
  }
}
export function isMuted(): boolean { return muted; }

export function setMusicMuted(m: boolean) {
  musicMuted = m;
  if (muzakGain) {
    muzakGain.gain.value = m ? 0 : 0.12;
  }
}
export function isMusicMuted(): boolean { return musicMuted; }

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// ── Audio unlock on first user interaction ─────────────
// Browsers block AudioContext until user gesture. This ensures it gets resumed.
export function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      audioUnlocked = true;
      if (!muted) { startAmbient(); startCustomerChatter(); }
    });
  } else {
    audioUnlocked = true;
    if (!muted) { startAmbient(); startCustomerChatter(); }
  }
}

// ── Ambient store audio ─────────────────────────────────
// Layers: store muzak + fluorescent hum + customer murmur
let ambientSources: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
let ambientStarted = false;
let chatterTimeout: ReturnType<typeof setTimeout> | null = null;
let customerInterval: ReturnType<typeof setInterval> | null = null;
let muzakGain: GainNode | null = null;

const AMBIENT_TRACKS = [
  { file: "ambient_muzak", volume: 0.12 },
  { file: "ambient_hum", volume: 0.06 },
  { file: "ambient_chatter", volume: 0.08 },
];

async function startAmbient() {
  if (ambientStarted || muted || !audioUnlocked) return;
  ambientStarted = true;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  for (const track of AMBIENT_TRACKS) {
    try {
      const res = await fetch(`/sounds/${track.file}.mp3`);
      if (!res.ok) continue;
      const ab = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(ab);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      const isMuzak = track.file === "ambient_muzak";
      gain.gain.value = (isMuzak && musicMuted) ? 0 : track.volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      if (isMuzak) muzakGain = gain;
      ambientSources.push({ source, gain });
    } catch { /* missing file is fine — ambient is optional */ }
  }
}

function stopAmbient() {
  for (const { source } of ambientSources) {
    try { source.stop(); } catch { /* already stopped */ }
  }
  ambientSources = [];
  ambientStarted = false;
  if (customerInterval) { clearInterval(customerInterval); customerInterval = null; }
  if (chatterTimeout) { clearTimeout(chatterTimeout); chatterTimeout = null; }
}

// ── Customer conversation audio ─────────────────────────
// Single-line clips (one-liners) + multi-line conversations for atmosphere

interface ConversationLine { speaker: string; file: string; }
interface Conversation { lines: ConversationLine[]; texts: string[]; }

// ── Multi-line conversations ────────────────────────────
const CONVERSATIONS: Conversation[] = [
  // Conv 0 — Couple arguing about genre
  {
    lines: [
      { speaker: "Jessica", file: "conv_0_0" },
      { speaker: "Liam",    file: "conv_0_1" },
      { speaker: "Jessica", file: "conv_0_2" },
      { speaker: "Liam",    file: "conv_0_3" },
    ],
    texts: [
      "You ALWAYS pick action movies. Every single Friday.",
      "Because your rom-coms put me to sleep! Literally.",
      "Fine. Comedy. We can BOTH agree on comedy, right?",
      "Deal. But I'm picking the snacks.",
    ],
  },
  // Conv 1 — Kid begging parent
  {
    lines: [
      { speaker: "Kid",   file: "conv_1_0" },
      { speaker: "Bella", file: "conv_1_1" },
      { speaker: "Kid",   file: "conv_1_2" },
      { speaker: "Bella", file: "conv_1_3" },
    ],
    texts: [
      "Mom! Mom! Can we get this one? It's got robots AND dinosaurs!",
      "Honey, that's rated R. You know the rules.",
      "But Tyler at school said he watched it and he's fine!",
      "Tyler at school is not my kid. Pick something else.",
    ],
  },
  // Conv 2 — Family can't decide
  {
    lines: [
      { speaker: "Roger", file: "conv_2_0" },
      { speaker: "Kid",   file: "conv_2_1" },
      { speaker: "Bella", file: "conv_2_2" },
      { speaker: "Roger", file: "conv_2_3" },
      { speaker: "Bella", file: "conv_2_4" },
    ],
    texts: [
      "Alright gang, we need to pick ONE movie. Not three.",
      "I want the one with the dog!",
      "Can we please watch something that doesn't have explosions for once?",
      "What's wrong with explosions?",
      "Just... pick the dog movie. Everybody wins.",
    ],
  },
  // Conv 3 — Two friends debating
  {
    lines: [
      { speaker: "Liam",   file: "conv_3_0" },
      { speaker: "George", file: "conv_3_1" },
      { speaker: "Liam",   file: "conv_3_2" },
      { speaker: "George", file: "conv_3_3" },
    ],
    texts: [
      "Dude, Terminator 2 is the greatest sequel ever made.",
      "I respect that, but Godfather Part Two exists.",
      "Okay but does the Godfather have a liquid metal robot?",
      "...I'll give you that one.",
    ],
  },
  // Conv 4 — Nostalgic couple
  {
    lines: [
      { speaker: "Roger", file: "conv_4_0" },
      { speaker: "Laura", file: "conv_4_1" },
      { speaker: "Roger", file: "conv_4_2" },
    ],
    texts: [
      "Hey, remember our first date? We rented Ghostbusters and burned the popcorn.",
      "We set off the smoke alarm and your roommate called the fire department.",
      "Best night of my life though.",
    ],
  },
  // Conv 5 — Customer and friend
  {
    lines: [
      { speaker: "Laura",   file: "conv_5_0" },
      { speaker: "Jessica", file: "conv_5_1" },
      { speaker: "Laura",   file: "conv_5_2" },
      { speaker: "Jessica", file: "conv_5_3" },
    ],
    texts: [
      "I heard this one is supposed to be really scary.",
      "Good scary or like, stupid scary?",
      "Like, don't-watch-it-alone scary.",
      "Perfect. Grab two copies, one for me and one for my nightmares.",
    ],
  },
];

// ── One-liner clips (existing single-line customer/kid clips) ──
const CUSTOMER_LINES = [
  "Have you seen Die Hard? It's not just a Christmas movie, it's THE Christmas movie.",
  "No way, the sequel is ALWAYS worse. Name one sequel that's better.",
  "Empire Strikes Back. Boom. Argument over.",
  "Excuse me, do you know if they have Jurassic Park? My kids have been begging me all week.",
  "Oh my gosh, they finally got Titanic back in stock!",
  "I can never decide between comedy and horror on a Friday night.",
  "My mom said I can rent two if I pick something the whole family can watch.",
  "Dude, you HAVE to watch The Matrix. It will blow your mind.",
  "Be kind, rewind! I almost forgot last time and got charged extra.",
  "What do you mean there's a late fee? I returned it on Tuesday!",
  "Can we PLEASE get pizza after this? There's a pizza place right next door.",
  "This is the third Friday in a row you've picked an action movie. It's my turn to choose.",
  "I heard the new Adam Sandler movie is hilarious. Let's get that one.",
  "Look at these candy prices. A dollar fifty for Junior Mints? Totally worth it though.",
  "Remember when we used to come here every single Friday? Those were the best days.",
  "Five day rental? Sweet, that means we don't have to rush back Sunday.",
  "I just want something scary. Like really scary. Like hide under the blanket scary.",
  "The guy at the counter recommended this one. He hasn't steered me wrong yet.",
  "Ooh they have a new releases wall! Let's see what's hot this week.",
  "Last time we rented three movies and only watched one. Classic Friday night.",
  // Kid lines (indices 20-25, files: kid_0.mp3 through kid_5.mp3)
  "Mom, can we get THIS one? Pleeeeease?",
  "I want the one with the dinosaurs!",
  "Can I get candy too? They have Sour Patch Kids!",
  "This store is so cool. I wanna work here when I grow up.",
  "I already watched that one like a hundred times.",
  "Is this one scary? I dont wanna have nightmares again.",
  // Tarantino lines (indices 26-30, files: tarantino_0.mp3 through tarantino_4.mp3)
  "You know what the problem with movies today is? Nobody takes RISKS anymore. Give me a Reservoir Dogs over any of this safe studio garbage.",
  "That right there? That is a MASTERPIECE and I will fight anyone who says otherwise. The dialogue alone is worth the rental fee ten times over.",
  "See, what people dont understand about cinema is its not about the PLOT. Its about the MOMENTS. The little moments between characters. Thats where the magic lives.",
  "If you havent seen Taxi Driver at LEAST five times, we cant even have this conversation. Im serious. Go rent it. Right now.",
  "Every frame of that film is a painting. Every single frame. And the soundtrack? Dont even get me started on the soundtrack.",
];
const CUSTOMER_NAMES = ["Roger", "Jessica", "Liam", "Mom", "Laura", "George", "Kid", "Chris", "Sarah", "Roger", "Jessica", "Lily", "Brian", "Laura", "George", "Liam", "Jessica", "Bella", "Sarah", "Brian", "Kid", "Kid", "Kid", "Kid", "Kid", "Kid", "Quentin", "Quentin", "Quentin", "Quentin", "Quentin"];
const KID_CLIP_START = 20; // indices 20-25 use kid_N.mp3 files
const TARANTINO_CLIP_START = 26; // indices 26+ use tarantino_N.mp3 files

let customerPlaying = false;
let conversationPlaying = false;

// ── Play a single one-liner clip ────────────────────────
// Era-aware: picks from era-specific one-liners first, falls back to legacy audio clips
async function playRandomCustomerClip() {
  if (muted || customerPlaying || conversationPlaying || !audioUnlocked) return;
  customerPlaying = true;

  const eraSet = getEraConversations();
  const eraLine = eraSet.oneLiners[Math.floor(Math.random() * eraSet.oneLiners.length)];
  const { speaker, text } = eraLine;

  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(2500, wordCount * 350);
  subtitleCallback?.(`${speaker}: "${text}"`, duration);

  // Check if this line matches a legacy audio clip (exact text match)
  const legacyIdx = CUSTOMER_LINES.indexOf(text);
  if (legacyIdx >= 0) {
    // Has a pre-recorded audio file — play it with spatial audio
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const clipFile = legacyIdx >= TARANTINO_CLIP_START ? `tarantino_${legacyIdx - TARANTINO_CLIP_START}` : legacyIdx >= KID_CLIP_START ? `kid_${legacyIdx - KID_CLIP_START}` : `customer_${legacyIdx}`;
      const res = await fetch(`/sounds/${clipFile}.mp3`);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(ab);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.3;
        const panner = createSpatialPanner(ctx, pickRandomNPCPosition());
        source.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
        source.onended = () => { customerPlaying = false; };
        source.start(0);
        return;
      }
    } catch { /* fall through to subtitle-only */ }
  }

  // Subtitle-only mode: wait the duration, no audio fetch
  setTimeout(() => { customerPlaying = false; }, duration);
}

// ── Play a multi-line conversation sequentially ─────────
// Era-aware: picks from era-specific conversations, falls back to legacy audio when available
async function playRandomConversation() {
  if (muted || customerPlaying || conversationPlaying || !audioUnlocked) return;
  conversationPlaying = true;

  const eraSet = getEraConversations();
  const eraConv = eraSet.conversations[Math.floor(Math.random() * eraSet.conversations.length)];

  const ctx = getAudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  // All lines in a conversation come from the same spatial position
  const npcPos = pickRandomNPCPosition();

  for (let i = 0; i < eraConv.lines.length; i++) {
    if (muted) { conversationPlaying = false; return; }

    const { speaker, text } = eraConv.lines[i];
    const wordCount = text.split(/\s+/).length;
    const subtitleDuration = Math.max(2500, wordCount * 350);
    subtitleCallback?.(`${speaker}: "${text}"`, subtitleDuration);

    // Check if this exact line matches a legacy conversation clip
    let playedAudio = false;
    for (const legacyConv of CONVERSATIONS) {
      const textIdx = legacyConv.texts.indexOf(text);
      if (textIdx >= 0) {
        try {
          const file = legacyConv.lines[textIdx].file;
          const res = await fetch(`/sounds/${file}.mp3`);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const buffer = await ctx.decodeAudioData(ab);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = 0.3;
            const panner = createSpatialPanner(ctx, npcPos);
            source.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);
            await new Promise<void>(resolve => {
              source.onended = () => resolve();
              source.start(0);
            });
            playedAudio = true;
          }
        } catch { /* fall through to subtitle-only */ }
        break;
      }
    }

    // Subtitle-only: wait the appropriate duration
    if (!playedAudio) {
      await new Promise(r => setTimeout(r, subtitleDuration));
    }

    // 1.5s pause between lines (except after last line)
    if (i < eraConv.lines.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  conversationPlaying = false;
}

// ── Schedule next chatter event ─────────────────────────
function scheduleNextChatter() {
  if (muted || !audioUnlocked) return;
  // 20-40 seconds between any audio event
  const delay = 20000 + Math.random() * 20000;
  chatterTimeout = setTimeout(() => {
    if (muted || !audioUnlocked) return;
    // 50% conversation, 50% one-liner
    if (Math.random() < 0.5) {
      playRandomConversation().finally(scheduleNextChatter);
    } else {
      playRandomCustomerClip();
      // One-liners are short — wait for them to finish then schedule next
      const waitForFinish = () => {
        if (customerPlaying) {
          setTimeout(waitForFinish, 500);
        } else {
          scheduleNextChatter();
        }
      };
      setTimeout(waitForFinish, 500);
    }
  }, delay);
}

export function startCustomerChatter() {
  if (chatterTimeout || customerInterval) return;
  // Play first clip after 5-10s
  setTimeout(() => {
    playRandomCustomerClip();
    // After first clip finishes, start the alternating schedule
    const waitForFirst = () => {
      if (customerPlaying) {
        setTimeout(waitForFirst, 500);
      } else {
        scheduleNextChatter();
      }
    };
    setTimeout(waitForFirst, 500);
  }, 5000 + Math.random() * 5000);
}

// Cached SFX buffers
const sfxCache: Map<string, AudioBuffer> = new Map();

export async function playSFX(name: string): Promise<void> {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();

    let buffer = sfxCache.get(name);
    if (!buffer) {
      const res = await fetch(`/sounds/${name}.mp3`);
      if (!res.ok) return;
      const ab = await res.arrayBuffer();
      buffer = await ctx.decodeAudioData(ab);
      sfxCache.set(name, buffer);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch { /* silent */ }
}

export async function playVinnyLine(text: string, speaker = "Vinny"): Promise<void> {
  if (isPlaying) return;

  // Always show subtitle, even when muted
  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(2000, wordCount * 400); // ~400ms per word
  subtitleCallback?.(`${speaker}: "${text}"`, duration);

  if (muted) return;

  try {
    isPlaying = true;

    const ctx = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const response = await fetch(
      `/api/tts?text=${encodeURIComponent(text)}`,
    );

    if (!response.ok) {
      isPlaying = false;
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = () => {
      isPlaying = false;
    };

    source.start(0);
  } catch {
    isPlaying = false;
  }
}

export const VINNY_LINES = {
  greetings: [
    "Welcome to Friday Night Video! Best selection in town.",
    "Hey there! Looking for something to watch tonight?",
    "G'day mate! Let me know if you need any recommendations.",
  ],
  checkout: [
    "Great pick! That's a classic right there.",
    "Ooh, solid choice. You've got good taste!",
    "Nice! Remember, be kind, rewind!",
  ],
  challenge_start: [
    "Think you can find 'em all? Clock's ticking!",
    "Alright, your movie night list is ready. Go go go!",
  ],
  challenge_complete: [
    "You found 'em all! Now THAT'S a movie night!",
    "Impressive! You really know your way around the store.",
  ],
  challenge_fail: [
    "Aw, time's up! Better luck next time, mate.",
    "So close! Give it another shot.",
  ],
  pickup: [
    "Good eye!",
    "Nice find!",
    "That's a great one!",
  ],
  charlie_tips: [
    "Have you checked out the new releases? Some real gems this week.",
    "If you like horror, the back row has some hidden classics.",
    "Pro tip: the comedy section is always worth a browse on a Friday night.",
    "Looking for something? I know where everything is in this store.",
    "The classics section is underrated. Trust me on that.",
    "Need a recommendation? You can't go wrong with anything on the top shelf.",
  ],
} as const;

export async function playRandomLine(
  category: keyof typeof VINNY_LINES,
): Promise<void> {
  const lines = VINNY_LINES[category];
  const line = lines[Math.floor(Math.random() * lines.length)];
  await playVinnyLine(line);
}
