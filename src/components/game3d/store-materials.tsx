"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getEraIdFromYears, type EraId } from "@/lib/curated-movie-catalog";
import { getShelfPlacementSlotsForEra } from "@/lib/store-movie-state";
import { fetchPresentShelfPlacementSlots } from "@/lib/live-shelf-placement";

// Toon shading gradient — 3-step (shadow, mid, highlight) for cel-shaded look
export const toonGradientTexture = (() => {
  if (typeof document === "undefined") return null; // SSR guard
  const canvas = document.createElement("canvas");
  canvas.width = 6;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  // 6 steps: smoother cel-shaded transitions (per INTERIOR-DESIGN-GUIDE.md)
  const values = [40, 80, 120, 160, 200, 255];
  values.forEach((v, i) => {
    const hex = v.toString(16).padStart(2, "0");
    ctx.fillStyle = `#${hex}${hex}${hex}`;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
})();

/** Drop-in material — meshToonMaterial everywhere (cel-shaded) */
export function Mat(props: Record<string, unknown>) {
  const { roughness, metalness, ...toonProps } = props;
  return <meshToonMaterial {...(toonProps as Record<string, unknown>)} gradientMap={toonGradientTexture} />;
}

// ── Poster texture cache + throttled loader ─────────────────
const posterTextureCache = new Map<string, THREE.Texture>();
const pendingCallbacks = new Map<string, { onTexture: (t: THREE.Texture) => void; onFail?: () => void }[]>();
const pendingLoads: (() => void)[] = [];
let activeLoads = 0;
const MAX_CONCURRENT_LOADS = 6; // limit concurrent image fetches to avoid ERR_INSUFFICIENT_RESOURCES
const checkedOutCardCache = new Map<string, THREE.Texture>();

function processQueue() {
  while (activeLoads < MAX_CONCURRENT_LOADS && pendingLoads.length > 0) {
    const next = pendingLoads.shift()!;
    activeLoads++;
    next();
  }
}

export function getOrCreatePosterTexture(url: string, onTexture: (t: THREE.Texture) => void, onFail?: () => void) {
  const cached = posterTextureCache.get(url);
  if (cached) {
    onTexture(cached);
    return;
  }
  // If already queued for this URL, register callbacks but don't re-queue
  const pendingKey = url + "__pending";
  if (posterTextureCache.has(pendingKey)) {
    // Store additional callbacks for when the pending load completes
    const existing = pendingCallbacks.get(url);
    if (existing) {
      existing.push({ onTexture, onFail });
    }
    return;
  }
  posterTextureCache.set(pendingKey, null as unknown as THREE.Texture);
  const callbacks: { onTexture: (t: THREE.Texture) => void; onFail?: () => void }[] = [{ onTexture, onFail }];
  pendingCallbacks.set(url, callbacks);

  const attemptFetch = (retry: boolean) => {
    const fetchUrl = url.startsWith("https://image.tmdb.org/")
      ? `/api/image-proxy?url=${encodeURIComponent(url)}`
      : url;
    fetch(fetchUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          const t = new THREE.Texture(img);
          t.colorSpace = THREE.SRGBColorSpace;
          t.needsUpdate = true;
          posterTextureCache.set(url, t);
          posterTextureCache.delete(pendingKey);
          const cbs = pendingCallbacks.get(url) || callbacks;
          pendingCallbacks.delete(url);
          cbs.forEach(cb => cb.onTexture(t));
          URL.revokeObjectURL(objectUrl);
          activeLoads--;
          processQueue();
        };
        img.onerror = () => {
          if (retry) {
            setTimeout(() => attemptFetch(false), 2000);
          } else {
            activeLoads--;
            posterTextureCache.delete(pendingKey);
            const cbs = pendingCallbacks.get(url) || callbacks;
            pendingCallbacks.delete(url);
            cbs.forEach(cb => cb.onFail?.());
            processQueue();
          }
        };
        img.src = objectUrl;
      })
      .catch(() => {
        if (retry) {
          setTimeout(() => attemptFetch(false), 2000);
        } else {
          activeLoads--;
          posterTextureCache.delete(pendingKey);
          const cbs = pendingCallbacks.get(url) || callbacks;
          pendingCallbacks.delete(url);
          cbs.forEach(cb => cb.onFail?.());
          processQueue();
        }
      });
  };

  const doFetch = () => attemptFetch(true);

  pendingLoads.push(doFetch);
  processQueue();
}

function wrapCardTitle(ctx: CanvasRenderingContext2D, title: string, maxWidth: number, maxLines: number): string[] {
  const words = title.trim().toUpperCase().split(/\s+/);
  const lines: string[] = [];

  for (const word of words) {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      if (current) lines[lines.length - 1] = candidate;
      else lines.push(candidate);
      continue;
    }

    if (lines.length < maxLines) {
      lines.push(word);
    } else {
      lines[maxLines - 1] = `${lines[maxLines - 1]} ${word}`;
    }
  }

  return lines.slice(0, maxLines);
}

