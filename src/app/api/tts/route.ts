import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "IKne3meq5aSn9XLyUdCD"; // Charlie - Deep, Confident, Energetic

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text");
  const voiceId = searchParams.get("voice") || DEFAULT_VOICE_ID;

  if (!text || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'text' query parameter" },
      { status: 400 },
    );
  }

  if (text.length > 500) {
    return NextResponse.json(
      { error: "Text must be 500 characters or fewer" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 },
    );
  }

  try {
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
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `ElevenLabs API error (${response.status}):`,
        errorBody,
      );
      return NextResponse.json(
        { error: "Text-to-speech generation failed" },
        { status: 500 },
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
