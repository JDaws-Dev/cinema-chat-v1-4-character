"use client";

import React, { useRef, useMemo, useState, useEffect, useContext, createContext } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { hasProp, PROPS } from "@/lib/game-state";

// Mobile context — meshBasicMaterial on mobile, meshStandardMaterial on desktop
const MobileCtx = createContext(false);

/** Drop-in replacement for meshStandardMaterial that uses meshBasicMaterial on mobile */
function Mat(props: Record<string, unknown>) {
  const mob = useContext(MobileCtx);
  if (mob) {
    // On mobile: use unlit material. Use emissive color if it was the dominant visual.
    const { roughness, metalness, emissiveIntensity, emissive, ...rest } = props;
    const color = (emissive && (emissiveIntensity as number) > 0.5) ? emissive : rest.color;
    return <meshBasicMaterial {...rest} color={color as string} />;
  }
  return <meshStandardMaterial {...(props as Record<string, unknown>)} />;
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

function getOrCreatePosterTexture(url: string, onTexture: (t: THREE.Texture) => void, onFail?: () => void) {
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
  FOREIGN: "10752", DOCS: "99", INDIE: "18", CULT: "27",
};

interface PosterData { url: string; title: string; id: number; }

// Global registry of movies actually loaded on shelves — challenge picks from this
const shelfMovieRegistry: Map<string, { title: string; genre: string; id: number }> = new Map();

export function getShelfMovies(): { title: string; genre: string; id: number }[] {
  return Array.from(shelfMovieRegistry.values());
}

function usePosterUrls(genre: string, count: number): PosterData[] {
  const [posters, setPosters] = useState<PosterData[]>([]);

  useEffect(() => {
    const genreId = GENRE_TMDB_IDS[genre];

    if (!genreId) {
      // Trending — fetch 2 pages
      Promise.all([
        fetch(`/api/trending?window=week`).then(r => r.json()),
        fetch(`/api/trending?window=day`).then(r => r.json()),
      ]).then(([week, day]) => {
        const all = [...(week.movies || []), ...(day.movies || [])];
        const seen = new Set<number>();
        const unique = all.filter((m: Record<string, unknown>) => {
          if (seen.has(m.id as number)) return false;
          seen.add(m.id as number);
          return true;
        });
        setPosters(unique.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url));
      }).catch(() => {});
    } else if (genreId === "classics") {
      // Classics: pre-1980 highly-rated films (TCM style)
      Promise.all([
        fetch(`/api/search?decade=1960&ratingMin=7&page=1`).then(r => r.json()),
        fetch(`/api/search?decade=1950&ratingMin=7&page=1`).then(r => r.json()),
        fetch(`/api/search?decade=1970&ratingMin=7&page=1`).then(r => r.json()),
      ]).then(([s60, s50, s70]) => {
        const all = [...(s60.results || []), ...(s50.results || []), ...(s70.results || [])];
        setPosters(all.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url));
      }).catch(() => {});
    } else {
      // Genre — fetch 2 pages for more variety
      Promise.all([
        fetch(`/api/search?genreId=${genreId}&ratingMin=6&page=1`).then(r => r.json()),
        fetch(`/api/search?genreId=${genreId}&ratingMin=6&page=2`).then(r => r.json()),
      ]).then(([p1, p2]) => {
        const all = [...(p1.results || []), ...(p2.results || [])];
        setPosters(all.slice(0, count).map((m: Record<string, unknown>) => ({
          url: (m.posterUrl as string) || "", title: (m.title as string) || "", id: (m.id as number) || 0,
        })).filter((p: PosterData) => p.url));
      }).catch(() => {});
    }
  }, [genre, count]);

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

function PosterBox({ url, position, rotation = 0, movieTitle, movieId, genreColor }: { url: string; position: [number, number, number]; rotation?: number; movieTitle?: string; movieId?: number; genreColor?: string }) {
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
        <boxGeometry args={[0.18, 0.28, 0.10]} />
        <meshBasicMaterial color="#1a1a2a" />
      </mesh>
      {/* Poster plane — offset clearly in front, flipped to face camera */}
      <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.17, 0.26]} />
        <meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Room dimensions ──────────────────────────────────────
const ROOM_W = 20;
const ROOM_D = 14;
const ROOM_H = 3.5;
const WALL_COLOR = "#1a3468";
const FLOOR_COLOR = "#2a3050";
const CEILING_COLOR = "#e8e4d8";
const COUNTER_COLOR = "#6a4830";
const SHELF_COLOR = "#5a3820";

// ── Shelf layout ─────────────────────────────────────────
const SHELF_ROWS = [
  // Row 1 — back of store (z = -4, pushed back 1 unit for entrance breathing room)
  { x: -5, z: -4, genre: "HORROR", color: "#dc2626" },
  { x: -1.7, z: -4, genre: "SCI-FI", color: "#3b82f6" },
  { x: 1.7, z: -4, genre: "COMEDY", color: "#f97316" },
  { x: 5, z: -4, genre: "DRAMA", color: "#6366f1" },
  // Row 2 — middle (z = -1)
  { x: -5, z: -1, genre: "ACTION", color: "#ef4444" },
  { x: -1.7, z: -1, genre: "CLASSICS", color: "#ca8a04" },
  { x: 1.7, z: -1, genre: "FAMILY", color: "#22c55e" },
  { x: 5, z: -1, genre: "ROMANCE", color: "#f43f5e" },
  // Row 3 — mid-front (z = 2, gives ~3 units to entrance area)
  { x: -5, z: 2, genre: "THRILLER", color: "#7c3aed" },
  { x: -1.7, z: 2, genre: "ANIMATED", color: "#06b6d4" },
  { x: 1.7, z: 2, genre: "DOCS", color: "#65a30d" },
  { x: 5, z: 2, genre: "WESTERN", color: "#92400e" },
];

function ShelfUnit({ x, z, genre, color, isMobile }: { x: number; z: number; genre: string; color: string; isMobile?: boolean }) {
  const posters = usePosterUrls(genre, 15); // 15 unique posters per genre, repeat across shelf
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");

  // Pack shelves full — reduced on mobile for performance
  const positions = useMemo(() => {
    const result: { x: number; y: number; z: number; side: string; idx: number }[] = [];
    const count = isMobile ? 5 : 8;
    const spacing = 0.24;
    const startX = -(count - 1) * spacing * 0.5;
    let idx = 0;
    for (const side of ["front", "back"] as const) {
      const z = side === "front" ? -0.25 : 0.25;
      for (const y of [1.17, 0.67, 0.19]) { // sit on shelf boards at y=0.035, 0.515, 1.015
        for (let i = 0; i < count; i++) {
          result.push({ x: startX + i * spacing, y, z, side, idx: idx++ });
        }
      }
    }
    return result;
  }, [isMobile]);

  return (
    <group position={[x, 0, z]} userData={{ interactType: "shelf", interactData: genreKey, label: `Browse ${genre}` }}>
      {/* Shelf frame — 3 tiers */}
      <mesh position={[0, 0.75, 0]} userData={{ interactType: "shelf", interactData: genreKey, label: `Browse ${genre}` }}>
        <boxGeometry args={[2.8, 1.5, 0.55]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Shelf top surface */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[2.9, 0.05, 0.6]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.55]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.55]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      {/* Shelf dividers (2 dividers = 3 tiers) */}
      <mesh position={[0, 0.50, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <Mat color="#6a4226" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <Mat color="#6a4226" roughness={0.8} />
      </mesh>
      {/* Bottom board */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <Mat color="#6a4226" roughness={0.8} />
      </mesh>

      {/* VHS Boxes — face-out with poster art */}
      {positions.map((pos) => {
        const posterIdx = pos.idx % Math.max(posters.length, 1);
        const poster = posters[posterIdx];
        const flipRot = pos.side === "back" ? Math.PI : 0;
        return poster ? (
          <PosterBox key={`${pos.side}-${posterIdx}`} url={poster.url} position={[pos.x, pos.y, pos.z]} rotation={flipRot} movieTitle={poster.title} movieId={poster.id} genreColor={color} />
        ) : (
          <mesh key={`${pos.side}-${posterIdx}`} position={[pos.x, pos.y, pos.z]}>
            <boxGeometry args={[0.20, 0.30, 0.10]} />
            <Mat
              color={new THREE.Color(color).offsetHSL(0, -0.1, -(posterIdx % 3) * 0.1)}
              roughness={0.6}
            />
          </mesh>
        );
      })}

      {/* Genre label sign on top of shelf — facing both sides */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.04]} />
        <Mat color="#0a1830" roughness={0.6} />
      </mesh>
      {/* Front label */}
      <Text
        position={[0, 1.62, -0.025]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.1}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {genre}
      </Text>
      {/* Back label */}
      <Text
        position={[0, 1.62, 0.025]}
        fontSize={0.1}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {genre}
      </Text>
    </group>
  );
}

const ENDCAP_CONFIGS: { x: number; z: number; rotY: number; label: string; vhsColors: string[] }[] = [
  { x: -7.5, z: -1.5, rotY: 0, label: "STAFF PICKS", vhsColors: ["#dc2626", "#3b82f6", "#f59e0b"] },
  { x: 7.5, z: 1.5, rotY: Math.PI, label: "JUST ADDED", vhsColors: ["#7c3aed", "#22c55e", "#ec4899"] },
];

function EndcapDisplay({ x, z, rotY, label, vhsColors }: { x: number; z: number; rotY: number; label: string; vhsColors: string[] }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Endcap shelf body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.0, 1.5, 0.4]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top surface */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[1.05, 0.04, 0.45]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>

      {/* Face-out VHS boxes — 3 on top shelf, 3 on bottom */}
      {vhsColors.map((color, i) => (
        <group key={`et-${i}`} position={[-0.28 + i * 0.28, 1.1, -0.25]}>
          <mesh>
            <boxGeometry args={[0.18, 0.28, 0.10]} />
            <Mat color={color} roughness={0.6} />
          </mesh>
          {/* White label strip on face */}
          <mesh position={[0, -0.08, -0.051]}>
            <planeGeometry args={[0.14, 0.06]} />
            <meshBasicMaterial color="#e8e8e0" />
          </mesh>
        </group>
      ))}
      {vhsColors.map((color, i) => (
        <group key={`eb-${i}`} position={[-0.28 + i * 0.28, 0.55, -0.25]}>
          <mesh>
            <boxGeometry args={[0.18, 0.28, 0.10]} />
            <Mat color={color} roughness={0.6} />
          </mesh>
          {/* White label strip on face */}
          <mesh position={[0, -0.08, -0.051]}>
            <planeGeometry args={[0.14, 0.06]} />
            <meshBasicMaterial color="#e8e8e0" />
          </mesh>
        </group>
      ))}

      {/* Label sign */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[0.9, 0.16, 0.03]} />
        <Mat color="#b91c1c" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 1.62, -0.02]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.06}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
      <Text
        position={[0, 1.62, 0.02]}
        fontSize={0.06}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