function getCheckedOutCardTexture(title: string): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const key = title.trim().toUpperCase();
  const cached = checkedOutCardCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f7e7b7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#7a0f0f";
  ctx.fillRect(16, 20, canvas.width - 32, 74);

  ctx.fillStyle = "#f8f1d4";
  ctx.font = "bold 30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHECKED OUT", canvas.width / 2, 58);

  ctx.fillStyle = "#161616";
  let fontSize = 34;
  let lines: string[] = [];
  for (; fontSize >= 22; fontSize -= 2) {
    ctx.font = `bold ${fontSize}px Arial`;
    lines = wrapCardTitle(ctx, title, 216, 4);
    if (lines.every((line) => ctx.measureText(line).width <= 216)) break;
  }
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 180 + index * (fontSize + 18));
  });

  ctx.strokeStyle = "#563c2b";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  checkedOutCardCache.set(key, texture);
  return texture;
}

// ── Poster texture loader ────────────────────────────────
const GENRE_TMDB_IDS: Record<string, string> = {
  HORROR: "27", "SCI-FI": "878", COMEDY: "35", DRAMA: "18",
  ACTION: "28", CLASSICS: "classics", FAMILY: "10751", NEW: "",
  THRILLER: "53", ROMANCE: "10749", ANIMATED: "16", WESTERN: "37",
  ADVENTURE: "12", FANTASY: "14", WAR: "10752", MUSICAL: "10402",
  KIDS: "16", CRIME: "80", MYSTERY: "9648",
};

export interface PosterData { url: string; title: string; id: number; }

const FALLBACK_POSTERS: PosterData[] = [
  { url: "https://image.tmdb.org/t/p/w342/lxM6kqilAdpdhqUl2biYp5frUxE.jpg", title: "Jaws", id: 578 },
  { url: "https://image.tmdb.org/t/p/w342/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg", title: "Alien", id: 348 },
  { url: "https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", title: "Blade Runner", id: 78 },
  { url: "https://image.tmdb.org/t/p/w342/ceG9VzoRAVGwivFU403Wc3AHRys.jpg", title: "Raiders of the Lost Ark", id: 85 },
  { url: "https://image.tmdb.org/t/p/w342/nRj5511mZdTl4saWEPoj9QroTIu.jpg", title: "The Shining", id: 694 },
  { url: "https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", title: "Star Wars", id: 11 },
  { url: "https://image.tmdb.org/t/p/w342/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg", title: "Back to the Future", id: 105 },
  { url: "https://image.tmdb.org/t/p/w342/an0nD6uq6byfxXCfk6lQBzdL2J1.jpg", title: "E.T. the Extra-Terrestrial", id: 601 },
  { url: "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", title: "Pulp Fiction", id: 680 },
  { url: "https://image.tmdb.org/t/p/w342/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", title: "The Godfather", id: 238 },
  { url: "https://image.tmdb.org/t/p/w342/gpMR1hnEo0JLEW0oGOAkxRYrf7R.jpg", title: "The Princess Bride", id: 2493 },
  { url: "https://image.tmdb.org/t/p/w342/3E52VpEVKhklKLLjqOGKpjEJBnM.jpg", title: "Ghostbusters", id: 620 },
];

// Era-based date filtering — set by Store component, read by usePosterUrls
let currentEraYears = "1990-1993";
let currentEraId: EraId = "early90s";
export function setEraYears(years: string) {
  currentEraYears = years;
  currentEraId = getEraIdFromYears(years);
}

// Global registry of movies actually loaded on shelves — challenge picks from this
const shelfMovieRegistry: Map<string, { title: string; genre: string; id: number }> = new Map();
let heldMovieIds = new Set<number>();
let heldMovieSlotKeys = new Set<string>();

export function getShelfMovies(): { title: string; genre: string; id: number }[] {
  return Array.from(shelfMovieRegistry.values());
}

export function setHeldMovieIds(ids: number[]) {
  heldMovieIds = new Set(ids);
}

export function setHeldMovieSlotKeys(slotKeys: string[]) {
  heldMovieSlotKeys = new Set(slotKeys);
}

