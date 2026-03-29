let audioContext: AudioContext | null = null;
let isPlaying = false;
let muted = false;
let audioUnlocked = false;

// Subtitle callback — set by the game page to display subtitles
let subtitleCallback: ((text: string, duration: number) => void) | null = null;

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
      gain.gain.value = track.volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
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
}

// ── Customer conversation audio ─────────────────────────
// Randomly plays customer chatter clips at intervals for atmosphere
const CUSTOMER_CLIP_COUNT = 20;
let customerInterval: ReturnType<typeof setInterval> | null = null;
let customerPlaying = false;

async function playRandomCustomerClip() {
  if (muted || customerPlaying || !audioUnlocked) return;
  customerPlaying = true;
  const idx = Math.floor(Math.random() * CUSTOMER_CLIP_COUNT);
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    const res = await fetch(`/sounds/customer_${idx}.mp3`);
    if (!res.ok) { customerPlaying = false; return; }
    const ab = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(ab);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.25; // moderate volume — background chatter
    source.connect(gain);
    gain.connect(ctx.destination);
    source.onended = () => { customerPlaying = false; };
    source.start(0);
  } catch { customerPlaying = false; }
}

export function startCustomerChatter() {
  if (customerInterval) return;
  // Play first clip after 5-10s, then every 15-30s
  setTimeout(() => {
    playRandomCustomerClip();
    customerInterval = setInterval(() => {
      playRandomCustomerClip();
    }, 15000 + Math.random() * 15000); // 15-30s between clips
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
