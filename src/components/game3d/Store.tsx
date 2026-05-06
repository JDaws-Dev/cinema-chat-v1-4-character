"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { hasProp, PROPS } from "@/lib/game-state";
import { playSFX } from "@/lib/audio";
import { getObjectById } from "@/lib/store-layout";
import { LayoutDrivenPrefabs } from "./prefabs";
import { NeonSignProp, AisleSignProp, AISLE_SIGNS, AisleFloorMarkings, FloorRugProp, Laundromat, CeilingFixtures, ExteriorEnvironment } from "./props";
import { BuildingShell } from "./props/BuildingShell";

// ── Module imports ──
import { ROOM_W, ROOM_D, ROOM_H, WALL_COLOR, FLOOR_COLOR, CEILING_COLOR, SHELF_COLOR } from "./store-constants";
import { Mat, PosterBox, setEraYears, getShelfMovies, setHeldMovieIds, setHeldMovieSlotKeys } from "./store-materials";
import { StaffPicksShelf } from "./store-shelves";
import { CharlieCharacter, VinnyCharacter, EarlCharacter, KenneyModel } from "./store-characters";
import { NPCManager } from "./NPCManager";
import { AnimatedEntranceDoor, AnimatedEmployeeDoor, Baseboard } from "./store-walls";
// Apartment removed — was a sprawling second-floor zone we couldn't get the design right on.

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


