"use client";

import { useState, useEffect } from "react";
import type { FilmDetail } from "@/lib/types";
import { fetchFilmDetail } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isOnWatchlist, getRating, setRating } from "@/lib/watchlist";
import { StarRating } from "./StarRating";

interface FilmDetailModalProps {
  filmId: number | null;
  onClose: () => void;
  onSelectFilm?: (id: number) => void;
}

export function FilmDetailModal({ filmId, onClose, onSelectFilm }: FilmDetailModalProps) {
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "cast" | "similar">("overview");
  const [onList, setOnList] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (!filmId) return;
    setLoading(true);
    setTab("overview");
    fetchFilmDetail(filmId)
      .then((data) => {
        setFilm(data.film);
        if (data.film) {
          setOnList(isOnWatchlist(data.film.title, data.film.year));
          const r = getRating(data.film.title, data.film.year);
          if (r) setUserRating(r.rating);
          else setUserRating(0);
        }
      })
      .catch(() => setFilm(null))
      .finally(() => setLoading(false));
  }, [filmId]);

  if (!filmId) return null;

  const toggleWatchlist = () => {
    if (!film) return;
    if (onList) {
      removeFromWatchlist(film.title, film.year);
      setOnList(false);
    } else {
      addToWatchlist({
        title: film.title,
        year: film.year,
        genre: film.genres[0] || null,
        tmdbId: film.id,
        posterUrl: film.posterUrl,
        overview: film.overview,
        addedAt: new Date().toISOString(),
      });
      setOnList(true);
    }
  };

  const handleRate = (stars: number) => {
    if (!film) return;
    setUserRating(stars);
    setRating({
      title: film.title,
      year: film.year,
      tmdbId: film.id,
      posterUrl: film.posterUrl,
      rating: stars,
      director: film.director,
      genre: film.genres[0] || null,
      ratedAt: new Date().toISOString(),
    });
  };

  const formatMoney = (n: number | null) => {
    if (!n) return null;
    return `$${(n / 1_000_000).toFixed(1)}M`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-gray-950 border border-amber-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading film details...</div>
        ) : !film ? (
          <div className="p-12 text-center text-gray-500">Film not found</div>
        ) : (
          <>
            {/* Backdrop */}
            {film.backdropUrl && (
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img
                  src={film.backdropUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors z-10"
            >
              ×
            </button>

            {/* Content */}
            <div className="p-6 -mt-16 relative">
              <div className="flex gap-4">
                {/* Poster */}
                {film.posterUrl && (
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    className="w-28 h-42 object-cover rounded-lg border border-amber-500/20 shadow-xl flex-shrink-0"
                  />
                )}

                {/* Title info */}
                <div className="flex-1 pt-12">
                  <h2 className="text-amber-300 text-xl font-bold">
                    {film.title}
                    {film.year && <span className="text-gray-400 font-normal ml-2">({film.year})</span>}
                  </h2>
                  {film.tagline && (
                    <p className="text-gray-500 text-xs italic mt-1">{film.tagline}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {film.runtime && <span>{film.runtime} min</span>}
                    {film.genres.length > 0 && <span>{film.genres.slice(0, 3).join(", ")}</span>}
                    {film.director && <span>Dir. {film.director}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-amber-400 font-bold text-sm">
                      {(film.voteAverage / 2).toFixed(1)}/5
                    </span>
                    <span className="text-gray-600 text-xs">
                      ({film.voteCount.toLocaleString()} votes)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={toggleWatchlist}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        onList
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "border-gray-700 text-gray-400 hover:border-amber-500/40 hover:text-amber-300"
                      }`}
                    >
                      {onList ? "★ On Watchlist" : "☆ Add to Watchlist"}
                    </button>
                    <StarRating rating={userRating} onRate={handleRate} size="sm" />
                  </div>
                </div>
              </div>

              {/* Streaming */}
              {film.providers.flatrate.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Stream on:</span>
                  <div className="flex gap-1.5">
                    {film.providers.flatrate.map((p) => (
                      <div key={p.id} title={p.name}>
                        {p.logoPath ? (
                          <img src={p.logoPath} alt={p.name} className="w-6 h-6 rounded" />
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-4 mt-6 border-b border-gray-800">
                {(["overview", "cast", "similar"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs pb-2 capitalize transition-colors ${
                      tab === t
                        ? "text-amber-400 border-b-2 border-amber-400"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="mt-4">
                {tab === "overview" && (
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">{film.overview}</p>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      {film.budget ? (
                        <div>
                          <span className="text-gray-500">Budget:</span>{" "}
                          <span className="text-gray-300">{formatMoney(film.budget)}</span>
                        </div>
                      ) : null}
                      {film.revenue ? (
                        <div>
                          <span className="text-gray-500">Revenue:</span>{" "}
                          <span className="text-gray-300">{formatMoney(film.revenue)}</span>
                        </div>
                      ) : null}
                      {film.productionCompanies.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Studio:</span>{" "}
                          <span className="text-gray-300">{film.productionCompanies.slice(0, 2).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === "cast" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {film.cast.slice(0, 12).map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        {c.profilePath ? (
                          <img
                            src={c.profilePath}
                            alt={c.name}
                            className="w-8 h-8 object-cover rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-600 text-xs">
                            ?
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-200 text-xs font-medium truncate">{c.name}</p>
                          <p className="text-gray-500 text-[10px] truncate">{c.character}</p>
                        </div>
                      </div>
                    ))}
                    {film.crew.length > 0 && (
                      <div className="col-span-full mt-2 pt-2 border-t border-gray-800/50">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Key Crew</p>
                        {film.crew.map((c) => (
                          <div key={`${c.id}-${c.job}`} className="text-xs text-gray-400 mb-1">
                            <span className="text-gray-300">{c.name}</span> — {c.job}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "similar" && (
                  <div className="grid grid-cols-4 gap-2">
                    {film.similar.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onSelectFilm?.(s.id)}
                        className="group text-left"
                      >
                        {s.posterUrl ? (
                          <img
                            src={s.posterUrl}
                            alt={s.title}
                            className="w-full aspect-[2/3] object-cover rounded border border-amber-500/10 group-hover:border-amber-500/40 transition-colors"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-gray-800 rounded flex items-center justify-center text-gray-600 text-[8px] text-center p-1">
                            {s.title}
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 truncate group-hover:text-amber-300 transition-colors">
                          {s.title}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
