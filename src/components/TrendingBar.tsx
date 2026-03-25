"use client";

import { useState, useEffect, useRef } from "react";
import type { TrendingMovie } from "@/lib/types";
import { fetchTrending } from "@/lib/api";

interface TrendingBarProps {
  onSelectFilm?: (id: number) => void;
}

export function TrendingBar({ onSelectFilm }: TrendingBarProps) {
  const [movies, setMovies] = useState<TrendingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrending("week")
      .then((data) => setMovies(data.movies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (loading || movies.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-amber-500/70 text-xs uppercase tracking-wider font-medium">
          Trending This Week
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="text-gray-600 hover:text-amber-400 text-sm transition-colors px-1"
          >
            &larr;
          </button>
          <button
            onClick={() => scroll("right")}
            className="text-gray-600 hover:text-amber-400 text-sm transition-colors px-1"
          >
            &rarr;
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {movies.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectFilm?.(m.id)}
            className="flex-shrink-0 group relative"
            title={`${m.title} (${m.year || "?"})`}
          >
            {m.posterUrl ? (
              <img
                src={m.posterUrl}
                alt={m.title}
                className="w-14 h-20 object-cover rounded border border-amber-500/10 group-hover:border-amber-500/40 transition-colors"
                loading="lazy"
              />
            ) : (
              <div className="w-14 h-20 bg-gray-800 rounded border border-amber-500/10 flex items-center justify-center text-gray-600 text-[8px] text-center px-1">
                {m.title}
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent rounded-b px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[8px] text-amber-300 truncate">{m.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
