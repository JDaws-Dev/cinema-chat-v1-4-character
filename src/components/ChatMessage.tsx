"use client";

import { useMemo } from "react";
import type { DetectedFilm } from "@/lib/types";
import { SuggestionCard } from "./SuggestionCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onShowDetail?: (id: number) => void;
}

/**
 * Detect film titles wrapped in **Title** (Year) pattern.
 */
function detectFilms(text: string): DetectedFilm[] {
  const films: DetectedFilm[] = [];
  const regex = /\*\*([^*]+)\*\*(?:\s*\((\d{4})\))?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    films.push({
      title: match[1],
      year: match[2] ? parseInt(match[2]) : undefined,
      fullMatch: match[0],
    });
  }
  return films;
}

/**
 * Parse text with **Title** patterns into React elements.
 */
function parseFilmTitles(text: string, onShowDetail?: (id: number) => void) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    if (match) {
      const title = match[1];
      return (
        <span
          key={i}
          className="film-title cursor-pointer font-bold text-amber-300 hover:text-amber-100 transition-colors border-b border-amber-300/40 hover:border-amber-100"
          title={`View details for ${title}`}
        >
          {title}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({ role, content, isStreaming, onShowDetail }: ChatMessageProps) {
  const parsed = useMemo(() => {
    if (role === "assistant") return parseFilmTitles(content, onShowDetail);
    return content;
  }, [role, content, onShowDetail]);

  const detectedFilms = useMemo(() => {
    if (role !== "assistant" || isStreaming) return [];
    return detectFilms(content);
  }, [role, content, isStreaming]);

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-blue-900/60 border border-blue-500/30 rounded-2xl rounded-br-sm px-4 py-3 text-blue-50">
          <p className="text-sm leading-relaxed">{parsed}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 max-w-[85%]">
        {/* Vinny avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-white font-bold text-sm border-2 border-amber-400/50 shadow-lg shadow-amber-900/30">
          V
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-900/80 border border-amber-500/20 rounded-2xl rounded-bl-sm px-4 py-3 text-gray-100 shadow-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {parsed}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />
              )}
            </p>
          </div>

          {/* Film suggestion cards (after streaming completes) */}
          {detectedFilms.length > 0 && (
            <div className="mt-1">
              {detectedFilms.slice(0, 3).map((film, i) => (
                <SuggestionCard
                  key={`${film.title}-${i}`}
                  title={film.title}
                  year={film.year}
                  onShowDetail={onShowDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
