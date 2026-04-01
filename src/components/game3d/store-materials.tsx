"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";

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
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    fetch(proxyUrl)
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

// ── Poster texture loader ────────────────────────────────
const GENRE_TMDB_IDS: Record<string, string> = {
  HORROR: "27", "SCI-FI": "878", COMEDY: "35", DRAMA: "18",
  ACTION: "28", CLASSICS: "classics", FAMILY: "10751", NEW: "",
  THRILLER: "53", ROMANCE: "10749", ANIMATED: "16", WESTERN: "37",
  FOREIGN: "10752", INDIE: "18", CULT: "27", CRIME: "80",
  MYSTERY: "9648", ADVENTURE: "12", FANTASY: "14", WAR: "10752",
  MUSICAL: "10402", KIDS: "10751", SPORTS: "28", DOCUMENTARY: "99",
  FITNESS: "10751", "TV SERIES": "10770",
};

export interface PosterData { url: string; title: string; id: number; }

// Era-based date filtering — set by Store component, read by usePosterUrls
let currentEraYears = "1990-1993";
export function setEraYears(years: string) { currentEraYears = years; }

// Global registry of movies actually loaded on shelves — challenge picks from this
const shelfMovieRegistry: Map<string, { title: string; genre: string; id: number }> = new Map();

export function getShelfMovies(): { title: string; genre: string; id: number }[] {
  return Array.from(shelfMovieRegistry.values());
}

export function usePosterUrls(genre: string, count: number): PosterData[] {
  const [posters, setPosters] = useState<PosterData[]>([]);

  useEffect(() => {
    // Support "-P2"/"-P3" suffix for extra racks of same genre (different TMDB pages)
    const pageMatch = genre.match(/-P(\d+)$/);
    const pageNum = pageMatch ? parseInt(pageMatch[1]) : 0;
    const baseGenre = pageNum ? genre.replace(/-P\d+$/, "") : genre;
    const pageOffset = pageNum * 3; // P2=pages 4-6, P3=pages 7-9
    const genreId = GENRE_TMDB_IDS[baseGenre];
    const [startYear, endYear] = currentEraYears.split("-");

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
        if (uniquePosters.length > 0 && uniquePosters.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(uniquePosters[i % uniquePosters.length]);
          setPosters(filled);
        } else {
          setPosters(uniquePosters);
        }
      }).catch(() => {});
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
        // Cycle/repeat to fill all slots if not enough unique results
        if (uniquePosters.length > 0 && uniquePosters.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(uniquePosters[i % uniquePosters.length]);
          setPosters(filled);
        } else {
          setPosters(uniquePosters);
        }
      }).catch(() => {});
    } else {
      // Genre — fetch 3 pages for more variety, filtered by era (offset for P2 racks)
      Promise.all([
        fetch(`/api/search?genreId=${genreId}&ratingMin=6&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=${1 + pageOffset}`).then(r => r.json()),
        fetch(`/api/search?genreId=${genreId}&ratingMin=6&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=${2 + pageOffset}`).then(r => r.json()),
        fetch(`/api/search?genreId=${genreId}&ratingMin=6&releaseDateGte=${startYear}-01-01&releaseDateLte=${endYear}-12-31&page=${3 + pageOffset}`).then(r => r.json()),
      ]).then(([p1, p2, p3]) => {
        const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
        const uniquePosters = all.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url);
        // Cycle/repeat to fill all slots if not enough unique results
        if (uniquePosters.length > 0 && uniquePosters.length < count) {
          const filled: PosterData[] = [];
          for (let i = 0; i < count; i++) filled.push(uniquePosters[i % uniquePosters.length]);
          setPosters(filled);
        } else {
          setPosters(uniquePosters);
        }
      }).catch(() => {});
    }
  }, [genre, count]);

  // Register loaded movies in global registry for challenge system
  useEffect(() => {
    const cleanGenre = genre.replace(/-P\d+$/, "");
    const genreName = cleanGenre.charAt(0).toUpperCase() + cleanGenre.slice(1).toLowerCase().replace(/-/g, " ");
    for (const p of posters) {
      if (p.title && p.id) {
        shelfMovieRegistry.set(`${p.id}`, { title: p.title, genre: genreName, id: p.id });
      }
    }
  }, [posters, genre]);

  return posters;
}

export function PosterBox({ url, position, rotation = 0, movieTitle, movieId, genreColor }: { url: string; position: [number, number, number]; rotation?: number; movieTitle?: string; movieId?: number; genreColor?: string }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    // Use smallest TMDB sizes — VHS boxes are tiny in 3D, no need for high-res
    const isMob = typeof window !== "undefined" && ("ontouchstart" in window || window.innerWidth < 768);
    const imgUrl = isMob ? url.replace("/w342/", "/w92/") : url.replace("/w342/", "/w154/");

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
  }, [url, genreColor]);

  const vhsData = movieTitle && movieId ? JSON.stringify({ id: movieId, title: movieTitle, posterUrl: url }) : undefined;

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      userData={vhsData ? { interactType: "vhs", interactData: vhsData, label: `Pick up: ${movieTitle}` } : undefined}
    >
      <mesh userData={vhsData ? { interactType: "vhs", interactData: vhsData, label: `Pick up: ${movieTitle}` } : undefined}>
        <boxGeometry args={[0.15, 0.26, 0.025]} />
        <meshBasicMaterial color="#1a1a2a" />
      </mesh>
      {/* Poster plane — offset clearly in front, flipped to face camera */}
      <mesh position={[0, 0, -0.0135]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.14, 0.25]} />
        <meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