function Counter() {
  return (
    <group position={[-6, 0, 5.5]} rotation={[0, 0, 0]}>
      {/* Counter — near entrance left side, facing right (+x) */}
      <mesh position={[0, 0.5, -0.55]}>
        <boxGeometry args={[6, 1.0, 0.08]} />
        <Mat color="#5a3820" roughness={0.8} />
      </mesh>
      {/* Counter body — sides */}
      <mesh position={[-3, 0.5, 0]}>
        <boxGeometry args={[0.08, 1.0, 1.2]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[3, 0.5, 0]}>
        <boxGeometry args={[0.08, 1.0, 1.2]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      {/* Counter top — polished wood */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[6.15, 0.06, 1.3]} />
        <Mat color="#9a7850" roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Counter kick panel */}
      <mesh position={[0, 0.05, -0.55]}>
        <boxGeometry args={[5.9, 0.1, 0.06]} />
        <Mat color="#3a2010" roughness={0.9} />
      </mesh>

      {/* Candy display shelves on front of counter (customer side) */}
      {/* Shelf brackets */}
      {[0.3, 0.6].map((y) => (
        <mesh key={`candy-shelf-${y}`} position={[0, y, -0.58]}>
          <boxGeometry args={[4, 0.03, 0.25]} />
          <Mat color="#5a3820" roughness={0.7} />
        </mesh>
      ))}
      {/* Candy boxes — rows of colorful packages */}
      {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((dx, i) => {
        const topSnacks = [
          { name: "Red Vines", emoji: "\ud83c\udf6c" },
          { name: "Butterfinger", emoji: "\ud83c\udf6b" },
          { name: "Skittles", emoji: "\ud83c\udf08" },
          { name: "Junior Mints", emoji: "\ud83c\udf43" },
          { name: "Twizzlers", emoji: "\ud83e\udee2" },
          { name: "Sour Patch Kids", emoji: "\ud83d\ude1d" },
          { name: "M&Ms", emoji: "\ud83d\udfe4" },
        ];
        const bottomSnacks = [
          { name: "Milk Duds", emoji: "\ud83d\udfe1" },
          { name: "Nerds", emoji: "\ud83e\udd13" },
          { name: "Gummy Bears", emoji: "\ud83d\udc3b" },
          { name: "Hot Tamales", emoji: "\ud83c\udf36\ufe0f" },
          { name: "Swedish Fish", emoji: "\ud83d\udc1f" },
          { name: "Reese's Pieces", emoji: "\ud83e\udd5c" },
          { name: "Raisinets", emoji: "\ud83c\udf47" },
        ];
        const topSnack = topSnacks[i];
        const bottomSnack = bottomSnacks[i];
        return (
        <group key={`candy-row-${i}`}>
          {/* Top shelf candy */}
          <group position={[dx, 0.72, -0.58]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: topSnack.name, emoji: topSnack.emoji }), label: `Pick up: ${topSnack.name}` }}>
            <mesh userData={{ interactType: "snack", interactData: JSON.stringify({ name: topSnack.name, emoji: topSnack.emoji }), label: `Pick up: ${topSnack.name}` }}>
              <boxGeometry args={[0.15, 0.18, 0.08]} />
              <Mat color={["#ef4444","#f59e0b","#3b82f6","#22c55e","#ec4899","#a855f7","#f97316"][i]} roughness={0.5} />
            </mesh>
            {/* Label stripe */}
            <mesh position={[0, 0, -0.041]}>
              <planeGeometry args={[0.12, 0.06]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
          {/* Bottom shelf candy */}
          <group position={[dx, 0.42, -0.58]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: bottomSnack.name, emoji: bottomSnack.emoji }), label: `Pick up: ${bottomSnack.name}` }}>
            <mesh userData={{ interactType: "snack", interactData: JSON.stringify({ name: bottomSnack.name, emoji: bottomSnack.emoji }), label: `Pick up: ${bottomSnack.name}` }}>
              <boxGeometry args={[0.15, 0.15, 0.09]} />
              <Mat color={["#f97316","#ec4899","#22c55e","#ef4444","#3b82f6","#f59e0b","#a855f7"][i]} roughness={0.5} />
            </mesh>
            {/* Label stripe */}
            <mesh position={[0, 0, -0.046]}>
              <planeGeometry args={[0.12, 0.05]} />
              <meshBasicMaterial color="#eeeecc" />
            </mesh>
          </group>
        </group>
        );
      })}
      {/* "CANDY & SNACKS" label */}
      <Text position={[0, 0.88, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>
        CANDY & SNACKS
      </Text>

      {/* Register */}
      <mesh position={[-1.5, 1.25, 0]}>
        <boxGeometry args={[0.65, 0.45, 0.5]} />
        <Mat color="#2a2a2a" roughness={0.4} />
      </mesh>
      {/* Register screen */}
      <mesh position={[-1.5, 1.38, -0.26]}>
        <boxGeometry args={[0.42, 0.22, 0.01]} />
        <Mat color="#0a3a0a" emissive="#0a4a0a" emissiveIntensity={0.5} />
      </mesh>
      {/* Register keypad */}
      <mesh position={[-1.5, 1.06, -0.1]}>
        <boxGeometry args={[0.4, 0.02, 0.3]} />
        <Mat color="#333" roughness={0.6} />
      </mesh>

      {/* "CHECKOUT" sign */}
      <Text position={[0, 1.15, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>
        CHECKOUT
      </Text>

      {/* Snack display on counter */}
      {[1.0, 1.3, 1.6, 1.9].map((dx, i) => {
        const counterSnacks = [
          { name: "Popcorn", emoji: "\ud83c\udf7f" },
          { name: "Soda", emoji: "\ud83e\udd64" },
          { name: "Nachos", emoji: "\ud83e\uddc0" },
          { name: "Cookie", emoji: "\ud83c\udf6a" },
        ];
        const snack = counterSnacks[i];
        return (
        <group key={`snk${i}`} position={[dx, 1.15, 0.2]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: snack.name, emoji: snack.emoji }), label: `Pick up: ${snack.name}` }}>
          <mesh userData={{ interactType: "snack", interactData: JSON.stringify({ name: snack.name, emoji: snack.emoji }), label: `Pick up: ${snack.name}` }}>
            <boxGeometry args={[0.12, 0.18, 0.06]} />
            <Mat color={["#ef4444", "#3b82f6", "#f59e0b", "#22c55e"][i]} roughness={0.5} />
          </mesh>
          {/* Front label */}
          <mesh position={[0, -0.02, -0.031]}>
            <planeGeometry args={[0.09, 0.06]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        );
      })}

      {/* Return bin */}
      <mesh position={[2.3, 1.15, -0.2]}>
        <boxGeometry args={[0.5, 0.25, 0.35]} />
        <Mat color="#2a2a3a" roughness={0.7} />
      </mesh>
      <Text position={[2.3, 1.35, -0.38]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#888" anchorX="center" font={undefined}>
        RETURNS
      </Text>

      {/* Computer monitor behind counter */}
      <group position={[0.5, 1.5, 0.3]}>
        {/* Monitor body */}
        <mesh>
          <boxGeometry args={[0.4, 0.35, 0.05]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.01, -0.026]}>
          <planeGeometry args={[0.34, 0.26]} />
          <Mat color="#1a3a6a" emissive="#1a4a8a" emissiveIntensity={0.6} />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, -0.22, 0.02]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
        {/* Monitor base */}
        <mesh position={[0, -0.27, 0.02]}>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
      </group>

      {/* Barcode scanner */}
      <mesh position={[1.0, 1.1, -0.2]}>
        <boxGeometry args={[0.15, 0.08, 0.2]} />
        <Mat color="#333333" roughness={0.5} />
      </mesh>
      {/* Scanner red line */}
      <mesh position={[1.0, 1.145, -0.2]}>
        <boxGeometry args={[0.12, 0.005, 0.02]} />
        <Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>

      {/* Stack of VHS cases on counter */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`vhs-stack-${i}`} position={[-0.5, 1.15 + i * 0.04, -0.2]} rotation={[0, (i * 0.15), 0]}>
          <boxGeometry args={[0.2, 0.035, 0.12]} />
          <Mat
            color={["#1a3a6a", "#6a1a3a", "#3a6a1a", "#5a3a6a"][i]}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* "MEMBERSHIP CARDS" sign — face customer side */}
      <Text position={[2, 1.4, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>
        MEMBERSHIP CARDS
      </Text>
    </group>
  );
}

