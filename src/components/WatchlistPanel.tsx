"use client";

import { useState, useEffect } from "react";
import type { WatchlistItem, UserRating } from "@/lib/types";
import { getWatchlist, removeFromWatchlist } from "@/lib/watchlist";
import { getRatings } from "@/lib/watchlist";
import { StarRating } from "./StarRating";

interface WatchlistPanelProps {
  open: boolean;
  onClose: () => void;
  onSelectFilm?: (id: number) => void;
}

type FilterTab = "all" | "rated" | "unrated";

export function WatchlistPanel({ open, onClose, onSelectFilm }: WatchlistPanelProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [tab, setTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (open) {
      setWatchlist(getWatchlist());
      setRatings(getRatings());
    }
  }, [open]);

  if (!open) return null;

  const ratingMap = new Map(ratings.map((r) => [`${r.title}-${r.year}`, r]));

  const filtered =
    tab === "rated"
      ? watchlist.filter((w) => ratingMap.has(`${w.title}-${w.year}`))
      : tab === "unrated"
        ? watchlist.filter((w) => !ratingMap.has(`${w.title}-${w.year}`))
        : watchlist;

  const handleRemove = (item: WatchlistItem) => {
    removeFromWatchlist(item.title, item.year);
    setWatchlist(getWatchlist());
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-sm bg-gray-950 border-l border-amber-500/20 h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm border-b border-amber-500/20 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-amber-400 font-bold text-sm">My Watchlist</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2">
            {(["all", "rated", "unrated"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                  tab === t
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t} ({t === "all"
                  ? watchlist.length
                  : t === "rated"
                    ? watchlist.filter((w) => ratingMap.has(`${w.title}-${w.year}`)).length
                    : watchlist.filter((w) => !ratingMap.has(`${w.title}-${w.year}`)).length
                })
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-3">
          {filtered.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              {watchlist.length === 0
                ? "Your watchlist is empty. Star films to add them here."
                : "No films match this filter."}
            </p>
          ) : (
            filtered.map((item) => {
              const rating = ratingMap.get(`${item.title}-${item.year}`);
              return (
                <div
                  key={`${item.title}-${item.year}`}
                  className="flex gap-2 p-2 rounded-lg hover:bg-gray-900/60 transition-colors group"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-10 h-15 object-cover rounded cursor-pointer flex-shrink-0"
                      onClick={() => item.tmdbId && onSelectFilm?.(item.tmdbId)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-15 bg-gray-800 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-gray-200 text-xs font-medium truncate cursor-pointer hover:text-amber-300 transition-colors"
                      onClick={() => item.tmdbId && onSelectFilm?.(item.tmdbId)}
                    >
                      {item.title}
                      {item.year && (
                        <span className="text-gray-500 ml-1">({item.year})</span>
                      )}
                    </p>
                    {rating && (
                      <div className="mt-0.5">
                        <StarRating rating={rating.rating} size="sm" readonly />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all self-center"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
