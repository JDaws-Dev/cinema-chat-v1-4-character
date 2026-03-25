import OpenAI from "openai";
import { buildSystemPrompt } from "@/lib/vinny-prompt";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
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

  const { messages, preferences } = await req.json();

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
