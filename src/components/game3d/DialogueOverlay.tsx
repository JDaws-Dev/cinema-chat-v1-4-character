"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getMessages, saveMessage, getPreferences, StoredPreference } from "@/lib/storage";

interface Props { onClose: () => void; }

export function DialogueBox({ onClose }: Props) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [prefs] = useState<StoredPreference[]>(() => getPreferences());
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const init = useRef(false);

  useEffect(() => {
    if (init.current) return;
    init.current = true;
    const stored = getMessages();
    if (stored.length > 0) setMessages(stored.slice(-10).map(m => ({ role: m.role, content: m.content })));
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo(0, messagesRef.current.scrollHeight);
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const userMsg = { role: "user" as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    saveMessage({ ...userMsg, timestamp: Date.now() });
    setStreaming(true);
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const history = [...messages, userMsg].slice(-20).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, preferences: prefs.map(p => ({ key: p.key, value: p.value })) }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") continue;
          try { const p = JSON.parse(d); if (p.text) { full += p.text; setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: full }; return u; }); } } catch {}
        }
      }
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: full }; return u; });
      saveMessage({ role: "assistant", content: full, timestamp: Date.now() });
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "Vinny stepped away for a sec. Try again." }; return u; });
    } finally { setStreaming(false); }
  }, [input, streaming, messages, prefs]);

  return (
    <div className="g3-chat">
      <div className="g3-chat-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="g3-chat-empty">
            <strong>Vinny</strong>
            <p>Hey! What are you in the mood for tonight? Tell me a genre, a feeling, a director — whatever. I&apos;ll find you something good.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`g3-chat-msg g3-chat-${m.role}`}>
            {m.role === "assistant" && <span className="g3-chat-name">Vinny</span>}
            <p>{m.content}</p>
          </div>
        ))}
      </div>
      <div className="g3-chat-input-row">
        <input
          ref={inputRef}
          type="text"
          className="g3-chat-input"
          placeholder="Tell Vinny what you're in the mood for..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
          disabled={streaming}
        />
        <button className="g3-chat-send" onClick={handleSend} disabled={streaming || !input.trim()}>Send</button>
      </div>
    </div>
  );
}
