"use client";

import { useCallback } from "react";
import { type HeldMovie } from "@/hooks/useInventory";

const HELD_VIEW_OFFSETS = [
  { x: 0, y: 0, rotation: 8 },
  { x: 26, y: 12, rotation: 13 },
  { x: 50, y: 24, rotation: 17 },
  { x: 72, y: 38, rotation: 20 },
  { x: 90, y: 52, rotation: 24 },
];

interface HeldVHSStackProps {
  heldMovies: HeldMovie[];
}

export function HeldVHSStack({ heldMovies }: HeldVHSStackProps) {
  const getHudPosterSrc = useCallback((posterUrl: string) => {
    if (!posterUrl) return "";
    return posterUrl.startsWith("https://image.tmdb.org/")
      ? `/api/image-proxy?url=${encodeURIComponent(posterUrl.replace('/w342/', '/w92/'))}`
      : posterUrl;
  }, []);

  return (
    <div className="g3-held-viewmodel" aria-hidden="true">
      {[...heldMovies].slice(-5).reverse().map((movie, index) => (
        <div
          key={`held-vhs-${movie.slotKey ?? movie.id}-${index}`}
          className="g3-held-vhs"
          style={{
            transform: `translate(${HELD_VIEW_OFFSETS[index]?.x ?? 0}px, ${HELD_VIEW_OFFSETS[index]?.y ?? 0}px) rotate(${HELD_VIEW_OFFSETS[index]?.rotation ?? 8}deg)`,
            zIndex: 20 - index,
          }}
        >
          {movie.posterUrl ? (
            <img
              src={getHudPosterSrc(movie.posterUrl)}
              alt=""
              className="g3-held-vhs-poster"
            />
          ) : (
            <div className="g3-held-vhs-fallback">{movie.title}</div>
          )}
          <div className="g3-held-vhs-spine" />
        </div>
      ))}
      {heldMovies.length > 5 && (
        <div className="g3-held-vhs-count">+{heldMovies.length - 5}</div>
      )}
    </div>
  );
}
