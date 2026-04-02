"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { hasProp, PROPS } from "@/lib/game-state";
import { playSFX } from "@/lib/audio";
import { getObjectById } from "@/lib/store-layout";
import { LayoutDrivenPrefabs } from "./prefabs";

// ── Module imports ──
import { ROOM_W, ROOM_D, ROOM_H, WALL_COLOR, FLOOR_COLOR, CEILING_COLOR, SHELF_COLOR } from "./store-constants";
import { Mat, PosterBox, setEraYears, getShelfMovies, setHeldMovieIds, setHeldMovieSlotKeys } from "./store-materials";
import { StaffPicksShelf } from "./store-shelves";
import { CharlieCharacter, VinnyCharacter, KenneyModel } from "./store-characters";
import { NPCManager } from "./NPCManager";
import { AnimatedEntranceDoor, AnimatedEmployeeDoor, Baseboard } from "./store-walls";

// Re-export for external consumers
export { setEraYears, getShelfMovies };

function eraYearsToId(years?: string): string {
  if (!years) return "early90s";
  if (years.startsWith("1987") || years.startsWith("1988") || years.startsWith("1989")) return "late80s";
  if (years.startsWith("1990")) return "early90s";
  if (years.startsWith("1994")) return "mid90s";
  if (years.startsWith("1997")) return "late90s";
  if (years.startsWith("202")) return "present";
  return "early90s";
}

// ── Neon sign ──
function NeonSign() {
  const pos = getObjectById("neon-sign");
  return (
    <group position={[pos?.x ?? 0, pos?.y ?? 3.1, pos?.z ?? (-ROOM_D / 2 + 0.15)]}>
      <mesh position={[0, 0, -0.01]}><boxGeometry args={[5.8, 0.4, 0.03]} /><Mat color="#0a0a18" roughness={0.5} /></mesh>
      <Text position={[0, 0, 0.02]} fontSize={0.2} color="#ffd700" anchorX="center" font={undefined}>FRIDAY NIGHT VIDEO<meshBasicMaterial color="#ffd700" toneMapped={false} /></Text>
    </group>
  );
}

// ── Aisle signs — show genres in each row ──
const AISLE_SIGNS: { z: number; label: string; colors: string[] }[] = [
  { z: -4.2, label: "ACTION/ADVENTURE \u2022 COMEDY \u2022 HORROR \u2022 DRAMA", colors: [] },
  { z: -1.5, label: "THRILLER \u2022 ROMANCE \u2022 SCI-FI & FANTASY \u2022 KIDS & FAMILY", colors: [] },
  { z: 1, label: "MUSICALS \u2022 CLASSICS \u2022 SCI-FI & FANTASY", colors: [] },
];

function AisleSign({ z, label }: { z: number; label: string; colors: string[] }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, ROOM_H - 0.45, 0]}><boxGeometry args={[0.02, 0.9, 0.02]} /><Mat color="#888888" metalness={0.5} roughness={0.3} /></mesh>
      {/* Blockbuster blue background with yellow border */}
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[6.2, 0.36, 0.02]} /><Mat color="#ffd700" roughness={0.5} /></mesh>
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[6.1, 0.3, 0.03]} /><Mat color="#00006e" roughness={0.5} /></mesh>
      <Text position={[0, 2.6, 0.025]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{label}</Text>
      <Text position={[0, 2.6, -0.025]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{label}</Text>
    </group>
  );
}

function AisleFloorMarkings() {
  return null;
}


function FloorRug() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 5.2]}><planeGeometry args={[3.4, 2.4]} /><Mat color="#ffd700" roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 5.2]}><planeGeometry args={[3, 2]} /><Mat color="#0a1830" roughness={0.95} /></mesh>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 5.2]} fontSize={0.18} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>FRIDAY NIGHT VIDEO</Text>
    </group>
  );
}

