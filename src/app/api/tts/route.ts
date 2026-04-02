import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const DEFAULT_VOICE_ID = "IKne3meq5aSn9XLyUdCD"; // Vinny default
const CACHE_DIR = path.join(process.cwd(), ".tts-cache");

// Ensure cache dir exists
if (!existsSync(CACHE_DIR)) {
  try { mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
}

function getCacheKey(voiceId: string, text: string, model: string, stability: number, similarity: number): string {
  return createHash("md5").update(`${voiceId}:${model}:${stability}:${similarity}:${text}`).digest("hex");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text");
  const voiceId = searchParams.get("voice") || DEFAULT_VOICE_ID;
  const stability = parseFloat(searchParams.get("stability") || "0.5");
  const similarityBoost = parseFloat(searchParams.get("similarity") || "0.75");
  const style = parseFloat(searchParams.get("style") || "0");
  const model = searchParams.get("model") || "eleven_flash_v2_5";

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing or empty 'text' query parameter" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Text must be 500 characters or fewer" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
  }

  // Check disk cache first
  const cacheKey = getCacheKey(voiceId, text, model, stability, similarityBoost);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);

  if (existsSync(cachePath)) {
    const cached = readFileSync(cachePath);
    return new Response(cached, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800",
        "X-TTS-Cache": "hit",
      },
    });
  }

  try {
    const voiceSettings: Record<string, unknown> = {
      stability,
      similarity_boost: similarityBoost,
    };
    if (style > 0) voiceSettings.style = style;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: voiceSettings,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs API error (${response.status}):`, errorBody);
      return NextResponse.json({ error: "Text-to-speech generation failed" }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    // Write to disk cache
    try {
      writeFileSync(cachePath, Buffer.from(audioBuffer));
    } catch (e) {
      console.error("TTS cache write error:", e);
    }

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800",
        "X-TTS-Cache": "miss",
      },
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
