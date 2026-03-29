"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";

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

function PosterBox({ url, position, rotation = 0, movieTitle, movieId }: { url: string; position: [number, number, number]; rotation?: number; movieTitle?: string; movieId?: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    // Use smaller images on mobile
    const isMob = typeof window !== "undefined" && ("ontouchstart" in window || window.innerWidth < 768);
    const imgUrl = isMob ? url.replace("/w342/", "/w185/") : url;
    fetch(`/api/image-proxy?url=${encodeURIComponent(imgUrl)}`)
      .then(r => r.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          if (matRef.current) {
            const t = new THREE.Texture(img);
            t.colorSpace = THREE.SRGBColorSpace;
            t.needsUpdate = true;
            matRef.current.map = t;
            matRef.current.color.set("#ffffff");
            matRef.current.needsUpdate = true;
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      })
      .catch(() => {});
  }, [url]);

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
  // Row 1 — back of store (z = -3)
  { x: -5.5, z: -3, genre: "HORROR", color: "#dc2626" },
  { x: -2, z: -3, genre: "SCI-FI", color: "#3b82f6" },
  { x: 1.5, z: -3, genre: "COMEDY", color: "#f97316" },
  { x: 5, z: -3, genre: "DRAMA", color: "#6366f1" },
  // Row 2 — middle (z = 0)
  { x: -5.5, z: 0, genre: "ACTION", color: "#ef4444" },
  { x: -2, z: 0, genre: "CLASSICS", color: "#ca8a04" },
  { x: 1.5, z: 0, genre: "FAMILY", color: "#22c55e" },
  { x: 5, z: 0, genre: "ROMANCE", color: "#f43f5e" },
  // Row 3 — near front (z = 3)
  { x: -5.5, z: 3, genre: "THRILLER", color: "#7c3aed" },
  { x: -2, z: 3, genre: "ANIMATED", color: "#06b6d4" },
  { x: 1.5, z: 3, genre: "DOCS", color: "#65a30d" },
];

