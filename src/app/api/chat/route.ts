import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/vinny-prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
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
        const errData = JSON.stringify({
          error: "Vinny stepped away for a moment. Try again.",
        });
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