// ── Merged static architecture — reduces ~20 draw calls to ~5 ──
function MergedArchitecture({ topDown }: { topDown: boolean }) {
  const { wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo } = useMemo(() => {
    // ── WALLS (WALL_COLOR) ──
    const walls: THREE.BufferGeometry[] = [];
    // Back wall
    const w0 = new THREE.PlaneGeometry(ROOM_W, ROOM_H); w0.translate(0, ROOM_H / 2, -ROOM_D / 2); walls.push(w0);
    // Front wall panels (around door gap)
    const w1 = new THREE.PlaneGeometry(8, 0.3); w1.translate(-6, 0.15, ROOM_D / 2); walls.push(w1);
    const w2 = new THREE.PlaneGeometry(8, 1.0); w2.translate(-6, 3.0, ROOM_D / 2); walls.push(w2);
    const w3 = new THREE.PlaneGeometry(1, 2.2); w3.translate(-9.5, 1.4, ROOM_D / 2); walls.push(w3);
    const w4 = new THREE.PlaneGeometry(8, 0.3); w4.translate(6, 0.15, ROOM_D / 2); walls.push(w4);
    const w5 = new THREE.PlaneGeometry(8, 1.0); w5.translate(6, 3.0, ROOM_D / 2); walls.push(w5);
    const w6 = new THREE.PlaneGeometry(1, 2.2); w6.translate(9.5, 1.4, ROOM_D / 2); walls.push(w6);
    // Left wall segments (with employee door gap)
    const w7 = new THREE.PlaneGeometry(1.31, ROOM_H); w7.rotateY(Math.PI / 2); w7.translate(-ROOM_W / 2, ROOM_H / 2, -6.345); walls.push(w7);
    const w8 = new THREE.PlaneGeometry(1.0, ROOM_H - 2.35); w8.rotateY(Math.PI / 2); w8.translate(-ROOM_W / 2, (2.35 + ROOM_H) / 2, -5.19); walls.push(w8);
    const w9 = new THREE.PlaneGeometry(11.69, ROOM_H); w9.rotateY(Math.PI / 2); w9.translate(-ROOM_W / 2, ROOM_H / 2, 1.155); walls.push(w9);
    // Right wall
    const w10 = new THREE.PlaneGeometry(ROOM_D, ROOM_H); w10.rotateY(-Math.PI / 2); w10.translate(ROOM_W / 2, ROOM_H / 2, 0); walls.push(w10);
    // Storefront wall panels (WALL_COLOR)
    const w11 = new THREE.BoxGeometry(4, 0.7, 0.15); w11.translate(0, ROOM_H - 0.25, ROOM_D / 2); walls.push(w11);
    const w12 = new THREE.BoxGeometry(8, 0.5, 0.06); w12.translate(-5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w12);
    const w13 = new THREE.BoxGeometry(8, 0.5, 0.06); w13.translate(5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w13);
    const w14 = new THREE.BoxGeometry(1.2, 0.5, 0.06); w14.translate(0, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w14);
    // Knee wall below windows
    const w15 = new THREE.BoxGeometry(ROOM_W - 0.1, 0.26, 0.15); w15.translate(0, 0.13, ROOM_D / 2 - 0.01); walls.push(w15);

    const wallGeo = mergeGeometries(walls, false);
    walls.forEach(g => g.dispose());

    // ── FLOOR (main floor plane only — entrance mat is a different color) ──
    const f0 = new THREE.PlaneGeometry(ROOM_W, ROOM_D); f0.rotateX(-Math.PI / 2);
    const floorGeo = f0;

    // ── CEILING (only when not top-down) ──
    let ceilingGeo: THREE.BufferGeometry | null = null;
    if (!topDown) {
      const ceils: THREE.BufferGeometry[] = [];
      // Main ceiling plane
      const c0 = new THREE.PlaneGeometry(ROOM_W + 2, ROOM_D + 2); c0.rotateX(Math.PI / 2); c0.translate(0, ROOM_H, 0); ceils.push(c0);
      // Front soffit
      const c1 = new THREE.BoxGeometry(ROOM_W + 2, 0.35, 1.0); c1.translate(0, ROOM_H - 0.15, ROOM_D / 2 - 0.05); ceils.push(c1);
      // Side soffits
      const c2 = new THREE.BoxGeometry(0.5, 0.35, ROOM_D + 2); c2.translate(-ROOM_W / 2, ROOM_H - 0.15, 0); ceils.push(c2);
      const c3 = new THREE.BoxGeometry(0.5, 0.35, ROOM_D + 2); c3.translate(ROOM_W / 2, ROOM_H - 0.15, 0); ceils.push(c3);
      // Back soffit
      const c4 = new THREE.BoxGeometry(ROOM_W + 2, 0.35, 0.5); c4.translate(0, ROOM_H - 0.15, -ROOM_D / 2 + 0.05); ceils.push(c4);

      ceilingGeo = mergeGeometries(ceils, false);
      ceils.forEach(g => g.dispose());
    }

    // ── YELLOW ACCENT STRIPES ──
    const accents: THREE.BufferGeometry[] = [];
    const a0 = new THREE.BoxGeometry(ROOM_W, 0.06, 0.02); a0.translate(0, 2.8, -ROOM_D / 2 + 0.06); accents.push(a0);
    const a1 = new THREE.BoxGeometry(8, 0.06, 0.02); a1.translate(-6, 2.8, ROOM_D / 2 - 0.02); accents.push(a1);
    const a2 = new THREE.BoxGeometry(8, 0.06, 0.02); a2.translate(6, 2.8, ROOM_D / 2 - 0.02); accents.push(a2);
    const a3 = new THREE.BoxGeometry(ROOM_D, 0.06, 0.02); a3.rotateY(Math.PI / 2); a3.translate(-ROOM_W / 2 + 0.02, 2.8, 0); accents.push(a3);
    const a4 = new THREE.BoxGeometry(ROOM_D, 0.06, 0.02); a4.rotateY(Math.PI / 2); a4.translate(ROOM_W / 2 - 0.02, 2.8, 0); accents.push(a4);

    const accentGeo = mergeGeometries(accents, false);
    accents.forEach(g => g.dispose());

    // ── BASEBOARDS ──
    const bbs: THREE.BufferGeometry[] = [];
    // Back wall baseboard
    const b0 = new THREE.BoxGeometry(ROOM_W, 0.15, 0.05); b0.translate(0, 0.075, -ROOM_D / 2 + 0.025); bbs.push(b0);
    // Left wall baseboard
    const b1 = new THREE.BoxGeometry(ROOM_D, 0.15, 0.05); b1.rotateY(Math.PI / 2); b1.translate(-ROOM_W / 2 + 0.025, 0.075, 0); bbs.push(b1);
    // Right wall baseboard
    const b2 = new THREE.BoxGeometry(ROOM_D, 0.15, 0.05); b2.rotateY(Math.PI / 2); b2.translate(ROOM_W / 2 - 0.025, 0.075, 0); bbs.push(b2);

    const baseboardGeo = mergeGeometries(bbs, false);
    bbs.forEach(g => g.dispose());

    return { wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo };
  }, [topDown]);

  // Dispose merged geometries on unmount
  useEffect(() => {
    return () => {
      wallGeo?.dispose();
      floorGeo?.dispose();
      ceilingGeo?.dispose();
      accentGeo?.dispose();
      baseboardGeo?.dispose();
    };
  }, [wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo]);

  return (
    <>
      {/* Merged walls */}
      {wallGeo && <mesh geometry={wallGeo}><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>}
      {/* Merged floor */}
      {floorGeo && <mesh geometry={floorGeo}><Mat color={FLOOR_COLOR} roughness={0.95} /></mesh>}
      {/* Merged ceiling + soffits */}
      {ceilingGeo && <mesh geometry={ceilingGeo}><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>}
      {/* Merged yellow accent stripes */}
      {accentGeo && <mesh geometry={accentGeo}><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>}
      {/* Merged baseboards */}
      {baseboardGeo && <mesh geometry={baseboardGeo}><Mat color="#0a1428" roughness={0.8} /></mesh>}
    </>
  );
}


