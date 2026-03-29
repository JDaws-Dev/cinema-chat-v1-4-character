let audioContext: AudioContext | null = null;
let isPlaying = false;
let muted = false;

// Subtitle callback — set by the game page to display subtitles
let subtitleCallback: ((text: string, duration: number) => void) | null = null;

export function setSubtitleHandler(cb: (text: string, duration: number) => void) {
  subtitleCallback = cb;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted(): boolean { return muted; }

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
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

export async function playVinnyLine(text: string): Promise<void> {
  if (isPlaying) return;

  // Always show subtitle, even when muted
  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(2000, wordCount * 400); // ~400ms per word
  subtitleCallback?.(`Vinny: "${text}"`, duration);

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
} as const;

export async function playRandomLine(
  category: keyof typeof VINNY_LINES,
): Promise<void> {
  const lines = VINNY_LINES[category];
  const line = lines[Math.floor(Math.random() * lines.length)];
  await playVinnyLine(line);
}