function RecentReturnsStack({
  movies,
}: {
  movies: Array<{ id: number; title: string; posterUrl: string; genre: string; slotKey?: string }>;
}) {
  const bin = getObjectById("return-bin");
  if (!bin || movies.length === 0) return null;

  return (
    <group position={[bin.x - 0.9, 0.98, bin.z - 0.05]} rotation={[0, -0.2, 0]}>
      <mesh position={[0.1, -0.02, 0.02]}>
        <boxGeometry args={[1.05, 0.08, 0.62]} />
        <Mat color="#5a3a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.18, 0.28]}>
        <boxGeometry args={[0.86, 0.18, 0.04]} />
        <Mat color="#ffd700" roughness={0.45} />
      </mesh>
      <Text position={[0.1, 0.18, 0.31]} fontSize={0.05} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>
        RECENT RETURNS
      </Text>
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

function TrophyShelf() {
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

export function Store({
  isMobile,
  eraYears,
  heldMovieIds = [],
  heldMovieSlotKeys = [],
  recentReturnMovies = [],
  maxNpcs = 5,
  topDown = false,
}: {
  isMobile?: boolean;
  eraYears?: string;
  heldMovieIds?: number[];
  heldMovieSlotKeys?: string[];
  recentReturnMovies?: Array<{ id: number; title: string; posterUrl: string; genre: string; slotKey?: string }>;
  maxNpcs?: number;
  topDown?: boolean;
}) {
  useEffect(() => { if (eraYears) setEraYears(eraYears); }, [eraYears]);
  useEffect(() => { setHeldMovieIds(heldMovieIds); }, [heldMovieIds]);
  useEffect(() => { setHeldMovieSlotKeys(heldMovieSlotKeys); }, [heldMovieSlotKeys]);

  const { camera } = useThree();
  const [entranceDoorOpen, setEntranceDoorOpen] = useState(false);
  const prevEntranceDoorOpen = useRef(false);

  useFrame(() => {
    const near = camera.position.z > ROOM_D / 2 - 3 && camera.position.z < ROOM_D / 2 + 2;
    if (near !== entranceDoorOpen) setEntranceDoorOpen(near);
  });

  useEffect(() => {
    if (entranceDoorOpen && !prevEntranceDoorOpen.current) playSFX("door_chime");
    prevEntranceDoorOpen.current = entranceDoorOpen;
  }, [entranceDoorOpen]);

  return (
    <group>
      {/* ── FLOOR ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[ROOM_W, ROOM_D]} /><Mat color={FLOOR_COLOR} roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, ROOM_D / 2 - 1]}><planeGeometry args={[6, 2]} /><Mat color="#3a3a3a" roughness={0.8} /></mesh>

      {/* ── CEILING (hidden in top-down view) ── */}
      {!topDown && <>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}><planeGeometry args={[ROOM_W, ROOM_D]} /><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H - 0.02, ROOM_D / 2]}><planeGeometry args={[ROOM_W + 2, 2]} /><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>
      {/* Ceiling grid — sparse for perf */}
      {[-6, -2, 2, 6].map(x => (<mesh key={`cgx${x}`} position={[x, ROOM_H - 0.03, 0]}><boxGeometry args={[0.02, 0.01, ROOM_D]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}
      {[-4, 0, 4].map(z => (<mesh key={`cgz${z}`} position={[0, ROOM_H - 0.03, z]}><boxGeometry args={[ROOM_W, 0.01, 0.02]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}
      </>}

      {/* ── WALLS ── */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]}><planeGeometry args={[ROOM_W, ROOM_H]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[-6, 0.15, ROOM_D / 2]}><planeGeometry args={[8, 0.3]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-6, 3.0, ROOM_D / 2]}><planeGeometry args={[8, 1.0]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-9.5, 1.4, ROOM_D / 2]}><planeGeometry args={[1, 2.2]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[6, 0.15, ROOM_D / 2]}><planeGeometry args={[8, 0.3]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[6, 3.0, ROOM_D / 2]}><planeGeometry args={[8, 1.0]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[9.5, 1.4, ROOM_D / 2]}><planeGeometry args={[1, 2.2]} /><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, -6.345]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.31, ROOM_H]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[-ROOM_W / 2, (2.35 + ROOM_H) / 2, -5.19]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.0, ROOM_H - 2.35]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 1.155]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[11.69, ROOM_H]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[ROOM_D, ROOM_H]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>

      <Baseboard pos={[0, 0.075, -ROOM_D / 2 + 0.025]} rot={[0, 0, 0]} width={ROOM_W} />
      <Baseboard pos={[-ROOM_W / 2 + 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />
      <Baseboard pos={[ROOM_W / 2 - 0.025, 0.075, 0]} rot={[0, Math.PI / 2, 0]} width={ROOM_D} />

      {/* Yellow accent stripes */}
      <mesh position={[0, 2.8, -ROOM_D / 2 + 0.06]}><boxGeometry args={[ROOM_W, 0.06, 0.02]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>
      <mesh position={[-6, 2.8, ROOM_D / 2 - 0.02]}><boxGeometry args={[8, 0.06, 0.02]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>
      <mesh position={[6, 2.8, ROOM_D / 2 - 0.02]}><boxGeometry args={[8, 0.06, 0.02]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>
      <mesh position={[-ROOM_W / 2 + 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[ROOM_D, 0.06, 0.02]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>
      <mesh position={[ROOM_W / 2 - 0.02, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[ROOM_D, 0.06, 0.02]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>

      {/* ── LIGHTING (minimal for performance) ── */}
      <ambientLight intensity={1.1} color="#f0eadc" />
      <hemisphereLight args={["#fff6e4", "#4a5070", 0.6]} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#fff1dc" />
      <directionalLight position={[-3, 6, -8]} intensity={0.3} color="#c8d4e8" />

      {/* Fluorescent ceiling fixtures (hidden in top-down) */}
      {!topDown && <>
      {[-6, -2, 2, 6].map((fx) => (<group key={fx}><group position={[fx, ROOM_H - 0.04, -1.5]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group><group position={[fx, ROOM_H - 0.04, 2]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group></group>))}
      {[-4, 0, 4].map((fx) => (<group key={`mid-${fx}`} position={[fx, ROOM_H - 0.04, 0]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group>))}
      {[-4.5, -0.5, 3.5].map((fx) => (<group key={`front-${fx}`} position={[fx, ROOM_H - 0.04, 4.9]}><mesh><boxGeometry args={[1.65, 0.05, 0.28]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.45, 0.03, 0.08]} /><meshBasicMaterial color="#fff6dd" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.55, 0.01, 0.22]} /><Mat color="#ece8da" roughness={0.22} /></mesh></group>))}
      </>}

      {AISLE_SIGNS.map((sign, i) => (<AisleSign key={`aisle-${i}`} z={sign.z} label={sign.label} colors={sign.colors} />))}
      <AisleFloorMarkings />

      {/* ── COUNTER + CHARACTERS ── */}
      <VinnyCharacter />
      <NPCManager isMobile={isMobile ?? false} eraId={eraYearsToId(eraYears)} />
      <CharlieCharacter />
      <StaffPicksShelf />
      <NeonSign />

      {/* Employees only door */}
      <group position={[-ROOM_W / 2 + 0.07, 0, getObjectById("employees-door")?.z ?? -5.19]} rotation={[0, Math.PI / 2, 0]}>
        <AnimatedEmployeeDoor open={false}>
          <group userData={{ interactType: "employees_door", label: "Employees Only" }}>
            <mesh position={[0, 1.15, 0]}><boxGeometry args={[0.9, 2.3, 0.04]} /><Mat color="#4a3020" roughness={0.8} /></mesh>
            <mesh position={[0.32, 1.0, 0.03]}><sphereGeometry args={[0.04, 8, 8]} /><Mat color="#b8960a" roughness={0.3} metalness={0.6} /></mesh>
            <mesh position={[0, 1.7, 0.03]}><boxGeometry args={[0.5, 0.15, 0.01]} /><Mat color="#cc2222" roughness={0.5} /></mesh>
            <Text position={[0, 1.7, 0.04]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>EMPLOYEES ONLY</Text>
          </group>
        </AnimatedEmployeeDoor>
        <mesh position={[-0.48, 1.15, 0]}><boxGeometry args={[0.04, 2.4, 0.06]} /><Mat color="#3a2010" roughness={0.7} /></mesh>
        <mesh position={[0.48, 1.15, 0]}><boxGeometry args={[0.04, 2.4, 0.06]} /><Mat color="#3a2010" roughness={0.7} /></mesh>
        <mesh position={[0, 2.37, 0]}><boxGeometry args={[1.0, 0.04, 0.06]} /><Mat color="#3a2010" roughness={0.7} /></mesh>
      </group>

      <TrophyShelf />
      <LayoutDrivenPrefabs />
      <RecentReturnsStack movies={recentReturnMovies} />

      {/* Neon accent strips (removed — looked like weird colored bars) */}

      {/* ── EXTERIOR ── */}
      {/* Sky dome (hidden in top-down) */}
      {!topDown && <>
      {[{ pos: [0, 10, -30] as [number,number,number], rot: [0, 0, 0] as [number,number,number] },{ pos: [0, 10, 35] as [number,number,number], rot: [0, Math.PI, 0] as [number,number,number] },{ pos: [-35, 10, 0] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number] },{ pos: [35, 10, 0] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number] }].map((sky, i) => (<mesh key={`sky-${i}`} position={sky.pos} rotation={sky.rot}><planeGeometry args={[80, 30]} /><meshBasicMaterial color="#1a2a48" /></mesh>))}
      <mesh position={[0, 22, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshBasicMaterial color="#1a2a48" /></mesh>
      {Array.from({ length: 15 }).map((_, i) => (<mesh key={`star-${i}`} position={[(Math.sin(i * 7.3) * 25), 5 + Math.abs(Math.sin(i * 3.7)) * 12, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.06, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>))}
      <mesh position={[12, 14, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[1.0, 16]} /><meshBasicMaterial color="#d8dce8" /></mesh>
      <mesh position={[12.3, 14.2, 33.9]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.7, 16]} /><meshBasicMaterial color="#c0c4d0" /></mesh>
      </>}

      {/* Parking lot — full strip mall width (Pizza Palace to Laundromat) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, ROOM_D / 2 + 5]}><planeGeometry args={[36, 14]} /><meshBasicMaterial color="#2a2a40" /></mesh>
      {/* Sidewalk — runs full length in front of all three businesses */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, ROOM_D / 2 + 0.8]}><planeGeometry args={[36, 1.5]} /><meshBasicMaterial color="#4a4a4a" /></mesh>
      {/* Curb edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, ROOM_D / 2 + 0.5]}><planeGeometry args={[36, 1.5]} /><meshBasicMaterial color="#2a2520" /></mesh>
      {/* Parking lines — spread across full lot */}
      {[-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15].map((px, i) => (<mesh key={`pline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, -0.035, ROOM_D / 2 + 6]}><planeGeometry args={[0.06, 4]} /><meshBasicMaterial color="#555555" /></mesh>))}

      {/* Fascia + signage (hidden in top-down) */}
      {!topDown && <>
      <mesh position={[0, ROOM_H + 0.8, ROOM_D / 2 + 0.22]}><boxGeometry args={[ROOM_W + 12, 2.0, 0.3]} /><meshBasicMaterial color="#1a1a28" /></mesh>

      {/* Roof line */}
      <mesh position={[0, ROOM_H + 1.2, ROOM_D / 2 - 0.12]}><boxGeometry args={[ROOM_W + 12, 0.15, 0.8]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      <mesh position={[0, ROOM_H + 1.1, ROOM_D / 2 + 0.27]}><boxGeometry args={[ROOM_W + 12.2, 0.08, 0.05]} /><meshBasicMaterial color="#444450" /></mesh>
      <group position={[0, ROOM_H + 1.35, ROOM_D / 2 + 0.15]}><mesh><boxGeometry args={[3.5, 0.35, 0.05]} /><meshBasicMaterial color="#222230" /></mesh><Text position={[0, 0, 0.035]} fontSize={0.16} color="#888899" anchorX="center" anchorY="middle">1987 STRIP MALL PLAZA<meshBasicMaterial color="#888899" toneMapped={false} /></Text></group>
      </>}

      {/* ── PIZZA PALACE — walkable interior ── */}
      <group position={[-13, 0, 5.5]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[6, 5]} /><meshBasicMaterial color="#4a3020" side={THREE.DoubleSide} /></mesh>
        {/* Checkerboard tiles */}
        {Array.from({ length: 6 }).map((_, ix) => Array.from({ length: 5 }).map((_, iz) => (
          (ix + iz) % 2 === 0 ? <mesh key={`tile-${ix}-${iz}`} rotation={[-Math.PI / 2, 0, 0]} position={[-2.5 + ix, 0.012, -2 + iz]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#5a3a28" side={THREE.DoubleSide} /></mesh> : null
        )))}
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}><planeGeometry args={[6, 5]} /><meshBasicMaterial color="#8a7a6a" side={THREE.DoubleSide} /></mesh>
        {/* Walls — use thin boxes so they're visible from both sides */}
        {/* Back wall (z=-2.5) */}
        <mesh position={[0, ROOM_H / 2, -2.5]}><boxGeometry args={[6, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        {/* Left wall (x=-3) */}
        <mesh position={[-3, ROOM_H / 2, 0]}><boxGeometry args={[0.1, ROOM_H, 5]} /><meshBasicMaterial color="#7a1818" /></mesh>
        {/* Right wall omitted — video store's left wall serves as divider */}

        {/* Front wall with door gap */}
        <mesh position={[-1.7, ROOM_H / 2, 1.5]}><boxGeometry args={[2.6, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        <mesh position={[1.9, ROOM_H / 2, 1.5]}><boxGeometry args={[2.2, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        {/* Above door */}
        <mesh position={[-0.3, 2.6, 1.5]}><boxGeometry args={[1.4, 0.9, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>

        {/* Counter — pizza display case */}
        <mesh position={[0, 0.5, -1.5]}><boxGeometry args={[4, 1, 0.8]} /><Mat color="#5a3a20" roughness={0.7} /></mesh>
        <mesh position={[0, 1.02, -1.5]}><boxGeometry args={[4.1, 0.04, 0.85]} /><Mat color="#7a5a30" roughness={0.4} /></mesh>
        {/* Glass display on counter */}
        <mesh position={[0, 1.3, -1.5]}><boxGeometry args={[3, 0.5, 0.6]} /><Mat color="#aaddee" transparent opacity={0.2} /></mesh>
        {/* Pizza boxes inside */}
        {[-1, 0, 1].map((dx, i) => (
          <mesh key={`pizza-${i}`} position={[dx, 1.1, -1.5]}><boxGeometry args={[0.7, 0.08, 0.7]} /><meshBasicMaterial color={["#cc8833", "#dd9944", "#bb7722"][i]} /></mesh>
        ))}

        {/* Soda fountain */}
        <mesh position={[-2.5, 0.8, -1]}><boxGeometry args={[0.8, 1.6, 0.5]} /><Mat color="#333333" roughness={0.5} /></mesh>
        <Text position={[-2.5, 1.5, -0.74]} fontSize={0.08} color="#ff3333" anchorX="center" anchorY="middle" font={undefined}>DRINKS</Text>

        {/* Menu board on back wall */}
        <mesh position={[0, 2.5, -2.48]}><boxGeometry args={[3, 0.8, 0.04]} /><meshBasicMaterial color="#1a0a0a" /></mesh>
        <Text position={[0, 2.7, -2.45]} fontSize={0.12} color="#ffcc44" anchorX="center" anchorY="middle" font={undefined}>PIZZA PALACE</Text>
        <Text position={[-0.8, 2.4, -2.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>SLICE $1.50</Text>
        <Text position={[0, 2.4, -2.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PIE $8.99</Text>
        <Text position={[0.8, 2.4, -2.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>SODA $1</Text>

        {/* Booth seating along left wall */}
        {[-1, 0.5].map((dz, i) => (
          <group key={`booth-${i}`} position={[-2.6, 0, dz]}>
            {/* Bench */}
            <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.6, 0.7, 1.2]} /><Mat color="#8b1a1a" roughness={0.6} /></mesh>
            {/* Table */}
            <mesh position={[0.55, 0.55, 0]}><boxGeometry args={[0.6, 0.04, 1]} /><Mat color="#ddd8cc" roughness={0.4} /></mesh>
            <mesh position={[0.55, 0.27, 0]}><boxGeometry args={[0.04, 0.54, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
          </group>
        ))}

        {/* Ceiling light */}
        <mesh position={[0, ROOM_H - 0.05, 0]}><boxGeometry args={[1.5, 0.04, 0.3]} /><meshBasicMaterial color="#fffae8" /></mesh>
        <pointLight position={[0, ROOM_H - 0.2, 0]} intensity={0.8} distance={8} color="#fff4d0" />

        {/* Neon OPEN sign in window */}
        <group position={[1.5, 2, 1.48]}>
          <mesh><boxGeometry args={[0.7, 0.35, 0.03]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.14} color="#ff3366" anchorX="center" anchorY="middle" font={undefined}>OPEN</Text>
        </group>
      </group>

      {/* Pizza Palace exterior signage */}
      <group position={[-13, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}>
        <mesh><boxGeometry args={[5.5, 0.7, 0.05]} /><meshBasicMaterial color="#cc3333" /></mesh>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[5.3, 0.55, 0.02]} /><meshBasicMaterial color="#1a0a0a" /></mesh>
        <Text position={[0, 0, 0.05]} fontSize={0.28} color="#ff6666" anchorX="center" anchorY="middle">PIZZA PALACE<meshBasicMaterial color="#ff6666" toneMapped={false} /></Text>
      </group>
      {/* Red & white awning */}
      {Array.from({ length: 11 }).map((_, i) => (<mesh key={`pizza-awning-${i}`} position={[-16 + i * 0.55, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.55, 0.05, 0.8]} /><meshBasicMaterial color={i % 2 === 0 ? "#cc2222" : "#eeeeee"} /></mesh>))}
      {/* Pizza window (looking into shop) — proper glass + aluminum frame */}
      <group position={[-14.5, 1.4, ROOM_D / 2 + 0.17]}>
        {/* Glass pane */}
        <mesh><planeGeometry args={[2.2, 1.8]} /><Mat color="#a0c0e0" transparent opacity={0.18} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
        {/* Aluminum frame — top */}
        <mesh position={[0, 0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Aluminum frame — bottom */}
        <mesh position={[0, -0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Aluminum frame — left */}
        <mesh position={[-1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Aluminum frame — right */}
        <mesh position={[1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Center divider (vertical) */}
        <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.04, 1.8, 0.03]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
      </group>

      {/* Laundromat */}
      {/* ── LAUNDROMAT — walkable interior (x=10 to x=16, z=4.5 to z=7) ── */}
      <group position={[13, 0, 5.75]}>
        {/* Floor — linoleum look */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[6, 2.5]} /><meshBasicMaterial color="#b8c4b0" /></mesh>
        {/* Linoleum tile pattern */}
        {Array.from({ length: 6 }).map((_, ix) => Array.from({ length: 3 }).map((_, iz) => (
          (ix + iz) % 2 === 0 ? <mesh key={`laund-tile-${ix}-${iz}`} rotation={[-Math.PI / 2, 0, 0]} position={[-2.5 + ix, 0.012, -1 + iz]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#a8b8a0" /></mesh> : null
        )))}
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}><planeGeometry args={[6, 2.5]} /><meshBasicMaterial color="#d8d8e0" /></mesh>

        {/* Back wall (z=-1.25, maps to world z=4.5) */}
        <mesh position={[0, ROOM_H / 2, -1.25]}><planeGeometry args={[6, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        {/* Right wall (x=3, maps to world x=16) */}
        <mesh position={[3, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2.5, ROOM_H]} /><meshBasicMaterial color="#c0d0e0" /></mesh>

        {/* Front wall with door gap at x=0.5 (maps to world x=13.5) */}
        <mesh position={[-1.5, ROOM_H / 2, 1.25]}><planeGeometry args={[3, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        <mesh position={[2.15, ROOM_H / 2, 1.25]}><planeGeometry args={[1.7, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        <mesh position={[0.5, 2.7, 1.25]}><planeGeometry args={[1.3, 1.1]} /><meshBasicMaterial color="#c8d8e8" /></mesh>

        {/* ── Washing machines along back wall (5 units) ── */}
        {[-2, -1.2, -0.4, 0.4, 1.2].map((dx, i) => (
          <group key={`washer-int-${i}`} position={[dx, 0, -0.9]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.7, 1.0, 0.65]} /><Mat color="#e0e0e0" roughness={0.5} /></mesh>
            <mesh position={[0, 1.01, 0]}><boxGeometry args={[0.72, 0.02, 0.67]} /><Mat color="#cccccc" roughness={0.4} /></mesh>
            <mesh position={[0, 0.45, 0.33]}><circleGeometry args={[0.22, 20]} /><Mat color="#aabbcc" transparent opacity={0.4} roughness={0.05} metalness={0.3} /></mesh>
            <mesh position={[0, 0.45, 0.335]}><ringGeometry args={[0.2, 0.24, 20]} /><Mat color="#888888" roughness={0.3} metalness={0.5} /></mesh>
            <mesh position={[0, 0.85, 0.3]}><boxGeometry args={[0.5, 0.15, 0.04]} /><meshBasicMaterial color="#333344" /></mesh>
            <mesh position={[0.15, 0.85, 0.33]}><cylinderGeometry args={[0.03, 0.03, 0.03, 8]} /><Mat color="#cccccc" roughness={0.3} metalness={0.6} /></mesh>
          </group>
        ))}

        {/* ── Dryers on right wall (3 units) ── */}
        {[-0.8, -0.1, 0.6].map((dz, i) => (
          <group key={`dryer-${i}`} position={[2.65, 0, dz]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.65, 1.0, 0.65]} /><Mat color="#d8d0c8" roughness={0.5} /></mesh>
            <mesh position={[0, 1.01, 0]}><boxGeometry args={[0.67, 0.02, 0.67]} /><Mat color="#c8c0b8" roughness={0.4} /></mesh>
            <mesh position={[-0.33, 0.45, 0]} rotation={[0, -Math.PI / 2, 0]}><circleGeometry args={[0.22, 20]} /><Mat color="#99aabb" transparent opacity={0.35} roughness={0.05} metalness={0.3} /></mesh>
            <mesh position={[-0.335, 0.45, 0]} rotation={[0, -Math.PI / 2, 0]}><ringGeometry args={[0.2, 0.24, 20]} /><Mat color="#888888" roughness={0.3} metalness={0.5} /></mesh>
            <mesh position={[-0.3, 0.85, 0]}><boxGeometry args={[0.04, 0.15, 0.5]} /><meshBasicMaterial color="#333344" /></mesh>
          </group>
        ))}

        {/* ── Folding table in center ── */}
        <group position={[0, 0, 0.2]}>
          <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.5, 0.05, 0.9]} /><Mat color="#d0c8b8" roughness={0.6} /></mesh>
          {[[-1.15, -0.35], [-1.15, 0.35], [1.15, -0.35], [1.15, 0.35]].map(([lx, lz], i) => (
            <mesh key={`ftleg-${i}`} position={[lx, 0.4, lz]}><boxGeometry args={[0.04, 0.8, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
          ))}
          <mesh position={[-0.6, 0.88, 0]}><boxGeometry args={[0.4, 0.12, 0.3]} /><meshBasicMaterial color="#e8c8a8" /></mesh>
          <mesh position={[0.3, 0.88, 0.1]}><boxGeometry args={[0.35, 0.08, 0.25]} /><meshBasicMaterial color="#a8c8e8" /></mesh>
          <mesh position={[0.8, 0.88, -0.1]}><boxGeometry args={[0.3, 0.1, 0.3]} /><meshBasicMaterial color="#c8a8c8" /></mesh>
        </group>

        {/* ── Vending machine in back-right corner ── */}
        <group position={[2.5, 0, -0.9]}>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.8, 2.0, 0.65]} /><Mat color="#cc2222" roughness={0.5} /></mesh>
          <mesh position={[0, 1.2, 0.33]}><boxGeometry args={[0.6, 1.0, 0.02]} /><Mat color="#222222" transparent opacity={0.6} /></mesh>
          <Text position={[0, 1.85, 0.34]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>DRINKS</Text>
          <mesh position={[0.3, 1.0, 0.34]}><boxGeometry args={[0.08, 0.15, 0.02]} /><Mat color="#888888" roughness={0.3} metalness={0.6} /></mesh>
        </group>

        {/* ── Plastic chairs along left wall (3 chairs) ── */}
        {[-0.6, 0.1, 0.8].map((dz, i) => (
          <group key={`chair-${i}`} position={[-2.7, 0, dz]}>
            <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.4, 0.04, 0.4]} /><Mat color={["#d04020", "#2060c0", "#d0a020"][i]} roughness={0.6} /></mesh>
            <mesh position={[0.18, 0.7, 0]}><boxGeometry args={[0.04, 0.55, 0.38]} /><Mat color={["#d04020", "#2060c0", "#d0a020"][i]} roughness={0.6} /></mesh>
            {[[-0.15, -0.15], [-0.15, 0.15], [0.15, -0.15], [0.15, 0.15]].map(([cx, cz], j) => (
              <mesh key={`cleg-${j}`} position={[cx, 0.2, cz]}><cylinderGeometry args={[0.015, 0.015, 0.4, 6]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
            ))}
          </group>
        ))}

        {/* ── Bulletin board with flyers on back wall ── */}
        <group position={[2, 1.6, -1.23]}>
          <mesh><boxGeometry args={[1.0, 0.7, 0.04]} /><Mat color="#7a5a30" roughness={0.85} /></mesh>
          <mesh position={[0, 0, 0.025]}><boxGeometry args={[0.9, 0.6, 0.01]} /><Mat color="#c4a060" roughness={0.9} /></mesh>
          {[[-0.25, 0.12, "#ffd700", "LOST CAT"], [0.15, 0.15, "#ef4444", "YARD SALE"], [-0.1, -0.1, "#22c55e", "GUITAR\nLESSONS"], [0.25, -0.12, "#3b82f6", "APT FOR\nRENT"]].map(([dx, dy, c, txt], i) => (
            <group key={`flyer-${i}`} position={[dx as number, dy as number, 0.035]} rotation={[0, 0, (i - 1.5) * 0.08]}>
              <mesh><planeGeometry args={[0.22, 0.18]} /><meshBasicMaterial color={c as string} /></mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.03} color="#111111" anchorX="center" anchorY="middle" font={undefined}>{txt as string}</Text>
            </group>
          ))}
          {[[-0.25, 0.2], [0.15, 0.22], [-0.1, -0.02], [0.25, -0.04]].map(([px, py], i) => (
            <mesh key={`pin-${i}`} position={[px, py, 0.04]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color={["#ff0000", "#ffaa00", "#00cc00", "#0066ff"][i]} /></mesh>
          ))}
        </group>

        {/* ── Fluorescent ceiling lights (2 fixtures) ── */}
        {[-1, 1.2].map((fx) => (
          <group key={`laund-light-${fx}`} position={[fx, ROOM_H - 0.04, 0]}>
            <mesh><boxGeometry args={[1.5, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
            <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.3, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh>
            <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.4, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh>
          </group>
        ))}
        <pointLight position={[0, ROOM_H - 0.2, 0]} intensity={0.7} distance={8} color="#f0f4ff" />

        {/* Laundry detergent shelf on back wall */}
        <group position={[-1.5, 1.5, -1.23]}>
          <mesh><boxGeometry args={[1.2, 0.06, 0.3]} /><Mat color="#5a5a5a" roughness={0.5} /></mesh>
          {[-0.4, -0.15, 0.1, 0.35].map((bx, i) => (
            <mesh key={`det-${i}`} position={[bx, 0.15, 0]}><boxGeometry args={[0.18, 0.25, 0.12]} /><meshBasicMaterial color={["#ff6633", "#3366ff", "#33cc66", "#ff33cc"][i]} /></mesh>
          ))}
        </group>

        {/* "Out of Order" sign on one washer */}
        <group position={[-2, 1.15, -0.57]}>
          <mesh><boxGeometry args={[0.4, 0.15, 0.02]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <Text position={[0, 0, 0.015]} fontSize={0.04} color="#cc0000" anchorX="center" anchorY="middle" font={undefined}>OUT OF ORDER</Text>
        </group>

        {/* Laundry basket on floor */}
        <group position={[-1, 0, 0.6]}>
          <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.5, 0.5, 0.4]} /><Mat color="#4488cc" roughness={0.7} /></mesh>
          <mesh position={[0.1, 0.52, 0.05]}><boxGeometry args={[0.3, 0.08, 0.2]} /><meshBasicMaterial color="#e8a0a0" /></mesh>
        </group>
      </group>

      {/* Laundromat exterior signage */}
      <group position={[ROOM_W / 2 + 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}><mesh><boxGeometry args={[3.5, 0.6, 0.05]} /><meshBasicMaterial color="#0a0a1a" /></mesh><Text position={[0, 0, 0.035]} fontSize={0.24} color="#77ddff" anchorX="center" anchorY="middle">LAUNDROMAT<meshBasicMaterial color="#77ddff" toneMapped={false} /></Text><mesh position={[0, 0, -0.01]}><planeGeometry args={[3.8, 0.9]} /><meshBasicMaterial color="#3399cc" transparent opacity={0.08} /></mesh></group>
      <mesh position={[ROOM_W / 2 + 3, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[5.5, 0.05, 0.8]} /><meshBasicMaterial color="#113355" /></mesh>
      {/* Laundromat window — proper glass + aluminum frame */}
      <group position={[ROOM_W / 2 + 2, 1.4, ROOM_D / 2 + 0.17]}>
        <mesh><planeGeometry args={[2.2, 1.8]} /><Mat color="#a0c0e0" transparent opacity={0.18} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, -0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[-1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
      </group>
      <group position={[ROOM_W / 2 + 1.2, 2.0, ROOM_D / 2 + 0.25]}><mesh><boxGeometry args={[0.7, 0.35, 0.04]} /><meshBasicMaterial color="#111111" /></mesh><Text position={[0, 0, 0.03]} fontSize={0.16} color="#33ff66" anchorX="center" anchorY="middle">OPEN<meshBasicMaterial color="#33ff66" toneMapped={false} /></Text></group>

      {/* Curb */}
      <mesh position={[0, 0.05, ROOM_D / 2 + 1.5]}><boxGeometry args={[36, 0.1, 0.15]} /><meshBasicMaterial color="#555555" /></mesh>

      {/* Road — full width */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, ROOM_D / 2 + 13]}><planeGeometry args={[40, 6]} /><meshBasicMaterial color="#111116" /></mesh>
      {[-12, -8, -4, 0, 4, 8, 12].map((dx, i) => (<mesh key={`roadline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dx, -0.055, ROOM_D / 2 + 13]}><planeGeometry args={[1.5, 0.08]} /><meshBasicMaterial color="#555533" /></mesh>))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 13.05]}><planeGeometry args={[40, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 12.9]}><planeGeometry args={[40, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>

      {/* Storefront windows + doors + awning — keeping inline for build verification */}
      <mesh position={[0, ROOM_H - 0.25, ROOM_D / 2]}><boxGeometry args={[4, 0.7, 0.15]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      {/* Upper wall band above windows — from door frame (±1.7) to near side walls (±9.7) */}
      <mesh position={[-5.7, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[8, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>
      <mesh position={[5.7, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[8, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>
      <mesh position={[-5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[8, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[8, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[0, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[1.2, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      {/* Door frame pillars */}
      <mesh position={[-1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>
      {/* Glass windows — from door frame (1.7) to 1 unit inside side wall (9.3) */}
      <mesh position={[-5.5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[7.6, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[5.5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[7.6, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
      {/* Window sills */}
      <mesh position={[-5.5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[7.6, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>
      <mesh position={[5.5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[7.6, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>
      {/* Knee wall below windows — full width, seals corners */}
      <mesh position={[0, 0.13, ROOM_D / 2 - 0.01]}><boxGeometry args={[ROOM_W - 0.1, 0.26, 0.15]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>

      {/* Entrance — simple double glass doors with thin frame */}
      <AnimatedEntranceDoor side="left" doorOpen={entranceDoorOpen}>
        <mesh position={[0, 1.4, 0]}><planeGeometry args={[1.6, 2.7]} /><Mat color="#a0c0e0" transparent opacity={0.15} side={THREE.DoubleSide} /></mesh>
        {/* Thin aluminum border */}
        <mesh position={[0, 2.75, 0]}><boxGeometry args={[1.7, 0.05, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[1.7, 0.05, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[-0.85, 1.4, 0]}><boxGeometry args={[0.04, 2.7, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0.85, 1.4, 0]}><boxGeometry args={[0.04, 2.7, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.05, 0.03]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
      </AnimatedEntranceDoor>
      <AnimatedEntranceDoor side="right" doorOpen={entranceDoorOpen}>
        <mesh position={[0, 1.4, 0]}><planeGeometry args={[1.6, 2.7]} /><Mat color="#a0c0e0" transparent opacity={0.15} side={THREE.DoubleSide} /></mesh>
        {/* Thin aluminum border */}
        <mesh position={[0, 2.75, 0]}><boxGeometry args={[1.7, 0.05, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[1.7, 0.05, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[-0.85, 1.4, 0]}><boxGeometry args={[0.04, 2.7, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0.85, 1.4, 0]}><boxGeometry args={[0.04, 2.7, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.05, 0.03]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
      </AnimatedEntranceDoor>


      <FloorRug />

      {/* Security mirror */}
      <group position={[-9.2, 3.3, -6.2]}><mesh rotation={[Math.PI / 4, 0, 0]}><circleGeometry args={[0.45, 24]} /><Mat color="#c0c8d0" roughness={0.8} metalness={0.3} /></mesh><mesh position={[0, 0.15, 0.05]}><cylinderGeometry args={[0.06, 0.06, 0.15, 8]} /><Mat color="#444444" roughness={0.8} /></mesh></group>

      {/* Ceiling speaker */}
      <group position={[-3, ROOM_H - 0.05, 3]}><mesh><boxGeometry args={[0.35, 0.08, 0.35]} /><Mat color="#2a2a2a" roughness={0.6} /></mesh></group>

      {/* Welcome mat outside */}
      <mesh position={[0, 0.005, 6.3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.5, 1.2]} /><Mat color="#1a1a1a" roughness={0.8} /></mesh>
      <Text position={[0, 0.01, 6.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#333333" anchorX="center" font={undefined}>WELCOME</Text>

      {/* Welcome mat inside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, ROOM_D / 2 - 0.5]}><planeGeometry args={[2, 1]} /><Mat color="#4a2020" roughness={0.95} /></mesh>
    </group>
  );
}

useGLTF.preload('/models/sedan.glb');
useGLTF.preload('/models/van.glb');
useGLTF.preload('/models/suv.glb');
useGLTF.preload('/models/hatchback-sports.glb');
useGLTF.preload('/models/taxi.glb');
useGLTF.preload('/models/police.glb');
useGLTF.preload('/models/delivery.glb');
useGLTF.preload('/models/trashcan.glb');
;
useGLTF.preload('/models/televisionVintage.glb');
useGLTF.preload('/models/candy-bar.glb');
useGLTF.preload('/models/candy-bar-wrapper.glb');
useGLTF.preload('/models/chocolate.glb');
useGLTF.preload('/models/soda-can.glb');
useGLTF.preload('/models/soda-bottle.glb');
useGLTF.preload('/models/cookie-chocolate.glb');
