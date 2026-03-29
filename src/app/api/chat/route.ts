import OpenAI from "openai";
import { buildSystemPrompt } from "@/lib/vinny-prompt";

/* ── Rate limiter (in-memory, per IP) ────────────────────── */
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function cleanupStaleEntries() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}

// Periodic cleanup every 60s to avoid unbounded growth
let lastCleanup = Date.now();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (now - lastCleanup > RATE_LIMIT_WINDOW_MS) {
    cleanupStaleEntries();
    lastCleanup = now;
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/* ── Input validation ────────────────────────────────────── */
function validateBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Invalid request body";
  const { messages, preferences } = body as Record<string, unknown>;

  if (!Array.isArray(messages)) return "messages must be an array";
  if (messages.length > 50) return "messages must have at most 50 entries";
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") return "Each message must be an object";
    const m = msg as Record<string, unknown>;
    if (typeof m.role !== "string") return "Each message must have a string role";
    if (typeof m.content !== "string") return "Each message must have a string content";
    if ((m.content as string).length > 5000) return "Message content must be at most 5000 characters";
  }

  if (preferences !== undefined) {
    if (!Array.isArray(preferences)) return "preferences must be an array";
    if (preferences.length > 50) return "preferences must have at most 50 entries";
  }

  return null;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests — slow down and try again in a minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let openai: OpenAI;
  try {
    openai = getClient();
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "The store is closed — Vinny's waiting on the owner to set up the API key.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validationError = validateBody(body);
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, preferences } = body as { messages: { role: string; content: string }[]; preferences?: { key: string; value: string }[] };

  const systemPrompt = buildSystemPrompt(preferences || []);

  // Convert messages to OpenAI format
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    temperature: 0.85,
    messages: openaiMessages,
    stream: true,
  });

  // Create a ReadableStream that sends SSE
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            const data = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        const isAuthError =
          error instanceof OpenAI.AuthenticationError;
        const msg = isAuthError
          ? "Vinny's keys don't work — the API key might be invalid."
          : "Vinny stepped away for a moment. Try again.";
        const errData = JSON.stringify({ error: msg });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
