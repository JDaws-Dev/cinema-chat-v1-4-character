"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  getMessages,
  saveMessage,
  getPreferences,
  setPreference as savePreference,
  StoredPreference,
} from "@/lib/storage";

interface DialogueBoxProps {
  open: boolean;
  onClose: () => void;
  onFilmClick?: (title: string, year?: number) => void;
}

export function DialogueBox({ open, onClose, onFilmClick }: DialogueBoxProps) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [preferences, setPreferences] = useState<StoredPreference[]>([]);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Load history once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = getMessages();
    if (stored.length > 0) {
      setMessages(stored.map((m) => ({ role: m.role, content: m.content })));
    }
    setPreferences(getPreferences());
  }, []);

  // Auto-scroll + focus
  useEffect(() => {
    if (open) {
      textRef.current?.scrollTo(0, textRef.current.scrollHeight);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    saveMessage({ ...userMsg, timestamp: Date.now() });

    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const history = [...messages, userMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));
      const prefs = preferences.map((p) => ({ key: p.key, value: p.value }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, preferences: prefs }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: fullText };
                return u;
              });
            }
            if (parsed.error) fullText = parsed.error;
          } catch { /* skip */ }
        }
      }

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: fullText };
        return u;
      });
      saveMessage({ role: "assistant", content: fullText, timestamp: Date.now() });

      // Simple preference extraction
      extractPrefs(text, preferences, setPreferences);
    } catch {
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: "Vinny stepped away from the counter. Try again in a sec.",
        };
        return u;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, preferences]);

  // Render message text with film title links
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      const match = part.match(/^\*\*(.+)\*\*$/);
      if (match) {
        const title = match[1];
        const yearMatch = title.match(/^(.+?)\s*\((\d{4})\)$/);
        return (
          <span
            key={i}
            className="film-link"
            onClick={() =>
              onFilmClick?.(
                yearMatch ? yearMatch[1] : title,
                yearMatch ? parseInt(yearMatch[2]) : undefined
              )
            }
          >
            {title}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Only show last few messages to keep dialogue box manageable
  const visibleMessages = messages.slice(-6);
  const lastMsg = visibleMessages[visibleMessages.length - 1];

  return (
    <div className={`dialogue-box ${open ? "dialogue-open" : ""}`}>
      <div className="dialogue-top" ref={textRef}>
        {/* Vinny portrait */}
        <div className="dialogue-portrait">
          <div style={{ position: "relative", width: 32, height: 48, transform: "scale(1.2)" }}>
            <div className="vinny-hair" />
            <div className="vinny-head">
              <div className="vinny-eyes">
                <div className="vinny-eye" />
                <div className="vinny-eye" />
              </div>
              <div className="vinny-stache" />
            </div>
            <div className="vinny-shirt" />
            <div className="vinny-vest" />
          </div>
        </div>

        <div className="dialogue-text-area">
          <div className="dialogue-speaker">VINNY</div>
          <div className="dialogue-text">
            {visibleMessages.length === 0 ? (
              <>
                Hey, welcome in. I&apos;m Vinny — been behind this counter since
                &apos;87. What are you in the mood for tonight?
              </>
            ) : (
              visibleMessages.map((msg, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  {msg.role === "user" ? (
                    <span style={{ color: "rgba(255,215,0,0.5)", fontSize: "0.75rem" }}>
                      You: {msg.content}
                    </span>
                  ) : (
                    <span>{renderText(msg.content)}</span>
                  )}
                </div>
              ))
            )}
            {streaming && lastMsg?.role === "assistant" && (
              <span className="dialogue-cursor" />
            )}
          </div>
        </div>
      </div>

      <div className="dialogue-input-row">
        <input
          ref={inputRef}
          className="dialogue-input"
          type="text"
          placeholder="Tell Vinny what you're in the mood for..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={streaming}
        />
        <button
          className="dialogue-send"
          onClick={handleSend}
          disabled={streaming || !input.trim()}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

// ── Preference extraction (matches existing logic) ───────
function extractPrefs(
  text: string,
  current: StoredPreference[],
  set: React.Dispatch<React.SetStateAction<StoredPreference[]>>
) {
  const lower = text.toLowerCase();
  const newPrefs: StoredPreference[] = [];

  const genres = [
    "horror", "sci-fi", "comedy", "drama", "action", "thriller",
    "romance", "animation", "documentary", "western", "noir",
  ];
  for (const g of genres) {
    if (lower.includes(`love ${g}`) || lower.includes(`into ${g}`) || lower.includes(`fan of ${g}`)) {
      const p: StoredPreference = {
        key: `likes_${g}`, value: "true",
        source: text.slice(0, 200), learnedAt: Date.now(),
      };
      savePreference(p);
      newPrefs.push(p);
    }
  }

  if (newPrefs.length > 0) set([...current, ...newPrefs]);
}
