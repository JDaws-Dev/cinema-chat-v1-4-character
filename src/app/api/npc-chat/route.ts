import { NextRequest, NextResponse } from "next/server";

const ERA_CONTEXT: Record<string, string> = {
  late80s: "It is 1989. The Berlin Wall just fell. Top Gun and Dirty Dancing are still huge. There is no internet. CDs are new. MTV plays music videos.",
  early90s: "It is 1992. Nirvana is on the radio. Home Alone was the biggest movie. The Gulf War just ended. There is no World Wide Web yet.",
  mid90s: "It is 1995. OJ Simpson trial is everywhere. Toy Story just came out. Windows 95 launched. Friends is the hottest show.",
  late90s: "It is 1998. Titanic broke all records. The Matrix is coming soon. Everyone is worried about Y2K. DVDs are starting to replace VHS.",
  present: "It is 2025. You work at a retro video store that still rents VHS tapes. Streaming exists but people come here for the nostalgia.",
};

// Simple keyword matcher — handles 70%+ of interactions without LLM
function matchKeywords(text: string, npcName: string): string | null {
  const lower = text.toLowerCase();

  // Greetings
  if (/\b(hi|hello|hey|sup|yo|what'?s up)\b/.test(lower)) {
    return `Hey! Welcome to the store. I'm ${npcName}. Looking for anything good tonight?`;
  }
  // Goodbye
  if (/\b(bye|later|see ya|gotta go|leaving)\b/.test(lower)) {
    return "See ya! Have a good night.";
  }
  // Directions
  if (/\b(where|find|looking for)\b.*\b(horror|scary)\b/.test(lower)) {
    return "Horror is in the back left. Fair warning — the covers alone give me nightmares.";
  }
  if (/\b(where|find|looking for)\b.*\b(action)\b/.test(lower)) {
    return "Action is in the back, first aisle on the left. Can't miss it.";
  }
  if (/\b(where|find|looking for)\b.*\b(comedy|funny)\b/.test(lower)) {
    return "Comedy is on the right side. There's some really good stuff in there tonight.";
  }
  if (/\b(where|find|looking for)\b.*\b(kids|family|children)\b/.test(lower)) {
    return "Family section is on the right, towards the front. Lots of good picks for the little ones.";
  }
  if (/\b(where|find|looking for)\b.*\b(drama)\b/.test(lower)) {
    return "Drama is along the back wall. Some real tearjerkers in there.";
  }
  if (/\b(where|find|looking for)\b.*\b(sci-?fi|science fiction)\b/.test(lower)) {
    return "Sci-fi is middle-left area. Some absolute classics on that shelf.";
  }
  // Recommendations
  if (/\b(recommend|suggest|what should|what do you)\b/.test(lower)) {
    return "Honestly? Ask Vinny at the counter. That guy knows every movie in this store.";
  }
  // New releases
  if (/\b(new|just came in|new releases|what'?s new)\b/.test(lower)) {
    return "New releases are on the back wall. They just put some good ones up.";
  }
  // Bathroom
  if (/\b(bathroom|restroom|toilet)\b/.test(lower)) {
    return "Bathroom is employees only. Sorry — store policy.";
  }
  // Rent / checkout
  if (/\b(rent|check out|borrow|how much)\b/.test(lower)) {
    return "Take it to Vinny at the counter. Three-day rental, and be kind — rewind!";
  }
  // Pizza
  if (/\b(pizza|hungry|eat|food)\b/.test(lower)) {
    return "Pizza Palace is right next door. Their pepperoni is unreal.";
  }
  // Store compliment
  if (/\b(love|great|awesome|cool)\b.*\b(store|place|shop)\b/.test(lower)) {
    return "Right? This place is the best. I come every Friday.";
  }

  return null; // No keyword match — fall through to LLM
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { npcName, personalityType, eraId, playerMessage, history, playerXP } = body as {
    npcName: string;
    personalityType: string;
    eraId: string;
    playerMessage: string;
    history: { role: string; text: string }[];
    playerXP?: number;
  };

  if (!playerMessage?.trim()) {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }

  // Try keyword match first (free, instant)
  const keywordReply = matchKeywords(playerMessage, npcName);
  if (keywordReply) {
    return NextResponse.json({ reply: keywordReply, sentiment: "neutral", source: "keyword" });
  }

  // LLM fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({
      reply: "Hmm, not sure about that one. You should ask Vinny — he knows everything.",
      sentiment: "neutral",
      source: "fallback",
    });
  }

  const eraContext = ERA_CONTEXT[eraId] || ERA_CONTEXT.early90s;

  const systemPrompt = `You are ${npcName}, a customer at a 1990s video rental store called Friday Night Video.

Personality type: ${personalityType}
${eraContext}

Rules:
- Stay in character. You are IN the store right now.
- Keep responses under 2 sentences. This is casual store conversation.
- You don't know this is a game. You are a real person in a video store.
- Never break the fourth wall.
- If asked about something you wouldn't know, deflect naturally.
- Use era-appropriate references only.
${playerXP !== undefined ? `- The player has ${playerXP} XP and seems like a ${playerXP > 500 ? "regular" : "newer customer"}.` : ""}

After your response, on a new line output exactly one of:
[SENTIMENT:friendly] [SENTIMENT:neutral] [SENTIMENT:rude] [SENTIMENT:hostile]
based on how the player's message made you feel.`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: m.role === "player" ? "user" as const : "assistant" as const,
        content: m.text,
      })),
      { role: "user" as const, content: playerMessage },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 120,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status}`);
    }

    const data = await res.json();
    const fullReply = data.choices?.[0]?.message?.content ?? "";

    // Extract sentiment tag
    const sentimentMatch = fullReply.match(/\[SENTIMENT:(\w+)\]/);
    const sentiment = sentimentMatch ? sentimentMatch[1] : "neutral";
    const cleanReply = fullReply.replace(/\[SENTIMENT:\w+\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, sentiment, source: "llm" });
  } catch (err) {
    console.error("NPC chat error:", err);
    return NextResponse.json({
      reply: "Sorry, I spaced out for a sec. What were you saying?",
      sentiment: "neutral",
      source: "fallback",
    });
  }
}
