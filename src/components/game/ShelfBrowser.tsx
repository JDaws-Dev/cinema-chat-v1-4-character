"use client";

import { useState, useEffect } from "react";
import { fetchTrending, fetchSearch } from "@/lib/api";
import { getShelfBrowserMovies, type EraId } from "@/lib/curated-movie-catalog";
import { getShelfPlacementSlotsForEra } from "@/lib/store-movie-state";
import { fetchPresentShelfPlacementSlots } from "@/lib/live-shelf-placement";
import type { TrendingMovie, SearchResult } from "@/lib/types";

// Map zone IDs to TMDB genre IDs
const GENRE_MAP: Record<string, string> = {
  horror: "27", scifi: "878", "sci-fi": "878", comedy: "35", drama: "18",
  action: "28", classics: "classics", family: "10751", thriller: "53",
  romance: "10749", animated: "16", western: "37", foreign: "10752",
  indie: "18", cult: "27", crime: "80", mystery: "9648", adventure: "12",
  fantasy: "14", war: "10752", musical: "10402", kids: "10751",
  sports: "28", documentary: "99", fitness: "10751", "tv series": "10770",
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
  eraId: EraId;
  shelfId?: string;
  placementKey?: string;
  shelfCount?: number;
  label?: string;
  heldSlotKeys?: string[];
  recentReturnSlotKeys?: string[];
  checkedOutSlotKeys?: string[];
  open: boolean;
  onClose: () => void;
  onFilmClick: (movie: Film) => void;
}

type FilmStatus = "on_shelf" | "in_returns" | "held" | "checked_out";
type Film = { id: number; title: string; year: number | null; posterUrl: string | null; slotKey?: string; status?: FilmStatus };

export function ShelfBrowser({
  genre,
  eraId,
  shelfId,
  placementKey,
  shelfCount,
  label,
  heldSlotKeys = [],
  recentReturnSlotKeys = [],
  checkedOutSlotKeys = [],
  open,
  onClose,
  onFilmClick,
}: ShelfBrowserProps) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const limit = shelfCount ?? (genre === "new_releases" || genre === "new" ? 10 : 18);

  useEffect(() => {
    if (!open || !genre) return;
    setLoading(true);
    setFilms([]);

    if (placementKey) {
      const held = new Set(heldSlotKeys);
      const inReturns = new Set(recentReturnSlotKeys);
      const checkedOut = new Set(checkedOutSlotKeys);

      if (eraId !== "present") {
        const held = new Set(heldSlotKeys);
        setFilms(
          getShelfPlacementSlotsForEra(eraId, genre, placementKey, limit).map((movie) => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            posterUrl: movie.posterUrl,
            slotKey: movie.slotKey,
            status: held.has(movie.slotKey)
              ? "held"
              : inReturns.has(movie.slotKey)
                ? "in_returns"
                : checkedOut.has(movie.slotKey)
                  ? "checked_out"
                  : "on_shelf",
          }))
        );
        setLoading(false);
        return;
      }

      fetchPresentShelfPlacementSlots("2024-2026", placementKey, limit)
        .then((slots) => {
          setFilms(slots.map((slot) => ({
            id: slot.id,
            title: slot.title,
            year: slot.year,
            posterUrl: slot.posterUrl,
            slotKey: slot.slotKey,
            status: held.has(slot.slotKey)
              ? "held"
              : inReturns.has(slot.slotKey)
                ? "in_returns"
                : checkedOut.has(slot.slotKey)
                  ? "checked_out"
                  : "on_shelf",
          })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    if (eraId !== "present") {
      setFilms(getShelfBrowserMovies(genre, eraId, shelfId, limit));
      setLoading(false);
      return;
    }

    if (genre === "new_releases" || genre === "staff_picks" || genre === "new") {
      fetchTrending("week")
        .then((data) => {
          setFilms(
            data.movies.slice(0, limit).map((m: TrendingMovie) => ({
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
          setFilms(data.results.slice(0, limit).map((r: SearchResult) => ({
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
            data.results.slice(0, limit).map((r: SearchResult) => ({
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
  }, [open, genre, eraId, shelfId, placementKey, limit, heldSlotKeys, recentReturnSlotKeys, checkedOutSlotKeys]);

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

  const shelfLabel = label ||
    (genre === "new_releases"
      ? "NEW RELEASES"
      : genre === "staff_picks"
        ? "STAFF PICKS"
        : genre.toUpperCase());

  const spineColor = SPINE_COLORS[genre] || "#888";

  const statusLabel: Record<FilmStatus, string> = {
    on_shelf: "ON SHELF",
    in_returns: "IN RETURNS",
    held: "IN YOUR STACK",
    checked_out: "CHECKED OUT",
  };

  return (
    <div className={`game-panel panel-bottom ${open ? "panel-open" : ""}`}>
      <div className="panel-header">
        <div className="panel-title">{shelfLabel}</div>
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
                key={film.slotKey ?? film.id}
                className={`vhs-cassette ${film.status === "checked_out" ? "vhs-cassette-disabled" : ""}`}
                onClick={() => film.status !== "checked_out" && onFilmClick(film)}
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
                {film.status && film.status !== "on_shelf" && (
                  <div className={`vhs-status-badge vhs-status-${film.status}`}>
                    {statusLabel[film.status]}
                  </div>
                )}
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