function VinnyCharacter() {
  const ref = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 0.8) * 0.015;
      // Slight lean side to side
      ref.current.rotation.z = Math.sin(t * 0.4) * 0.02;
    }
    // Arm gesturing — occasional wave/gesture
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 0.6) * 0.15;
      leftArmRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 0.5 + 1.5) * 0.2;
      rightArmRef.current.rotation.z = Math.sin(t * 0.35 + 1.0) * 0.06;
    }
    // Head looking around the store
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.15;
      headRef.current.rotation.x = Math.sin(t * 0.18) * 0.04;
    }
  });

  return (
    <group ref={ref} position={[-6, 0, 6.2]} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
      {/* Legs — Khaki pants */}
      <mesh position={[-0.09, 0.35, 0]} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
        <boxGeometry args={[0.13, 0.7, 0.15]} />
        <Mat color="#c2a66b" roughness={0.85} />
      </mesh>
      <mesh position={[0.09, 0.35, 0]}>
        <boxGeometry args={[0.13, 0.7, 0.15]} />
        <Mat color="#c2a66b" roughness={0.85} />
      </mesh>

      {/* Sneakers — white with blue accent */}
      <mesh position={[-0.09, 0.03, -0.02]}>
        <boxGeometry args={[0.14, 0.08, 0.2]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>
      <mesh position={[-0.09, 0.05, -0.08]}>
        <boxGeometry args={[0.12, 0.04, 0.06]} />
        <Mat color="#1a3a6a" roughness={0.6} />
      </mesh>
      <mesh position={[0.09, 0.03, -0.02]}>
        <boxGeometry args={[0.14, 0.08, 0.2]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>
      <mesh position={[0.09, 0.05, -0.08]}>
        <boxGeometry args={[0.12, 0.04, 0.06]} />
        <Mat color="#1a3a6a" roughness={0.6} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.32, 0.05, 0.18]} />
        <Mat color="#3a2a1a" roughness={0.7} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.7, -0.09]}>
        <boxGeometry args={[0.06, 0.04, 0.01]} />
        <Mat color="#c0a020" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Torso — Blockbuster blue polo */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.25]} />
        <Mat color="#0a4a8a" roughness={0.7} />
      </mesh>
      {/* Polo collar */}
      <mesh position={[0, 1.2, -0.06]}>
        <boxGeometry args={[0.22, 0.06, 0.16]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>
      {/* Collar fold left */}
      <mesh position={[-0.06, 1.22, -0.1]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.08, 0.05, 0.02]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>
      {/* Collar fold right */}
      <mesh position={[0.06, 1.22, -0.1]} rotation={[0.3, 0, -0.2]}>
        <boxGeometry args={[0.08, 0.05, 0.02]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>
      {/* Polo buttons */}
      {[1.05, 1.12].map(y => (
        <mesh key={y} position={[0, y, -0.13]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <Mat color="#e8e0d0" roughness={0.4} />
        </mesh>
      ))}

      {/* Yellow name tag — "VINNY" */}
      <mesh position={[0.14, 1.02, -0.13]}>
        <boxGeometry args={[0.14, 0.07, 0.01]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.14, 1.02, -0.145]} rotation={[0, Math.PI, 0]} fontSize={0.03} color="#1a1a1a" anchorX="center" font={undefined}>
        VINNY
      </Text>

      {/* MANAGER badge — red rectangle on chest */}
      <mesh position={[-0.1, 1.08, -0.13]}>
        <boxGeometry args={[0.14, 0.055, 0.01]} />
        <Mat color="#cc2222" emissive="#cc2222" emissiveIntensity={0.15} />
      </mesh>
      <Text position={[-0.1, 1.08, -0.145]} rotation={[0, Math.PI, 0]} fontSize={0.025} color="#ffffff" anchorX="center" font={undefined}>
        MANAGER
      </Text>

      {/* Lanyard — cord around neck */}
      <mesh position={[-0.04, 1.15, -0.08]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.015, 0.25, 0.01]} />
        <Mat color="#1a3a6a" roughness={0.5} />
      </mesh>
      <mesh position={[0.04, 1.15, -0.08]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.015, 0.25, 0.01]} />
        <Mat color="#1a3a6a" roughness={0.5} />
      </mesh>
      {/* Lanyard card */}
      <mesh position={[0, 0.98, -0.1]}>
        <boxGeometry args={[0.08, 0.1, 0.01]} />
        <Mat color="#f5f5f0" roughness={0.4} />
      </mesh>
      {/* Card stripe */}
      <mesh position={[0, 1.01, -0.106]}>
        <boxGeometry args={[0.07, 0.015, 0.005]} />
        <Mat color="#1a3a6a" />
      </mesh>

      {/* Left arm (pivots from shoulder) */}
      <group ref={leftArmRef} position={[-0.26, 1.12, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.12, 0.45, 0.14]} />
          <Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.48, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <Mat color="#d4a574" roughness={0.8} />
        </mesh>
      </group>
      {/* Right arm (pivots from shoulder) */}
      <group ref={rightArmRef} position={[0.26, 1.12, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.12, 0.45, 0.14]} />
          <Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.48, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <Mat color="#d4a574" roughness={0.8} />
        </mesh>
      </group>

      {/* Head group (turns left/right) */}
      <group ref={headRef} position={[0, 1.45, 0]}>
        {/* Head — slightly bigger */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.23, 16, 16]} />
          <Mat color="#d4a574" roughness={0.75} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.12, 0.02]}>
          <sphereGeometry args={[0.24, 16, 10]} />
          <Mat color="#2a1a0a" roughness={0.9} />
        </mesh>

        {/* Glasses — wire frames */}
        {/* Left lens ring */}
        <mesh position={[-0.08, 0.02, -0.2]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.04, 0.006, 8, 16]} />
          <Mat color="#888888" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Right lens ring */}
        <mesh position={[0.08, 0.02, -0.2]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.04, 0.006, 8, 16]} />
          <Mat color="#888888" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Bridge between lenses */}
        <mesh position={[0, 0.02, -0.22]}>
          <boxGeometry args={[0.04, 0.006, 0.006]} />
          <Mat color="#888888" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Left temple arm */}
        <mesh position={[-0.12, 0.02, -0.14]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.14]} />
          <Mat color="#888888" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Right temple arm */}
        <mesh position={[0.12, 0.02, -0.14]} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.14]} />
          <Mat color="#888888" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Lens tint (subtle) */}
        <mesh position={[-0.08, 0.02, -0.2]}>
          <circleGeometry args={[0.038, 16]} />
          <Mat color="#e8e8ff" transparent opacity={0.15} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.2]}>
          <circleGeometry args={[0.038, 16]} />
          <Mat color="#e8e8ff" transparent opacity={0.15} />
        </mesh>

        {/* Eyes (behind glasses) */}
        <mesh position={[-0.08, 0.02, -0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.08, 0.02, -0.22]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <Mat color="#1a1a1a" />
        </mesh>
        <mesh position={[0.08, 0.02, -0.22]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <Mat color="#1a1a1a" />
        </mesh>

        {/* Bigger mustache — curved, more prominent */}
        <mesh position={[0, -0.08, -0.2]}>
          <boxGeometry args={[0.18, 0.05, 0.05]} />
          <Mat color="#2a1a0a" roughness={0.9} />
        </mesh>
        {/* Mustache curl left */}
        <mesh position={[-0.1, -0.09, -0.19]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.04, 0.03, 0.04]} />
          <Mat color="#2a1a0a" roughness={0.9} />
        </mesh>
        {/* Mustache curl right */}
        <mesh position={[0.1, -0.09, -0.19]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.04, 0.03, 0.04]} />
          <Mat color="#2a1a0a" roughness={0.9} />
        </mesh>

        {/* Wider smile */}
        <mesh position={[0, -0.12, -0.2]}>
          <boxGeometry args={[0.12, 0.025, 0.03]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>
        {/* Smile corners (upturned) */}
        <mesh position={[-0.06, -0.115, -0.2]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.03, 0.015, 0.02]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>
        <mesh position={[0.06, -0.115, -0.2]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.03, 0.015, 0.02]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.04, -0.22]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <Mat color="#c49a6a" roughness={0.8} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.22, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <Mat color="#d4a574" roughness={0.75} />
        </mesh>
        <mesh position={[0.22, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <Mat color="#d4a574" roughness={0.75} />
        </mesh>
      </group>

      {/* Floating name */}
      <Text position={[0, 1.95, 0]} rotation={[0, Math.PI, 0]} fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>
        VINNY
      </Text>

      {/* Shadow on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <Mat color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// Aisle waypoints NPCs can walk between (x, z) — stays between shelf rows
// NPC waypoints — must be in the AISLES between shelves, not through them
// Shelf centers: x = -5, -1.7, 1.7, 5 (each 2.8 wide)
// Aisle centers between shelves: x = -3.35, 0, 3.35
// Shelf rows at z = -3, 0, 3 — cross aisles at z = -1.5, 1.5
// Aisles between shifted shelf rows: z=-4, -1, 2
// Between row1&2: z=-2.5, between row2&3: z=0.5, past row3: z=3.5
const NPC_WAYPOINTS: [number, number][] = [
  [0, -6],      // center back (behind shelf row 1)
  [-3.35, -5.5],// left back aisle
  [-3.35, -2.5],// left aisle between row 1 & 2
  [0, -2.5],    // center between row 1 & 2
  [3.35, -2.5], // right aisle between row 1 & 2
  [3.35, 0.5],  // right aisle between row 2 & 3
  [0, 0.5],     // center between row 2 & 3
  [-3.35, 0.5], // left aisle between row 2 & 3
  [-3.35, 3.5], // left front (past shelves)
  [0, 3.5],     // center front
  [3.35, 3.5],  // right front
];

function NPCCustomer({ startPos, shirtColor, hairColor, skinTone }: {
  startPos: [number, number, number]; shirtColor: string; hairColor: string; skinTone: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.8; // units per second
  const startIdx = useMemo(() => {
    // Pick nearest waypoint as starting index
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < NPC_WAYPOINTS.length; i++) {
      const dx = NPC_WAYPOINTS[i][0] - startPos[0];
      const dz = NPC_WAYPOINTS[i][1] - startPos[2];
      const d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }, [startPos]);
  const waypointIdx = useRef(startIdx);
  const direction = useRef(useMemo(() => (Math.random() > 0.5 ? 1 : -1), []));
  const waitTimer = useRef(0);
  const waitDuration = useRef(0);
  const isBrowsing = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1); // clamp large deltas
    const t = state.clock.elapsedTime;

    // If waiting at a waypoint, count down
    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      // Still bob slightly while waiting
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      return;
    }

    const target = NPC_WAYPOINTS[waypointIdx.current];
    const dx = target[0] - ref.current.position.x;
    const dz = target[1] - ref.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      // Arrived at waypoint — decide: browse (40%) or short pause (60%)
      if (Math.random() < 0.4) {
        // Browse: longer pause, face nearest shelf row
        isBrowsing.current = true;
        waitTimer.current = 5 + Math.random() * 5;
        waitDuration.current = waitTimer.current;
        const npcZ = ref.current.position.z;
        const shelfZs = [-3, 0, 3];
        let nearestZ = shelfZs[0];
        let nearestDist = Math.abs(npcZ - shelfZs[0]);
        for (const sz of shelfZs) {
          const d = Math.abs(npcZ - sz);
          if (d < nearestDist) { nearestDist = d; nearestZ = sz; }
        }
        // Face toward the shelf: if shelf z < npc z, face -z (PI), else face +z (0)
        ref.current.rotation.y = nearestZ < npcZ ? Math.PI : 0;
      } else {
        // Quick pause
        isBrowsing.current = false;
        waitTimer.current = 0.5 + Math.random() * 0.5;
        waitDuration.current = waitTimer.current;
      }
      waypointIdx.current = (waypointIdx.current + direction.current + NPC_WAYPOINTS.length) % NPC_WAYPOINTS.length;
    } else {
      // Move toward target
      const nx = dx / dist;
      const nz = dz / dist;
      ref.current.position.x += nx * speed * dt;
      ref.current.position.z += nz * speed * dt;
      // Walk bob
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
      // Face direction of movement (model faces -z, so add PI)
      ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
    }
  });

  const vhsColor = useMemo(() => {
    const colors = ["#2a2a8a", "#8a2a2a", "#2a6a2a", "#6a2a6a", "#1a5a5a", "#8a6a1a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);
  const hasBag = useMemo(() => Math.random() > 0.5, []);

  return (
    <group ref={ref} position={startPos} userData={{ interactType: "customer", label: "Talk to Customer" }}>
      {/* Legs */}
      <mesh position={[-0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#3a3a4a" roughness={0.8} />
      </mesh>
      <mesh position={[0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#3a3a4a" roughness={0.8} />
      </mesh>
      {/* Body — slightly varied proportions */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.34, 0.44, 0.22]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Left arm with VHS tape in hand */}
      <mesh position={[-0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* VHS tape in left hand */}
      <mesh position={[-0.22, 0.52, -0.02]}>
        <boxGeometry args={[0.1, 0.06, 0.02]} />
        <Mat color={vhsColor} roughness={0.6} />
      </mesh>
      {/* VHS label stripe */}
      <mesh position={[-0.22, 0.52, -0.035]}>
        <boxGeometry args={[0.08, 0.02, 0.005]} />
        <Mat color="#f0f0e0" roughness={0.5} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Shopping bag (some customers) */}
      {hasBag && (
        <group position={[0.22, 0.42, 0]}>
          {/* Bag body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.14, 0.06]} />
            <Mat color="#e8d8b0" roughness={0.8} />
          </mesh>
          {/* Bag handle */}
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[0.03, 0.005, 6, 8, Math.PI]} />
            <Mat color="#c0b090" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Head — slightly taller */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.16, 12, 14]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>
      {/* Head top (taller shape) */}
      <mesh position={[0, 1.26, 0]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.34, 0.01]}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <Mat color={hairColor} roughness={0.9} />
      </mesh>

      {/* Simple face — two dot eyes */}
      <mesh position={[-0.05, 1.22, -0.14]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <Mat color="#1a1a1a" />
      </mesh>
      <mesh position={[0.05, 1.22, -0.14]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <Mat color="#1a1a1a" />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <Mat color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function KidCustomer({ startPos, shirtColor, hairColor, skinTone }: {
  startPos: [number, number, number]; shirtColor: string; hairColor: string; skinTone: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.6; // slightly slower than adults
  const startIdx = useMemo(() => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < NPC_WAYPOINTS.length; i++) {
      const dx = NPC_WAYPOINTS[i][0] - startPos[0];
      const dz = NPC_WAYPOINTS[i][1] - startPos[2];
      const d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }, [startPos]);
  const waypointIdx = useRef(startIdx);
  const direction = useRef(useMemo(() => (Math.random() > 0.5 ? 1 : -1), []));
  const waitTimer = useRef(0);
  const waitDuration = useRef(0);
  const isBrowsing = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;

    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      return;
    }

    const target = NPC_WAYPOINTS[waypointIdx.current];
    const dx = target[0] - ref.current.position.x;
    const dz = target[1] - ref.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      // Browse (40%) or short pause (60%)
      if (Math.random() < 0.4) {
        isBrowsing.current = true;
        waitTimer.current = 5 + Math.random() * 5;
        waitDuration.current = waitTimer.current;
        const npcZ = ref.current.position.z;
        const shelfZs = [-3, 0, 3];
        let nearestZ = shelfZs[0];
        let nearestDist = Math.abs(npcZ - shelfZs[0]);
        for (const sz of shelfZs) {
          const d = Math.abs(npcZ - sz);
          if (d < nearestDist) { nearestDist = d; nearestZ = sz; }
        }
        ref.current.rotation.y = nearestZ < npcZ ? Math.PI : 0;
      } else {
        isBrowsing.current = false;
        waitTimer.current = 0.5 + Math.random() * 0.5;
        waitDuration.current = waitTimer.current;
      }
      waypointIdx.current = (waypointIdx.current + direction.current + NPC_WAYPOINTS.length) % NPC_WAYPOINTS.length;
    } else {
      const nx = dx / dist;
      const nz = dz / dist;
      ref.current.position.x += nx * speed * dt;
      ref.current.position.z += nz * speed * dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2.5)) * 0.025;
      // Face direction of movement (model faces -z, so add PI)
      ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
    }
  });

  return (
    <group ref={ref} position={startPos} scale={0.65} userData={{ interactType: "customer", label: "Talk to Kid" }}>
      {/* Legs — shorter kid proportions */}
      <mesh position={[-0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#4a6fa5" roughness={0.8} />
      </mesh>
      <mesh position={[0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#4a6fa5" roughness={0.8} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.34, 0.44, 0.22]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Head — rounder kid proportions */}
      <mesh position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.17, 12, 14]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.28, 0.01]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <Mat color={hairColor} roughness={0.9} />
      </mesh>
      {/* Eyes — slightly bigger for kid look */}
      <mesh position={[-0.055, 1.2, -0.15]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <Mat color="#1a1a1a" />
      </mesh>
      <mesh position={[0.055, 1.2, -0.15]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <Mat color="#1a1a1a" />
      </mesh>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <Mat color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function CharlieCharacter({ isMobile }: { isMobile?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const speed = 0.8;
  const startPos: [number, number, number] = [-2, 0, 1.5];
  const startIdx = useMemo(() => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < NPC_WAYPOINTS.length; i++) {
      const dx = NPC_WAYPOINTS[i][0] - startPos[0];
      const dz = NPC_WAYPOINTS[i][1] - startPos[2];
      const d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }, []);
  const waypointIdx = useRef(startIdx);
  const direction = useRef(1);
  const waitTimer = useRef(0);
  const isBrowsing = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;

    // Idle bob
    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      // Head look around while idle
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.2;
      }
      return;
    }

    const target = NPC_WAYPOINTS[waypointIdx.current];
    const dx = target[0] - ref.current.position.x;
    const dz = target[1] - ref.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      // Browse (40%) or staff linger (60%)
      if (Math.random() < 0.4) {
        isBrowsing.current = true;
        waitTimer.current = 5 + Math.random() * 5;
        const npcZ = ref.current.position.z;
        const shelfZs = [-3, 0, 3];
        let nearestZ = shelfZs[0];
        let nearestDist = Math.abs(npcZ - shelfZs[0]);
        for (const sz of shelfZs) {
          const d = Math.abs(npcZ - sz);
          if (d < nearestDist) { nearestDist = d; nearestZ = sz; }
        }
        ref.current.rotation.y = nearestZ < npcZ ? Math.PI : 0;
      } else {
        isBrowsing.current = false;
        waitTimer.current = 1.0 + Math.random() * 1.5; // Staff lingers longer than customers
      }
      waypointIdx.current = (waypointIdx.current + direction.current + NPC_WAYPOINTS.length) % NPC_WAYPOINTS.length;
    } else {
      const nx = dx / dist;
      const nz = dz / dist;
      ref.current.position.x += nx * speed * dt;
      ref.current.position.z += nz * speed * dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
      ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.1;
    }
  });

  return (
    <group ref={ref} position={startPos} userData={{ interactType: "charlie", label: "Talk to Charlie" }}>
      {/* Legs — Dark jeans */}
      <mesh position={[-0.08, 0.3, 0]} userData={{ interactType: "charlie", label: "Talk to Charlie" }}>
        <boxGeometry args={[0.12, 0.6, 0.13]} />
        <Mat color="#1a3050" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.6, 0.13]} />
        <Mat color="#1a3050" roughness={0.85} />
      </mesh>

      {/* Sneakers — black with white sole */}
      <mesh position={[-0.08, 0.03, -0.02]}>
        <boxGeometry args={[0.13, 0.07, 0.18]} />
        <Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[-0.08, 0.01, -0.02]}>
        <boxGeometry args={[0.14, 0.03, 0.19]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>
      <mesh position={[0.08, 0.03, -0.02]}>
        <boxGeometry args={[0.13, 0.07, 0.18]} />
        <Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.01, -0.02]}>
        <boxGeometry args={[0.14, 0.03, 0.19]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.16]} />
        <Mat color="#2a2a2a" roughness={0.7} />
      </mesh>

      {/* Torso — Blockbuster blue polo (same as Vinny) */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.36, 0.5, 0.22]} />
        <Mat color="#0a4a8a" roughness={0.7} />
      </mesh>
      {/* Yellow accent stripe on shirt */}
      <mesh position={[0, 0.75, -0.115]}>
        <boxGeometry args={[0.34, 0.04, 0.01]} />
        <Mat color="#ffd700" roughness={0.5} />
      </mesh>
      {/* Polo collar */}
      <mesh position={[0, 1.08, -0.05]}>
        <boxGeometry args={[0.2, 0.05, 0.14]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>
      {/* Collar fold left */}
      <mesh position={[-0.05, 1.1, -0.09]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.07, 0.04, 0.02]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>
      {/* Collar fold right */}
      <mesh position={[0.05, 1.1, -0.09]} rotation={[0.3, 0, -0.2]}>
        <boxGeometry args={[0.07, 0.04, 0.02]} />
        <Mat color="#0a4a8a" roughness={0.6} />
      </mesh>

      {/* Yellow name tag — "CHARLIE" */}
      <mesh position={[0.12, 0.92, -0.12]}>
        <boxGeometry args={[0.14, 0.06, 0.01]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.12, 0.92, -0.135]} rotation={[0, Math.PI, 0]} fontSize={0.025} color="#1a1a1a" anchorX="center" font={undefined}>
        CHARLIE
      </Text>

      {/* STAFF badge — Blockbuster yellow on chest */}
      <mesh position={[-0.09, 0.97, -0.12]}>
        <boxGeometry args={[0.12, 0.05, 0.01]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} />
      </mesh>
      <Text position={[-0.09, 0.97, -0.135]} rotation={[0, Math.PI, 0]} fontSize={0.022} color="#ffffff" anchorX="center" font={undefined}>
        STAFF
      </Text>

      {/* Left arm */}
      <mesh position={[-0.24, 0.82, 0]}>
        <boxGeometry args={[0.11, 0.4, 0.12]} />
        <Mat color="#0a4a8a" roughness={0.7} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.24, 0.58, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <Mat color="#e8c4a0" roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.24, 0.82, 0]}>
        <boxGeometry args={[0.11, 0.4, 0.12]} />
        <Mat color="#0a4a8a" roughness={0.7} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.24, 0.58, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <Mat color="#e8c4a0" roughness={0.8} />
      </mesh>

      {/* Head group */}
      <group ref={headRef} position={[0, 1.3, 0]}>
        {/* Head — slightly smaller than Vinny */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <Mat color="#e8c4a0" roughness={0.75} />
        </mesh>

        {/* Baseball cap — brim + crown */}
        {/* Cap crown */}
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.08]}>
          <sphereGeometry args={[0.21, 16, 10]} />
          <Mat color="#1a3a6a" roughness={0.6} />
        </mesh>
        {/* Cap brim — slightly tilted */}
        <mesh position={[0, 0.06, -0.18]} rotation={[0.15, 0, 0.06]}>
          <boxGeometry args={[0.22, 0.02, 0.12]} />
          <Mat color="#1a3a6a" roughness={0.6} />
        </mesh>

        {/* Yellow accent on cap front */}
        <mesh position={[0, 0.08, -0.2]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.04, 0.01]} />
          <Mat color="#ffd700" roughness={0.5} />
        </mesh>

        {/* Blonde/light brown hair peeking out from cap sides */}
        <mesh position={[-0.18, -0.02, 0]}>
          <boxGeometry args={[0.06, 0.1, 0.12]} />
          <Mat color="#c4a45a" roughness={0.9} />
        </mesh>
        <mesh position={[0.18, -0.02, 0]}>
          <boxGeometry args={[0.06, 0.1, 0.12]} />
          <Mat color="#c4a45a" roughness={0.9} />
        </mesh>
        {/* Hair at back of cap */}
        <mesh position={[0, -0.02, 0.12]}>
          <boxGeometry args={[0.2, 0.1, 0.06]} />
          <Mat color="#c4a45a" roughness={0.9} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.07, -0.02, -0.17]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.07, -0.02, -0.17]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.07, -0.02, -0.195]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <Mat color="#1a1a1a" />
        </mesh>
        <mesh position={[0.07, -0.02, -0.195]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <Mat color="#1a1a1a" />
        </mesh>

        {/* No mustache — just a smile */}
        <mesh position={[0, -0.1, -0.18]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>
        {/* Smile corners */}
        <mesh position={[-0.05, -0.095, -0.18]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.025, 0.012, 0.015]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>
        <mesh position={[0.05, -0.095, -0.18]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.025, 0.012, 0.015]} />
          <Mat color="#c07060" roughness={0.8} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.05, -0.19]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <Mat color="#d4a574" roughness={0.8} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.19, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <Mat color="#e8c4a0" roughness={0.75} />
        </mesh>
        <mesh position={[0.19, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <Mat color="#e8c4a0" roughness={0.75} />
        </mesh>

        {/* Headphones around neck */}
        {/* Left earpiece */}
        <mesh position={[-0.16, -0.18, -0.02]}>
          <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
        <mesh position={[-0.16, -0.18, -0.02]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
          <Mat color="#444444" roughness={0.3} />
        </mesh>
        {/* Right earpiece */}
        <mesh position={[0.16, -0.18, -0.02]}>
          <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
        <mesh position={[0.16, -0.18, -0.02]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
          <Mat color="#444444" roughness={0.3} />
        </mesh>
        {/* Headband connecting earpieces (arches over head/behind neck) */}
        <mesh position={[0, -0.12, 0.08]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.16, 0.012, 8, 16, Math.PI]} />
          <Mat color="#2a2a2a" roughness={0.4} />
        </mesh>
      </group>

      {/* Floating name */}
      <Text position={[0, 1.75, 0]} rotation={[0, Math.PI, 0]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>
        CHARLIE
      </Text>

      {/* Point light for visibility (desktop only) */}

      {/* Shadow on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <Mat color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function NewReleasesWall({ isMobile }: { isMobile?: boolean }) {
  const posters = usePosterUrls("NEW", 10); // fewer unique posters, repeat across wall
  // Only trending — these are actual new releases
  const allPosters = posters;

  // Same PosterBox format as the racks — small VHS boxes in a grid
  const positions = useMemo(() => {
    const result: { x: number; y: number; idx: number }[] = [];
    const cols = isMobile ? 10 : 20;
    const rows = isMobile ? 2 : 3;
    const spacing = 0.24;
    const startX = -(cols - 1) * spacing * 0.5;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ x: startX + col * spacing, y: 1.75 - row * 0.5, idx: idx++ });
      }
    }
    return result;
  }, [isMobile]);

  return (
    <group position={[0, 0, -ROOM_D / 2 + 0.15]}>
      {/* Shelf unit — centered, not full wall */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[8, 2.0, 0.3]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[8.2, 0.05, 0.35]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Shelf dividers */}
      {[1.5, 1.0, 0.5, 0.02].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><boxGeometry args={[7.8, 0.03, 0.28]} /><Mat color="#6a4226" roughness={0.8} /></mesh>
      ))}
      {/* Side panels */}
      <mesh position={[-4, 1.0, 0]}><boxGeometry args={[0.04, 2.0, 0.3]} /><Mat color="#4a2818" roughness={0.8} /></mesh>
      <mesh position={[4, 1.0, 0]}><boxGeometry args={[0.04, 2.0, 0.3]} /><Mat color="#4a2818" roughness={0.8} /></mesh>

      {/* BIG "NEW RELEASES" illuminated sign above */}
      <mesh position={[0, 2.6, 0.05]}>
        <boxGeometry args={[6, 0.5, 0.06]} />
        <Mat color="#1a3a6a" roughness={0.5} />
      </mesh>
      <Text position={[0, 2.6, 0.09]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        ★ NEW RELEASES ★
      </Text>
      <Text position={[0, 2.6, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        ★ NEW RELEASES ★
      </Text>

      {/* VHS boxes — 10 copies of each movie grouped together */}
      {positions.map((pos) => {
        const movieIdx = allPosters.length > 0 ? Math.floor(pos.idx / 10) % allPosters.length : -1;
        const poster = movieIdx >= 0 ? allPosters[movieIdx] : null;
        return (
          <NewReleaseVHS key={pos.idx} url={poster?.url || ""} position={[pos.x, pos.y, 0.15]} />
        );
      })}

      {/* Old small sign removed — big illuminated sign is above */}
    </group>
  );
}

function NeonSign() {
  return (
    <group position={[0, 3.1, -ROOM_D / 2 + 0.15]}>
      {/* Simple dark backing with gold text — clean, no haze */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[5.8, 0.4, 0.03]} />
        <Mat color="#0a0a18" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.2}
        color="#ffd700"
        anchorX="center"
        font={undefined}
      >
        FRIDAY NIGHT VIDEO
        <meshBasicMaterial color="#ffd700" toneMapped={false} />
      </Text>
    </group>
  );
}

function TVScreen({ isMobile }: { isMobile?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  // Animate screen color to simulate VHS playback flicker
  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    if (matRef.current.emissive) {
      // Desktop (MeshStandardMaterial)
      const r = 0.1 + Math.sin(t * 0.7) * 0.05;
      const g = 0.2 + Math.sin(t * 1.1 + 1) * 0.08;
      const b = 0.4 + Math.sin(t * 0.5 + 2) * 0.1;
      matRef.current.emissive.setRGB(r, g, b);
      matRef.current.emissiveIntensity = 0.8 + Math.sin(t * 8.3) * 0.1 + (Math.sin(t * 37) > 0.95 ? 0.4 : 0);
    } else if (matRef.current.color) {
      // Mobile (MeshBasicMaterial) — animate color directly
      const r = 0.1 + Math.sin(t * 0.7) * 0.08;
      const g = 0.25 + Math.sin(t * 1.1 + 1) * 0.1;
      const b = 0.5 + Math.sin(t * 0.5 + 2) * 0.15;
      matRef.current.color.setRGB(r, g, b);
    }
  });
  return (
    <group position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} userData={{ interactType: "tv", label: "Friday Night Pick" }}>
      {/* CRT TV body — chunky retro shape */}
      <mesh userData={{ interactType: "tv", label: "Friday Night Pick" }}>
        <boxGeometry args={[1.2, 0.9, 0.4]} />
        <Mat color="#2a2a2a" roughness={0.5} />
      </mesh>
      {/* Rounded bezel */}
      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[1.1, 0.8, 0.05]} />
        <Mat color="#1a1a1a" roughness={0.4} />
      </mesh>
      {/* Screen — animated */}
      <mesh position={[0, 0, 0.21]}>
        <planeGeometry args={[0.95, 0.65]} />
        <Mat ref={matRef} color="#000000" emissive="#1a4a6a" emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* VHS tracking lines — thin horizontal stripes */}
      {[-0.2, -0.05, 0.15].map((dy, i) => (
        <mesh key={`scan-${i}`} position={[0, dy, 0.215]}>
          <planeGeometry args={[0.9, 0.008]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
        </mesh>
      ))}
      {/* Screen glow */}
      {/* TV stand bracket */}
      <mesh position={[0, -0.55, -0.05]}>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <Mat color="#333" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Wall mount plate */}
      <mesh position={[0, 0, -0.21]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <Mat color="#444" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}

