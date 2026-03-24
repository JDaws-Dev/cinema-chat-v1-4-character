"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="border-t border-amber-500/20 bg-gray-950/90 backdrop-blur-sm p-4">
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Tell Vinny what you're in the mood for..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-gray-900/60 border border-amber-500/30 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 text-sm transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl px-5 py-3 font-medium text-sm transition-all duration-200 shadow-lg shadow-amber-900/30 disabled:shadow-none disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
