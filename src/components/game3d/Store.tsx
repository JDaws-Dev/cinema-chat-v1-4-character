"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { hasProp, PROPS } from "@/lib/game-state";
import { playSFX } from "@/lib/audio";
import { getObjectById } from "@/lib/store-layout";

// ── Module imports ──
import { ROOM_W, ROOM_D, ROOM_H, WALL_COLOR, FLOOR_COLOR, CEILING_COLOR, SHELF_COLOR, SHELF_ROWS } from "./store-constants";
import { Mat, setEraYears, getShelfMovies } from "./store-materials";
import { ShelfUnit, WallShelf, NewReleasesWall } from "./store-shelves";
import { NPCCustomer, KidCustomer, CharlieCharacter, VinnyCharacter, NPC_POOL, NPC_WAYPOINTS, KenneyCar, KenneyModel, getRandomAdultPersonality } from "./store-characters";
import { Counter } from "./store-counter";
import { WallPoster, WallCrtTv, AnimatedEntranceDoor, AnimatedEmployeeDoor, Baseboard } from "./store-walls";

// Re-export for external consumers
export { setEraYears, getShelfMovies };

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

// ── Aisle signs ──
const AISLE_SIGNS: { z: number; label: string; colors: string[] }[] = [
  { z: -4, label: "HORROR \u2022 SCI-FI \u2022 COMEDY", colors: ["#dc2626", "#3b82f6", "#f97316"] },
  { z: -1, label: "ACTION \u2022 CLASSICS", colors: ["#ef4444", "#ca8a04"] },
  { z: 2, label: "FAMILY \u2022 WESTERN", colors: ["#22c55e", "#92400e"] },
];

function AisleSign({ z, label }: { z: number; label: string; colors: string[] }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, ROOM_H - 0.45, 0]}><boxGeometry args={[0.02, 0.9, 0.02]} /><Mat color="#888888" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[2.3, 0.36, 0.02]} /><Mat color="#0a1830" roughness={0.6} /></mesh>
      <mesh position={[0, 2.6, 0]}><boxGeometry args={[2.2, 0.3, 0.03]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.5} /></mesh>
      <Text position={[0, 2.6, 0.02]} fontSize={0.08} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>{label}</Text>
      <Text position={[0, 2.6, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>{label}</Text>
    </group>
  );
}

function AisleFloorMarkings() {
  return (<>{[-2.5, 0.5, 3.5].map((z) => (<mesh key={`floor-strip-${z}`} position={[0, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[ROOM_W - 2, 0.08]} /><meshBasicMaterial color="#0d1320" /></mesh>))}</>);
}

function FlickeringLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  useFrame((state) => { if (lightRef.current) lightRef.current.intensity = 4.0 + Math.sin(state.clock.elapsedTime * 3.7) * 0.5; });
  return (<spotLight ref={lightRef} position={position} angle={0.6} penumbra={0.5} intensity={4} distance={6} color="#fff4d0" target-position={[position[0], 0, position[2]]} />);
}

function FloorRug() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 5.2]}><planeGeometry args={[3.4, 2.4]} /><Mat color="#ffd700" roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.2]}><planeGeometry args={[3, 2]} /><Mat color="#0a1830" roughness={0.95} /></mesh>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 5.2]} fontSize={0.18} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>FRIDAY NIGHT VIDEO</Text>
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
      <group position={[0, 1.88, 0]}><mesh><boxGeometry args={[1.6, 0.22, 0.04]} /><Mat color="#1a1a2e" roughness={0.6} /></mesh><Text position={[0, 0, 0.025]} fontSize={0.1} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>COLLECTION</Text></group>
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

