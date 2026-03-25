"use client";

import { useState, useEffect } from "react";
import type { MovieInfo, StreamingProviders } from "@/lib/types";
import { fetchMovie } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isOnWatchlist } from "@/lib/watchlist";
import { StarRating } from "./StarRating";
import { getRating, setRating } from "@/lib/watchlist";

interface SuggestionCardProps {
  title: string;
  year?: number;
  onShowDetail?: (id: number) => void;
}

export function SuggestionCard({ title, year, onShowDetail }: SuggestionCardProps) {
  const [movie, setMovie] = useState<MovieInfo | null>(null);
  const [providers, setProviders] = useState<StreamingProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [onList, setOnList] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMovie(title, year).then((data) => {
      if (cancelled) return;
      setMovie(data.movie);
      setProviders(data.providers);
      if (data.movie) {
        setOnList(isOnWatchlist(data.movie.title, data.movie.year));
        const r = getRating(data.movie.title, data.movie.year);
        if (r) setUserRating(r.rating);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [title, year]);

  if (loading) {
    return (
      <div className="my-3 bg-gray-900/60 border border-amber-500/20 rounded-xl p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-16 h-24 bg-gray-800 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-2/3" />
            <div className="h-3 bg-gray-800 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const toggleWatchlist = () => {
    if (onList) {
      removeFromWatchlist(movie.title, movie.year);
      setOnList(false);
    } else {
      addToWatchlist({
        title: movie.title,
        year: movie.year,
        genre: null,
        tmdbId: movie.id,
        posterUrl: movie.posterUrl,
        overview: movie.overview,
        addedAt: new Date().toISOString(),
      });
      setOnList(true);
    }
  };

  const handleRate = (stars: number) => {
    setUserRating(stars);
    setRating({
      title: movie.title,
      year: movie.year,
      tmdbId: movie.id,
      posterUrl: movie.posterUrl,
      rating: stars,
      ratedAt: new Date().toISOString(),
    });
  };

  const score = movie.voteAverage ? (movie.voteAverage / 2).toFixed(1) : null;

  return (
    <div className="my-3 bg-gray-900/60 border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 transition-colors">
      <div className="flex gap-3 p-3">
        {/* Poster */}
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-16 h-24 object-cover rounded cursor-pointer flex-shrink-0"
            onClick={() => onShowDetail?.(movie.id)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-16 h-24 bg-gray-800 rounded flex items-center justify-center text-gray-600 text-xs cursor-pointer flex-shrink-0"
            onClick={() => onShowDetail?.(movie.id)}
          >
            No Poster
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="text-amber-300 font-semibold text-sm cursor-pointer hover:text-amber-200 transition-colors truncate"
                onClick={() => onShowDetail?.(movie.id)}
              >
                {movie.title}
                {movie.year && (
                  <span className="text-gray-500 font-normal ml-1">
                    ({movie.year})
                  </span>
                )}
              </h3>
              {score && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400 text-xs font-medium">{score}</span>
                  <span className="text-gray-600 text-xs">/5 TMDB</span>
                </div>
              )}
            </div>
            <button
              onClick={toggleWatchlist}
              className={`text-lg flex-shrink-0 transition-colors ${
                onList ? "text-amber-400" : "text-gray-600 hover:text-amber-400"
              }`}
              title={onList ? "Remove from watchlist" : "Add to watchlist"}
            >
              {onList ? "★" : "☆"}
            </button>
          </div>

          {/* Streaming providers */}
          {providers && providers.flatrate.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-gray-500 text-[10px] uppercase tracking-wide">Stream:</span>
              <div className="flex gap-1">
                {providers.flatrate.slice(0, 4).map((p) => (
                  <div key={p.id} title={p.name}>
                    {p.logoPath ? (
                      <img src={p.logoPath} alt={p.name} className="w-5 h-5 rounded" />
                    ) : (
                      <span className="text-[10px] text-gray-400">{p.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User rating */}
          <div className="mt-2">
            <StarRating rating={userRating} onRate={handleRate} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
