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
];
const CUSTOMER_NAMES = ["Roger", "Jessica", "Liam", "Mom", "Laura", "George", "Kid", "Chris", "Sarah", "Roger", "Jessica", "Lily", "Brian", "Laura", "George", "Liam", "Jessica", "Bella", "Sarah", "Brian", "Kid", "Kid", "Kid", "Kid", "Kid", "Kid"];
const KID_CLIP_START = 20; // indices 20+ use kid_N.mp3 files
let customerInterval: ReturnType<typeof setInterval> | null = null;
let customerPlaying = false;

async function playRandomCustomerClip() {
  if (muted || customerPlaying || !audioUnlocked) return;
  customerPlaying = true;
  const idx = Math.floor(Math.random() * CUSTOMER_LINES.length);
  // Show subtitle
  const line = CUSTOMER_LINES[idx];
  const name = CUSTOMER_NAMES[idx];
  const wordCount = line.split(/\s+/).length;
  const duration = Math.max(2500, wordCount * 350);
  subtitleCallback?.(`${name}: "${line}"`, duration);
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    const clipFile = idx >= KID_CLIP_START ? `kid_${idx - KID_CLIP_START}` : `customer_${idx}`;
    const res = await fetch(`/sounds/${clipFile}.mp3`);
    if (!res.ok) { customerPlaying = false; return; }
    const ab = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(ab);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
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
