"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import {
  getMessages,
  saveMessage,
  getPreferences,
  setPreference as savePreference,
  StoredPreference,
} from "@/lib/storage";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [preferences, setPreferences] = useState<StoredPreference[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Load stored messages and preferences on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = getMessages();
    if (stored.length > 0) {
      setMessages(stored.map((m) => ({ role: m.role, content: m.content })));
    }
    setPreferences(getPreferences());
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      // Add user message
      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      saveMessage({ role: "user", content, timestamp: Date.now() });

      // Start streaming
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
      ]);

      try {
        // Build message history for API (last 20 turns for context window)
        const history = [...messages, userMessage]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const prefs = preferences.map((p) => ({
          key: p.key,
          value: p.value,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, preferences: prefs }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: fullText,
                      isStreaming: true,
                    };
                    return updated;
                  });
                }
                if (parsed.error) {
                  fullText = parsed.error;
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        // Finalize message
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          };
          return updated;
        });

        // Save assistant response
        saveMessage({
          role: "assistant",
          content: fullText,
          timestamp: Date.now(),
        });

        // Extract and save preferences
        extractPreferences(content, preferences, setPreferences);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "Sorry, I stepped away from the counter for a second. Hit me again \u2014 what were you looking for?",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, preferences]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-white text-3xl font-bold border-4 border-amber-400/30 shadow-2xl shadow-amber-900/40">
                V
              </div>
              <h2 className="text-amber-400 text-2xl font-bold mb-2">
                Hey, welcome in.
              </h2>
              <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                I&apos;m Vinny. I&apos;ve been behind this counter since &apos;87.
                Tell me what you&apos;re in the mood for and I&apos;ll find you
                something good.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {[
                  "I want something like Jaws but for the whole family",
                  "Give me a sci-fi film that\u2019ll make me think",
                  "Something with depth \u2014 I need to feel something tonight",
                  "What\u2019s the best Spielberg film and why?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-gray-900/60 border border-amber-500/20 rounded-full px-4 py-2 text-amber-300/70 hover:text-amber-200 hover:border-amber-400/40 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={msg.isStreaming}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

/**
 * Extract preferences from user messages (simple heuristic).
 */
function extractPreferences(
  userMessage: string,
  currentPrefs: StoredPreference[],
  setPrefs: React.Dispatch<React.SetStateAction<StoredPreference[]>>
) {
  const lower = userMessage.toLowerCase();
  const newPrefs: StoredPreference[] = [];

  const genres = [
    "horror", "sci-fi", "comedy", "drama", "action", "thriller",
    "romance", "animation", "documentary", "western", "noir",
  ];
  for (const genre of genres) {
    if (
      lower.includes(`love ${genre}`) ||
      lower.includes(`into ${genre}`) ||
      lower.includes(`fan of ${genre}`)
    ) {
      const pref: StoredPreference = {
        key: `likes_${genre}`,
        value: "true",
        source: userMessage.slice(0, 200),
        learnedAt: Date.now(),
      };
      savePreference(pref);
      newPrefs.push(pref);
    }
  }

  const directors = [
    "spielberg", "nolan", "scorsese", "tarantino", "kubrick",
    "villeneuve", "coppola", "fincher", "anderson", "coen",
  ];
  for (const dir of directors) {
    if (lower.includes(dir)) {
      const pref: StoredPreference = {
        key: "mentioned_director",
        value: dir,
        source: userMessage.slice(0, 200),
        learnedAt: Date.now(),
      };
      savePreference(pref);
      newPrefs.push(pref);
    }
  }

  if (
    lower.includes("family") ||
    lower.includes("kids") ||
    lower.includes("children")
  ) {
    const pref: StoredPreference = {
      key: "has_family_context",
      value: "true",
      source: userMessage.slice(0, 200),
      learnedAt: Date.now(),
    };
    savePreference(pref);
    newPrefs.push(pref);
  }

  if (newPrefs.length > 0) {
    setPrefs([...currentPrefs, ...newPrefs]);
  }
}
