"use client";

import React, { useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import { hasProp, PROPS } from "@/lib/game-state";
import { getObjectById } from "@/lib/store-layout";
import { ROOM_W } from "./store-constants";
import { Mat, PosterBox } from "./store-materials";

// ── Recent Returns Stack ──
export function RecentReturnsStack({
  movies,
}: {
  movies: Array<{ id: number; title: string; posterUrl: string; genre: string; slotKey?: string }>;
}) {
  const counter = getObjectById("counter");
  if (!counter || movies.length === 0) return null;

  // Returns stack on the counter end — no separate desk
  return (
    <group position={[counter.x - 2.2, 0.92, counter.z]} rotation={[0, -0.1, 0]}>
      {movies.slice(0, 4).map((movie, index) => (
        <PosterBox
          key={`recent-return-${movie.slotKey ?? movie.id}`}
          url={movie.posterUrl}
          position={[-0.24 + (index % 2) * 0.24, 0.17 + Math.floor(index / 2) * 0.02, -0.18 + Math.floor(index / 2) * 0.2]}
          rotation={Math.PI * 0.96}
          movieTitle={movie.title}
          movieId={movie.id}
          genreColor="#d4a514"
          slotKey={movie.slotKey}
          hideWithSlotKey={false}
        />
      ))}
    </group>
  );
}

// ── Trophy Shelf ──
const RARITY_COLORS: Record<string, string> = { legendary: "#ffd700", rare: "#a855f7", uncommon: "#06b6d4" };

export function TrophyShelf() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  useEffect(() => {
    const checkProps = () => { const newSet = new Set<string>(); for (const p of PROPS) { if (hasProp(p.id)) newSet.add(p.id); } setUnlocked(newSet); };
    checkProps(); const iv = setInterval(checkProps, 5000); return () => clearInterval(iv);
  }, []);
  const COL_SPACING = 0.4;
  const TIER_YS = [0.3, 0.8, 1.3];
  return (
    <group position={[getObjectById("trophy-shelf")?.x ?? (ROOM_W / 2 - 0.3), 0, getObjectById("trophy-shelf")?.z ?? -4]} rotation={[0, -Math.PI / 2, 0]} userData={{ interactType: "trophy", label: "View Collection" }}>
      <mesh position={[0, 0.85, -0.06]}><boxGeometry args={[2.5, 1.7, 0.04]} /><Mat color="#3a2010" roughness={0.85} /></mesh>
      {TIER_YS.map((y, i) => (<mesh key={`shelf-${i}`} position={[0, y - 0.08, 0]}><boxGeometry args={[2.5, 0.04, 0.25]} /><Mat color="#5a3a1a" roughness={0.7} /></mesh>))}
      <mesh position={[0, 1.72, 0]}><boxGeometry args={[2.5, 0.04, 0.25]} /><Mat color="#5a3a1a" roughness={0.7} /></mesh>
      {[-1.25, 1.25].map((x, i) => (<mesh key={`side-${i}`} position={[x, 0.85, 0]}><boxGeometry args={[0.04, 1.7, 0.25]} /><Mat color="#4a2a14" roughness={0.8} /></mesh>))}
      <group position={[0, 1.88, 0]}><mesh><boxGeometry args={[1.6, 0.22, 0.04]} /><Mat color="#1a1a2e" roughness={0.6} /></mesh><Text position={[0, 0, 0.03]} fontSize={0.1} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>COLLECTION</Text></group>
      {PROPS.map((prop, idx) => {
        const col = idx % 5; const row = Math.floor(idx / 5);
        const x = (col - 2) * COL_SPACING; const y = TIER_YS[row];
        const isUnlocked = unlocked.has(prop.id);
        return (
          <group key={prop.id} position={[x, y, 0]}>
            {isUnlocked ? (<><mesh position={[0, 0, 0]}><boxGeometry args={[0.18, 0.06, 0.18]} /><Mat color={RARITY_COLORS[prop.rarity] || "#888888"} emissive={RARITY_COLORS[prop.rarity] || "#888888"} emissiveIntensity={0.15} roughness={0.4} metalness={0.3} /></mesh><Text position={[0, 0.14, 0.02]} fontSize={0.15} anchorX="center" anchorY="middle" font={undefined}>{prop.emoji}</Text><Text position={[0, -0.06, 0.02]} fontSize={0.04} color="#cccccc" anchorX="center" anchorY="middle" font={undefined} maxWidth={0.35}>{prop.name}</Text></>) : (<><mesh position={[0, 0.075, 0]}><boxGeometry args={[0.15, 0.15, 0.15]} /><Mat color="#1a1a1a" roughness={0.9} /></mesh><Text position={[0, 0.075, 0.08]} fontSize={0.08} color="#555555" anchorX="center" anchorY="middle" font={undefined}>?</Text></>)}
          </group>
        );
      })}
    </group>
  );
}
