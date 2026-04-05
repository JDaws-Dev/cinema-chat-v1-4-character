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

function buildBackCoverCopy(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  const selected: string[] = [];
  let count = 0;

  for (const sentence of sentences) {
    if (count >= 280) break;
    selected.push(sentence);
    count += sentence.length;
    if (selected.length >= 2) break;
  }

  const copy = (selected.join(" ") || trimmed).trim();
  return copy.length > 300 ? `${copy.slice(0, 297).trimEnd()}...` : copy;
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
  const coverBlurb = film?.tagline?.trim()
    || film?.overview.split(/(?<=[.!?])\s+/)[0]?.trim()
    || null;
  const backCoverCopy = film?.overview ? buildBackCoverCopy(film.overview) : "";
  const providerSections = film ? [
    { label: "STREAM", items: film.providers.flatrate },
    { label: "RENT", items: film.providers.rent },
    { label: "BUY", items: film.providers.buy },
  ].filter((section) => section.items.length > 0) : [];

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
                  {film.backdropUrl ? (
                    <img src={film.backdropUrl} alt="" className="vhs-case-front-backdrop" />
                  ) : film.posterUrl ? (
                    <img src={film.posterUrl} alt="" className="vhs-case-front-backdrop" />
                  ) : (
                    <div className="vhs-case-front-placeholder" />
                  )}
                  <div className="vhs-case-front-shade" />
                  {film.posterUrl && (
                    <img src={film.posterUrl} alt={film.title} className="vhs-case-front-poster" />
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
                <button
                  type="button"
                  className="vhs-case-flip-btn"
                  onClick={() => setIsFlipped(true)}
                >
                  TURN IT OVER
                </button>
              </div>

              <div className="vhs-case-face vhs-case-back">
                <div className="vhs-back-paper">
                  <div className="vhs-back-stills">
                    <div className="vhs-back-still vhs-back-still--wide">
                      {film.backdropUrl ? (
                        <img src={film.backdropUrl} alt="" />
                      ) : film.posterUrl ? (
                        <img src={film.posterUrl} alt="" />
                      ) : (
                        <div className="vhs-back-still-placeholder" />
                      )}
                    </div>
                    <div className="vhs-back-still vhs-back-still--poster">
                      {film.posterUrl ? (
                        <img src={film.posterUrl} alt={film.title} />
                      ) : film.backdropUrl ? (
                        <img src={film.backdropUrl} alt="" />
                      ) : (
                        <div className="vhs-back-still-placeholder" />
                      )}
                    </div>
                  </div>

                  {coverBlurb && (
                    <div className="vhs-back-blurb">
                      <span className="vhs-back-paper-kicker">FEATURE PRESENTATION</span>
                      <p className="vhs-back-review">"{coverBlurb}"</p>
                    </div>
                  )}

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

                  <div className="vhs-back-copy-grid">
                    <div className="vhs-back-main">
                      <div className="vhs-back-copy-block">
                        <span className="vhs-back-paper-kicker">BACK COVER COPY</span>
                        <p className="vhs-back-synopsis">{backCoverCopy || "No synopsis on file."}</p>
                      </div>
                      <div className="vhs-back-credits">
                        {film.director && <p><span className="vhs-back-label">Director:</span> {film.director}</p>}
                        {topCast && <p><span className="vhs-back-label">Starring:</span> {topCast}</p>}
                        {leadStudio && <p><span className="vhs-back-label">Studio:</span> {leadStudio}</p>}
                        {film.language && <p><span className="vhs-back-label">Language:</span> {film.language.toUpperCase()}</p>}
                      </div>
                    </div>

                    <aside className="vhs-back-side">
                      <div className="vhs-back-streaming">
                        <div className="vhs-back-streaming-kicker">WHERE IT'S STREAMING</div>
                        {providerSections.length > 0 ? (
                          <div className="vhs-back-provider-stack">
                            {providerSections.map((section) => (
                              <div key={section.label} className="vhs-back-providers">
                                <span className="vhs-back-label">{section.label}:</span>
                                <span className="vhs-back-provider-logos">
                                  {section.items.map((p) =>
                                    p.logoPath ? (
                                      <img key={`${section.label}-${p.id}`} src={p.logoPath} alt={p.name} title={p.name} className="vhs-back-provider-icon" />
                                    ) : (
                                      <span key={`${section.label}-${p.id}`} className="vhs-back-provider-text">{p.name}</span>
                                    )
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="vhs-back-streaming-note">No streaming match. This one is a true shelf pull.</p>
                        )}
                      </div>
                    </aside>
                  </div>

                  <div className="vhs-back-actions">
                    {onRent ? (
                      <>
                        <button
                          className="vhs-rent-btn"
                          onClick={() => onRent({ id: film.id, title: film.title, posterUrl: film.posterUrl || "", genre: film.genres[0] || "" })}
                        >
                          TAKE TO HAND
                        </button>
                        <button className="vhs-putback-btn" onClick={onClose}>
                          PUT IT BACK
                        </button>
                      </>
                    ) : (
                      <>
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
