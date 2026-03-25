import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/vinny-prompt";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}

export async function POST(req: Request) {
  let anthropic: Anthropic;
  try {
    anthropic = getClient();
  } catch {
    return new Response(
      JSON.stringify({ error: "The store is closed — Vinny's waiting on the owner to set up the API key." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages, preferences } = await req.json();

  const systemPrompt = buildSystemPrompt(preferences || []);

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  // Create a ReadableStream that sends SSE
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        const isAuthError = error instanceof Anthropic.AuthenticationError;
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