function ShelfUnit({ x, z, genre, color, isMobile }: { x: number; z: number; genre: string; color: string; isMobile?: boolean }) {
  const posters = usePosterUrls(genre, 40);
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");

  // Pack shelves full — reduced on mobile for performance
  const positions = useMemo(() => {
    const result: { x: number; y: number; z: number; side: string; idx: number }[] = [];
    const count = isMobile ? 5 : 10;
    const spacing = 0.24;
    const startX = -(count - 1) * spacing * 0.5;
    let idx = 0;
    for (const side of ["front", "back"] as const) {
      const z = side === "front" ? -0.25 : 0.25;
      for (const y of [1.25, 0.75, 0.25]) {
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
        <meshStandardMaterial color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Shelf top surface */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[2.9, 0.05, 0.6]} />
        <meshStandardMaterial color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.55]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.55]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>
      {/* Shelf dividers (2 dividers = 3 tiers) */}
      <mesh position={[0, 0.50, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <meshStandardMaterial color="#6a4226" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <meshStandardMaterial color="#6a4226" roughness={0.8} />
      </mesh>
      {/* Bottom board */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[2.75, 0.03, 0.52]} />
        <meshStandardMaterial color="#6a4226" roughness={0.8} />
      </mesh>

      {/* VHS Boxes — face-out with poster art */}
      {positions.map((pos) => {
        const posterIdx = pos.idx % Math.max(posters.length, 1);
        const poster = posters[posterIdx];
        const flipRot = pos.side === "back" ? Math.PI : 0;
        return poster ? (
          <PosterBox key={`${pos.side}-${posterIdx}`} url={poster.url} position={[pos.x, pos.y, pos.z]} rotation={flipRot} movieTitle={poster.title} movieId={poster.id} />
        ) : (
          <mesh key={`${pos.side}-${posterIdx}`} position={[pos.x, pos.y, pos.z]}>
            <boxGeometry args={[0.20, 0.30, 0.10]} />
            <meshStandardMaterial
              color={new THREE.Color(color).offsetHSL(0, -0.1, -(posterIdx % 3) * 0.1)}
              roughness={0.6}
            />
          </mesh>
        );
      })}

      {/* Genre label sign on top of shelf — facing both sides */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.04]} />
        <meshStandardMaterial color="#0a1830" roughness={0.6} />
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
        <meshStandardMaterial color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top surface */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[1.05, 0.04, 0.45]} />
        <meshStandardMaterial color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>

      {/* Face-out VHS boxes — 3 on top shelf, 3 on bottom */}
      {vhsColors.map((color, i) => (
        <group key={`et-${i}`} position={[-0.28 + i * 0.28, 1.1, -0.25]}>
          <mesh>
            <boxGeometry args={[0.18, 0.28, 0.10]} />
            <meshStandardMaterial color={color} roughness={0.6} />
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
            <meshStandardMaterial color={color} roughness={0.6} />
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
        <meshStandardMaterial color="#b91c1c" roughness={0.5} />
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
    <group position={[7.5, 0, 5]}>
      {/* Counter body — front panel */}
      <mesh position={[0, 0.5, -0.55]}>
        <boxGeometry args={[6, 1.0, 0.08]} />
        <meshStandardMaterial color="#5a3820" roughness={0.8} />
      </mesh>
      {/* Counter body — sides */}
      <mesh position={[-3, 0.5, 0]}>
        <boxGeometry args={[0.08, 1.0, 1.2]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[3, 0.5, 0]}>
        <boxGeometry args={[0.08, 1.0, 1.2]} />
        <meshStandardMaterial color="#4a2818" roughness={0.8} />
      </mesh>
      {/* Counter top — polished wood */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[6.15, 0.06, 1.3]} />
        <meshStandardMaterial color="#9a7850" roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Counter kick panel */}
      <mesh position={[0, 0.05, -0.55]}>
        <boxGeometry args={[5.9, 0.1, 0.06]} />
        <meshStandardMaterial color="#3a2010" roughness={0.9} />
      </mesh>

      {/* Candy display shelves on front of counter (customer side) */}
      {/* Shelf brackets */}
      {[0.3, 0.6].map((y) => (
        <mesh key={`candy-shelf-${y}`} position={[0, y, -0.58]}>
          <boxGeometry args={[4, 0.03, 0.25]} />
          <meshStandardMaterial color="#5a3820" roughness={0.7} />
        </mesh>
      ))}
      {/* Candy boxes — rows of colorful packages */}
      {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((dx, i) => (
        <group key={`candy-row-${i}`}>
          {/* Top shelf candy */}
          <group position={[dx, 0.72, -0.58]}>
            <mesh>
              <boxGeometry args={[0.15, 0.18, 0.08]} />
              <meshStandardMaterial color={["#ef4444","#f59e0b","#3b82f6","#22c55e","#ec4899","#a855f7","#f97316"][i]} roughness={0.5} />
            </mesh>
            {/* Label stripe */}
            <mesh position={[0, 0, -0.041]}>
              <planeGeometry args={[0.12, 0.06]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
          {/* Bottom shelf candy */}
          <group position={[dx, 0.42, -0.58]}>
            <mesh>
              <boxGeometry args={[0.15, 0.15, 0.09]} />
              <meshStandardMaterial color={["#f97316","#ec4899","#22c55e","#ef4444","#3b82f6","#f59e0b","#a855f7"][i]} roughness={0.5} />
            </mesh>
            {/* Label stripe */}
            <mesh position={[0, 0, -0.046]}>
              <planeGeometry args={[0.12, 0.05]} />
              <meshBasicMaterial color="#eeeecc" />
            </mesh>
          </group>
        </group>
      ))}
      {/* "CANDY & SNACKS" label */}
      <Text position={[0, 0.88, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>
        CANDY & SNACKS
      </Text>

      {/* Register */}
      <mesh position={[-1.5, 1.25, 0]}>
        <boxGeometry args={[0.65, 0.45, 0.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>
      {/* Register screen */}
      <mesh position={[-1.5, 1.38, -0.26]}>
        <boxGeometry args={[0.42, 0.22, 0.01]} />
        <meshStandardMaterial color="#0a3a0a" emissive="#0a4a0a" emissiveIntensity={0.5} />
      </mesh>
      {/* Register keypad */}
      <mesh position={[-1.5, 1.06, -0.1]}>
        <boxGeometry args={[0.4, 0.02, 0.3]} />
        <meshStandardMaterial color="#333" roughness={0.6} />
      </mesh>

      {/* "CHECKOUT" sign */}
      <Text position={[0, 1.15, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>
        CHECKOUT
      </Text>

      {/* Snack display on counter */}
      {[1.0, 1.3, 1.6, 1.9].map((dx, i) => (
        <group key={`snk${i}`} position={[dx, 1.15, 0.2]}>
          <mesh>
            <boxGeometry args={[0.12, 0.18, 0.06]} />
            <meshStandardMaterial color={["#ef4444", "#3b82f6", "#f59e0b", "#22c55e"][i]} roughness={0.5} />
          </mesh>
          {/* Front label */}
          <mesh position={[0, -0.02, -0.031]}>
            <planeGeometry args={[0.09, 0.06]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Return bin */}
      <mesh position={[2.3, 1.15, -0.2]}>
        <boxGeometry args={[0.5, 0.25, 0.35]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      <Text position={[2.3, 1.35, -0.38]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#888" anchorX="center" font={undefined}>
        RETURNS
      </Text>

      {/* Computer monitor behind counter */}
      <group position={[0.5, 1.5, 0.3]}>
        {/* Monitor body */}
        <mesh>
          <boxGeometry args={[0.4, 0.35, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.01, -0.026]}>
          <planeGeometry args={[0.34, 0.26]} />
          <meshStandardMaterial color="#1a3a6a" emissive="#1a4a8a" emissiveIntensity={0.6} />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, -0.22, 0.02]}>
          <boxGeometry args={[0.08, 0.1, 0.06]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
        </mesh>
        {/* Monitor base */}
        <mesh position={[0, -0.27, 0.02]}>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
        </mesh>
      </group>

      {/* Barcode scanner */}
      <mesh position={[1.0, 1.1, -0.2]}>
        <boxGeometry args={[0.15, 0.08, 0.2]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>
      {/* Scanner red line */}
      <mesh position={[1.0, 1.145, -0.2]}>
        <boxGeometry args={[0.12, 0.005, 0.02]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
      </mesh>

      {/* Stack of VHS cases on counter */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`vhs-stack-${i}`} position={[-0.5, 1.15 + i * 0.04, -0.2]} rotation={[0, (i * 0.15), 0]}>
          <boxGeometry args={[0.2, 0.035, 0.12]} />
          <meshStandardMaterial
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

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
      // Slight lean side to side
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
    }
  });

  return (
    <group ref={ref} position={[7.5, 0, 6]} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
      {/* Legs */}
      <mesh position={[-0.08, 0.35, 0]} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
        <boxGeometry args={[0.12, 0.7, 0.14]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.14]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
      </mesh>

      {/* Torso / Vest */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.25]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.7} />
      </mesh>
      {/* Vest buttons */}
      {[0.85, 0.95, 1.05].map(y => (
        <mesh key={y} position={[0, y, -0.13]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#ffd700" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {/* Shirt collar */}
      <mesh position={[0, 1.2, -0.05]}>
        <boxGeometry args={[0.2, 0.08, 0.18]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.6} />
      </mesh>
      {/* Name tag */}
      <mesh position={[0.14, 1.0, -0.13]}>
        <boxGeometry args={[0.12, 0.06, 0.01]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.26, 0.9, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.14]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.7} />
      </mesh>
      <mesh position={[0.26, 0.9, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.14]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.7} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.26, 0.65, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>
      <mesh position={[0.26, 0.65, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.55, 0.02]}>
        <sphereGeometry args={[0.21, 16, 10]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.07, 1.44, -0.17]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0.07, 1.44, -0.17]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.07, 1.44, -0.2]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.07, 1.44, -0.2]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Mustache */}
      <mesh position={[0, 1.36, -0.18]}>
        <boxGeometry args={[0.14, 0.04, 0.04]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 1.32, -0.17]}>
        <boxGeometry args={[0.08, 0.02, 0.03]} />
        <meshStandardMaterial color="#a07050" roughness={0.8} />
      </mesh>

      {/* Floating name */}
      <Text position={[0, 1.85, 0]} rotation={[0, Math.PI, 0]} fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>
        VINNY
      </Text>

      {/* Shadow on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function NPCCustomer({ startPos, shirtColor, hairColor, skinTone }: {
  startPos: [number, number, number]; shirtColor: string; hairColor: string; skinTone: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + offset;
      ref.current.position.x = startPos[0] + Math.sin(t * 0.25) * 2.5;
      ref.current.position.z = startPos[2] + Math.cos(t * 0.18) * 1.8;
      // Walk bob
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
      // Face direction of movement
      ref.current.rotation.y = Math.atan2(Math.cos(t * 0.25), -Math.sin(t * 0.18));
    }
  });

  return (
    <group ref={ref} position={startPos}>
      {/* Legs */}
      <mesh position={[-0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.32, 0.42, 0.2]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={skinTone} roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.32, 0.01]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function NewReleasesWall() {
  const posters = usePosterUrls("NEW", 20);
  // Only trending — these are actual new releases
  const allPosters = posters;

  // Same PosterBox format as the racks — small VHS boxes in a grid
  const positions = useMemo(() => {
    const result: { x: number; y: number; idx: number }[] = [];
    const cols = 30;
    const rows = 4;
    const spacing = 0.24;
    const startX = -(cols - 1) * spacing * 0.5;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ x: startX + col * spacing, y: 1.75 - row * 0.5, idx: idx++ });
      }
    }
    return result;
  }, []);

  return (
    <group position={[0, 0, -ROOM_D / 2 + 0.15]}>
      {/* Shelf unit — centered, not full wall */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[8, 2.0, 0.3]} />
        <meshStandardMaterial color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[8.2, 0.05, 0.35]} />
        <meshStandardMaterial color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Shelf dividers */}
      {[1.5, 1.0, 0.5, 0.02].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><boxGeometry args={[7.8, 0.03, 0.28]} /><meshStandardMaterial color="#6a4226" roughness={0.8} /></mesh>
      ))}
      {/* Side panels */}
      <mesh position={[-4, 1.0, 0]}><boxGeometry args={[0.04, 2.0, 0.3]} /><meshStandardMaterial color="#4a2818" roughness={0.8} /></mesh>
      <mesh position={[4, 1.0, 0]}><boxGeometry args={[0.04, 2.0, 0.3]} /><meshStandardMaterial color="#4a2818" roughness={0.8} /></mesh>

      {/* BIG "NEW RELEASES" illuminated sign above */}
      <mesh position={[0, 2.6, 0.05]}>
        <boxGeometry args={[6, 0.5, 0.06]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.5} />
      </mesh>
      <Text position={[0, 2.6, 0.09]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        ★ NEW RELEASES ★
      </Text>
      <Text position={[0, 2.6, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        ★ NEW RELEASES ★
      </Text>
      <pointLight position={[0, 2.6, 0.3]} color="#ffd700" intensity={2} distance={4} />

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
    <group position={[0, 3.3, -ROOM_D / 2 + 0.15]}>
      {/* Sign backing */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[6, 0.4, 0.04]} />
        <meshStandardMaterial color="#0a1830" roughness={0.5} />
      </mesh>
      {/* Text facing into room (+z toward player) */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.2}
        color="#ffd700"
        anchorX="center"
        font={undefined}
      >
        FRIDAY NIGHT VIDEO
      </Text>
      <pointLight position={[0, 0, 0.3]} color="#ffd700" intensity={2} distance={5} />
    </group>
  );
}

function TVScreen() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  // Animate screen color to simulate VHS playback flicker
  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      const r = 0.1 + Math.sin(t * 0.7) * 0.05;
      const g = 0.2 + Math.sin(t * 1.1 + 1) * 0.08;
      const b = 0.4 + Math.sin(t * 0.5 + 2) * 0.1;
      matRef.current.emissive.setRGB(r, g, b);
      // Occasional brightness flicker
      matRef.current.emissiveIntensity = 0.8 + Math.sin(t * 8.3) * 0.1 + (Math.sin(t * 37) > 0.95 ? 0.4 : 0);
    }
  });
  return (
    <group position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} userData={{ interactType: "tv", label: "Friday Night Pick" }}>
      {/* CRT TV body — chunky retro shape */}
      <mesh userData={{ interactType: "tv", label: "Friday Night Pick" }}>
        <boxGeometry args={[1.2, 0.9, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
      </mesh>
      {/* Rounded bezel */}
      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[1.1, 0.8, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      {/* Screen — animated */}
      <mesh position={[0, 0, 0.21]}>
        <planeGeometry args={[0.95, 0.65]} />
        <meshStandardMaterial ref={matRef} color="#000000" emissive="#1a4a6a" emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* VHS tracking lines — thin horizontal stripes */}
      {[-0.2, -0.05, 0.15].map((dy, i) => (
        <mesh key={`scan-${i}`} position={[0, dy, 0.215]}>
          <planeGeometry args={[0.9, 0.008]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
        </mesh>
      ))}
      {/* Screen glow */}
      <pointLight position={[0, 0, 0.5]} color="#4a8aff" intensity={1.5} distance={4} />
      {/* TV stand bracket */}
      <mesh position={[0, -0.55, -0.05]}>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Wall mount plate */}
      <mesh position={[0, 0, -0.21]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}

// Gumball machine near entrance
function GumballMachine() {
  return (
    <group position={[2, 0, ROOM_D / 2 - 1.5]}>
      {/* Base pedestal */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.8, 12]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      {/* Globe (glass sphere with gumballs) */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ff4444" transparent opacity={0.3} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* Gumballs inside — colored spheres */}
      {[
        [0, 0.95, 0, "#ff3333"], [-0.06, 1.02, 0.04, "#3388ff"], [0.05, 0.98, -0.05, "#33cc33"],
        [-0.04, 1.06, -0.03, "#ffaa00"], [0.06, 1.04, 0.03, "#ff33aa"], [0, 0.92, 0.06, "#8833ff"],
      ].map(([x, y, z, c], i) => (
        <mesh key={`gb-${i}`} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={c as string} roughness={0.3} />
        </mesh>
      ))}
      {/* Metal cap on top */}
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 0.05, 12]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Coin slot */}
      <mesh position={[0, 0.75, -0.13]}>
        <boxGeometry args={[0.06, 0.04, 0.02]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Dispensing tray */}
      <mesh position={[0, 0.15, -0.15]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Security dome mirror in ceiling corner
function SecurityDome({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Mounting plate */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* Dome — dark reflective */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#111" roughness={0.05} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Neon accent strip for shelves
function ShelfNeonStrip({ position, color, width = 2.6 }: { position: [number, number, number]; color: string; width?: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.02, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, -0.1, 0]} color={color} intensity={0.3} distance={1.5} />
    </group>
  );
}

function NewReleaseVHS({ url, position }: { url: string; position: [number, number, number] }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!url) return;
    fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`)
      .then(r => r.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          if (matRef.current) {
            const t = new THREE.Texture(img);
            t.colorSpace = THREE.SRGBColorSpace;
            t.needsUpdate = true;
            matRef.current.map = t;
            matRef.current.color.set("#ffffff");
            matRef.current.needsUpdate = true;
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      })
      .catch(() => {});
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
  { z: -3, label: "HORROR \u2022 SCI-FI \u2022 COMEDY \u2022 DRAMA", colors: ["#dc2626", "#3b82f6", "#f97316", "#6366f1"] },
  { z: 0, label: "ACTION \u2022 CLASSICS \u2022 FAMILY \u2022 ROMANCE", colors: ["#ef4444", "#ca8a04", "#22c55e", "#f43f5e"] },
  { z: 3, label: "THRILLER \u2022 ANIMATED \u2022 DOCS", colors: ["#7c3aed", "#06b6d4", "#65a30d"] },
];

function AisleSign({ z, label, colors }: { z: number; label: string; colors: string[] }) {
  return (
    <group position={[0, 0, z]}>
      {/* Hanging pole from ceiling */}
      <mesh position={[0, ROOM_H - 0.35, 0]}>
        <boxGeometry args={[0.02, 0.7, 0.02]} />
        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dark border frame (behind yellow sign) */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.3, 0.36, 0.02]} />
        <meshStandardMaterial color="#0a1830" roughness={0.6} />
      </mesh>
      {/* Sign body — Blockbuster yellow (in front of border) */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.2, 0.3, 0.03]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.5} />
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
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`;
    fetch(proxyUrl)
      .then(r => r.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          if (matRef.current) {
            const t = new THREE.Texture(img);
            t.colorSpace = THREE.SRGBColorSpace;
            t.needsUpdate = true;
            matRef.current.map = t;
            matRef.current.color.set("#ffffff");
            matRef.current.needsUpdate = true;
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      })
      .catch(() => {});
  }, [title]);

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[1.0, 1.4, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      {/* Poster art — in front of frame, facing into room */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} />
      </mesh>
      {/* Title below poster — room side only (no back label to avoid overlap) */}
      <Text position={[0, -0.8, 0.03]} fontSize={0.1} color="#ffffff" anchorX="center" font={undefined}>
        {title}
      </Text>
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
      {/* Main entrance rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#4a2030" roughness={0.95} />
      </mesh>
      {/* Carpet wear paths — darker strips along main aisles */}
      {/* Center aisle (main walkway) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[1.8, ROOM_D - 2]} />
        <meshStandardMaterial color="#222840" roughness={0.98} />
      </mesh>
      {/* Cross aisles between shelf rows */}
      {[-1.5, 1.5].map((z) => (
        <mesh key={`cross-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, z]}>
          <planeGeometry args={[ROOM_W - 6, 1.2]} />
          <meshStandardMaterial color="#242844" roughness={0.98} />
        </mesh>
      ))}
      {/* Path to counter area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.006, 4]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#252848" roughness={0.98} />
      </mesh>
    </group>
  );
}

function Baseboard({ pos, rot, width }: { pos: [number, number, number]; rot: [number, number, number]; width: number }) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={[width, 0.15, 0.05]} />
      <meshStandardMaterial color="#0a1428" roughness={0.8} />
    </mesh>
  );
}

export function Store({ isMobile }: { isMobile?: boolean }) {
  return (
    <group>
      {/* Floor — blue commercial carpet like Blockbuster */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#1a2248" roughness={0.95} />
      </mesh>
      {/* Entrance tile area — different floor near the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, ROOM_D / 2 - 1]}>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
      {/* Floor light pools */}
      {[-4, 0, 4].map((x, i) => (
        <mesh key={`fl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]}>
          <circleGeometry args={[3, 24]} />
          <meshStandardMaterial color="#1e2850" roughness={0.9} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={CEILING_COLOR} roughness={0.9} />
      </mesh>
      {/* Ceiling drop-tile grid */}
      {Array.from({ length: Math.floor(18 / 1.2) + 1 }, (_, i) => -9 + i * 1.2).map(x => (
        <mesh key={`cgx${x}`} position={[x, ROOM_H - 0.01, 0]}>
          <boxGeometry args={[0.02, 0.01, ROOM_D]} />
          <meshStandardMaterial color="#c0b8a8" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(12 / 1.2) + 1 }, (_, i) => -6 + i * 1.2).map(z => (
        <mesh key={`cgz${z}`} position={[0, ROOM_H - 0.01, z]}>
          <boxGeometry args={[ROOM_W, 0.01, 0.02]} />
          <meshStandardMaterial color="#c0b8a8" />
        </mesh>
      ))}

      {/* Walls */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[-6, ROOM_H / 2, ROOM_D / 2]}>
        <planeGeometry args={[8, ROOM_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[6, ROOM_H / 2, ROOM_D / 2]}>
        <planeGeometry args={[8, ROOM_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
      </mesh>

      {/* Baseboards */}
      <Baseboard pos={[0, 0.075, -ROOM_D / 2 + 0.025]} rot={[0, 0, 0]} width={ROOM_W} />
      <Baseboard pos={[-ROOM_W / 2 + 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />
      <Baseboard pos={[ROOM_W / 2 - 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />

      {/* Blockbuster-yellow accent stripes along all interior walls */}
      {/* Back wall stripe */}
      <mesh position={[0, 2.8, -ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[ROOM_W, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Front wall — left section */}
      <mesh position={[-6, 2.8, ROOM_D / 2 - 0.02]}>
        <boxGeometry args={[8, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Front wall — right section */}
      <mesh position={[6, 2.8, ROOM_D / 2 - 0.02]}>
        <boxGeometry args={[8, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Left wall stripe */}
      <mesh position={[-ROOM_W / 2 + 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Right wall stripe */}
      <mesh position={[ROOM_W / 2 - 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>

      {/* Fluorescent ceiling lights — tube fixtures with warm/cool zoning */}
      {[-6, -2, 2, 6].map((fx) => (
        <group key={fx}>
          {/* Back aisle fixtures (z=-1.5) — cool fluorescent */}
          <group position={[fx, ROOM_H - 0.04, -1.5]}>
            {/* Fixture housing */}
            <mesh>
              <boxGeometry args={[1.8, 0.05, 0.3]} />
              <meshStandardMaterial color="#d0d0c8" roughness={0.6} />
            </mesh>
            {/* Fluorescent tube — emissive */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[1.6, 0.03, 0.08]} />
              <meshStandardMaterial color="#f0f8ff" emissive="#e0e8ff" emissiveIntensity={1.5} />
            </mesh>
            {/* Reflector panel */}
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[1.7, 0.01, 0.25]} />
              <meshStandardMaterial color="#e8e8e0" metalness={0.3} roughness={0.2} />
            </mesh>
          </group>
          <pointLight position={[fx, ROOM_H - 0.3, -1.5]} color="#e0e8ff" intensity={6} distance={12} />
          <spotLight position={[fx, ROOM_H - 0.3, -1.5]} angle={0.6} penumbra={0.5} intensity={2.5} distance={6} color="#e0e8ff" />

          {/* Front aisle fixtures (z=2) — warm fluorescent near entrance/counter */}
          <group position={[fx, ROOM_H - 0.04, 2]}>
            {/* Fixture housing */}
            <mesh>
              <boxGeometry args={[1.8, 0.05, 0.3]} />
              <meshStandardMaterial color="#d0d0c8" roughness={0.6} />
            </mesh>
            {/* Fluorescent tube — warmer */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[1.6, 0.03, 0.08]} />
              <meshStandardMaterial color="#fff8e0" emissive="#fff4d0" emissiveIntensity={1.5} />
            </mesh>
            {/* Reflector panel */}
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[1.7, 0.01, 0.25]} />
              <meshStandardMaterial color="#e8e8e0" metalness={0.3} roughness={0.2} />
            </mesh>
          </group>
          <pointLight position={[fx, ROOM_H - 0.3, 2]} color="#fff4d0" intensity={6} distance={12} />
          <spotLight position={[fx, ROOM_H - 0.3, 2]} angle={0.6} penumbra={0.5} intensity={2.5} distance={6} color="#fff4d0" />
        </group>
      ))}
      {/* Middle row of fixtures (z=0) — neutral white */}
      {[-4, 0, 4].map((fx) => (
        <group key={`mid-${fx}`}>
          <group position={[fx, ROOM_H - 0.04, 0]}>
            <mesh>
              <boxGeometry args={[1.8, 0.05, 0.3]} />
              <meshStandardMaterial color="#d0d0c8" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[1.6, 0.03, 0.08]} />
              <meshStandardMaterial color="#f0f4e8" emissive="#f0f0e0" emissiveIntensity={1.3} />
            </mesh>
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[1.7, 0.01, 0.25]} />
              <meshStandardMaterial color="#e8e8e0" metalness={0.3} roughness={0.2} />
            </mesh>
          </group>
          <pointLight position={[fx, ROOM_H - 0.3, 0]} color="#f0eee0" intensity={5} distance={10} />
        </group>
      ))}
      {/* One flickering fluorescent light in back corner */}
      <FlickeringLight position={[2, ROOM_H - 0.3, -1.5]} />

      {/* Warm accent light near counter area */}
      <pointLight position={[7, ROOM_H - 0.5, 5]} color="#ffd080" intensity={3} distance={6} />

      {/* Ambient fill — bright fluorescent store */}
      <ambientLight intensity={1.6} color="#e8e4d8" />
      {/* Hemisphere light — warm ceiling, cool floor bounce */}
      <hemisphereLight args={["#fff4e0", "#3a4060", 1.0]} />

      {/* Shelves */}
      {SHELF_ROWS.map((s, i) => (
        <ShelfUnit key={i} x={s.x} z={s.z} genre={s.genre} color={s.color} isMobile={isMobile} />
      ))}

      {/* Hanging aisle signs */}
      {AISLE_SIGNS.map((sign, i) => (
        <AisleSign key={`aisle-${i}`} z={sign.z} label={sign.label} colors={sign.colors} />
      ))}

      {/* Endcap displays at end of each shelf row */}
      {ENDCAP_CONFIGS.map((cfg, i) => (
        <EndcapDisplay key={`endcap-${i}`} x={cfg.x} z={cfg.z} rotY={cfg.rotY} label={cfg.label} vhsColors={cfg.vhsColors} />
      ))}

      {/* Counter + Vinny */}
      <Counter />
      <VinnyCharacter />

      {/* NPCs — reduce to 2 on mobile for performance */}
      <NPCCustomer startPos={[-4, 0, -1.5]} shirtColor="#3498db" hairColor="#2a1a0a" skinTone="#d4a574" />
      <NPCCustomer startPos={[3, 0, 1.5]} shirtColor="#e74c3c" hairColor="#4a3020" skinTone="#c49a6c" />
      {!isMobile && <NPCCustomer startPos={[-1, 0, 3.5]} shirtColor="#27ae60" hairColor="#1a1a1a" skinTone="#e8c4a0" />}
      {!isMobile && <NPCCustomer startPos={[6, 0, -2]} shirtColor="#9b59b6" hairColor="#8b6914" skinTone="#d4a574" />}

      {/* New Releases wall display */}
      <NewReleasesWall />

      {/* Neon sign */}
      <NeonSign />

      {/* CRT TV with animated screen */}
      <TVScreen />

      {/* Wall posters — back wall */}
      {/* Back wall posters — flanking the new releases rack */}
      <WallPoster x={-7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#b91c1c" title="JAWS" />
      <WallPoster x={-9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#1d4ed8" title="ALIEN" />
      <WallPoster x={7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#7c3aed" title="BLADE RUNNER" />
      <WallPoster x={9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#059669" title="RAIDERS" />

      {/* Wall posters — side walls */}
      <WallPoster x={-ROOM_W / 2 + 0.05} y={2.0} z={-3} rotY={Math.PI / 2} color="#dc2626" title="THE SHINING" />
      <WallPoster x={-ROOM_W / 2 + 0.05} y={2.0} z={1} rotY={Math.PI / 2} color="#f59e0b" title="STAR WARS" />
      <WallPoster x={ROOM_W / 2 - 0.05} y={2.0} z={-2} rotY={-Math.PI / 2} color="#ec4899" title="BACK TO THE FUTURE" />
      <WallPoster x={ROOM_W / 2 - 0.05} y={2.0} z={2} rotY={-Math.PI / 2} color="#14b8a6" title="E.T." />

      {/* "BE KIND REWIND" sign on left wall */}
      <group position={[-ROOM_W / 2 + 0.12, 2.0, 2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.35, 0.03]} />
          <meshStandardMaterial color="#0a1a3a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>
          BE KIND, REWIND
        </Text>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>
          BE KIND, REWIND
        </Text>
        <pointLight position={[0, 0.3, 0.2]} color="#ffd700" intensity={0.5} distance={2} />
      </group>

      {/* "OPEN" neon near entrance */}
      <group position={[-4, 2.5, ROOM_D / 2 - 0.1]} rotation={[0, Math.PI, 0]}>
        <Text fontSize={0.2} color="#ff3e7a" anchorX="center" font={undefined}>
          OPEN
        </Text>
        <pointLight position={[0, 0, 0.3]} color="#ff3e7a" intensity={1.5} distance={4} />
      </group>

      {/* Store hours sign near door */}
      <group position={[4, 2.0, ROOM_D / 2 - 0.1]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.03]} />
          <meshStandardMaterial color="#0a1a3a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.2, 0.02]} fontSize={0.06} color="#ffffff" anchorX="center" font={undefined}>
          STORE HOURS
        </Text>
        <Text position={[0, -0.05, 0.02]} fontSize={0.05} color="#aaaaaa" anchorX="center" font={undefined}>
          MON-SAT 10AM-11PM
        </Text>
        <Text position={[0, -0.2, 0.02]} fontSize={0.05} color="#aaaaaa" anchorX="center" font={undefined}>
          SUN 11AM-9PM
        </Text>
      </group>

      {/* ── Storefront windows + night sky exterior ──────── */}
      {/* Night sky plane behind the front wall (visible through windows) */}
      <mesh position={[0, ROOM_H / 2, ROOM_D / 2 + 0.15]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshBasicMaterial color="#050a18" />
      </mesh>
      {/* Faint starfield dots on the sky plane */}
      {[[-3.5, 2.8], [-6.2, 2.1], [5.1, 2.9], [7.4, 1.8], [-1.5, 3.0], [2.8, 2.3], [-7, 3.1], [8.2, 2.6]].map(([sx, sy], i) => (
        <mesh key={`star${i}`} position={[sx, sy, ROOM_D / 2 + 0.14]}>
          <circleGeometry args={[0.03, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Moon glow */}
      <mesh position={[6, 3.0, ROOM_D / 2 + 0.13]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="#d4d8f0" />
      </mesh>
      <pointLight position={[6, 3.0, ROOM_D / 2 + 0.5]} color="#8090c0" intensity={2} distance={8} />
      {/* Parking lot ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, ROOM_D / 2 + 1]}>
        <planeGeometry args={[ROOM_W + 4, 3]} />
        <meshBasicMaterial color="#1a1a20" />
      </mesh>
      {/* Parking lot lamp posts */}
      {[-6, 0, 6].map((lx, i) => (
        <group key={`lamp-${i}`} position={[lx, 0, ROOM_D / 2 + 2]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 3, 8]} />
            <meshBasicMaterial color="#444" />
          </mesh>
          <pointLight position={[0, 3, 0]} color="#ffaa55" intensity={1.5} distance={5} />
          <mesh position={[0, 3.1, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.15]} />
            <meshBasicMaterial color="#555" />
          </mesh>
        </group>
      ))}

      {/* Left storefront window (x = -5, between wall edge and door gap) */}
      <mesh position={[-5, ROOM_H / 2, ROOM_D / 2 + 0.01]}>
        <planeGeometry args={[5.5, ROOM_H - 0.5]} />
        <meshStandardMaterial
          color="#8ab8dd"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left window frame strips */}
      <mesh position={[-2.2, ROOM_H / 2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[0.06, ROOM_H - 0.4, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-7.8, ROOM_H / 2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[0.06, ROOM_H - 0.4, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-5, ROOM_H - 0.2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-5, 0.3, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Right storefront window (x = 5, between door gap and wall edge) */}
      <mesh position={[5, ROOM_H / 2, ROOM_D / 2 + 0.01]}>
        <planeGeometry args={[5.5, ROOM_H - 0.5]} />
        <meshStandardMaterial
          color="#8ab8dd"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Right window frame strips */}
      <mesh position={[2.2, ROOM_H / 2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[0.06, ROOM_H - 0.4, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[7.8, ROOM_H / 2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[0.06, ROOM_H - 0.4, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[5, ROOM_H - 0.2, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[5, 0.3, ROOM_D / 2 + 0.02]}>
        <boxGeometry args={[5.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Awning above entrance — blue/yellow canopy */}
      <mesh position={[0, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[5, 0.06, 1.2]} />
        <meshStandardMaterial color="#1a3a8a" roughness={0.7} />
      </mesh>
      {/* Yellow accent stripe on awning */}
      <mesh position={[0, ROOM_H + 0.02, ROOM_D / 2 + 0.7]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[5, 0.03, 0.25]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.6} />
      </mesh>
      {/* Awning underside light */}
      <pointLight position={[0, ROOM_H - 0.1, ROOM_D / 2 + 0.4]} color="#ffd080" intensity={1.5} distance={4} />

      {/* Floor rug near entrance */}
      <FloorRug />

      {/* Welcome mat — raised above floor to prevent z-fighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, ROOM_D / 2 - 0.5]}>
        <planeGeometry args={[2, 1]} />
        <meshStandardMaterial color="#4a2020" roughness={0.95} />
      </mesh>

      {/* ── Entrance door ──────────────────────────────────── */}
      <group position={[0, 0, ROOM_D / 2 - 0.05]}>
        {/* Glass panel */}
        <mesh position={[0, 1.4, 0]}>
          <planeGeometry args={[2, 2.8]} />
          <meshStandardMaterial color="#a0c0e0" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
        {/* Metal frame — left */}
        <mesh position={[-1.02, 1.4, 0]}>
          <boxGeometry args={[0.04, 2.84, 0.04]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Metal frame — right */}
        <mesh position={[1.02, 1.4, 0]}>
          <boxGeometry args={[0.04, 2.84, 0.04]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Metal frame — top */}
        <mesh position={[0, 2.82, 0]}>
          <boxGeometry args={[2.08, 0.04, 0.04]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Metal frame — bottom */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[2.08, 0.04, 0.04]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, -0.03]}>
          <boxGeometry args={[1.6, 0.06, 0.04]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* "PUSH" text on glass — facing inside */}
        <Text position={[0, 1.8, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          PUSH
        </Text>
      </group>

      {/* Candy/snack rack near counter */}
      <mesh position={[6, 0.7, 5]}>
        <boxGeometry args={[0.8, 1.4, 0.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
      {/* Colorful candy boxes on rack */}
      {[[-0.2, 0.3], [0, 0.3], [0.2, 0.3], [-0.15, 0.1], [0.1, 0.1]].map(([dx, dy], i) => (
        <mesh key={`candy${i}`} position={[6 + dx, 0.7 + dy, 4.78]}>
          <boxGeometry args={[0.12, 0.15, 0.02]} />
          <meshStandardMaterial color={["#ef4444","#3b82f6","#f59e0b","#22c55e","#a855f7"][i]} roughness={0.5} />
        </mesh>
      ))}

      {/* Security pillars at entrance */}
      <mesh position={[-1.2, 0.75, ROOM_D / 2 - 0.5]}>
        <boxGeometry args={[0.15, 1.5, 0.08]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.6} />
      </mesh>
      <mesh position={[1.2, 0.75, ROOM_D / 2 - 0.5]}>
        <boxGeometry args={[0.15, 1.5, 0.08]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.6} />
      </mesh>
      {/* Red LED indicators on top */}
      <mesh position={[-1.2, 1.55, ROOM_D / 2 - 0.5]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.2, 1.55, ROOM_D / 2 - 0.5]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Wall clock near counter */}
      <group position={[ROOM_W / 2 - 0.1, 2.8, 4]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <circleGeometry args={[0.25, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <cylinderGeometry args={[0.27, 0.27, 0.04, 24]} />
          <meshStandardMaterial color="#333" roughness={0.5} />
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

      {/* Promotional cardboard standee near entrance */}
      <group position={[3, 0.9, ROOM_D / 2 - 2]}>
        <mesh>
          <boxGeometry args={[0.6, 1.8, 0.03]} />
          <meshStandardMaterial color="#c0a080" roughness={0.8} />
        </mesh>
        {/* Standee support triangle behind */}
        <mesh position={[0, -0.5, 0.15]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.02]} />
          <meshStandardMaterial color="#a08060" roughness={0.8} />
        </mesh>
        <Text position={[0, 0.5, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#1a1a1a" anchorX="center" font={undefined}>
          COMING SOON
        </Text>
        <Text position={[0, 0.2, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#333" anchorX="center" font={undefined}>
          ASK VINNY
        </Text>
      </group>

      {/* Drop box near entrance */}
      <mesh position={[-3, 0.5, ROOM_D / 2 - 1]}>
        <boxGeometry args={[1.0, 1.0, 0.6]} />
        <meshStandardMaterial color="#1a3a6a" roughness={0.7} />
      </mesh>
      {/* RETURNS label — toward store interior (-z side) */}
      <Text position={[-3, 1.1, ROOM_D / 2 - 1.32]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#ffd700" anchorX="center" font={undefined}>
        RETURNS
      </Text>
      {/* RETURNS label — on top of box */}
      <Text position={[-3, 1.05, ROOM_D / 2 - 1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>
        RETURNS
      </Text>

      {/* Bulletin board on left wall */}
      <group position={[-ROOM_W / 2 + 0.08, 1.6, 4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial color="#7a5a30" roughness={0.85} />
        </mesh>
        {/* Sticky notes */}
        {[[-0.3, 0.15, "#ffd700"], [0.1, 0.2, "#ef4444"], [-0.15, -0.1, "#22c55e"], [0.25, -0.05, "#3b82f6"]].map(([dx, dy, c], i) => (
          <mesh key={`note${i}`} position={[dx as number, dy as number, -0.03]} rotation={[0, 0, (i - 1.5) * 0.1]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial color={c as string} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── MOVIE NIGHT CHALLENGE BOARD ─────────────────────── */}
      <group position={[ROOM_W / 2 - 0.1, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}
        userData={{ interactType: "challenge", label: "Start Movie Night Challenge!" }}
      >
        {/* Board backing */}
        <mesh userData={{ interactType: "challenge", label: "Start Movie Night Challenge!" }}>
          <boxGeometry args={[1.4, 1.0, 0.04]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.5} />
        </mesh>
        {/* Neon border glow */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.5, 1.1, 0.01]} />
          <meshStandardMaterial color="#ff3e7a" emissive="#ff3e7a" emissiveIntensity={0.3} roughness={0.5} />
        </mesh>
        {/* Inner border */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[1.35, 0.95, 0.01]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.5} />
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
          Find 3 movies before time runs out!
        </Text>
        <Text position={[0, -0.2, 0.03]} fontSize={0.04} color="rgba(255,215,0,0.7)" anchorX="center" anchorY="middle" font={undefined}>
          Click here to start
        </Text>
        {/* Glow */}
        <pointLight position={[0, 0, 0.5]} color="#ff3e7a" intensity={1} distance={3} />
      </group>

      {/* ── ATMOSPHERE & DETAIL ──────────────────────────────── */}

      {/* Gumball machine near entrance */}
      <GumballMachine />

      {/* Security dome mirrors in ceiling corners */}
      <SecurityDome position={[-ROOM_W / 2 + 0.5, ROOM_H - 0.05, -ROOM_D / 2 + 0.5]} />
      <SecurityDome position={[ROOM_W / 2 - 0.5, ROOM_H - 0.05, ROOM_D / 2 - 0.5]} />

      {/* Neon accent strips under shelf top surfaces — genre colored glow */}
      {SHELF_ROWS.map((s, i) => (
        <ShelfNeonStrip key={`neon-${i}`} position={[s.x, 1.50, s.z]} color={s.color} />
      ))}

      {/* "EMPLOYEES ONLY" door on back wall */}
      <group position={[-9, 0, -ROOM_D / 2 + 0.06]}>
        {/* Door */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.9, 2.3, 0.04]} />
          <meshStandardMaterial color="#4a3020" roughness={0.8} />
        </mesh>
        {/* Door frame */}
        <mesh position={[-0.48, 1.15, 0]}>
          <boxGeometry args={[0.04, 2.4, 0.06]} />
          <meshStandardMaterial color="#3a2010" roughness={0.7} />
        </mesh>
        <mesh position={[0.48, 1.15, 0]}>
          <boxGeometry args={[0.04, 2.4, 0.06]} />
          <meshStandardMaterial color="#3a2010" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.37, 0]}>
          <boxGeometry args={[1.0, 0.04, 0.06]} />
          <meshStandardMaterial color="#3a2010" roughness={0.7} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.32, 1.0, 0.03]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#b8960a" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Sign */}
        <mesh position={[0, 1.7, 0.03]}>
          <boxGeometry args={[0.5, 0.15, 0.01]} />
          <meshStandardMaterial color="#cc2222" roughness={0.5} />
        </mesh>
        <Text position={[0, 1.7, 0.04]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          EMPLOYEES ONLY
        </Text>
      </group>

      {/* "LATE FEES" warning sign near checkout */}
      <group position={[ROOM_W / 2 - 0.1, 1.5, 3]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.6, 0.02]} />
          <meshStandardMaterial color="#0a1a3a" roughness={0.6} />
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
            <meshStandardMaterial color={sign.bg} roughness={0.5} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
            {sign.label}
          </Text>
        </group>
      ))}

      {/* VHS rewinder on counter */}
      <group position={[8.5, 1.08, 5.2]}>
        {/* Rewinder body */}
        <mesh>
          <boxGeometry args={[0.25, 0.08, 0.18]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.5} />
        </mesh>
        {/* VHS slot */}
        <mesh position={[0, 0.04, -0.04]}>
          <boxGeometry args={[0.2, 0.01, 0.12]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.4} />
        </mesh>
        {/* Power LED */}
        <mesh position={[0.08, 0.045, -0.09]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
        {/* "REWIND" label */}
        <Text position={[-0.02, 0.045, -0.091]} fontSize={0.015} color="#888" anchorX="center" font={undefined}>
          REWIND
        </Text>
      </group>

      {/* Magazine/rental guide rack near entrance */}
      <group position={[-2, 0, ROOM_D / 2 - 1.8]}>
        {/* Wire rack */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.5, 1.2, 0.15]} />
          <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.4} wireframe />
        </mesh>
        {/* Magazines/guides — colorful thin boxes */}
        {[0.9, 0.7, 0.5, 0.3].map((y, i) => (
          <mesh key={`mag-${i}`} position={[0, y, -0.05]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.35, 0.25, 0.01]} />
            <meshStandardMaterial color={["#ef4444", "#3b82f6", "#ffd700", "#22c55e"][i]} roughness={0.5} />
          </mesh>
        ))}
        {/* "FREE GUIDES" sign */}
        <Text position={[0, 1.25, -0.05]} fontSize={0.04} color="#ffd700" anchorX="center" font={undefined}>
          FREE RENTAL GUIDES
        </Text>
      </group>

      {/* Rope stanchion near counter queue area */}
      {[4.5, 5.5].map((qx) => (
        <group key={`stanch-${qx}`} position={[qx, 0, 3.5]}>
          {/* Post */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color="#b8960a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Base */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial color="#333" roughness={0.5} />
          </mesh>
          {/* Top ball */}
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#b8960a" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Velvet rope between stanchions */}
      <mesh position={[5, 0.8, 3.5]}>
        <cylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
        <meshStandardMaterial color="#8b0000" roughness={0.8} />
      </mesh>

      {/* "REWARDS MEMBER?" sign above counter */}
      <group position={[7.5, 2.8, 5]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 0.4, 0.03]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.2} roughness={0.5} />
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
          <meshStandardMaterial color="#6a3a1a" roughness={0.8} />
        </mesh>
        {/* Soil */}
        <mesh position={[0, 0.41, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 8]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
        </mesh>
        {/* Plant — simple sphere cluster */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#1a5a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, 0.85, 0.05]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#1a6a1a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.08, 0.8, -0.05]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#2a5a2a" roughness={0.8} />
        </mesh>
      </group>

      {/* Trash can near entrance */}
      <group position={[-1.5, 0, ROOM_D / 2 - 1]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.13, 0.6, 8]} />
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </mesh>
        {/* Rim */}
        <mesh position={[0, 0.61, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 8]} />
          <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

    </group>
  );
}