// Gumball machine removed

// Security dome mirror in ceiling corner
function SecurityDome({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Mounting plate */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <Mat color="#333" roughness={0.5} />
      </mesh>
      {/* Dome — dark reflective */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color="#111" roughness={0.05} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Neon accent strip for shelves
function ShelfNeonStrip({ position, color, width = 2.6, isMobile }: { position: [number, number, number]; color: string; width?: number; isMobile?: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.02, 0.02]} />
        <Mat color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function NewReleaseVHS({ url, position }: { url: string; position: [number, number, number] }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!url) return;
    getOrCreatePosterTexture(url, (t) => {
      if (matRef.current) {
        matRef.current.map = t;
        matRef.current.color.set("#ffffff");
        matRef.current.needsUpdate = true;
      }
    });
  }, [url]);

  return (
    <group position={position}>
      {/* VHS box */}
      <mesh>
        <boxGeometry args={[0.18, 0.28, 0.10]} />
        <meshBasicMaterial color="#1a1a2a" />
      </mesh>
      {/* Cover art facing into the room (+z) */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[0.17, 0.26]} />
        <meshBasicMaterial ref={matRef} color="#333" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Aisle sign config per shelf row ──────────────────────
const AISLE_SIGNS: { z: number; label: string; colors: string[] }[] = [
  { z: -4, label: "HORROR \u2022 SCI-FI \u2022 COMEDY \u2022 DRAMA", colors: ["#dc2626", "#3b82f6", "#f97316", "#6366f1"] },
  { z: -1, label: "ACTION \u2022 CLASSICS \u2022 FAMILY \u2022 ROMANCE", colors: ["#ef4444", "#ca8a04", "#22c55e", "#f43f5e"] },
  { z: 2, label: "THRILLER \u2022 ANIMATED \u2022 DOCS \u2022 WESTERN", colors: ["#7c3aed", "#06b6d4", "#65a30d", "#92400e"] },
];

function AisleSign({ z, label, colors }: { z: number; label: string; colors: string[] }) {
  return (
    <group position={[0, 0, z]}>
      {/* Hanging pole from ceiling */}
      <mesh position={[0, ROOM_H - 0.35, 0]}>
        <boxGeometry args={[0.02, 0.7, 0.02]} />
        <Mat color="#888888" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dark border frame (behind yellow sign) */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.3, 0.36, 0.02]} />
        <Mat color="#0a1830" roughness={0.6} />
      </mesh>
      {/* Sign body — Blockbuster yellow (in front of border) */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.2, 0.3, 0.03]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      {/* Text — front side (facing +z, toward entrance) */}
      <Text
        position={[0, 2.8, 0.02]}
        fontSize={0.08}
        color="#0a1830"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
      {/* Text — back side (facing -z, toward back wall) */}
      <Text
        position={[0, 2.8, -0.02]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.08}
        color="#0a1830"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

// ── Aisle floor markings (dashed yellow lines between shelf rows) ──
function AisleFloorMarkings() {
  const dashCount = 14;
  const dashWidth = 0.5;
  const dashDepth = 0.06;
  const gap = 0.3;
  const totalWidth = dashCount * (dashWidth + gap) - gap;
  const startX = -totalWidth / 2;

  return (
    <>
      {[-2.5, 0.5].map((z) => (
        <group key={`floor-line-${z}`} position={[0, 0.005, z]}>
          {Array.from({ length: dashCount }).map((_, i) => (
            <mesh key={i} position={[startX + i * (dashWidth + gap) + dashWidth / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[dashWidth, dashDepth]} />
              <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ── Staff Picks wall shelf (right wall) ──
const STAFF_PICK_MOVIES = [
  { url: "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", title: "Pulp Fiction", id: 680 },
  { url: "https://image.tmdb.org/t/p/w342/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", title: "The Godfather", id: 238 },
  { url: "https://image.tmdb.org/t/p/w342/gpMR1hnEo0JLEW0oGOAkxRYrf7R.jpg", title: "The Princess Bride", id: 2493 },
  { url: "https://image.tmdb.org/t/p/w342/3E52VpEVKhklKLLjqOGKpjEJBnM.jpg", title: "Ghostbusters", id: 620 },
];

function StaffPicksShelf() {
  return (
    <group position={[ROOM_W / 2 - 0.2, 1.2, -1]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Shelf board */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.22]} />
        <Mat color="#5a3a1a" roughness={0.7} />
      </mesh>
      {/* Back panel mounted to wall */}
      <mesh position={[0, 0.25, -0.1]}>
        <boxGeometry args={[1.3, 0.55, 0.03]} />
        <Mat color="#3a2010" roughness={0.85} />
      </mesh>
      {/* "STAFF PICKS" sign */}
      <mesh position={[0, 0.48, -0.08]}>
        <boxGeometry args={[0.9, 0.16, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      <Text
        position={[0, 0.48, -0.065]}
        fontSize={0.07}
        color="#0a1830"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        STAFF PICKS
      </Text>
      {/* Movie poster boxes on the shelf */}
      {STAFF_PICK_MOVIES.map((m, i) => {
        const dx = -0.36 + i * 0.24;
        return (
          <PosterBox
            key={`staff-pick-${m.id}`}
            url={m.url}
            position={[dx, 1.25, 0.05]}
            movieTitle={m.title}
            movieId={m.id}
          />
        );
      })}
    </group>
  );
}

// ── Hardcoded poster paths for wall posters (classic films) ──
const WALL_POSTER_PATHS: Record<string, string> = {
  JAWS: "https://image.tmdb.org/t/p/w342/lxM6kqilAdpdhqUl2biYp5frUxE.jpg",
  ALIEN: "https://image.tmdb.org/t/p/w342/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
  "BLADE RUNNER": "https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
  RAIDERS: "https://image.tmdb.org/t/p/w342/ceG9VzoRAVGwivFU403Wc3AHRys.jpg",
  "THE SHINING": "https://image.tmdb.org/t/p/w342/nRj5511mZdTl4saWEPoj9QroTIu.jpg",
  "STAR WARS": "https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  "BACK TO THE FUTURE": "https://image.tmdb.org/t/p/w342/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg",
  "E.T.": "https://image.tmdb.org/t/p/w342/an0nD6uq6byfxXCfk6lQBzdL2J1.jpg",
};

function WallPoster({ x, y, z, rotY = 0, title }: { x: number; y: number; z: number; rotY?: number; color?: string; title: string }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const tmdbUrl = WALL_POSTER_PATHS[title];
    if (!tmdbUrl) return;
    getOrCreatePosterTexture(tmdbUrl, (t) => {
      if (matRef.current) {
        matRef.current.map = t;
        matRef.current.color.set("#ffffff");
        matRef.current.needsUpdate = true;
      }
    });
  }, [title]);

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[1.0, 1.4, 0.04]} />
        <Mat color="#1a1a1a" roughness={0.5} />
      </mesh>
      {/* Poster art — in front of frame, facing into room */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} />
      </mesh>
      {/* Title removed — poster art speaks for itself */}
    </group>
  );
}

function FlickeringLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 4.0 + Math.sin(state.clock.elapsedTime * 3.7) * 0.5;
    }
  });
  return (
    <spotLight
      ref={lightRef}
      position={position}
      angle={0.6}
      penumbra={0.5}
      intensity={4}
      distance={6}
      color="#fff4d0"
      target-position={[position[0], 0, position[2]]}
    />
  );
}

function FloorRug() {
  return (
    <group>
      {/* Main entrance rug — branded with gold border, between row 3 and entrance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 5.2]}>
        <planeGeometry args={[3.4, 2.4]} />
        <Mat color="#ffd700" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.2]}>
        <planeGeometry args={[3, 2]} />
        <Mat color="#0a1830" roughness={0.95} />
      </mesh>
      {/* Store name on rug */}
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 5.2]} fontSize={0.18} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        FRIDAY NIGHT VIDEO
      </Text>
      {/* Carpet wear removed */}
    </group>
  );
}

function Baseboard({ pos, rot, width }: { pos: [number, number, number]; rot: [number, number, number]; width: number }) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={[width, 0.15, 0.05]} />
      <Mat color="#0a1428" roughness={0.8} />
    </mesh>
  );
}

// ── Trophy Shelf ─────────────────────────────────────────
const RARITY_COLORS: Record<string, string> = {
  legendary: "#ffd700",
  rare: "#a855f7",
  uncommon: "#06b6d4",
};