function buildFallbackPosters(count: number, cacheKey: string): PosterData[] {
  const offset = Math.abs([...cacheKey].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % FALLBACK_POSTERS.length;
  const rotated = FALLBACK_POSTERS.map((_, i) => FALLBACK_POSTERS[(i + offset) % FALLBACK_POSTERS.length]);
  return Array.from({ length: count }, (_, i) => rotated[i % rotated.length]);
}

export function usePosterUrls(genre: string, count: number, placementKey = ""): PosterData[] {
  const [posters, setPosters] = useState<PosterData[]>([]);

  useEffect(() => {
    const [startYear, endYear] = currentEraYears.split("-");
    const effectivePlacementKey = placementKey || `${genre}:${count}`;

    if (currentEraId !== "present") {
      const localPosters = getShelfPlacementSlotsForEra(
        currentEraId,
        genre,
        effectivePlacementKey,
        count
      );
      setPosters(
        localPosters.map((poster) => ({
          url: poster.posterUrl,
          title: poster.title,
          id: poster.id,
        }))
      );
      return;
    }

    fetchPresentShelfPlacementSlots(currentEraYears, effectivePlacementKey, count)
      .then((liveSlots) => {
        if (liveSlots.length === 0) {
          setPosters(buildFallbackPosters(count, `${genre}_${startYear}_${endYear}_${effectivePlacementKey}`));
          return;
        }
        setPosters(
          liveSlots.map((slot) => ({
            url: slot.posterUrl,
            title: slot.title,
            id: slot.id,
          }))
        );
      })
      .catch(() => {
        setPosters(buildFallbackPosters(count, `${genre}_${startYear}_${endYear}_${effectivePlacementKey}`));
      });
  }, [genre, count, placementKey]);

  // Register loaded movies in global registry for challenge system
  useEffect(() => {
    const genreName = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase().replace(/-/g, " ");
    for (const p of posters) {
      if (p.title && p.id) {
        shelfMovieRegistry.set(`${p.id}`, { title: p.title, genre: genreName, id: p.id });
      }
    }
  }, [posters, genre]);

  return posters;
}

export function PosterBox({
  url,
  position,
  rotation = 0,
  movieTitle,
  movieId,
  genreColor,
  slotKey,
  hideWithSlotKey = true,
}: {
  url: string;
  position: [number, number, number];
  rotation?: number;
  movieTitle?: string;
  movieId?: number;
  genreColor?: string;
  slotKey?: string;
  hideWithSlotKey?: boolean;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const loadedRef = useRef(false);
  const isUnavailable = slotKey
    ? (hideWithSlotKey && heldMovieSlotKeys.has(slotKey))
    : typeof movieId === "number" && heldMovieIds.has(movieId);
  const checkedOutTexture = useMemo(
    () => (isUnavailable && movieTitle ? getCheckedOutCardTexture(movieTitle) : null),
    [isUnavailable, movieTitle]
  );

  useEffect(() => {
    if (isUnavailable) return;
    loadedRef.current = false;
    const isMob = typeof window !== "undefined" && ("ontouchstart" in window || window.innerWidth < 768);
    const imgUrl = url.startsWith("https://image.tmdb.org/")
      ? isMob ? url.replace("/w342/", "/w92/") : url.replace("/w342/", "/w154/")
      : url;

    // 5-second fallback: show genre color if texture hasn't loaded
    const fallbackColor = genreColor || "#5a5a7a";
    const fallbackTimer = setTimeout(() => {
      if (!loadedRef.current && matRef.current) {
        matRef.current.color.set(fallbackColor);
        matRef.current.needsUpdate = true;
      }
    }, 5000);

    getOrCreatePosterTexture(imgUrl, (t) => {
      loadedRef.current = true;
      if (matRef.current) {
        matRef.current.map = t;
        matRef.current.color.set("#ffffff");
        matRef.current.needsUpdate = true;
      }
    }, () => {
      // onFail — immediately show genre fallback color
      if (!loadedRef.current && matRef.current) {
        matRef.current.color.set(fallbackColor);
        matRef.current.needsUpdate = true;
      }
    });

    return () => clearTimeout(fallbackTimer);
  }, [url, genreColor, isUnavailable]);

  const vhsData = movieTitle && movieId
    ? JSON.stringify({ id: movieId, title: movieTitle, posterUrl: url, slotKey })
    : undefined;
  const userData = !isUnavailable && vhsData
    ? { interactType: "vhs", interactData: vhsData, label: `Pick up: ${movieTitle}` }
    : undefined;

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      userData={userData}
    >
      {!isUnavailable && (
        <mesh userData={userData}>
          <boxGeometry args={[0.15, 0.26, 0.025]} />
          <meshBasicMaterial color="#1a1a2a" />
        </mesh>
      )}
      {isUnavailable && (
        <>
          <mesh position={[0, -0.115, 0]}>
            <boxGeometry args={[0.16, 0.02, 0.03]} />
            <meshBasicMaterial color="#3b2f2a" />
          </mesh>
          <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.14, 0.25]} />
            <meshBasicMaterial
              color="#f7e7b7"
              map={checkedOutTexture}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
      {!isUnavailable && (
        <mesh position={[0, 0, -0.0135]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.14, 0.25]} />
          <meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
