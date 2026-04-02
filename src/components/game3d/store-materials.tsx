"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getCuratedShelfPosterData, getEraIdFromYears, type EraId } from "@/lib/curated-movie-catalog";

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

function wrapCardTitle(title: string): string[] {
  const words = title.trim().toUpperCase().split(/\s+/);
  const lines: string[] = [];

  for (const word of words) {
    if (lines.length === 0) {
      lines.push(word);
      continue;
    }

    const candidate = `${lines[lines.length - 1]} ${word}`;
    if (candidate.length <= 16 && lines.length < 3) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < 3) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
    }
  }

  return lines.slice(0, 3);
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
  ctx.font = "bold 34px Arial";
  const lines = wrapCardTitle(title);
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 190 + index * 72);
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

// Cache all fetched posters per genre+era so duplicate shelves can take different slices
const genrePosterCache: Record<string, PosterData[]> = {};
const genreSliceCounter: Record<string, number> = {};

function buildFallbackPosters(count: number, cacheKey: string): PosterData[] {
  if (sliceRefMap[cacheKey] === undefined) {
    sliceRefMap[cacheKey] = genreSliceCounter[cacheKey] || 0;
    genreSliceCounter[cacheKey] = (genreSliceCounter[cacheKey] || 0) + 1;
  }
  const offset = sliceRefMap[cacheKey] * count;
  const rotated = FALLBACK_POSTERS.map((_, i) => FALLBACK_POSTERS[(i + offset) % FALLBACK_POSTERS.length]);
  return Array.from({ length: count }, (_, i) => rotated[i % rotated.length]);
}

const sliceRefMap: Record<string, number> = {};

export function usePosterUrls(genre: string, count: number, placementKey = ""): PosterData[] {
  const [posters, setPosters] = useState<PosterData[]>([]);
  // Each shelf instance gets the next slice of cached results
  const sliceRef = useRef<number>(-1);

  useEffect(() => {
    const genreId = GENRE_TMDB_IDS[genre];
    const [startYear, endYear] = currentEraYears.split("-");

    if (currentEraId !== "present") {
      const localPosters = getCuratedShelfPosterData(genre, currentEraId, placementKey, count);
      setPosters(
        localPosters.map((poster) => ({
          url: poster.url,
          title: poster.title,
          id: poster.id,
        }))
      );
      return;
    }

    if (!genreId) {
      // "New Releases" wall — popular movies from the selected era (3 pages for more variety)
      Promise.all([
        fetch(`/api/search?releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&ratingMin=5&page=1`).then(r => r.json()),
        fetch(`/api/search?releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&ratingMin=5&page=2`).then(r => r.json()),
        fetch(`/api/search?releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&ratingMin=5&page=3`).then(r => r.json()),
      ]).then(([p1, p2, p3]) => {
        const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
        const seen = new Set<number>();
        const unique = all.filter((m: Record<string, unknown>) => {
          if (seen.has(m.id as number)) return false;
          seen.add(m.id as number);
          return true;
        });
        const uniquePosters = unique.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url);
        // Cycle/repeat to fill all slots if not enough unique results
        if (uniquePosters.length === 0) {
          setPosters(buildFallbackPosters(count, `NEW_${startYear}_${endYear}`));
        } else if (uniquePosters.length > 0 && uniquePosters.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(uniquePosters[i % uniquePosters.length]);
          setPosters(filled);
        } else {
          setPosters(uniquePosters);
        }
      }).catch(() => {
        setPosters(buildFallbackPosters(count, `NEW_${startYear}_${endYear}`));
      });
    } else if (genreId === "classics") {
      // Classics: pre-1980 highly-rated films (TCM style)
      Promise.all([
        fetch(`/api/search?decade=1960&ratingMin=7&page=1`).then(r => r.json()),
        fetch(`/api/search?decade=1950&ratingMin=7&page=1`).then(r => r.json()),
        fetch(`/api/search?decade=1970&ratingMin=7&page=1`).then(r => r.json()),
      ]).then(([s60, s50, s70]) => {
        const all = [...(s60.results || []), ...(s50.results || []), ...(s70.results || [])];
        const uniquePosters = all.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url);
        if (uniquePosters.length === 0) {
          setPosters(buildFallbackPosters(count, `CLASSICS_${startYear}_${endYear}`));
        } else if (uniquePosters.length > 0 && uniquePosters.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(uniquePosters[i % uniquePosters.length]);
          setPosters(filled);
        } else {
          setPosters(uniquePosters);
        }
      }).catch(() => {
        setPosters(buildFallbackPosters(count, `CLASSICS_${startYear}_${endYear}`));
      });
    } else {
      // Genre — fetch 3 pages, cache results, each shelf takes a different slice
      const cacheKey = `${genre}_${startYear}_${endYear}`;
      const fetchAndSlice = (allPosters: PosterData[]) => {
        // Assign a slice index for this shelf instance
        if (sliceRef.current === -1) {
          sliceRef.current = genreSliceCounter[cacheKey] || 0;
          genreSliceCounter[cacheKey] = (genreSliceCounter[cacheKey] || 0) + 1;
        }
        const offset = sliceRef.current * count;
        const sliced = allPosters.slice(offset, offset + count);
        // If not enough in our slice, wrap around
        if (sliced.length > 0 && sliced.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(sliced[i % sliced.length]);
          setPosters(filled);
        } else if (sliced.length === 0) {
          // Our slice is empty, use from start
          const wrapped = allPosters.slice(0, count);
          setPosters(wrapped.length > 0 ? wrapped : []);
        } else {
          setPosters(sliced);
        }
      };

      if (genrePosterCache[cacheKey]) {
        fetchAndSlice(genrePosterCache[cacheKey]);
      } else {
        Promise.all([
          fetch(`/api/search?genreId=${genreId}&ratingMin=5&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=1`).then(r => r.json()),
          fetch(`/api/search?genreId=${genreId}&ratingMin=5&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=2`).then(r => r.json()),
          fetch(`/api/search?genreId=${genreId}&ratingMin=5&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=3`).then(r => r.json()),
        ]).then(([p1, p2, p3]) => {
          const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
          const allPosters = all.map((m: Record<string, unknown>) => ({
            url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
          })).filter((p: PosterData) => p.url);
          if (allPosters.length === 0) {
            setPosters(buildFallbackPosters(count, cacheKey));
            return;
          }
          genrePosterCache[cacheKey] = allPosters;
          fetchAndSlice(allPosters);
        }).catch(() => {
          setPosters(buildFallbackPosters(count, cacheKey));
        });
      }
    }
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
}: {
  url: string;
  position: [number, number, number];
  rotation?: number;
  movieTitle?: string;
  movieId?: number;
  genreColor?: string;
  slotKey?: string;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const loadedRef = useRef(false);
  const isUnavailable = slotKey
    ? heldMovieSlotKeys.has(slotKey)
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