function TrophyShelf({ isMobile }: { isMobile?: boolean }) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkProps = () => {
      const newSet = new Set<string>();
      for (const p of PROPS) {
        if (hasProp(p.id)) newSet.add(p.id);
      }
      setUnlocked(newSet);
    };
    checkProps();
    const iv = setInterval(checkProps, 5000);
    return () => clearInterval(iv);
  }, []);

  const COL_SPACING = 0.4;
  const TIER_YS = [0.3, 0.8, 1.3];

  return (
    <group position={[ROOM_W / 2 - 0.3, 0, -4]} rotation={[0, -Math.PI / 2, 0]} userData={{ interactType: "trophy", label: "View Collection" }}>
      {/* Shelf unit — back panel */}
      <mesh position={[0, 0.85, -0.06]}>
        <boxGeometry args={[2.5, 1.7, 0.04]} />
        <Mat color="#3a2010" roughness={0.85} />
      </mesh>

      {/* Three shelf boards */}
      {TIER_YS.map((y, i) => (
        <mesh key={`shelf-${i}`} position={[0, y - 0.08, 0]}>
          <boxGeometry args={[2.5, 0.04, 0.25]} />
          <Mat color="#5a3a1a" roughness={0.7} />
        </mesh>
      ))}

      {/* Top cap board */}
      <mesh position={[0, 1.72, 0]}>
        <boxGeometry args={[2.5, 0.04, 0.25]} />
        <Mat color="#5a3a1a" roughness={0.7} />
      </mesh>

      {/* Side panels */}
      {[-1.25, 1.25].map((x, i) => (
        <mesh key={`side-${i}`} position={[x, 0.85, 0]}>
          <boxGeometry args={[0.04, 1.7, 0.25]} />
          <Mat color="#4a2a14" roughness={0.8} />
        </mesh>
      ))}

      {/* "COLLECTION" sign on top */}
      <group position={[0, 1.88, 0]}>
        <mesh>
          <boxGeometry args={[1.6, 0.22, 0.04]} />
          <Mat color="#1a1a2e" roughness={0.6} />
        </mesh>
        <Text
          position={[0, 0, 0.025]}
          fontSize={0.1}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          COLLECTION
        </Text>
      </group>

      {/* Prop slots — 5 columns x 3 rows */}
      {PROPS.map((prop, idx) => {
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const x = (col - 2) * COL_SPACING;
        const y = TIER_YS[row];
        const isUnlocked = unlocked.has(prop.id);

        return (
          <group key={prop.id} position={[x, y, 0]}>
            {isUnlocked ? (
              <>
                {/* Colored pedestal */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.18, 0.06, 0.18]} />
                  <Mat
                    color={RARITY_COLORS[prop.rarity] || "#888888"}
                    emissive={RARITY_COLORS[prop.rarity] || "#888888"}
                    emissiveIntensity={0.15}
                    roughness={0.4}
                    metalness={0.3}
                  />
                </mesh>
                {/* Emoji label */}
                <Text
                  position={[0, 0.14, 0.02]}
                  fontSize={0.15}
                  anchorX="center"
                  anchorY="middle"
                  font={undefined}
                >
                  {prop.emoji}
                </Text>
                {/* Prop name */}
                <Text
                  position={[0, -0.06, 0.02]}
                  fontSize={0.04}
                  color="#cccccc"
                  anchorX="center"
                  anchorY="middle"
                  font={undefined}
                  maxWidth={0.35}
                >
                  {prop.name}
                </Text>
              </>
            ) : (
              <>
                {/* Locked dark box */}
                <mesh position={[0, 0.075, 0]}>
                  <boxGeometry args={[0.15, 0.15, 0.15]} />
                  <Mat color="#1a1a1a" roughness={0.9} />
                </mesh>
                {/* Question mark */}
                <Text
                  position={[0, 0.075, 0.08]}
                  fontSize={0.08}
                  color="#555555"
                  anchorX="center"
                  anchorY="middle"
                  font={undefined}
                >
                  ?
                </Text>
              </>
            )}
          </group>
        );
      })}

      {/* Subtle shelf light */}
    </group>
  );
}

