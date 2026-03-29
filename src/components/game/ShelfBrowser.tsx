"use client";

import { useState, useEffect } from "react";
import { fetchTrending, fetchSearch } from "@/lib/api";
import type { TrendingMovie, SearchResult } from "@/lib/types";

// Map zone IDs to TMDB genre IDs
const GENRE_MAP: Record<string, string> = {
  horror: "27",
  scifi: "878",
  comedy: "35",
  drama: "18",
  action: "28",
  classics: "classics",
  family: "10751",
  thriller: "53",
  romance: "10749",
  animated: "16",
  western: "37",
  foreign: "10752",
  docs: "99",
  indie: "18",
  cult: "27",
};

const SPINE_COLORS: Record<string, string> = {
  horror: "#dc2626",
  scifi: "#3b82f6",
  comedy: "#f97316",
  drama: "#1e40af",
  action: "#ef4444",
  classics: "#b8960a",
  family: "#22c55e",
  thriller: "#7c3aed",
  romance: "#f43f5e",
  animated: "#06b6d4",
  western: "#a16207",
  foreign: "#0891b2",
  docs: "#65a30d",
  indie: "#d946ef",
  cult: "#ea580c",
  new_releases: "#ec4899",
  staff_picks: "#ffd700",
};

interface ShelfBrowserProps {
  genre: string;
  open: boolean;
  onClose: () => void;
  onFilmClick: (id: number) => void;
}

type Film = { id: number; title: string; year: number | null; posterUrl: string | null };

export function ShelfBrowser({ genre, open, onClose, onFilmClick }: ShelfBrowserProps) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !genre) return;
    setLoading(true);
    setFilms([]);

    if (genre === "new_releases" || genre === "staff_picks" || genre === "new") {
      fetchTrending("week")
        .then((data) => {
          setFilms(
            data.movies.map((m: TrendingMovie) => ({
              id: m.id,
              title: m.title,
              year: m.year,
              posterUrl: m.posterUrl,
            }))
          );
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (genre === "classics") {
      // Classics: pre-1980 highly rated films
      fetchSearch({ decade: "1960", ratingMin: 7 })
        .then((data) => {
          setFilms(data.results.map((r: SearchResult) => ({
            id: r.id, title: r.title, year: r.year, posterUrl: r.posterUrl,
          })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      const genreId = GENRE_MAP[genre];
      if (!genreId) {
        setLoading(false);
        return;
      }
      fetchSearch({ genreId, ratingMin: 6 })
        .then((data) => {
          setFilms(
            data.results.map((r: SearchResult) => ({
              id: r.id,
              title: r.title,
              year: r.year,
              posterUrl: r.posterUrl,
            }))
          );
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, genre]);

  // Q or Backspace to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q" || e.key === "Backspace") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const label =
    genre === "new_releases"
      ? "NEW RELEASES"
      : genre === "staff_picks"
        ? "STAFF PICKS"
        : genre.toUpperCase();

  const spineColor = SPINE_COLORS[genre] || "#888";

  return (
    <div className={`game-panel panel-bottom ${open ? "panel-open" : ""}`}>
      <div className="panel-header">
        <div className="panel-title">{label}</div>
        <button className="panel-close" onClick={onClose}>
          ✕ CLOSE
        </button>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="panel-loading">LOADING TAPES...</div>
        ) : films.length === 0 ? (
          <div className="panel-empty">Shelf is empty. Check back later.</div>
        ) : (
          <div className="vhs-grid">
            {films.map((film) => (
              <div
                key={film.id}
                className="vhs-cassette"
                onClick={() => onFilmClick(film.id)}
              >
                {film.posterUrl ? (
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    className="vhs-poster"
                    loading="lazy"
                  />
                ) : (
                  <div className="vhs-poster-placeholder">{film.title}</div>
                )}
                <div className="vhs-spine" style={{ background: spineColor }} />
                <div className="vhs-title">{film.title}</div>
                {film.year && <div className="vhs-year">{film.year}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
