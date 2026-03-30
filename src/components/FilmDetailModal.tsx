"use client";

import { useState, useEffect, useMemo } from "react";
import type { FilmDetail } from "@/lib/types";
import { fetchFilmDetail } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isOnWatchlist, getRating, setRating } from "@/lib/watchlist";
import { StarRating } from "./StarRating";

interface FilmDetailModalProps {
  filmId: number | null;
  onClose: () => void;
  onSelectFilm?: (id: number) => void;
}

/** Map genre names to VHS-stripe colors */
const GENRE_COLORS: Record<string, string> = {
  Action: "#e53e3e",
  Adventure: "#dd6b20",
  Animation: "#38b2ac",
  Comedy: "#ecc94b",
  Crime: "#9f7aea",
  Documentary: "#4299e1",
  Drama: "#3182ce",
  Family: "#48bb78",
  Fantasy: "#805ad5",
  History: "#b7791f",
  Horror: "#c53030",
  Music: "#d53f8c",
  Mystery: "#667eea",
  Romance: "#ed64a6",
  "Science Fiction": "#00b5d8",
  "TV Movie": "#a0aec0",
  Thriller: "#e53e3e",
  War: "#718096",
  Western: "#c05621",
};

/** Deterministic pseudo-random barcode widths from a seed string */
function barcodeWidths(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const widths: number[] = [];
  for (let i = 0; i < 30; i++) {
    h = (h * 1103515245 + 12345) | 0;
    widths.push(((h >>> 16) & 3) + 1); // 1-4px bars
  }
  return widths;
}

export function FilmDetailModal({ filmId, onClose, onSelectFilm }: FilmDetailModalProps) {
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [onList, setOnList] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (!filmId) return;
    setLoading(true);
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

  const genreColor = useMemo(() => {
    if (!film || film.genres.length === 0) return "#ffd700";
    return GENRE_COLORS[film.genres[0]] ?? "#ffd700";
  }, [film]);

  const barcode = useMemo(() => barcodeWidths(film?.title ?? ""), [film?.title]);

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

  const topCast = film?.cast.slice(0, 4).map((c) => c.name).join(", ") ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* VHS Back Case */}
      <div
        className="vhs-back"
        style={{ "--genre-color": genreColor } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="vhs-back-loading">Loading film details...</div>
        ) : !film ? (
          <div className="vhs-back-loading">Film not found</div>
        ) : (
          <>
            {/* Close button */}
            <button onClick={onClose} className="vhs-back-close" aria-label="Close">
              &times;
            </button>

            {/* Header: poster + title block */}
            <div className="vhs-back-header">
              {film.posterUrl && (
                <img
                  src={film.posterUrl}
                  alt={film.title}
                  className="vhs-back-poster"
                />
              )}
              <div className="vhs-back-title-block">
                <h2 className="vhs-back-title">{film.title}</h2>
                <p className="vhs-back-meta">
                  {[
                    film.year,
                    film.voteAverage ? `${(film.voteAverage / 2).toFixed(1)}/5` : null,
                    film.runtime ? `${film.runtime} min` : null,
                  ]
                    .filter(Boolean)
                    .join(" \u2022 ")}
                </p>
                {film.genres.length > 0 && (
                  <p className="vhs-back-genres">{film.genres.slice(0, 3).join(" / ")}</p>
                )}
              </div>
            </div>

            <div className="vhs-back-divider" />

            {/* Synopsis */}
            {film.overview && (
              <p className="vhs-back-synopsis">&ldquo;{film.overview}&rdquo;</p>
            )}

            <div className="vhs-back-divider" />

            {/* Credits */}
            <div className="vhs-back-credits">
              {film.director && (
                <p>
                  <span className="vhs-back-label">DIRECTOR:</span> {film.director}
                </p>
              )}
              {topCast && (
                <p>
                  <span className="vhs-back-label">STARRING:</span> {topCast}
                </p>
              )}
              {film.productionCompanies.length > 0 && (
                <p>
                  <span className="vhs-back-label">STUDIO:</span>{" "}
                  {film.productionCompanies.slice(0, 2).join(", ")}
                </p>
              )}
            </div>

            {/* Streaming providers */}
            {film.providers.flatrate.length > 0 && (
              <div className="vhs-back-providers">
                <span className="vhs-back-label">STREAM ON:</span>
                <span className="vhs-back-provider-logos">
                  {film.providers.flatrate.map((p) =>
                    p.logoPath ? (
                      <img key={p.id} src={p.logoPath} alt={p.name} title={p.name} className="vhs-back-provider-icon" />
                    ) : (
                      <span key={p.id} className="vhs-back-provider-text">{p.name}</span>
                    )
                  )}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="vhs-back-actions">
              <button
                onClick={toggleWatchlist}
                className={`vhs-back-pick-btn ${onList ? "vhs-back-pick-btn--active" : ""}`}
              >
                {onList ? "\u2605 On Watchlist" : "\u2606 Pick this movie"}
              </button>
              <StarRating rating={userRating} onRate={handleRate} size="sm" />
            </div>

            {/* Similar films row */}
            {film.similar.length > 0 && (
              <div className="vhs-back-similar">
                <p className="vhs-back-label" style={{ marginBottom: 6 }}>SEE ALSO:</p>
                <div className="vhs-back-similar-row">
                  {film.similar.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectFilm?.(s.id)}
                      className="vhs-back-similar-item"
                      title={s.title}
                    >
                      {s.posterUrl ? (
                        <img src={s.posterUrl} alt={s.title} loading="lazy" />
                      ) : (
                        <span className="vhs-back-similar-placeholder">{s.title}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: barcode + year */}
            <div className="vhs-back-footer">
              <div className="vhs-back-barcode" aria-hidden="true">
                {barcode.map((w, i) => (
                  <span key={i} style={{ width: w }} />
                ))}
              </div>
              <span className="vhs-back-copyright">
                {film.year ? `\u00A9${film.year}` : ""}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