export function Store({ isMobile }: { isMobile?: boolean }) {
  return (
    <MobileCtx.Provider value={!!isMobile}>
    <group>
      {/* Floor — blue commercial carpet like Blockbuster */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <Mat color="#1a2248" roughness={0.95} />
      </mesh>
      {/* Entrance tile area — different floor near the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, ROOM_D / 2 - 1]}>
        <planeGeometry args={[6, 2]} />
        <Mat color="#3a3a3a" roughness={0.8} />
      </mesh>
      {/* Floor light pools */}
      {[-4, 0, 4].map((x, i) => (
        <mesh key={`fl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]}>
          <circleGeometry args={[3, 24]} />
          <Mat color="#1e2850" roughness={0.9} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <Mat color={CEILING_COLOR} roughness={0.9} />
      </mesh>
      {/* Ceiling drop-tile grid */}
      {Array.from({ length: Math.floor(18 / 1.2) + 1 }, (_, i) => -9 + i * 1.2).map(x => (
        <mesh key={`cgx${x}`} position={[x, ROOM_H - 0.01, 0]}>
          <boxGeometry args={[0.02, 0.01, ROOM_D]} />
          <Mat color="#c0b8a8" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(12 / 1.2) + 1 }, (_, i) => -6 + i * 1.2).map(z => (
        <mesh key={`cgz${z}`} position={[0, ROOM_H - 0.01, z]}>
          <boxGeometry args={[ROOM_W, 0.01, 0.02]} />
          <Mat color="#c0b8a8" />
        </mesh>
      ))}

      {/* Walls */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[-6, ROOM_H / 2, ROOM_D / 2]}>
        <planeGeometry args={[8, ROOM_H]} />
        <Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[6, ROOM_H / 2, ROOM_D / 2]}>
        <planeGeometry args={[8, ROOM_H]} />
        <Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>

      {/* Baseboards */}
      <Baseboard pos={[0, 0.075, -ROOM_D / 2 + 0.025]} rot={[0, 0, 0]} width={ROOM_W} />
      <Baseboard pos={[-ROOM_W / 2 + 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />
      <Baseboard pos={[ROOM_W / 2 - 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />

      {/* Blockbuster-yellow accent stripes along all interior walls */}
      {/* Back wall stripe */}
      <mesh position={[0, 2.8, -ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[ROOM_W, 0.06, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Front wall — left section */}
      <mesh position={[-6, 2.8, ROOM_D / 2 - 0.02]}>
        <boxGeometry args={[8, 0.06, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Front wall — right section */}
      <mesh position={[6, 2.8, ROOM_D / 2 - 0.02]}>
        <boxGeometry args={[8, 0.06, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Left wall stripe */}
      <mesh position={[-ROOM_W / 2 + 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.06, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Right wall stripe */}
      <mesh position={[ROOM_W / 2 - 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.06, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>

      {/* Ambient lighting only — no dynamic pointLights/spotLights for performance */}
      <ambientLight intensity={2.2} color="#e8e4d8" />
      <hemisphereLight args={["#fff4e0", "#3a4060", 1.2]} />

      {/* Fluorescent ceiling fixtures — visual only (emissive materials, no lights) */}
      {[-6, -2, 2, 6].map((fx) => (
        <group key={fx}>
          {/* Back aisle fixtures (z=-1.5) */}
          <group position={[fx, ROOM_H - 0.04, -1.5]}>
            <mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
            <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#e8f0ff" /></mesh>
            <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh>
          </group>
          {/* Front aisle fixtures (z=2) */}
          <group position={[fx, ROOM_H - 0.04, 2]}>
            <mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
            <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fff8e0" /></mesh>
            <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh>
          </group>
        </group>
      ))}
      {/* Middle row of fixtures (z=0) */}
      {[-4, 0, 4].map((fx) => (
        <group key={`mid-${fx}`} position={[fx, ROOM_H - 0.04, 0]}>
          <mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
          <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#f0f4e8" /></mesh>
          <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh>
        </group>
      ))}

      {/* Shelves */}
      {SHELF_ROWS.map((s, i) => (
        <ShelfUnit key={i} x={s.x} z={s.z} genre={s.genre} color={s.color} isMobile={isMobile} />
      ))}

      {/* Hanging aisle signs */}
      {AISLE_SIGNS.map((sign, i) => (
        <AisleSign key={`aisle-${i}`} z={sign.z} label={sign.label} colors={sign.colors} />
      ))}

      {/* Aisle floor markings — dashed yellow lines between shelf rows */}
      <AisleFloorMarkings />

      {/* Staff Picks wall shelf — right wall */}
      <StaffPicksShelf />

      {/* Counter + Vinny */}
      <Counter />
      <VinnyCharacter />

      {/* NPCs + Charlie */}
      <NPCCustomer startPos={[-3.35, 0, -5.5]} shirtColor="#3498db" hairColor="#2a1a0a" skinTone="#d4a574" />
      <NPCCustomer startPos={[3.35, 0, 0.5]} shirtColor="#e74c3c" hairColor="#4a3020" skinTone="#c49a6c" />
      {!isMobile && <NPCCustomer startPos={[-3.35, 0, 3.5]} shirtColor="#27ae60" hairColor="#1a1a1a" skinTone="#e8c4a0" />}
      {!isMobile && <NPCCustomer startPos={[3.35, 0, -2.5]} shirtColor="#9b59b6" hairColor="#8b6914" skinTone="#d4a574" />}
      <KidCustomer startPos={[0, 0, 0.5]} shirtColor="#f0e020" hairColor="#6b3a10" skinTone="#e8c4a0" />
      <CharlieCharacter isMobile={isMobile} />

      {/* New Releases wall display */}
      <NewReleasesWall isMobile={isMobile} />

      {/* Neon sign */}
      <NeonSign />

      {/* CRT TV with animated screen */}
      <TVScreen isMobile={isMobile} />

      {/* Wall posters — back wall */}
      {/* Back wall posters — flanking the new releases rack */}
      <WallPoster x={-7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#b91c1c" title="JAWS" />
      <WallPoster x={-9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#1d4ed8" title="ALIEN" />
      <WallPoster x={7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#7c3aed" title="BLADE RUNNER" />
      <WallPoster x={9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#059669" title="RAIDERS" />

      {/* Wall posters — side walls */}
      <WallPoster x={-ROOM_W / 2 + 0.05} y={2.0} z={-3} rotY={Math.PI / 2} color="#dc2626" title="THE SHINING" />
      <WallPoster x={-ROOM_W / 2 + 0.05} y={2.0} z={2} rotY={Math.PI / 2} color="#f59e0b" title="STAR WARS" />
      <WallPoster x={ROOM_W / 2 - 0.05} y={2.0} z={0} rotY={-Math.PI / 2} color="#ec4899" title="BACK TO THE FUTURE" />
      <WallPoster x={ROOM_W / 2 - 0.05} y={2.0} z={5} rotY={-Math.PI / 2} color="#14b8a6" title="E.T." />

      {/* "BE KIND REWIND" sign on left wall — clear of Star Wars poster at z=1 */}
      <group position={[-ROOM_W / 2 + 0.12, 2.0, 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.35, 0.03]} />
          <Mat color="#0a1a3a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>
          BE KIND, REWIND
        </Text>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>
          BE KIND, REWIND
        </Text>
      </group>

      {/* "OPEN" neon sign near entrance — classic hanging sign */}
      <group position={[-4, 2.5, ROOM_D / 2 - 0.1]} rotation={[0, Math.PI, 0]}>
        {/* Sign backing — dark */}
        <mesh>
          <boxGeometry args={[1.0, 0.45, 0.03]} />
          <Mat color="#0a0a18" roughness={0.5} />
        </mesh>
        {/* Neon border */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.1, 0.55, 0.01]} />
          <Mat color="#ff3e7a" emissive="#ff3e7a" emissiveIntensity={0.2} transparent opacity={0.5} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.22} color="#ff3e7a" anchorX="center" font={undefined}>
          OPEN
          <meshBasicMaterial color="#ff3e7a" toneMapped={false} />
        </Text>
      </group>

      {/* Store hours sign near door — white with blue border */}
      <group position={[4, 2.0, ROOM_D / 2 - 0.1]} rotation={[0, Math.PI, 0]}>
        {/* Blue border */}
        <mesh position={[0, 0, -0.005]}>
          <boxGeometry args={[1.3, 0.9, 0.03]} />
          <Mat color="#1a3a6a" roughness={0.5} />
        </mesh>
        {/* White background */}
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.03]} />
          <Mat color="#f0f0e8" roughness={0.7} />
        </mesh>
        <Text position={[0, 0.25, 0.02]} fontSize={0.08} color="#1a3a6a" anchorX="center" font={undefined}>
          STORE HOURS
        </Text>
        <Text position={[0, 0.05, 0.02]} fontSize={0.05} color="#333333" anchorX="center" font={undefined}>
          MON-SAT 10AM - 11PM
        </Text>
        <Text position={[0, -0.1, 0.02]} fontSize={0.05} color="#333333" anchorX="center" font={undefined}>
          SUN 11AM - 9PM
        </Text>
        <Text position={[0, -0.28, 0.02]} fontSize={0.035} color="#cc3333" anchorX="center" font={undefined}>
          OPEN LATE FRIDAYS!
        </Text>
      </group>

      {/* ── Storefront windows + night sky exterior ──────── */}
      {/* Night sky backdrop — surrounds the scene so there's no black void */}
      {/* Back sky */}
      <mesh position={[0, 8, -25]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#050a18" />
      </mesh>
      {/* Front sky (behind parking lot, far away) */}
      <mesh position={[0, 8, 30]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#050a18" />
      </mesh>
      {/* Left sky */}
      <mesh position={[-30, 8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#050a18" />
      </mesh>
      {/* Right sky */}
      <mesh position={[30, 8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#050a18" />
      </mesh>
      {/* Sky ceiling */}
      <mesh position={[0, 20, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color="#060c1a" />
      </mesh>
      {/* Parking lot ground plane — extended for walking approach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, ROOM_D / 2 + 5]}>
        <planeGeometry args={[ROOM_W + 8, 14]} />
        <meshBasicMaterial color="#1a1a20" />
      </mesh>
      {/* Sidewalk in front of store */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, ROOM_D / 2 + 0.8]}>
        <planeGeometry args={[ROOM_W + 2, 1.5]} />
        <meshBasicMaterial color="#3a3a3a" />
      </mesh>
      {/* Parking lines */}
      {[-6, -3, 0, 3, 6].map((px, i) => (
        <mesh key={`pline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, -0.04, ROOM_D / 2 + 6]}>
          <planeGeometry args={[0.06, 4]} />
          <meshBasicMaterial color="#555555" />
        </mesh>
      ))}
      {/* Parking lot lamp posts */}
      {[-6, 0, 6].map((lx, i) => (
        <group key={`lamp-${i}`} position={[lx, 0, ROOM_D / 2 + 7]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 3, 8]} />
            <meshBasicMaterial color="#444" />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.15]} />
            <meshBasicMaterial color="#555" />
          </mesh>
        </group>
      ))}

      {/* ── EXTERIOR ──────────────────────────────────────────── */}
      {/* Fascia wall above storefront — fills the gap between ceiling and sign */}
      <mesh position={[0, ROOM_H + 0.8, ROOM_D / 2 + 0.2]}>
        <boxGeometry args={[ROOM_W + 12, 2.0, 0.3]} />
        <meshBasicMaterial color="#1a1a28" />
      </mesh>
      {/* ── Store front signage — "FRIDAY NIGHT VIDEO" ──────── */}
      <group position={[0, ROOM_H + 0.5, ROOM_D / 2 + 0.5]}>
        {/* Sign backing */}
        <mesh>
          <boxGeometry args={[8, 1.2, 0.2]} />
          <meshBasicMaterial color="#0a0a2a" />
        </mesh>
        {/* Sign border trim — double border */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[8.3, 1.35, 0.02]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[8.1, 1.15, 0.02]} />
          <meshBasicMaterial color="#0a0a2a" />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[7.9, 1.05, 0.02]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        {/* VHS tape icon — left of text */}
        <group position={[-3.5, 0, 0.13]}>
          <mesh>
            <boxGeometry args={[0.5, 0.35, 0.02]} />
            <meshBasicMaterial color="#ffd700" toneMapped={false} />
          </mesh>
          {/* Tape reels */}
          <mesh position={[-0.1, 0, 0.01]}>
            <circleGeometry args={[0.08, 8]} />
            <meshBasicMaterial color="#0a0a2a" />
          </mesh>
          <mesh position={[0.1, 0, 0.01]}>
            <circleGeometry args={[0.08, 8]} />
            <meshBasicMaterial color="#0a0a2a" />
          </mesh>
        </group>
        <Text
          position={[0, 0.05, 0.14]}
          fontSize={0.55}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          FRIDAY NIGHT VIDEO
          <meshBasicMaterial color="#ffd700" toneMapped={false} />
        </Text>
        {/* Tagline below main text */}
        <Text
          position={[0, -0.3, 0.14]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          YOUR NEIGHBORHOOD VIDEO STORE
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        {/* Sign illumination — gooseneck lights */}
      </group>

      {/* ── Strip mall walls extending left and right ──────── */}

      {/* ── Shared roof line connecting all storefronts ──────── */}
      <mesh position={[0, ROOM_H + 1.2, ROOM_D / 2 - 0.1]}>
        <boxGeometry args={[ROOM_W + 12, 0.15, 0.8]} />
        <meshBasicMaterial color="#2a2a30" />
      </mesh>
      {/* Roof fascia trim */}
      <mesh position={[0, ROOM_H + 1.1, ROOM_D / 2 + 0.25]}>
        <boxGeometry args={[ROOM_W + 12.2, 0.08, 0.05]} />
        <meshBasicMaterial color="#444450" />
      </mesh>
      {/* Address sign on shared roof */}
      <group position={[0, ROOM_H + 1.35, ROOM_D / 2 + 0.15]}>
        <mesh>
          <boxGeometry args={[3.5, 0.35, 0.05]} />
          <meshBasicMaterial color="#222230" />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.16}
          color="#888899"
          anchorX="center"
          anchorY="middle"
        >
          1987 STRIP MALL PLAZA
          <meshBasicMaterial color="#888899" toneMapped={false} />
        </Text>
      </group>

      {/* ══════════════════════════════════════════════════════════
           PIZZA PALACE — left neighbor (centered x=-13, z=7)
         ══════════════════════════════════════════════════════════ */}
      {/* Left neighbor wall */}
      <mesh position={[-ROOM_W / 2 - 3, ROOM_H / 2, ROOM_D / 2]}>
        <boxGeometry args={[6, ROOM_H, 0.3]} />
        <meshBasicMaterial color="#2a2a30" />
      </mesh>
      {/* Left neighbor door */}
      <mesh position={[-ROOM_W / 2 - 2.5, 1.1, ROOM_D / 2 + 0.16]}>
        <planeGeometry args={[1.0, 2.2]} />
        <meshBasicMaterial color="#111115" />
      </mesh>
      {/* Door frame */}
      <mesh position={[-ROOM_W / 2 - 2.5, 2.22, ROOM_D / 2 + 0.17]}>
        <boxGeometry args={[1.1, 0.04, 0.04]} />
        <meshBasicMaterial color="#553322" />
      </mesh>
      {/* Pizza Palace sign backing */}
      <group position={[-ROOM_W / 2 - 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}>
        <mesh>
          <boxGeometry args={[3.5, 0.6, 0.05]} />
          <meshBasicMaterial color="#1a0a0a" />
        </mesh>
        {/* Sign border */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[3.6, 0.7, 0.02]} />
          <meshBasicMaterial color="#cc3333" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[3.4, 0.5, 0.02]} />
          <meshBasicMaterial color="#1a0a0a" />
        </mesh>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.24}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
        >
          PIZZA PALACE
          <meshBasicMaterial color="#ff4444" toneMapped={false} />
        </Text>
      </group>

      {/* Neon pizza slice sign — triangle */}
      <group position={[-ROOM_W / 2 - 4.5, ROOM_H - 0.3, ROOM_D / 2 + 0.2]}>
        <mesh rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.35, 0.6, 3]} />
          <meshBasicMaterial color="#ff6622" toneMapped={false} />
        </mesh>
        {/* Pepperoni dots on slice */}
        <mesh position={[-0.05, 0.05, 0.18]}>
          <circleGeometry args={[0.05, 8]} />
          <meshBasicMaterial color="#cc2200" />
        </mesh>
        <mesh position={[0.08, -0.1, 0.18]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color="#cc2200" />
        </mesh>
      </group>

      {/* Red-and-white checkered awning */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={`pizza-awning-${i}`}
          position={[-ROOM_W / 2 - 5.5 + i * 0.55, ROOM_H + 0.05, ROOM_D / 2 + 0.3]}
          rotation={[0.25, 0, 0]}
        >
          <boxGeometry args={[0.55, 0.05, 0.8]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#cc2222" : "#eeeeee"} />
        </mesh>
      ))}

      {/* Pizza Palace window — warm glow */}
      <mesh position={[-ROOM_W / 2 - 3.8, 1.4, ROOM_D / 2 + 0.17]}>
        <planeGeometry args={[1.8, 1.6]} />
        <meshBasicMaterial color="#443311" transparent opacity={0.6} />
      </mesh>
      {/* Window frame */}
      <mesh position={[-ROOM_W / 2 - 3.8, 1.4, ROOM_D / 2 + 0.18]}>
        <boxGeometry args={[1.9, 0.04, 0.03]} />
        <meshBasicMaterial color="#553322" />
      </mesh>
      <mesh position={[-ROOM_W / 2 - 3.8, 1.4, ROOM_D / 2 + 0.18]}>
        <boxGeometry args={[0.04, 1.7, 0.03]} />
        <meshBasicMaterial color="#553322" />
      </mesh>
      {/* Warm light spilling from window */}

      {/* "OPEN LATE" neon sign in window */}
      <group position={[-ROOM_W / 2 - 3.8, 1.8, ROOM_D / 2 + 0.19]}>
        <mesh>
          <boxGeometry args={[1.2, 0.3, 0.02]} />
          <meshBasicMaterial color="#0a0a0a" />
        </mesh>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.14}
          color="#ff3366"
          anchorX="center"
          anchorY="middle"
        >
          OPEN LATE
          <meshBasicMaterial color="#ff3366" toneMapped={false} />
        </Text>
      </group>

      {/* Menu board outside door */}
      <group position={[-ROOM_W / 2 - 1.6, 1.2, ROOM_D / 2 + 0.4]}>
        {/* A-frame board */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.9, 0.05]} />
          <meshBasicMaterial color="#222211" />
        </mesh>
        {/* Board border */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.55, 0.85, 0.02]} />
          <meshBasicMaterial color="#443322" />
        </mesh>
        <Text
          position={[0, 0.2, 0.03]}
          fontSize={0.08}
          color="#ffcc44"
          anchorX="center"
          anchorY="middle"
        >
          SLICES $1.50
          <meshBasicMaterial color="#ffcc44" toneMapped={false} />
        </Text>
        <Text
          position={[0, 0.05, 0.03]}
          fontSize={0.06}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          WHOLE PIE $8.99
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        <Text
          position={[0, -0.1, 0.03]}
          fontSize={0.06}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          2-LITER SODA $1
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        {/* Board legs */}
        <mesh position={[-0.25, -0.55, 0.1]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.04, 0.3, 0.04]} />
          <meshBasicMaterial color="#443322" />
        </mesh>
        <mesh position={[0.25, -0.55, 0.1]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.04, 0.3, 0.04]} />
          <meshBasicMaterial color="#443322" />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════
           LAUNDROMAT — right neighbor
         ══════════════════════════════════════════════════════════ */}
      {/* Right neighbor wall */}
      <mesh position={[ROOM_W / 2 + 3, ROOM_H / 2, ROOM_D / 2]}>
        <boxGeometry args={[6, ROOM_H, 0.3]} />
        <meshBasicMaterial color="#2a2a30" />
      </mesh>
      {/* Right neighbor door */}
      <mesh position={[ROOM_W / 2 + 3.5, 1.1, ROOM_D / 2 + 0.16]}>
        <planeGeometry args={[1.0, 2.2]} />
        <meshBasicMaterial color="#111115" />
      </mesh>
      {/* Laundromat sign */}
      <group position={[ROOM_W / 2 + 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}>
        <mesh>
          <boxGeometry args={[3.5, 0.6, 0.05]} />
          <meshBasicMaterial color="#0a0a1a" />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.24}
          color="#55bbee"
          anchorX="center"
          anchorY="middle"
        >
          LAUNDROMAT
          <meshBasicMaterial color="#55bbee" toneMapped={false} />
        </Text>
      </group>
      {/* Right neighbor awning */}
      <mesh position={[ROOM_W / 2 + 3, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[5.5, 0.05, 0.8]} />
        <meshBasicMaterial color="#113355" />
      </mesh>

      {/* Laundromat large window */}
      <mesh position={[ROOM_W / 2 + 2, 1.4, ROOM_D / 2 + 0.17]}>
        <planeGeometry args={[2.2, 1.8]} />
        <meshBasicMaterial color="#223344" transparent opacity={0.5} />
      </mesh>
      {/* Window frame */}
      {[[-1.1, 0], [1.1, 0], [0, 0.9], [0, -0.9]].map(([ox, oy], i) => (
        <mesh key={`laund-frame-${i}`} position={[ROOM_W / 2 + 2 + (ox as number), 1.4 + (oy as number), ROOM_D / 2 + 0.18]}>
          <boxGeometry args={[i < 2 ? 0.04 : 2.3, i < 2 ? 1.9 : 0.04, 0.03]} />
          <meshBasicMaterial color="#334455" />
        </mesh>
      ))}

      {/* Visible washing machines through window (3 machines) */}
      {[0, 0.65, 1.3].map((dx, i) => (
        <group key={`washer-${i}`} position={[ROOM_W / 2 + 1.5 + dx, 0.7, ROOM_D / 2 - 0.05]}>
          {/* Machine body */}
          <mesh>
            <boxGeometry args={[0.55, 0.7, 0.5]} />
            <meshBasicMaterial color="#cccccc" />
          </mesh>
          {/* Door circle */}
          <mesh position={[0, 0, 0.26]}>
            <circleGeometry args={[0.18, 16]} />
            <meshBasicMaterial color="#aabbcc" />
          </mesh>
          {/* Inner drum circle */}
          <mesh position={[0, 0, 0.27]}>
            <circleGeometry args={[0.12, 12]} />
            <meshBasicMaterial color="#556677" />
          </mesh>
        </group>
      ))}

      {/* Fluorescent blue-white light from laundromat */}

      {/* Spinning "OPEN" sign */}
      <group position={[ROOM_W / 2 + 1.2, 2.0, ROOM_D / 2 + 0.25]}>
        <mesh>
          <boxGeometry args={[0.7, 0.35, 0.04]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.16}
          color="#33ff66"
          anchorX="center"
          anchorY="middle"
        >
          OPEN
          <meshBasicMaterial color="#33ff66" toneMapped={false} />
        </Text>
      </group>

      {/* ── Curb between sidewalk and parking lot ──────── */}
      <mesh position={[0, 0.05, ROOM_D / 2 + 1.5]}>
        <boxGeometry args={[ROOM_W + 4, 0.1, 0.15]} />
        <meshBasicMaterial color="#555555" />
      </mesh>

      {/* ── Parked car — 90s sedan, parked perpendicular to store */}
      <group position={[5, 0, ROOM_D / 2 + 5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.0, 0.8, 1.0]} />
          <meshBasicMaterial color="#1a2233" />
        </mesh>
        {/* Cabin / windows */}
        <mesh position={[0.1, 1.1, 0]}>
          <boxGeometry args={[1.2, 0.5, 0.9]} />
          <meshBasicMaterial color="#1a2a44" />
        </mesh>
        {/* Wheels */}
        {[[-0.7, 0.15, 0.5], [-0.7, 0.15, -0.5], [0.7, 0.15, 0.5], [0.7, 0.15, -0.5]].map(([wx, wy, wz], i) => (
          <mesh key={`wheel-${i}`} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.08, 8]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
        ))}
        {/* Headlights */}
        <mesh position={[-1.01, 0.55, 0.3]}>
          <boxGeometry args={[0.02, 0.12, 0.15]} />
          <meshBasicMaterial color="#ffeeaa" toneMapped={false} />
        </mesh>
        <mesh position={[-1.01, 0.55, -0.3]}>
          <boxGeometry args={[0.02, 0.12, 0.15]} />
          <meshBasicMaterial color="#ffeeaa" toneMapped={false} />
        </mesh>
        {/* Taillights */}
        <mesh position={[1.01, 0.55, 0.3]}>
          <boxGeometry args={[0.02, 0.1, 0.12]} />
          <meshBasicMaterial color="#cc2222" />
        </mesh>
        <mesh position={[1.01, 0.55, -0.3]}>
          <boxGeometry args={[0.02, 0.1, 0.12]} />
          <meshBasicMaterial color="#cc2222" />
        </mesh>
        {/* Bumpers */}
        <mesh position={[-1.02, 0.3, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.9]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[1.02, 0.3, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.9]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      </group>

      {/* ── 90s Minivan, parked perpendicular to store */}
      <group position={[-4, 0, ROOM_D / 2 + 5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Body — boxy and tall */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.2, 1.0, 1.1]} />
          <meshBasicMaterial color="#556644" />
        </mesh>
        {/* Tall cabin */}
        <mesh position={[0.1, 1.4, 0]}>
          <boxGeometry args={[1.8, 0.7, 1.05]} />
          <meshBasicMaterial color="#334433" />
        </mesh>
        {/* Windows */}
        <mesh position={[0.1, 1.4, 0.53]}>
          <planeGeometry args={[1.6, 0.5]} />
          <meshBasicMaterial color="#445566" />
        </mesh>
        <mesh position={[0.1, 1.4, -0.53]}>
          <planeGeometry args={[1.6, 0.5]} />
          <meshBasicMaterial color="#445566" />
        </mesh>
        {/* Wheels */}
        {[[-0.8, 0.18, 0.55], [-0.8, 0.18, -0.55], [0.8, 0.18, 0.55], [0.8, 0.18, -0.55]].map(([wx, wy, wz], i) => (
          <mesh key={`van-wheel-${i}`} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
        ))}
        {/* Headlights */}
        <mesh position={[-1.11, 0.65, 0.35]}>
          <boxGeometry args={[0.02, 0.14, 0.18]} />
          <meshBasicMaterial color="#ffeeaa" toneMapped={false} />
        </mesh>
        <mesh position={[-1.11, 0.65, -0.35]}>
          <boxGeometry args={[0.02, 0.14, 0.18]} />
          <meshBasicMaterial color="#ffeeaa" toneMapped={false} />
        </mesh>
        {/* Taillights */}
        <mesh position={[1.11, 0.65, 0.35]}>
          <boxGeometry args={[0.02, 0.12, 0.14]} />
          <meshBasicMaterial color="#cc2222" />
        </mesh>
        <mesh position={[1.11, 0.65, -0.35]}>
          <boxGeometry args={[0.02, 0.12, 0.14]} />
          <meshBasicMaterial color="#cc2222" />
        </mesh>
        {/* Bumpers */}
        <mesh position={[-1.12, 0.35, 0]}>
          <boxGeometry args={[0.04, 0.14, 1.0]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[1.12, 0.35, 0]}>
          <boxGeometry args={[0.04, 0.14, 1.0]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        {/* Roof rack */}
        <mesh position={[0, 1.78, 0]}>
          <boxGeometry args={[1.6, 0.04, 0.9]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
      </group>

      {/* ── Handicap parking sign ──────── */}
      <group position={[-1.5, 0, ROOM_D / 2 + 3.5]}>
        {/* Post */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 1.6, 6]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
        {/* Sign */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.03]} />
          <meshBasicMaterial color="#2255bb" />
        </mesh>
        {/* Wheelchair icon (simplified) */}
        <mesh position={[0, 1.6, 0.02]}>
          <circleGeometry args={[0.1, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Parking spot marking on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -0.04, ROOM_D / 2 + 2.5]}>
          <planeGeometry args={[2.5, 0.06]} />
          <meshBasicMaterial color="#2255bb" />
        </mesh>
      </group>

      {/* ── Bike rack with kid's bike ──────── */}
      <group position={[8, 0, ROOM_D / 2 + 1]}>
        {/* Rack — inverted U shape */}
        <mesh position={[0, 0.5, 0]}>
          <torusGeometry args={[0.25, 0.02, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#888888" />
        </mesh>
        <mesh position={[-0.25, 0.12, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
          <meshBasicMaterial color="#888888" />
        </mesh>
        <mesh position={[0.25, 0.12, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
          <meshBasicMaterial color="#888888" />
        </mesh>
        {/* Kid's bike */}
        <group position={[0, 0, 0.25]}>
          {/* Frame */}
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.35, 0.03, 0.03]} />
            <meshBasicMaterial color="#ee3344" />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.25, 0.03, 0.03]} />
            <meshBasicMaterial color="#ee3344" />
          </mesh>
          {/* Wheels */}
          <mesh position={[-0.15, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshBasicMaterial color="#222222" />
          </mesh>
          <mesh position={[0.15, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.015, 8, 16]} />
            <meshBasicMaterial color="#222222" />
          </mesh>
          {/* Handlebars */}
          <mesh position={[-0.15, 0.38, 0]}>
            <boxGeometry args={[0.03, 0.1, 0.15]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Seat */}
          <mesh position={[0.1, 0.38, 0]}>
            <boxGeometry args={[0.08, 0.03, 0.06]} />
            <meshBasicMaterial color="#222222" />
          </mesh>
        </group>
      </group>

      {/* ── Shopping cart return area ──────── */}
      <group position={[2, 0, ROOM_D / 2 + 7]}>
        {/* Painted border on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <planeGeometry args={[1.8, 1.2]} />
          <meshBasicMaterial color="#222228" />
        </mesh>
        {/* Yellow border lines */}
        {[[-0.9, 0], [0.9, 0]].map(([ox], i) => (
          <mesh key={`cart-line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[ox as number, -0.038, 0]}>
            <planeGeometry args={[0.05, 1.2]} />
            <meshBasicMaterial color="#ccaa22" />
          </mesh>
        ))}
        {/* Cart return sign */}
        <mesh position={[0.9, 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 1.6, 6]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
        <mesh position={[0.9, 1.6, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.03]} />
          <meshBasicMaterial color="#2244aa" />
        </mesh>
        <Text
          position={[0.9, 1.6, 0.02]}
          fontSize={0.07}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          CART RETURN
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        {/* A lone shopping cart */}
        <group position={[-0.2, 0, 0]}>
          {/* Cart basket */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.5, 0.35, 0.35]} />
            <meshBasicMaterial color="#999999" />
          </mesh>
          {/* Cart handle */}
          <mesh position={[0.3, 0.7, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.3]} />
            <meshBasicMaterial color="#666666" />
          </mesh>
          {/* Cart wheels */}
          {[[-0.2, 0.12, 0.15], [-0.2, 0.12, -0.15], [0.2, 0.12, 0.15], [0.2, 0.12, -0.15]].map(([cx, cy, cz], i) => (
            <mesh key={`cart-whl-${i}`} position={[cx, cy, cz]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 6]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Storm drain grate ──────── */}
      <group position={[-7, -0.045, ROOM_D / 2 + 6]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Grate border */}
        <mesh>
          <planeGeometry args={[0.6, 0.4]} />
          <meshBasicMaterial color="#0a0a0a" />
        </mesh>
        {/* Grate bars */}
        {[-0.15, -0.05, 0.05, 0.15].map((gy, i) => (
          <mesh key={`grate-${i}`} position={[0, gy, 0.001]}>
            <planeGeometry args={[0.5, 0.03]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
        ))}
      </group>

      {/* ── Street / road beyond parking lot ──────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, ROOM_D / 2 + 13]}>
        <planeGeometry args={[ROOM_W + 20, 6]} />
        <meshBasicMaterial color="#111116" />
      </mesh>
      {/* Road center line */}
      {[-8, -4, 0, 4, 8].map((dx, i) => (
        <mesh key={`roadline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dx, -0.055, ROOM_D / 2 + 13]}>
          <planeGeometry args={[1.5, 0.08]} />
          <meshBasicMaterial color="#555533" />
        </mesh>
      ))}
      {/* ── End exterior ──── */}

      {/* Transom wall above doors — fills the gap between door top and ceiling */}
      <mesh position={[0, ROOM_H - 0.25, ROOM_D / 2]}>
        <boxGeometry args={[4, 0.7, 0.15]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      {/* Solid wall above windows — from y=2.5 to ceiling */}
      <mesh position={[-5, ROOM_H - 0.4, ROOM_D / 2]}>
        <boxGeometry args={[5.6, 1.0, 0.15]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[5, ROOM_H - 0.4, ROOM_D / 2]}>
        <boxGeometry args={[5.6, 1.0, 0.15]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      {/* Header panels above storefront windows — accent trim */}
      <mesh position={[-5, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}>
        <boxGeometry args={[5.6, 0.5, 0.06]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[5, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}>
        <boxGeometry args={[5.6, 0.5, 0.06]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}>
        <boxGeometry args={[1.2, 0.5, 0.06]} />
        <Mat color={WALL_COLOR} roughness={0.85} />
      </mesh>

      {/* Left storefront window (x = -5) — real stores have windows from ~0.3 to ~2.5m */}
      <mesh position={[-5, 1.4, ROOM_D / 2 + 0.01]}>
        <planeGeometry args={[5.5, 2.2]} />
        <Mat
          color="#8ab8dd"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left window frame strips */}
      <mesh position={[-2.2, 1.4, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[0.06, 2.3, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-7.8, 1.4, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[0.06, 2.3, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-5, 2.5, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-5, 0.3, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Right storefront window (x = 5) */}
      <mesh position={[5, 1.4, ROOM_D / 2 + 0.01]}>
        <planeGeometry args={[5.5, 2.2]} />
        <Mat
          color="#8ab8dd"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Right window frame strips */}
      <mesh position={[2.2, 1.4, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[0.06, 2.3, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[7.8, 1.4, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[0.06, 2.3, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[5, 2.5, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[5, 0.3, ROOM_D / 2 + 0.06]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <Mat color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Awning above entrance — blue/yellow canopy */}
      <mesh position={[0, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[5, 0.06, 1.2]} />
        <Mat color="#1a3a8a" roughness={0.7} />
      </mesh>
      {/* Yellow accent stripe on awning */}
      <mesh position={[0, ROOM_H + 0.02, ROOM_D / 2 + 0.7]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[5, 0.03, 0.25]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.6} />
      </mesh>
      {/* Awning underside light */}

      {/* Floor rug near entrance */}
      <FloorRug />

      {/* Welcome mat — raised above floor to prevent z-fighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, ROOM_D / 2 - 0.5]}>
        <planeGeometry args={[2, 1]} />
        <Mat color="#4a2020" roughness={0.95} />
      </mesh>

      {/* ── Double entrance doors ────────────────────────────── */}
      {/* Left door */}
      <group position={[-0.55, 0, ROOM_D / 2 - 0.05]}>
        <mesh position={[0, 1.4, 0]}>
          <planeGeometry args={[1.0, 2.8]} />
          <Mat color="#a0c0e0" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
        {/* Frame */}
        <mesh position={[-0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 2.82, 0]}><boxGeometry args={[1.08, 0.04, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.06, 0.04]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
        <Text position={[0, 1.8, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
      </group>
      {/* Right door */}
      <group position={[0.55, 0, ROOM_D / 2 - 0.05]}>
        <mesh position={[0, 1.4, 0]}>
          <planeGeometry args={[1.0, 2.8]} />
          <Mat color="#a0c0e0" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 2.82, 0]}><boxGeometry args={[1.08, 0.04, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.06, 0.04]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
        <Text position={[0, 1.8, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
      </group>
      {/* Center divider between doors */}
      <mesh position={[0, 1.4, ROOM_D / 2 - 0.05]}>
        <boxGeometry args={[0.06, 2.84, 0.04]} />
        <Mat color="#3a3a3a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* ── Return window (outside, left of entrance — behind counter) ──────── */}
      <group position={[-8, 0, ROOM_D / 2 + 0.1]}>
        {/* Return counter structure */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1.0, 0.6]} />
          <Mat color="#1a3a6a" roughness={0.7} />
        </mesh>
        {/* Counter top */}
        <mesh position={[0, 1.02, 0]}>
          <boxGeometry args={[1.6, 0.04, 0.65]} />
          <Mat color="#2a4a7a" roughness={0.5} />
        </mesh>
        {/* Return slot opening */}
        <mesh position={[0, 0.7, -0.28]}>
          <boxGeometry args={[0.8, 0.15, 0.08]} />
          <Mat color="#0a0a1a" roughness={0.9} />
        </mesh>
        {/* "VIDEO RETURN" sign */}
        <mesh position={[0, 1.4, -0.1]}>
          <boxGeometry args={[1.2, 0.3, 0.03]} />
          <Mat color="#ffd700" roughness={0.5} />
        </mesh>
        <Text position={[0, 1.4, -0.13]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>
          VIDEO RETURN
        </Text>
        {/* A few tapes sitting in the slot */}
        {[-0.15, 0, 0.15].map((dx, i) => (
          <mesh key={`ret-tape-${i}`} position={[dx, 0.78, -0.2]} rotation={[0.1, 0.1 * i, 0]}>
            <boxGeometry args={[0.18, 0.04, 0.10]} />
            <Mat color={["#1a3a6a", "#6a1a3a", "#3a6a1a"][i]} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ── Return chute (interior, behind counter — wall-mounted) ──────── */}
      <group position={[-8, 0, 6.5]}>
        {/* Chute trough — angled ramp from wall slot down to bin */}
        <mesh position={[0, 0.7, 0]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.6]} />
          <Mat color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Chute side rails */}
        <mesh position={[-0.45, 0.7, 0]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.6]} />
          <Mat color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0.45, 0.7, 0]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.6]} />
          <Mat color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Catch bin below chute */}
        <mesh position={[0, 0.25, 0.2]}>
          <boxGeometry args={[1.0, 0.5, 0.5]} />
          <Mat color="#1a1a2a" roughness={0.9} />
        </mesh>
        {/* Tape in the bin */}
        <mesh position={[0.1, 0.45, 0.2]} rotation={[0.05, 0.2, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.10]} />
          <Mat color="#4a1a3a" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Recent Returns display on counter top ──────── */}
      <group position={[-4, 1.08, 5.2]}>
        {/* Small sign */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.6, 0.25, 0.03]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <Text position={[0, 0.2, 0.02]} fontSize={0.055} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>
          RECENT RETURNS — Browse before we shelve!
        </Text>
        {/* Returned tapes laid flat on counter */}
        {[
          { dx: -0.5, dz: 0.08, rot: 0.05, color: "#6a1a3a" },
          { dx: -0.15, dz: 0.06, rot: -0.08, color: "#1a3a6a" },
          { dx: 0.2, dz: 0.1, rot: 0.12, color: "#3a6a1a" },
          { dx: 0.5, dz: 0.04, rot: -0.03, color: "#5a3a1a" },
        ].map((t, i) => (
          <mesh key={`recent-${i}`} position={[t.dx, 0.02, t.dz]} rotation={[0, t.rot, 0]}>
            <boxGeometry args={[0.19, 0.03, 0.12]} />
            <Mat color={t.color} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Candy rack removed — counter already has built-in candy shelves */}

      {/* Security pillars at entrance */}
      <mesh position={[-1.2, 0.75, ROOM_D / 2 - 0.5]}>
        <boxGeometry args={[0.15, 1.5, 0.08]} />
        <Mat color="#e8e8e0" roughness={0.6} />
      </mesh>
      <mesh position={[1.2, 0.75, ROOM_D / 2 - 0.5]}>
        <boxGeometry args={[0.15, 1.5, 0.08]} />
        <Mat color="#e8e8e0" roughness={0.6} />
      </mesh>
      {/* Red LED indicators on top */}
      <mesh position={[-1.2, 1.55, ROOM_D / 2 - 0.5]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.2, 1.55, ROOM_D / 2 - 0.5]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Wall clock near counter */}
      <group position={[ROOM_W / 2 - 0.1, 2.8, 6.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <circleGeometry args={[0.25, 24]} />
          <Mat color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <cylinderGeometry args={[0.27, 0.27, 0.04, 24]} />
          <Mat color="#333" roughness={0.5} />
        </mesh>
        {/* Hour hand */}
        <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.02, 0.12, 0.005]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        {/* Minute hand */}
        <mesh position={[0.04, 0.06, 0.01]} rotation={[0, 0, -1.2]}>
          <boxGeometry args={[0.015, 0.18, 0.005]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </group>

      {/* Standee removed — was cluttering entrance */}

      {/* Old drop box removed — return window is now outside */}

      {/* Bulletin board on left wall */}
      <group position={[-ROOM_W / 2 + 0.08, 1.6, 4.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <Mat color="#7a5a30" roughness={0.85} />
        </mesh>
        {/* Sticky notes */}
        {[[-0.3, 0.15, "#ffd700"], [0.1, 0.2, "#ef4444"], [-0.15, -0.1, "#22c55e"], [0.25, -0.05, "#3b82f6"]].map(([dx, dy, c], i) => (
          <mesh key={`note${i}`} position={[dx as number, dy as number, -0.03]} rotation={[0, 0, (i - 1.5) * 0.1]}>
            <planeGeometry args={[0.2, 0.2]} />
            <Mat color={c as string} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── MOVIE NIGHT CHALLENGE BOARD ─────────────────────── */}
      <group position={[ROOM_W / 2 - 0.1, 1.5, 1.5]} rotation={[0, -Math.PI / 2, 0]}
        userData={{ interactType: "challenge", label: "Challenge Board" }}
      >
        {/* Board backing */}
        <mesh userData={{ interactType: "challenge", label: "Challenge Board" }}>
          <boxGeometry args={[1.4, 1.0, 0.04]} />
          <Mat color="#0a0a1a" roughness={0.5} />
        </mesh>
        {/* Neon border glow */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.5, 1.1, 0.01]} />
          <Mat color="#ff3e7a" emissive="#ff3e7a" emissiveIntensity={0.3} roughness={0.5} />
        </mesh>
        {/* Inner border */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[1.35, 0.95, 0.01]} />
          <Mat color="#0a0a1a" roughness={0.5} />
        </mesh>
        {/* Title */}
        <Text position={[0, 0.25, 0.03]} fontSize={0.1} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
          MOVIE NIGHT
        </Text>
        <Text position={[0, 0.1, 0.03]} fontSize={0.07} color="#ff3e7a" anchorX="center" anchorY="middle" font={undefined}>
          CHALLENGE
        </Text>
        {/* Description */}
        <Text position={[0, -0.08, 0.03]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          Choose your challenge!
        </Text>
        <Text position={[0, -0.2, 0.03]} fontSize={0.04} color="rgba(255,215,0,0.7)" anchorX="center" anchorY="middle" font={undefined}>
          Click to open
        </Text>
        {/* Glow */}
      </group>

      {/* ── TROPHY SHELF ────────────────────────────────────── */}
      <TrophyShelf isMobile={isMobile} />

      {/* ── ATMOSPHERE & DETAIL ──────────────────────────────── */}

      {/* Security dome mirrors in ceiling corners */}
      <SecurityDome position={[-ROOM_W / 2 + 0.5, ROOM_H - 0.05, -ROOM_D / 2 + 0.5]} />
      <SecurityDome position={[ROOM_W / 2 - 0.5, ROOM_H - 0.05, ROOM_D / 2 - 0.5]} />

      {/* AC vent on ceiling */}
      <mesh position={[3, ROOM_H - 0.02, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
        <Mat color="#c8c0b0" roughness={0.6} />
      </mesh>
      {/* Vent slats */}
      {[-0.25, -0.1, 0.05, 0.2].map((dy, i) => (
        <mesh key={`vent-${i}`} position={[3, ROOM_H - 0.018, -2 + dy]}>
          <boxGeometry args={[0.7, 0.004, 0.02]} />
          <Mat color="#aaa89a" roughness={0.5} />
        </mesh>
      ))}

      {/* Water stain on ceiling tile — adds character */}
      <mesh position={[-6, ROOM_H - 0.015, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <Mat color="#c0b090" roughness={0.95} transparent opacity={0.4} />
      </mesh>

      {/* Neon accent strips under shelf top surfaces — genre colored glow */}
      {SHELF_ROWS.map((s, i) => (
        <ShelfNeonStrip key={`neon-${i}`} position={[s.x, 1.50, s.z]} color={s.color} isMobile={isMobile} />
      ))}

      {/* "EMPLOYEES ONLY" door on left wall */}
      <group position={[-ROOM_W / 2 + 0.06, 0, -4]} rotation={[0, Math.PI / 2, 0]}>
        {/* Door */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.9, 2.3, 0.04]} />
          <Mat color="#4a3020" roughness={0.8} />
        </mesh>
        {/* Door frame */}
        <mesh position={[-0.48, 1.15, 0]}>
          <boxGeometry args={[0.04, 2.4, 0.06]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        <mesh position={[0.48, 1.15, 0]}>
          <boxGeometry args={[0.04, 2.4, 0.06]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.37, 0]}>
          <boxGeometry args={[1.0, 0.04, 0.06]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.32, 1.0, 0.03]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <Mat color="#b8960a" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Sign */}
        <mesh position={[0, 1.7, 0.03]}>
          <boxGeometry args={[0.5, 0.15, 0.01]} />
          <Mat color="#cc2222" roughness={0.5} />
        </mesh>
        <Text position={[0, 1.7, 0.04]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          EMPLOYEES ONLY
        </Text>
      </group>

      {/* "LATE FEES" warning sign near checkout */}
      <group position={[-ROOM_W / 2 + 0.1, 1.5, 5.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.6, 0.02]} />
          <Mat color="#0a1a3a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.15, 0.015]} fontSize={0.08} color="#ef4444" anchorX="center" font={undefined}>
          LATE FEES
        </Text>
        <Text position={[0, 0, 0.015]} fontSize={0.04} color="#ffffff" anchorX="center" font={undefined}>
          1-DAY: $1.50 | 2-DAY: $3.00
        </Text>
        <Text position={[0, -0.12, 0.015]} fontSize={0.04} color="#ffd700" anchorX="center" font={undefined}>
          BE KIND, RETURN ON TIME!
        </Text>
      </group>

      {/* "2-DAY RENTAL" / "NEW RELEASE" sticker signs on shelf ends */}
      {[
        { pos: [-5.5, 1.7, -3.3] as [number, number, number], label: "2-DAY RENTAL", bg: "#1a6abb" },
        { pos: [5, 1.7, -3.3] as [number, number, number], label: "5-DAY RENTAL", bg: "#059669" },
        { pos: [-5.5, 1.7, 2.7] as [number, number, number], label: "NEW!", bg: "#ef4444" },
      ].map((sign, i) => (
        <group key={`rental-${i}`} position={sign.pos}>
          <mesh>
            <boxGeometry args={[0.6, 0.15, 0.01]} />
            <Mat color={sign.bg} roughness={0.5} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
            {sign.label}
          </Text>
        </group>
      ))}

      {/* VHS rewinder on counter */}
      <group position={[-8, 1.08, 5.5]}>
        {/* Rewinder body */}
        <mesh>
          <boxGeometry args={[0.25, 0.08, 0.18]} />
          <Mat color="#1a1a2a" roughness={0.5} />
        </mesh>
        {/* VHS slot */}
        <mesh position={[0, 0.04, -0.04]}>
          <boxGeometry args={[0.2, 0.01, 0.12]} />
          <Mat color="#0a0a1a" roughness={0.4} />
        </mesh>
        {/* Power LED */}
        <mesh position={[0.08, 0.045, -0.09]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <Mat color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
        {/* "REWIND" label */}
        <Text position={[-0.02, 0.045, -0.091]} fontSize={0.015} color="#888" anchorX="center" font={undefined}>
          REWIND
        </Text>
      </group>

      {/* Rental guide rack removed — was cluttering entrance */}


      {/* "REWARDS MEMBER?" sign above counter */}
      <group position={[-6, 2.8, 5.5]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 0.4, 0.03]} />
          <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.2} roughness={0.5} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.12} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>
          REWARDS MEMBER? ASK!
        </Text>
      </group>

      {/* Potted plant in corner */}
      <group position={[ROOM_W / 2 - 0.5, 0, -ROOM_D / 2 + 0.5]}>
        {/* Pot */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.4, 8]} />
          <Mat color="#6a3a1a" roughness={0.8} />
        </mesh>
        {/* Soil */}
        <mesh position={[0, 0.41, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 8]} />
          <Mat color="#3a2a1a" roughness={0.9} />
        </mesh>
        {/* Plant — simple sphere cluster */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <Mat color="#1a5a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, 0.85, 0.05]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <Mat color="#1a6a1a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.08, 0.8, -0.05]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <Mat color="#2a5a2a" roughness={0.8} />
        </mesh>
      </group>

      {/* Trash can near entrance */}
      <group position={[-1.5, 0, ROOM_D / 2 - 1]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.13, 0.6, 8]} />
          <Mat color="#333333" roughness={0.7} />
        </mesh>
        {/* Rim */}
        <mesh position={[0, 0.61, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 8]} />
          <Mat color="#444444" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* ─── SPECIALS chalkboard on right wall near entrance ─── */}
      <group position={[9.85, 1.8, 3]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Green chalkboard */}
        <mesh>
          <boxGeometry args={[1.4, 1.0, 0.04]} />
          <Mat color="#1a3a1a" roughness={0.95} />
        </mesh>
        {/* Wood frame — top */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[1.48, 0.06, 0.06]} />
          <Mat color="#6a3a0a" roughness={0.8} />
        </mesh>
        {/* Wood frame — bottom */}
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[1.48, 0.06, 0.06]} />
          <Mat color="#6a3a0a" roughness={0.8} />
        </mesh>
        {/* Wood frame — left */}
        <mesh position={[-0.72, 0, 0]}>
          <boxGeometry args={[0.06, 1.1, 0.06]} />
          <Mat color="#6a3a0a" roughness={0.8} />
        </mesh>
        {/* Wood frame — right */}
        <mesh position={[0.72, 0, 0]}>
          <boxGeometry args={[0.06, 1.1, 0.06]} />
          <Mat color="#6a3a0a" roughness={0.8} />
        </mesh>
        {/* Chalk ledge */}
        <mesh position={[0, -0.55, 0.04]}>
          <boxGeometry args={[1.2, 0.03, 0.06]} />
          <Mat color="#6a3a0a" roughness={0.8} />
        </mesh>
        {/* Chalk piece on ledge */}
        <mesh position={[0.3, -0.53, 0.06]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.01, 0.01, 0.06, 6]} />
          <Mat color="#eeeeee" roughness={0.9} />
        </mesh>
        {/* Header text */}
        <Text position={[0, 0.32, 0.025]} fontSize={0.12} color="#ffffff" anchorX="center" font={undefined}>
          ★ SPECIALS ★
        </Text>
        {/* Deal 1 */}
        <Text position={[0, 0.1, 0.025]} fontSize={0.08} color="#fffe8a" anchorX="center" font={undefined}>
          RENT 2 GET 1 FREE!
        </Text>
        {/* Deal 2 */}
        <Text position={[0, -0.1, 0.025]} fontSize={0.07} color="#ffffff" anchorX="center" font={undefined}>
          KIDS MOVIES $0.99/night
        </Text>
        {/* Decorative underline */}
        <mesh position={[0, -0.2, 0.025]}>
          <boxGeometry args={[0.9, 0.008, 0.002]} />
          <Mat color="#fffe8a" roughness={0.9} />
        </mesh>
      </group>

      {/* ─── Stack of returned VHS tapes behind counter ─── */}
      <group position={[-6, 1.08, 6]}>
        {/* Tape 1 — bottom, blue */}
        <mesh position={[0, 0, 0]} rotation={[0, 0.05, 0]}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
          <Mat color="#1e40af" roughness={0.7} />
        </mesh>
        {/* Tape 2 — red, slightly rotated */}
        <mesh position={[0.02, 0.04, -0.01]} rotation={[0, -0.15, 0.02]}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
          <Mat color="#b91c1c" roughness={0.7} />
        </mesh>
        {/* Tape 3 — black */}
        <mesh position={[-0.01, 0.08, 0.01]} rotation={[0, 0.2, -0.03]}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
          <Mat color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Tape 4 — yellow, askew */}
        <mesh position={[0.03, 0.12, -0.02]} rotation={[0.05, -0.3, 0.04]}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
          <Mat color="#ca8a04" roughness={0.7} />
        </mesh>
        {/* Tape 5 — green, on top leaning */}
        <mesh position={[-0.04, 0.16, 0.0]} rotation={[0, 0.4, -0.08]}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
          <Mat color="#166534" roughness={0.7} />
        </mesh>
        {/* "RETURNS" sticky note */}
        <Text position={[0, 0.22, 0]} fontSize={0.03} color="#333" anchorX="center" rotation={[-Math.PI / 2, 0, 0]} font={undefined}>
          RETURNS
        </Text>
      </group>

      {/* ─── Membership application forms on counter ─── */}
      <group position={[-5, 1.06, 5.3]}>
        {/* Paper stack */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.015, 0.25]} />
          <Mat color="#f5f5f0" roughness={0.9} />
        </mesh>
        {/* Top sheet slightly offset */}
        <mesh position={[0.005, 0.008, 0.003]}>
          <boxGeometry args={[0.18, 0.003, 0.25]} />
          <Mat color="#fafaf5" roughness={0.9} />
        </mesh>
        {/* Pen lying on top */}
        <mesh position={[0.06, 0.015, 0.02]} rotation={[0, 0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
          <Mat color="#1a1a8a" roughness={0.5} />
        </mesh>
        {/* Pen cap */}
        <mesh position={[0.1, 0.015, 0.05]} rotation={[0, 0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.004, 0.03, 6]} />
          <Mat color="#1a1a5a" roughness={0.4} />
        </mesh>
        {/* Tiny text suggesting form header */}
        <Text position={[0, 0.013, -0.06]} fontSize={0.015} color="#333" anchorX="center" rotation={[-Math.PI / 2, 0, 0]} font={undefined}>
          MEMBERSHIP APPLICATION
        </Text>
      </group>

      {/* Plastic bag removed */}

      {/* Coming attractions, lost & found, gumball machines all removed */}

      {/* ─── Phone on wall behind counter ─── */}
      <group position={[-9.8, 2.2, 6.3]} rotation={[0, Math.PI / 2, 0]}>
        {/* Wall mount plate */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.15, 0.25, 0.02]} />
          <Mat color="#d4c9a8" roughness={0.8} />
        </mesh>
        {/* Handset cradle */}
        <mesh position={[0, 0.15, 0.02]}>
          <boxGeometry args={[0.12, 0.03, 0.04]} />
          <Mat color="#c8b888" roughness={0.7} />
        </mesh>
        {/* Handset */}
        <group position={[0, 0.17, 0.03]}>
          {/* Earpiece */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.025, 0.02, 0.04, 8]} />
            <Mat color="#c8b888" roughness={0.6} />
          </mesh>
          {/* Handle */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <Mat color="#c8b888" roughness={0.6} />
          </mesh>
          {/* Mouthpiece */}
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.04, 8]} />
            <Mat color="#c8b888" roughness={0.6} />
          </mesh>
        </group>
        {/* Coiled cord — represented as a series of small torus segments */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`cord-${i}`} position={[0, -0.02 - i * 0.04, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.015, 0.003, 6, 8, Math.PI]} />
            <Mat color="#c8b888" roughness={0.7} />
          </mesh>
        ))}
        {/* Dial pad area */}
        <mesh position={[0, -0.02, 0.015]}>
          <boxGeometry args={[0.08, 0.1, 0.01]} />
          <Mat color="#bba878" roughness={0.7} />
        </mesh>
      </group>

    </group>
    </MobileCtx.Provider>
  );
}