export function Store({ isMobile, eraYears, maxNpcs = 5 }: { isMobile?: boolean; eraYears?: string; maxNpcs?: number }) {
  useEffect(() => { if (eraYears) setEraYears(eraYears); }, [eraYears]);

  const spawnedNpcs = useMemo(() => {
    const shuffled = [...NPC_POOL].sort(() => Math.random() - 0.5);
    const count = 4 + Math.floor(Math.random() * 3);
    return shuffled.slice(0, count).map(npc => ({ ...npc, personality: getRandomAdultPersonality() }));
  }, []);

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
      {[-4, 0, 4].map((x, i) => (<mesh key={`fl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 0]}><circleGeometry args={[3, 24]} /><Mat color="#1e2850" roughness={0.9} transparent opacity={0.3} /></mesh>))}

      {/* ── CEILING ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}><planeGeometry args={[ROOM_W, ROOM_D]} /><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H - 0.02, ROOM_D / 2]}><planeGeometry args={[ROOM_W + 2, 2]} /><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>
      {Array.from({ length: Math.floor(18 / 1.2) + 1 }, (_, i) => -9 + i * 1.2).map(x => (<mesh key={`cgx${x}`} position={[x, ROOM_H - 0.03, 0]}><boxGeometry args={[0.02, 0.01, ROOM_D]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}
      {Array.from({ length: Math.floor(12 / 1.2) + 1 }, (_, i) => -6 + i * 1.2).map(z => (<mesh key={`cgz${z}`} position={[0, ROOM_H - 0.03, z]}><boxGeometry args={[ROOM_W, 0.01, 0.02]} /><Mat color="#8f897d" transparent opacity={0.45} /></mesh>))}

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

      {/* ── LIGHTING ── */}
      <ambientLight intensity={0.9} color="#f0eadc" />
      <hemisphereLight args={["#fff6e4", "#4a5070", 0.8]} />
      <hemisphereLight args={["#ffe8c8", "#3d4a6a", 0.3]} />
      <directionalLight position={[5, 8, 3]} intensity={1.5} color="#fff1dc" />
      <directionalLight position={[-3, 6, -8]} intensity={0.4} color="#c8d4e8" />
      <pointLight position={[-6, ROOM_H - 0.34, -1.5]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[2, ROOM_H - 0.34, -1.5]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[-2, ROOM_H - 0.34, 2]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[6, ROOM_H - 0.34, 2]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[-4, ROOM_H - 0.34, 0]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[4, ROOM_H - 0.34, 0]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[-4.5, ROOM_H - 0.34, 4.9]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />
      <pointLight position={[3.5, ROOM_H - 0.34, 4.9]} intensity={0.6} distance={6} color="#fff6e8" castShadow={false} />

      {/* Fluorescent ceiling fixtures */}
      {[-6, -2, 2, 6].map((fx) => (<group key={fx}><group position={[fx, ROOM_H - 0.04, -1.5]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group><group position={[fx, ROOM_H - 0.04, 2]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group></group>))}
      {[-4, 0, 4].map((fx) => (<group key={`mid-${fx}`} position={[fx, ROOM_H - 0.04, 0]}><mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.6, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh></group>))}
      {[-4.5, -0.5, 3.5].map((fx) => (<group key={`front-${fx}`} position={[fx, ROOM_H - 0.04, 4.9]}><mesh><boxGeometry args={[1.65, 0.05, 0.28]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh><mesh position={[0, -0.04, 0]}><boxGeometry args={[1.45, 0.03, 0.08]} /><meshBasicMaterial color="#fff6dd" /></mesh><mesh position={[0, -0.01, 0]}><boxGeometry args={[1.55, 0.01, 0.22]} /><Mat color="#ece8da" roughness={0.22} /></mesh></group>))}

      {/* ── SHELVES ── */}
      {SHELF_ROWS.map((s, i) => (<ShelfUnit key={i} x={s.x} z={s.z} genre={s.genre} color={s.color} backGenre={s.backGenre} backColor={s.backColor} rotY={s.rotY} />))}
      <WallShelf position={[getObjectById("wallshelf-back-drama")?.x ?? -5, 0, -ROOM_D/2 + 0.15]} rotation={[0, 0, 0]} width={6} genre="DRAMA" color="#6366f1" />
      {AISLE_SIGNS.map((sign, i) => (<AisleSign key={`aisle-${i}`} z={sign.z} label={sign.label} colors={sign.colors} />))}
      <AisleFloorMarkings />

      {/* ── COUNTER + CHARACTERS ── */}
      <Counter />
      <VinnyCharacter />
      {spawnedNpcs.slice(0, maxNpcs).map((npc, i) => (<NPCCustomer key={npc.id} id={npc.id} startPos={[NPC_WAYPOINTS[i % NPC_WAYPOINTS.length][0], -0.05, NPC_WAYPOINTS[i % NPC_WAYPOINTS.length][1]]} shirtColor={npc.shirtColor} hairColor={npc.hairColor} skinTone={npc.skinTone} hairStyle={npc.hairStyle} personality={npc.personality} />))}
      {maxNpcs >= 1 && <KidCustomer startPos={[getObjectById("kid")?.x ?? 0, -0.05, getObjectById("kid")?.z ?? 0.5]} shirtColor="#f0e020" hairColor="#6b3a10" skinTone="#e8c4a0" />}
      <CharlieCharacter />
      <NewReleasesWall />
      <NeonSign />

      {/* ── CRT TVs ── */}
      <WallCrtTv position={[getObjectById("tv-left")?.x ?? -9.05, getObjectById("tv-left")?.y ?? 2.2, getObjectById("tv-left")?.z ?? -2.8]} yaw={Math.PI / 2 - 0.18} tilt={0.12} scale={0.84} pipeDrop={0.96} />
      <WallCrtTv position={[getObjectById("tv-right")?.x ?? (ROOM_W / 2 - 0.72), getObjectById("tv-right")?.y ?? 2.26, getObjectById("tv-right")?.z ?? -3.9]} yaw={-Math.PI / 2 + 0.18} tilt={0.12} scale={0.7} pipeDrop={1.16} />

      {/* ── WALL POSTERS ── */}
      <WallPoster x={getObjectById("poster-jaws")?.x ?? -7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#b91c1c" title="JAWS" />
      <WallPoster x={getObjectById("poster-alien")?.x ?? -9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#1d4ed8" title="ALIEN" />
      <WallPoster x={getObjectById("poster-blade")?.x ?? 7} y={1.8} z={-ROOM_D / 2 + 0.05} color="#7c3aed" title="BLADE RUNNER" />
      <WallPoster x={getObjectById("poster-raiders")?.x ?? 9} y={1.8} z={-ROOM_D / 2 + 0.05} color="#059669" title="RAIDERS" />
      <WallPoster x={-ROOM_W / 2 + 0.1} y={2.0} z={getObjectById("poster-shining")?.z ?? -2.78} rotY={Math.PI / 2} color="#dc2626" title="THE SHINING" />
      <WallPoster x={-ROOM_W / 2 + 0.04} y={2.0} z={getObjectById("poster-starwars")?.z ?? 1.32} rotY={Math.PI / 2} color="#f59e0b" title="STAR WARS" />
      <WallPoster x={ROOM_W / 2 - 0.16} y={2.0} z={getObjectById("poster-bttf")?.z ?? 2.95} rotY={-Math.PI / 2} color="#ec4899" title="BACK TO THE FUTURE" />
      <WallPoster x={ROOM_W / 2 - 0.13} y={2.0} z={getObjectById("poster-et")?.z ?? 5.19} rotY={-Math.PI / 2} color="#14b8a6" title="E.T." />

      {/* ── WALL-MOUNTED ITEMS ── */}
      {/* BE KIND REWIND */}
      <group position={[-ROOM_W / 2 + 0.12, 2.0, getObjectById("be-kind-sign")?.z ?? 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[1.5, 0.35, 0.03]} /><Mat color="#0a1a3a" roughness={0.6} /></mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>BE KIND, REWIND</Text>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.09} color="#ffd700" anchorX="center" font={undefined}>BE KIND, REWIND</Text>
      </group>

      {/* OPEN sign */}
      <group position={[getObjectById("open-sign")?.x ?? -4, getObjectById("open-sign")?.y ?? 2.3, ROOM_D / 2]}>
        <mesh><boxGeometry args={[1.0, 0.45, 0.03]} /><Mat color="#0a0a18" roughness={0.5} /></mesh>
        <mesh position={[0, 0, 0.01]}><boxGeometry args={[1.1, 0.55, 0.01]} /><Mat color="#ff3e7a" emissive="#ff3e7a" emissiveIntensity={0.2} transparent opacity={0.5} /></mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.22} color="#ff3e7a" anchorX="center" font={undefined}>OPEN<meshBasicMaterial color="#ff3e7a" toneMapped={false} /></Text>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.22} color="#ff3e7a" anchorX="center" font={undefined}>OPEN<meshBasicMaterial color="#ff3e7a" toneMapped={false} /></Text>
      </group>

      {/* Store hours */}
      <group position={[getObjectById("store-hours")?.x ?? 4, getObjectById("store-hours")?.y ?? 1.8, getObjectById("store-hours")?.z ?? ROOM_D / 2 + 0.05]}>
        <mesh position={[0, 0, -0.005]}><boxGeometry args={[1.3, 0.9, 0.03]} /><Mat color="#1a3a6a" roughness={0.5} /></mesh>
        <mesh><boxGeometry args={[1.2, 0.8, 0.03]} /><Mat color="#f0f0e8" roughness={0.7} /></mesh>
        <Text position={[0, 0.25, 0.02]} fontSize={0.08} color="#1a3a6a" anchorX="center" font={undefined}>STORE HOURS</Text>
        <Text position={[0, 0.05, 0.02]} fontSize={0.05} color="#333333" anchorX="center" font={undefined}>MON-SAT 10AM - 11PM</Text>
        <Text position={[0, -0.1, 0.02]} fontSize={0.05} color="#333333" anchorX="center" font={undefined}>SUN 11AM - 9PM</Text>
        <Text position={[0, -0.28, 0.02]} fontSize={0.035} color="#cc3333" anchorX="center" font={undefined}>OPEN LATE FRIDAYS!</Text>
      </group>

      {/* Clock near counter */}
      <group position={[getObjectById("clock-counter")?.x ?? ROOM_W / 2 - 0.1, getObjectById("clock-counter")?.y ?? 2.8, getObjectById("clock-counter")?.z ?? 6.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><circleGeometry args={[0.25, 24]} /><Mat color="#ffffff" roughness={0.4} /></mesh>
        <mesh position={[0, 0, -0.03]}><cylinderGeometry args={[0.27, 0.27, 0.04, 24]} /><Mat color="#333" roughness={0.5} /></mesh>
        <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.02, 0.12, 0.005]} /><meshBasicMaterial color="#111" /></mesh>
        <mesh position={[0.04, 0.06, 0.01]} rotation={[0, 0, -1.2]}><boxGeometry args={[0.015, 0.18, 0.005]} /><meshBasicMaterial color="#111" /></mesh>
      </group>

      {/* Late fees sign */}
      <group position={[ROOM_W / 2 - 0.1, getObjectById("late-fees-sign")?.y ?? 1.5, getObjectById("late-fees-sign")?.z ?? 5.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[1.0, 0.6, 0.02]} /><Mat color="#0a1a3a" roughness={0.6} /></mesh>
        <Text position={[0, 0.15, 0.015]} fontSize={0.08} color="#ef4444" anchorX="center" font={undefined}>LATE FEES</Text>
        <Text position={[0, 0, 0.015]} fontSize={0.04} color="#ffffff" anchorX="center" font={undefined}>1-DAY: $1.50 | 2-DAY: $3.00</Text>
        <Text position={[0, -0.12, 0.015]} fontSize={0.04} color="#ffd700" anchorX="center" font={undefined}>BE KIND, RETURN ON TIME!</Text>
      </group>

      {/* Bulletin board */}
      <group position={[-ROOM_W / 2 + 0.08, getObjectById("bulletin-board")?.y ?? 1.6, getObjectById("bulletin-board")?.z ?? 4.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[1.2, 0.8, 0.05]} /><Mat color="#7a5a30" roughness={0.85} /></mesh>
        {[[-0.3, 0.15, "#ffd700"], [0.1, 0.2, "#ef4444"], [-0.15, -0.1, "#22c55e"], [0.25, -0.05, "#3b82f6"]].map(([dx, dy, c], i) => (<mesh key={`note${i}`} position={[dx as number, dy as number, 0.03]} rotation={[0, 0, (i - 1.5) * 0.1]}><planeGeometry args={[0.2, 0.2]} /><Mat color={c as string} roughness={0.7} /></mesh>))}
      </group>

      {/* Phone on wall */}
      <group position={[getObjectById("wall-phone")?.x ?? 9.8, getObjectById("wall-phone")?.y ?? 2.2, getObjectById("wall-phone")?.z ?? 5.3]} rotation={[0, getObjectById("wall-phone")?.rotY ?? -Math.PI / 2, 0]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.15, 0.25, 0.02]} /><Mat color="#d4c9a8" roughness={0.8} /></mesh>
        <mesh position={[0, 0.15, 0.02]}><boxGeometry args={[0.12, 0.03, 0.04]} /><Mat color="#c8b888" roughness={0.7} /></mesh>
        <group position={[0, 0.17, 0.03]}>
          <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.025, 0.02, 0.04, 8]} /><Mat color="#c8b888" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.12, 8]} /><Mat color="#c8b888" roughness={0.6} /></mesh>
          <mesh position={[0, -0.07, 0]}><cylinderGeometry args={[0.02, 0.025, 0.04, 8]} /><Mat color="#c8b888" roughness={0.6} /></mesh>
        </group>
        {[0, 1, 2, 3, 4, 5].map((i) => (<mesh key={`cord-${i}`} position={[0, -0.02 - i * 0.04, 0.02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.015, 0.003, 6, 8, Math.PI]} /><Mat color="#c8b888" roughness={0.7} /></mesh>))}
        <mesh position={[0, -0.02, 0.015]}><boxGeometry args={[0.08, 0.1, 0.01]} /><Mat color="#bba878" roughness={0.7} /></mesh>
      </group>

      {/* Specials chalkboard */}
      <group position={[getObjectById("promo-board")?.x ?? 9.84, getObjectById("promo-board")?.y ?? 1.72, getObjectById("promo-board")?.z ?? 3.05]} rotation={[0, getObjectById("promo-board")?.rotY ?? -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[1.02, 0.78, 0.04]} /><Mat color="#1a2f58" roughness={0.7} /></mesh>
        <mesh position={[0, 0, 0.012]}><boxGeometry args={[1.12, 0.88, 0.02]} /><Mat color="#d4a514" roughness={0.45} metalness={0.1} /></mesh>
        <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.98, 0.74, 0.012]} /><Mat color="#10203e" roughness={0.78} /></mesh>
        <mesh position={[0, 0.23, 0.028]}><boxGeometry args={[0.7, 0.14, 0.008]} /><meshBasicMaterial color="#ffd700" /></mesh>
        <Text position={[0, 0.23, 0.034]} fontSize={0.075} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>STORE SPECIALS</Text>
        <Text position={[0, 0.04, 0.03]} fontSize={0.065} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>RENT 2 GET 1 FREE</Text>
        <Text position={[0, -0.11, 0.03]} fontSize={0.055} color="#ffe88a" anchorX="center" anchorY="middle" font={undefined}>KIDS FAVORITES $0.99</Text>
        <Text position={[0, -0.25, 0.03]} fontSize={0.042} color="#7ec8ff" anchorX="center" anchorY="middle" font={undefined}>NEW RELEASES TUESDAY</Text>
      </group>

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

      {/* Challenge board */}
      <group position={[ROOM_W / 2 - 0.08, getObjectById("challenge-board")?.y ?? 1.62, getObjectById("challenge-board")?.z ?? 2.65]} rotation={[0, -Math.PI / 2, 0]} userData={{ interactType: "challenge", label: "Challenge Board" }}>
        <mesh userData={{ interactType: "challenge", label: "Challenge Board" }}><boxGeometry args={[0.72, 0.5, 0.04]} /><Mat color="#122448" roughness={0.55} /></mesh>
        <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.82, 0.6, 0.02]} /><Mat color="#d4a514" emissive="#ffd700" emissiveIntensity={0.08} roughness={0.55} /></mesh>
        <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.68, 0.46, 0.01]} /><Mat color="#0f1a33" roughness={0.5} /></mesh>
        <Text position={[0, 0.115, 0.03]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>MOVIE NIGHT</Text>
        <Text position={[0, 0.03, 0.03]} fontSize={0.038} color="#7ec8ff" anchorX="center" anchorY="middle" font={undefined}>CHALLENGE</Text>
        <Text position={[0, -0.045, 0.03]} fontSize={0.021} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>Pick tonight's theme</Text>
        <Text position={[0, -0.115, 0.03]} fontSize={0.02} color="#d4c28a" anchorX="center" anchorY="middle" font={undefined}>Click to open</Text>
      </group>

      <TrophyShelf />

      {/* Neon accent strips (removed — looked like weird colored bars) */}

      {/* ── EXTERIOR ── */}
      {/* Sky dome */}
      {[{ pos: [0, 10, -30] as [number,number,number], rot: [0, 0, 0] as [number,number,number] },{ pos: [0, 10, 35] as [number,number,number], rot: [0, Math.PI, 0] as [number,number,number] },{ pos: [-35, 10, 0] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number] },{ pos: [35, 10, 0] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number] }].map((sky, i) => (<mesh key={`sky-${i}`} position={sky.pos} rotation={sky.rot}><planeGeometry args={[80, 30]} /><meshBasicMaterial color="#1a2a48" /></mesh>))}
      <mesh position={[0, 22, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshBasicMaterial color="#1a2a48" /></mesh>
      {Array.from({ length: 40 }).map((_, i) => (<mesh key={`star-${i}`} position={[(Math.sin(i * 7.3) * 25), 5 + Math.abs(Math.sin(i * 3.7)) * 12, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[i % 4 === 0 ? 0.08 : 0.04, 6]} /><meshBasicMaterial color={i % 7 === 0 ? "#aabbff" : "#ffffff"} /></mesh>))}
      <mesh position={[12, 14, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[1.0, 16]} /><meshBasicMaterial color="#d8dce8" /></mesh>
      <mesh position={[12.3, 14.2, 33.9]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.7, 16]} /><meshBasicMaterial color="#c0c4d0" /></mesh>

      {/* Parking lot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, ROOM_D / 2 + 5]}><planeGeometry args={[ROOM_W + 8, 14]} /><meshBasicMaterial color="#2a2a40" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[getObjectById("sidewalk")?.x ?? 0, -0.04, getObjectById("sidewalk")?.z ?? ROOM_D / 2 + 0.8]}><planeGeometry args={[ROOM_W + 2, 1.5]} /><meshBasicMaterial color="#4a4a4a" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, ROOM_D / 2 + 0.5]}><planeGeometry args={[ROOM_W, 1.5]} /><meshBasicMaterial color="#2a2520" /></mesh>
      {[-6, -3, 0, 3, 6].map((px, i) => (<mesh key={`pline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, -0.04, ROOM_D / 2 + 6]}><planeGeometry args={[0.06, 4]} /><meshBasicMaterial color="#555555" /></mesh>))}

      {/* Parking lot lamps */}
      {[getObjectById("lamp-1")?.x ?? -6, getObjectById("lamp-2")?.x ?? 0, getObjectById("lamp-3")?.x ?? 6].map((lx, i) => (<group key={`lamp-${i}`} position={[lx, 0, [getObjectById("lamp-1")?.z, getObjectById("lamp-2")?.z, getObjectById("lamp-3")?.z][i] ?? ROOM_D / 2 + 7]}><mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.03, 0.04, 3, 8]} /><meshBasicMaterial color="#444" /></mesh><mesh position={[0, 3.1, 0]}><boxGeometry args={[0.3, 0.08, 0.15]} /><meshBasicMaterial color="#555" /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}><circleGeometry args={[1.5, 12]} /><meshBasicMaterial color="#332a15" transparent opacity={0.3} /></mesh></group>))}

      {/* Fascia + signage */}
      <mesh position={[0, ROOM_H + 0.8, ROOM_D / 2 + 0.2]}><boxGeometry args={[ROOM_W + 12, 2.0, 0.3]} /><meshBasicMaterial color="#1a1a28" /></mesh>
      <group position={[0, ROOM_H + 0.5, ROOM_D / 2 + 0.5]}>
        <mesh><boxGeometry args={[8, 1.2, 0.2]} /><meshBasicMaterial color="#0a0a1a" /></mesh>
        <mesh position={[0, 0, 0.11]}><boxGeometry args={[8.1, 1.25, 0.01]} /><meshBasicMaterial color="#b8960a" /></mesh>
        <mesh position={[0, 0, 0.115]}><boxGeometry args={[7.9, 1.1, 0.01]} /><meshBasicMaterial color="#0a0a1a" /></mesh>
        <group position={[-3.2, 0.05, 0.13]}><mesh position={[-0.15, 0, 0]}><boxGeometry args={[0.28, 0.4, 0.03]} /><meshBasicMaterial color="#ffd700" toneMapped={false} /></mesh><mesh position={[0.15, 0, 0]}><boxGeometry args={[0.28, 0.4, 0.03]} /><meshBasicMaterial color="#1a3a6a" toneMapped={false} /></mesh><mesh position={[0.15, 0, 0.016]}><boxGeometry args={[0.32, 0.44, 0.003]} /><meshBasicMaterial color="#ffd700" toneMapped={false} /></mesh><mesh position={[0.15, 0, 0.019]}><boxGeometry args={[0.28, 0.4, 0.003]} /><meshBasicMaterial color="#1a3a6a" toneMapped={false} /></mesh></group>
        <Text position={[0.2, 0.1, 0.13]} fontSize={0.5} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>FRIDAY NIGHT VIDEO<meshBasicMaterial color="#ffd700" toneMapped={false} /></Text>
        <Text position={[0.2, -0.3, 0.13]} fontSize={0.1} color="#cccccc" anchorX="center" anchorY="middle" font={undefined}>YOUR NEIGHBORHOOD VIDEO STORE<meshBasicMaterial color="#cccccc" toneMapped={false} /></Text>
      </group>

      {/* Roof line */}
      <mesh position={[0, ROOM_H + 1.2, ROOM_D / 2 - 0.1]}><boxGeometry args={[ROOM_W + 12, 0.15, 0.8]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      <mesh position={[0, ROOM_H + 1.1, ROOM_D / 2 + 0.25]}><boxGeometry args={[ROOM_W + 12.2, 0.08, 0.05]} /><meshBasicMaterial color="#444450" /></mesh>
      <group position={[0, ROOM_H + 1.35, ROOM_D / 2 + 0.15]}><mesh><boxGeometry args={[3.5, 0.35, 0.05]} /><meshBasicMaterial color="#222230" /></mesh><Text position={[0, 0, 0.03]} fontSize={0.16} color="#888899" anchorX="center" anchorY="middle">1987 STRIP MALL PLAZA<meshBasicMaterial color="#888899" toneMapped={false} /></Text></group>

      {/* Pizza Palace */}
      <mesh position={[getObjectById("pizza-building")?.x ?? -ROOM_W / 2 - 3, ROOM_H / 2, getObjectById("pizza-building")?.z ?? ROOM_D / 2]}><boxGeometry args={[6, ROOM_H, 0.3]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      <mesh position={[getObjectById("pizza-door")?.x ?? -ROOM_W / 2 - 2.5, 1.1, getObjectById("pizza-door")?.z ?? ROOM_D / 2 + 0.16]}><planeGeometry args={[1.0, 2.2]} /><meshBasicMaterial color="#111115" /></mesh>
      <mesh position={[-ROOM_W / 2 - 2.5, 2.22, ROOM_D / 2 + 0.17]}><boxGeometry args={[1.1, 0.04, 0.04]} /><meshBasicMaterial color="#553322" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-ROOM_W / 2 - 2.5, -0.03, ROOM_D / 2 + 0.6]}><planeGeometry args={[1.6, 1.0]} /><meshBasicMaterial color="#553311" transparent opacity={0.35} /></mesh>
      <group position={[-ROOM_W / 2 - 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}><mesh><boxGeometry args={[3.5, 0.6, 0.05]} /><meshBasicMaterial color="#1a0a0a" /></mesh><mesh position={[0, 0, 0.01]}><boxGeometry args={[3.6, 0.7, 0.02]} /><meshBasicMaterial color="#cc3333" /></mesh><mesh position={[0, 0, 0.02]}><boxGeometry args={[3.4, 0.5, 0.02]} /><meshBasicMaterial color="#1a0a0a" /></mesh><Text position={[0, 0, 0.04]} fontSize={0.24} color="#ff6666" anchorX="center" anchorY="middle">PIZZA PALACE<meshBasicMaterial color="#ff6666" toneMapped={false} /></Text><mesh position={[0, 0, -0.01]}><planeGeometry args={[3.8, 0.9]} /><meshBasicMaterial color="#ff3333" transparent opacity={0.08} /></mesh></group>
      <group position={[getObjectById("pizza-slice-sign")?.x ?? -ROOM_W / 2 - 4.5, ROOM_H - 0.3, getObjectById("pizza-slice-sign")?.z ?? ROOM_D / 2 + 0.2]}><mesh rotation={[0, 0, 0.1]}><coneGeometry args={[0.35, 0.6, 3]} /><meshBasicMaterial color="#ff6622" toneMapped={false} /></mesh><mesh position={[-0.05, 0.05, 0.18]}><circleGeometry args={[0.05, 8]} /><meshBasicMaterial color="#cc2200" /></mesh><mesh position={[0.08, -0.1, 0.18]}><circleGeometry args={[0.04, 8]} /><meshBasicMaterial color="#cc2200" /></mesh></group>
      {Array.from({ length: 10 }).map((_, i) => (<mesh key={`pizza-awning-${i}`} position={[-ROOM_W / 2 - 5.5 + i * 0.55, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.55, 0.05, 0.8]} /><meshBasicMaterial color={i % 2 === 0 ? "#cc2222" : "#eeeeee"} /></mesh>))}
      <mesh position={[getObjectById("pizza-window")?.x ?? -ROOM_W / 2 - 3.8, 1.4, getObjectById("pizza-window")?.z ?? ROOM_D / 2 + 0.17]}><planeGeometry args={[1.8, 1.6]} /><meshBasicMaterial color="#443311" transparent opacity={0.6} /></mesh>
      <mesh position={[-ROOM_W / 2 - 3.8, 1.4, ROOM_D / 2 + 0.18]}><boxGeometry args={[1.9, 0.04, 0.03]} /><meshBasicMaterial color="#553322" /></mesh>
      <mesh position={[-ROOM_W / 2 - 3.8, 1.4, ROOM_D / 2 + 0.18]}><boxGeometry args={[0.04, 1.7, 0.03]} /><meshBasicMaterial color="#553322" /></mesh>
      <group position={[-ROOM_W / 2 - 3.8, 1.8, ROOM_D / 2 + 0.19]}><mesh><boxGeometry args={[1.2, 0.3, 0.02]} /><meshBasicMaterial color="#0a0a0a" /></mesh><Text position={[0, 0, 0.02]} fontSize={0.14} color="#ff3366" anchorX="center" anchorY="middle">OPEN LATE<meshBasicMaterial color="#ff3366" toneMapped={false} /></Text></group>
      <group position={[getObjectById("pizza-menu")?.x ?? -ROOM_W / 2 - 1.6, 1.2, getObjectById("pizza-menu")?.z ?? ROOM_D / 2 + 0.4]}><mesh><boxGeometry args={[0.6, 0.9, 0.05]} /><meshBasicMaterial color="#222211" /></mesh><mesh position={[0, 0, 0.01]}><boxGeometry args={[0.55, 0.85, 0.02]} /><meshBasicMaterial color="#443322" /></mesh><Text position={[0, 0.2, 0.03]} fontSize={0.08} color="#ffcc44" anchorX="center" anchorY="middle">SLICES $1.50<meshBasicMaterial color="#ffcc44" toneMapped={false} /></Text><Text position={[0, 0.05, 0.03]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle">WHOLE PIE $8.99<meshBasicMaterial color="#ffffff" toneMapped={false} /></Text><Text position={[0, -0.1, 0.03]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle">2-LITER SODA $1<meshBasicMaterial color="#ffffff" toneMapped={false} /></Text><mesh position={[-0.25, -0.55, 0.1]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshBasicMaterial color="#443322" /></mesh><mesh position={[0.25, -0.55, 0.1]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshBasicMaterial color="#443322" /></mesh></group>

      {/* Laundromat */}
      <mesh position={[getObjectById("laundro-building")?.x ?? ROOM_W / 2 + 3, ROOM_H / 2, getObjectById("laundro-building")?.z ?? ROOM_D / 2]}><boxGeometry args={[6, ROOM_H, 0.3]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      <mesh position={[getObjectById("laundro-door")?.x ?? ROOM_W / 2 + 3.5, 1.1, getObjectById("laundro-door")?.z ?? ROOM_D / 2 + 0.16]}><planeGeometry args={[1.0, 2.2]} /><meshBasicMaterial color="#111115" /></mesh>
      <group position={[ROOM_W / 2 + 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}><mesh><boxGeometry args={[3.5, 0.6, 0.05]} /><meshBasicMaterial color="#0a0a1a" /></mesh><Text position={[0, 0, 0.03]} fontSize={0.24} color="#77ddff" anchorX="center" anchorY="middle">LAUNDROMAT<meshBasicMaterial color="#77ddff" toneMapped={false} /></Text><mesh position={[0, 0, -0.01]}><planeGeometry args={[3.8, 0.9]} /><meshBasicMaterial color="#3399cc" transparent opacity={0.08} /></mesh></group>
      <mesh position={[ROOM_W / 2 + 3, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[5.5, 0.05, 0.8]} /><meshBasicMaterial color="#113355" /></mesh>
      <mesh position={[getObjectById("laundro-window")?.x ?? ROOM_W / 2 + 2, 1.4, getObjectById("laundro-window")?.z ?? ROOM_D / 2 + 0.17]}><planeGeometry args={[2.2, 1.8]} /><meshBasicMaterial color="#223344" transparent opacity={0.5} /></mesh>
      {[[-1.1, 0], [1.1, 0], [0, 0.9], [0, -0.9]].map(([ox, oy], i) => (<mesh key={`laund-frame-${i}`} position={[ROOM_W / 2 + 2 + (ox as number), 1.4 + (oy as number), ROOM_D / 2 + 0.18]}><boxGeometry args={[i < 2 ? 0.04 : 2.3, i < 2 ? 1.9 : 0.04, 0.03]} /><meshBasicMaterial color="#334455" /></mesh>))}
      {[0, 0.65, 1.3].map((dx, i) => (<group key={`washer-${i}`} position={[ROOM_W / 2 + 1.5 + dx, 0.7, ROOM_D / 2 - 0.05]}><mesh><boxGeometry args={[0.55, 0.7, 0.5]} /><meshBasicMaterial color="#cccccc" /></mesh><mesh position={[0, 0, 0.26]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#aabbcc" /></mesh><mesh position={[0, 0, 0.27]}><circleGeometry args={[0.12, 12]} /><meshBasicMaterial color="#556677" /></mesh></group>))}
      <group position={[getObjectById("laundro-open")?.x ?? ROOM_W / 2 + 1.2, 2.0, getObjectById("laundro-open")?.z ?? ROOM_D / 2 + 0.25]}><mesh><boxGeometry args={[0.7, 0.35, 0.04]} /><meshBasicMaterial color="#111111" /></mesh><Text position={[0, 0, 0.03]} fontSize={0.16} color="#33ff66" anchorX="center" anchorY="middle">OPEN<meshBasicMaterial color="#33ff66" toneMapped={false} /></Text></group>

      {/* Curb + Cars */}
      <mesh position={[0, 0.05, ROOM_D / 2 + 1.5]}><boxGeometry args={[ROOM_W + 4, 0.1, 0.15]} /><meshBasicMaterial color="#555555" /></mesh>
      <KenneyCar model="sedan" position={[getObjectById("car-sedan")?.x ?? 5, 0, ROOM_D/2 + 4]} rotation={[0, 0, 0]} scale={1.2} />
      <KenneyCar model="van" position={[getObjectById("car-van")?.x ?? -4, 0, ROOM_D/2 + 4]} rotation={[0, Math.PI, 0]} scale={1.2} />
      <KenneyCar model="suv" position={[getObjectById("car-suv")?.x ?? 1, 0, ROOM_D/2 + 5.5]} rotation={[0, 0, 0]} scale={1.2} />
      <KenneyCar model="hatchback-sports" position={[getObjectById("car-hatchback")?.x ?? -7, 0, ROOM_D/2 + 5.5]} rotation={[0, Math.PI, 0]} scale={1.2} />
      <KenneyCar model="taxi" position={[getObjectById("car-taxi")?.x ?? 8, 0, ROOM_D/2 + 5.5]} rotation={[0, 0, 0]} scale={1.2} />
      <KenneyCar model="sedan" position={[getObjectById("car-sedan2")?.x ?? -10, 0, ROOM_D / 2 + 4]} rotation={[0, Math.PI, 0]} scale={1.2} />
      <KenneyCar model="police" position={[getObjectById("car-police")?.x ?? 10, 0, ROOM_D / 2 + 4]} rotation={[0, 0, 0]} scale={1.2} />
      <KenneyCar model="delivery" position={[getObjectById("car-delivery")?.x ?? -2, 0, ROOM_D / 2 + 5.5]} rotation={[0, Math.PI, 0]} scale={1.2} />

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, ROOM_D / 2 + 13]}><planeGeometry args={[ROOM_W + 20, 6]} /><meshBasicMaterial color="#111116" /></mesh>
      {[-8, -4, 0, 4, 8].map((dx, i) => (<mesh key={`roadline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dx, -0.055, ROOM_D / 2 + 13]}><planeGeometry args={[1.5, 0.08]} /><meshBasicMaterial color="#555533" /></mesh>))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 13.05]}><planeGeometry args={[30, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 12.9]}><planeGeometry args={[30, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>

      {/* Storefront windows + doors + awning — keeping inline for build verification */}
      <mesh position={[0, ROOM_H - 0.25, ROOM_D / 2]}><boxGeometry args={[4, 0.7, 0.15]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[-5, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[5.6, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>
      <mesh position={[5, ROOM_H - 0.4, ROOM_D / 2]}><boxGeometry args={[5.6, 1.0, 0.15]} /><Mat color="#0e1a38" roughness={0.85} /></mesh>
      <mesh position={[-5, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[5.6, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[5, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[5.6, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[0, ROOM_H - 0.15, ROOM_D / 2 + 0.01]}><boxGeometry args={[1.2, 0.5, 0.06]} /><Mat color={WALL_COLOR} roughness={0.85} /></mesh>
      <mesh position={[-1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[1.7, 1.4, ROOM_D / 2 + 0.02]}><boxGeometry args={[0.12, 2.8, 0.06]} /><Mat color="#3a3a4a" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[-5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[5.5, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[5, 1.4, ROOM_D / 2 + 0.01]}><planeGeometry args={[5.5, 2.2]} /><Mat color="#d4c8a0" transparent opacity={0.24} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[5.5, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>
      <mesh position={[5, 0.28, ROOM_D / 2 + 0.05]}><boxGeometry args={[5.5, 0.06, 0.1]} /><Mat color="#2a2a3a" roughness={0.5} /></mesh>
      <mesh position={[0, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[5, 0.06, 1.2]} /><Mat color="#1a3a8a" roughness={0.7} /></mesh>
      <mesh position={[0, ROOM_H + 0.02, ROOM_D / 2 + 0.7]} rotation={[0.25, 0, 0]}><boxGeometry args={[5, 0.03, 0.25]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.6} /></mesh>

      {/* Entrance doors */}
      <AnimatedEntranceDoor side="left" doorOpen={entranceDoorOpen}>
        <mesh position={[0, 1.4, 0]}><planeGeometry args={[1.0, 2.8]} /><Mat color="#a0c0e0" transparent opacity={0.12} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 2.82, 0]}><boxGeometry args={[1.08, 0.04, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.06, 0.04]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
        <mesh position={[0, 1.15, -0.02]}><boxGeometry args={[0.25, 0.08, 0.005]} /><Mat color="#cc0000" roughness={0.5} /></mesh>
        <Text position={[0, 1.15, -0.03]} rotation={[0, Math.PI, 0]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
        <mesh position={[0, 1.15, 0.02]}><boxGeometry args={[0.25, 0.08, 0.005]} /><Mat color="#cc0000" roughness={0.5} /></mesh>
        <Text position={[0, 1.15, 0.03]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
        <Text position={[0, 1.8, 0.01]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
      </AnimatedEntranceDoor>
      <AnimatedEntranceDoor side="right" doorOpen={entranceDoorOpen}>
        <mesh position={[0, 1.4, 0]}><planeGeometry args={[1.0, 2.8]} /><Mat color="#a0c0e0" transparent opacity={0.12} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0.52, 1.4, 0]}><boxGeometry args={[0.04, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 2.82, 0]}><boxGeometry args={[1.08, 0.04, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 1.0, -0.03]}><boxGeometry args={[0.8, 0.06, 0.04]} /><Mat color="#888888" roughness={0.3} metalness={0.7} /></mesh>
        <mesh position={[0, 1.15, -0.02]}><boxGeometry args={[0.25, 0.08, 0.005]} /><Mat color="#cc0000" roughness={0.5} /></mesh>
        <Text position={[0, 1.15, -0.03]} rotation={[0, Math.PI, 0]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
        <mesh position={[0, 1.15, 0.02]}><boxGeometry args={[0.25, 0.08, 0.005]} /><Mat color="#cc0000" roughness={0.5} /></mesh>
        <Text position={[0, 1.15, 0.03]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
        <Text position={[0, 1.8, 0.01]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PUSH</Text>
      </AnimatedEntranceDoor>
      <mesh position={[0, 1.4, ROOM_D / 2 - 0.05]}><boxGeometry args={[0.06, 2.84, 0.04]} /><Mat color="#3a3a3a" roughness={0.4} metalness={0.6} /></mesh>

      {/* Security pillars */}
      <mesh position={[-1.2, 0.75, ROOM_D / 2 - 0.5]}><boxGeometry args={[0.15, 1.5, 0.08]} /><Mat color="#e8e8e0" roughness={0.6} /></mesh>
      <mesh position={[1.2, 0.75, ROOM_D / 2 - 0.5]}><boxGeometry args={[0.15, 1.5, 0.08]} /><Mat color="#e8e8e0" roughness={0.6} /></mesh>
      <mesh position={[-1.2, 1.55, ROOM_D / 2 - 0.5]}><sphereGeometry args={[0.02, 8, 8]} /><Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} /></mesh>
      <mesh position={[1.2, 1.55, ROOM_D / 2 - 0.5]}><sphereGeometry args={[0.02, 8, 8]} /><Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} /></mesh>

      <FloorRug />

      {/* Potted plant + trash can */}
      <KenneyModel model="pottedPlant" position={[getObjectById("plant")?.x ?? (ROOM_W / 2 - 0.5), 0, getObjectById("plant")?.z ?? (-ROOM_D / 2 + 0.5)]} scale={0.5} />
      <KenneyModel model="trashcan" position={[getObjectById("trash-can")?.x ?? -1.5, 0, getObjectById("trash-can")?.z ?? (ROOM_D / 2 - 1)]} scale={0.5} />


      {/* Rewards sign */}
      <group position={[getObjectById("rewards-sign")?.x ?? 7, getObjectById("rewards-sign")?.y ?? 2.8, getObjectById("rewards-sign")?.z ?? 5]}>
        <mesh><boxGeometry args={[2.5, 0.4, 0.03]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.2} roughness={0.5} /></mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.12} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>REWARDS MEMBER? ASK!</Text>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.12} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>REWARDS MEMBER? ASK!</Text>
      </group>


      {/* Security mirror */}
      <group position={[-9.2, 3.3, -6.2]}><mesh rotation={[Math.PI / 4, 0, 0]}><circleGeometry args={[0.45, 24]} /><Mat color="#c0c8d0" roughness={0.8} metalness={0.3} /></mesh><mesh position={[0, 0.15, 0.05]}><cylinderGeometry args={[0.06, 0.06, 0.15, 8]} /><Mat color="#444444" roughness={0.8} /></mesh></group>

      {/* Ceiling speaker */}
      <group position={[-3, ROOM_H - 0.05, 3]}><mesh><boxGeometry args={[0.35, 0.08, 0.35]} /><Mat color="#2a2a2a" roughness={0.6} /></mesh></group>

      {/* Return bin */}
      <group position={[getObjectById("return-bin")?.x ?? 3.5, 0, getObjectById("return-bin")?.z ?? 5.2]} userData={{ interactType: "return_slot", label: "Drop Returns Here" }}>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.8, 1.0, 0.6]} /><Mat color="#1a3a6a" roughness={0.7} /></mesh>
        <mesh position={[0, 0.8, 0.28]}><boxGeometry args={[0.5, 0.1, 0.06]} /><meshBasicMaterial color="#0a0a1a" /></mesh>
        <Text position={[0, 1.1, 0.31]} fontSize={0.05} color="#ffd700" anchorX="center" font={undefined}>DROP RETURNS HERE</Text>
        <Text position={[0, 1.1, -0.31]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#ffd700" anchorX="center" font={undefined}>DROP RETURNS HERE</Text>
      </group>

      {/* Bargain bin */}
      <group position={[getObjectById("bargain-crate")?.x ?? -1.5, getObjectById("bargain-crate")?.y ?? 0, getObjectById("bargain-crate")?.z ?? 4.5]}>
        <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.9, 0.5, 0.7]} /><Mat color="#6a4a20" roughness={0.9} /></mesh>
        <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.8, 0.35, 0.6]} /><Mat color="#3a2a10" roughness={0.9} /></mesh>
        <mesh position={[0, 0.6, -0.36]}><boxGeometry args={[0.6, 0.22, 0.02]} /><Mat color="#ef4444" roughness={0.5} /></mesh>
        <Text position={[0, 0.6, -0.38]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>2 FOR $1</Text>
        <Text position={[0, 0.6, -0.345]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>2 FOR $1</Text>
      </group>

      {/* Welcome mat outside */}
      <mesh position={[0, 0.005, 6.3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.5, 1.2]} /><Mat color="#1a1a1a" roughness={0.8} /></mesh>
      <Text position={[0, 0.008, 6.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#333333" anchorX="center" font={undefined}>WELCOME</Text>

      {/* Welcome mat inside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, ROOM_D / 2 - 0.5]}><planeGeometry args={[2, 1]} /><Mat color="#4a2020" roughness={0.95} /></mesh>
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
useGLTF.preload('/models/pottedPlant.glb');
useGLTF.preload('/models/televisionVintage.glb');
useGLTF.preload('/models/candy-bar.glb');
useGLTF.preload('/models/candy-bar-wrapper.glb');
useGLTF.preload('/models/chocolate.glb');
useGLTF.preload('/models/soda-can.glb');
useGLTF.preload('/models/soda-bottle.glb');
useGLTF.preload('/models/cookie-chocolate.glb');
