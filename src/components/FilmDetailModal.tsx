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
  onRent?: (movie: { id: number; title: string; posterUrl: string; genre: string }) => void;
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

export function FilmDetailModal({ filmId, onClose, onSelectFilm, onRent }: FilmDetailModalProps) {
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [onList, setOnList] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  useEffect(() => {
    if (!film) return;
    setIsFlipped(false);
    const timer = window.setTimeout(() => setIsFlipped(true), 1250);
    return () => window.clearTimeout(timer);
  }, [film?.id]);

  const genreColor = useMemo(() => {
    if (!film || film.genres.length === 0) return "#ffd700";
    return GENRE_COLORS[film.genres[0]] ?? "#ffd700";
  }, [film]);

  const barcode = useMemo(() => barcodeWidths(film?.title ?? ""), [film?.title]);
  const synopsisStyle = useMemo(() => {
    const length = film?.overview.length ?? 0;
    if (length > 900) return { fontSize: "0.56rem", lineHeight: 1.16 };
    if (length > 700) return { fontSize: "0.6rem", lineHeight: 1.18 };
    if (length > 560) return { fontSize: "0.64rem", lineHeight: 1.22 };
    if (length > 420) return { fontSize: "0.68rem", lineHeight: 1.26 };
    if (length > 320) return { fontSize: "0.72rem", lineHeight: 1.3 };
    return undefined;
  }, [film?.overview]);

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
  const leadStudio = film?.productionCompanies[0] ?? null;
  const caseArtUrl = film?.posterUrl || film?.backdropUrl || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* VHS Back Case */}
      <div
        className="vhs-back vhs-case-shell"
        style={{ "--genre-color": genreColor } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="vhs-back-loading">Loading...</div>
        ) : !film ? (
          <div className="vhs-back-loading">Film not found</div>
        ) : (
          <>
            <button onClick={onClose} className="vhs-back-close" aria-label="Close">&times;</button>

            <div className={`vhs-case ${isFlipped ? "vhs-case--flipped" : ""}`}>
              <div className="vhs-case-face vhs-case-front">
                <div className="vhs-case-front-badge">PICK UP THE CASE</div>
                <div className="vhs-case-front-art">
                  {caseArtUrl ? (
                    <img src={caseArtUrl} alt={film.title} className="vhs-case-front-backdrop" />
                  ) : (
                    <div className="vhs-case-front-placeholder" />
                  )}
                </div>
                <div className="vhs-case-front-copy">
                  <h2 className="vhs-case-front-title">{film.title.toUpperCase()}</h2>
                  {film.tagline && (
                    <p className="vhs-case-front-tagline">"{film.tagline}"</p>
                  )}
                  <p className="vhs-case-front-meta">
                    {film.year} &bull; {film.runtime ? `${film.runtime} min` : ""} &bull; {film.genres.slice(0, 2).join(" / ")}
                  </p>
                </div>
                <div className="vhs-case-front-actions">
                  {onRent ? (
                    <>
                      <button
                        className="vhs-rent-btn"
                        onClick={() => onRent({ id: film.id, title: film.title, posterUrl: film.posterUrl || "", genre: film.genres[0] || "" })}
                      >
                        PICK UP
                      </button>
                      <button
                        type="button"
                        className="vhs-turn-btn"
                        onClick={() => setIsFlipped(true)}
                      >
                        TURN OVER
                      </button>
                      <button className="vhs-putback-btn" onClick={onClose}>
                        PUT BACK
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="vhs-turn-btn"
                      onClick={() => setIsFlipped(true)}
                    >
                      TURN OVER
                    </button>
                  )}
                </div>
              </div>

              <div className="vhs-case-face vhs-case-back">
                <div className="vhs-back-paper">
                  <div className="vhs-back-copy-grid">
                    <div className="vhs-back-main">
                      <div className="vhs-back-header-block">
                        <h2 className="vhs-back-title">{film.title.toUpperCase()}</h2>
                        <p className="vhs-back-meta">
                          {film.year} &bull; {film.runtime ? `${film.runtime} min` : ""} &bull; {film.genres.slice(0, 2).join(" / ")}
                        </p>
                        {film.voteAverage ? (
                          <div className="vhs-rating-badge">
                            ★ {(film.voteAverage / 2).toFixed(1)}
                          </div>
                        ) : null}
                      </div>

                      <div className="vhs-back-copy-block">
                        <span className="vhs-back-paper-kicker">SYNOPSIS</span>
                        <p className="vhs-back-synopsis" style={synopsisStyle}>{film.overview || "No synopsis on file."}</p>
                      </div>
                      <div className="vhs-back-credits">
                        {film.director && <p><span className="vhs-back-label">Director:</span> {film.director}</p>}
                        {topCast && <p><span className="vhs-back-label">Starring:</span> {topCast}</p>}
                        {leadStudio && <p><span className="vhs-back-label">Studio:</span> {leadStudio}</p>}
                        {film.language && <p><span className="vhs-back-label">Language:</span> {film.language.toUpperCase()}</p>}
                      </div>
                    </div>

                    <aside className="vhs-back-side">
                      {caseArtUrl ? (
                        <div className="vhs-back-corner-art">
                          <img src={caseArtUrl} alt={film.title} />
                        </div>
                      ) : null}
                    </aside>
                  </div>

                  <div className="vhs-back-actions">
                    {onRent ? (
                      <>
                        <button
                          className="vhs-rent-btn"
                          onClick={() => onRent({ id: film.id, title: film.title, posterUrl: film.posterUrl || "", genre: film.genres[0] || "" })}
                        >
                          PICK UP
                        </button>
                        <button
                          type="button"
                          className="vhs-turn-btn"
                          onClick={() => setIsFlipped(false)}
                        >
                          TURN OVER
                        </button>
                        <button className="vhs-putback-btn" onClick={onClose}>
                          PUT BACK
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="vhs-turn-btn"
                          onClick={() => setIsFlipped(false)}
                        >
                          TURN OVER
                        </button>
                        <button
                          onClick={toggleWatchlist}
                          className={`vhs-back-pick-btn ${onList ? "vhs-back-pick-btn--active" : ""}`}
                        >
                          {onList ? "\u2605 On Watchlist" : "\u2606 Pick this movie"}
                        </button>
                        <StarRating rating={userRating} onRate={handleRate} size="sm" />
                      </>
                    )}
                  </div>

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
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