function RecentReturnsStack({
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
      {/* Environment map removed — hemisphere + ambient provide sufficient fill at lower cost */}

      {/* ── MERGED STATIC ARCHITECTURE (walls, floor, ceiling, accents, baseboards) ── */}
      <MergedArchitecture topDown={topDown} />
      {/* Entrance mat floor (different color, not merged) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, ROOM_D / 2 - 1]}><planeGeometry args={[6, 2]} /><Mat color="#3a3a3a" roughness={0.8} /></mesh>
      {/* Ceiling grid — transparent material, not merged */}
      {!topDown && <>
      {[-6, -2, 2, 6].map(x => (<mesh key={`cgx${x}`} position={[x, ROOM_H - 0.03, 0]}><boxGeometry args={[0.02, 0.01, ROOM_D]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}
      {[-4, 0, 4].map(z => (<mesh key={`cgz${z}`} position={[0, ROOM_H - 0.03, z]}><boxGeometry args={[ROOM_W, 0.01, 0.02]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}
      </>}

      {/* ── LIGHTING — zone spots to break flat ambient (≤ 8 lights, mobile perf-safe) ── */}
      {/* Reduced ambient so zone spots can pool — was 1.6, felt flat */}
      <ambientLight intensity={1.1} color="#f5edd8" />
      {/* Hemisphere: warm ceiling → cool floor for depth without extra lights */}
      <hemisphereLight args={["#fff6e4", "#3a4560", 0.7]} />
      {/* Key directional: simulates all overhead fluorescent panels in one light */}
      <directionalLight position={[2, 8, 1]} intensity={1.7} color="#fff3dc" />
      {/* Cool fill from back — separates shelves from wall */}
      <directionalLight position={[-4, 5, -8]} intensity={0.45} color="#c0d0e8" />
      {/* Back aisle warm zone — HORROR/CLASSICS area */}
      <pointLight position={[-5, 2.9, -4.5]} intensity={1.2} distance={7.5} decay={1.8} color="#ffd9a0" />
      {/* Middle aisle warm zone — COMEDY/ACTION */}
      <pointLight position={[5, 2.9, -1.5]} intensity={1.1} distance={7.5} decay={1.8} color="#ffd9a0" />
      {/* Front aisle warm zone — NEW RELEASES near entrance */}
      <pointLight position={[0, 2.9, 2.5]} intensity={1.0} distance={7.0} decay={1.8} color="#ffe4b8" />
      {/* Counter warm spot — stronger focal pool */}
      <pointLight position={[7, 2.8, 5.5]} intensity={1.3} distance={6} decay={1.7} color="#ffc888" />

      {/* Fluorescent ceiling fixtures (hidden in top-down) */}
      {!topDown && <CeilingFixtures />}

      {AISLE_SIGNS.map((sign, i) => (<AisleSignProp key={`aisle-${i}`} z={sign.z} label={sign.label} />))}
      <AisleFloorMarkings />

      {/* ── COUNTER + CHARACTERS ── */}
      <VinnyCharacter />
      <NPCManager isMobile={isMobile ?? false} eraId={eraYearsToId(eraYears)} />
      <CharlieCharacter />
      {/* TonyCharacter removed with Pizza Palace */}
      <EarlCharacter />
      <StaffPicksShelf />
      <NeonSignProp />

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

      {/* ── EXTERIOR (sky, parking, roads, streets, collision walls) ── */}
      {!topDown && <ExteriorEnvironment topDown={topDown} />}

      {/* Fascia + signage (hidden in top-down) — height capped to 0.6m so it
          stays in the commercial-ceiling band (y=3.6 to y=4.2) and doesn't
          obscure the apartment windows above (which start at y=4.4). */}
      {!topDown && <>
      <mesh position={[0, ROOM_H + 0.4, ROOM_D / 2 + 0.22]}><boxGeometry args={[ROOM_W + 12, 0.6, 0.3]} /><meshBasicMaterial color="#1a1a28" /></mesh>
      <mesh position={[0, ROOM_H + 0.7, ROOM_D / 2 - 0.12]}><boxGeometry args={[ROOM_W + 12, 0.1, 0.8]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      <mesh position={[0, ROOM_H + 0.7, ROOM_D / 2 + 0.27]}><boxGeometry args={[ROOM_W + 12.2, 0.06, 0.05]} /><meshBasicMaterial color="#444450" /></mesh>
      <group position={[0, ROOM_H + 0.55, ROOM_D / 2 + 0.15]}><mesh><boxGeometry args={[3.5, 0.18, 0.05]} /><meshBasicMaterial color="#222230" /></mesh><Text position={[0, 0, 0.035]} fontSize={0.09} color="#888899" anchorX="center" anchorY="middle">1987 STRIP MALL PLAZA<meshBasicMaterial color="#888899" toneMapped={false} /></Text></group>
      </>}

      {/* ── CONTINUOUS PARAPET WALL — runs across entire strip mall roofline ── */}
      {/* Real strip malls have a parapet wall hiding the flat roof. This ties
          all three storefronts together visually as one building.
          Height: 0.5m above ROOM_H (y=3.5 to y=4.0)
          Width: full strip mall span (x=-16 to x=16 = 32m)
          Front face only, facing the parking lot */}
      {!topDown && <>
        {/* Parapet wall body */}
        <mesh position={[0, ROOM_H + 0.25, ROOM_D / 2 + 0.05]}>
          <boxGeometry args={[32, 0.5, 0.15]} />
          <meshBasicMaterial color="#1a2a40" />
        </mesh>
        {/* Metal coping cap on top of parapet — thin horizontal strip */}
        <mesh position={[0, ROOM_H + 0.52, ROOM_D / 2 + 0.05]}>
          <boxGeometry args={[32.1, 0.04, 0.22]} />
          <meshBasicMaterial color="#5a6a78" />
        </mesh>
      </>}

      {/* PizzaPalace removed — couldn't get the design right; not core to the gameplay */}
      {!topDown && <Laundromat />}
      {!topDown && <BuildingShell />}

      {/* Apartment removed — same reason as Pizza Palace */}

      {/* Storefront windows + doors + awning — WALL_COLOR panels merged into MergedArchitecture */}
      {/* Upper wall band above windows — from door frame (±1.7) to near side walls (±9.7) */}
      {!topDown && <mesh position={[-5.7, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[8, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>}
      {!topDown && <mesh position={[5.7, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[8, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>}
      {/* Door frame pillars */}
      {!topDown && <mesh position={[-1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>}
      {!topDown && <mesh position={[1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>}
      {/* Glass windows — from door frame (1.7) to 1 unit inside side wall (9.3) */}
      {!topDown && <mesh position={[-5.5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[7.6, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>}
      {!topDown && <mesh position={[5.5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[7.6, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>}
      {/* Window sills */}
      {!topDown && <mesh position={[-5.5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[7.6, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>}
      {!topDown && <mesh position={[5.5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[7.6, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>}

      {/* Neon OPEN sign — double-sided so it reads correctly from both inside and outside */}
      <group position={[5, 2.0, ROOM_D / 2 - 0.05]}>
        <mesh><boxGeometry args={[0.8, 0.4, 0.04]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
        {/* Front face (visible from outside / entering) */}
        <Text position={[0, 0, 0.025]} fontSize={0.16} color="#ff3366" anchorX="center" anchorY="middle" font={undefined}>OPEN<meshBasicMaterial color="#ff3366" toneMapped={false} /></Text>
        {/* Back face (visible from inside the store) */}
        <Text position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]} fontSize={0.16} color="#ff3366" anchorX="center" anchorY="middle" font={undefined}>OPEN<meshBasicMaterial color="#ff3366" toneMapped={false} /></Text>
        <pointLight position={[0, 0, 0.1]} intensity={0.3} distance={2} color="#ff3366" />
      </group>

      {/* Knee wall merged into MergedArchitecture */}

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


      <FloorRugProp />

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
