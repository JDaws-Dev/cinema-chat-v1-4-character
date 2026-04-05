"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF, Billboard, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { registerNPCPosition, unregisterNPCPosition } from "@/lib/audio";
import { type NpcPersonality, type PersonalityType, PERSONALITIES, getRandomAdultPersonality, getPersonalityLabel } from "@/lib/npc-personalities";
import { getObjectById } from "@/lib/store-layout";
import { SHELF_ROWS } from "./store-constants";
import { Mat } from "./store-materials";

// ── Global dialogue target signal ─────────────────────────────
// Set by game page when RPG dialogue is active. Characters read this to animate mouth.
// Value is the interactType string of the character being talked to (e.g. "vinny", "charlie", "customer")
// or null when no dialogue is active.
export let activeDialogueTarget: string | null = null;
export function setActiveDialogueTarget(target: string | null) {
  activeDialogueTarget = target;
}

// ── Lifelike animation helpers ─────────────────────────────
// Deterministic seed from character id string → stable per-character randomization
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295; // 0..1
}

// Hook: breathing (torso scaleY), idle sway (groupX), head micro-movements
function useLifelikeIdle(
  seed: number,
  torsoRef: React.RefObject<THREE.Mesh | null>,
  headRef: React.RefObject<THREE.Group | THREE.Mesh | null>,
  groupRef: React.RefObject<THREE.Group | null>,
  baseGroupX?: number, // if group position.x is managed externally, pass undefined
) {
  const breathPeriod = 3.5 + seed * 1.0; // 3.5-4.5s
  const swayPhase = seed * Math.PI * 2;
  const headFreq1 = 0.7 + seed * 0.4;
  const headFreq2 = 1.3 + (1 - seed) * 0.5;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Breathing: torso scaleY pulses 1.0 → 1.008
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1.0 + 0.008 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / breathPeriod));
    }
    // Idle sway: offset group X by ±0.02 on 6s cycle
    if (groupRef.current && baseGroupX !== undefined) {
      groupRef.current.position.x = baseGroupX + Math.sin(t * (Math.PI * 2 / 6) + swayPhase) * 0.02;
    }
    // Head micro-movements: sum of two sine waves, max 0.03 rad
    if (headRef.current) {
      const micro = Math.sin(t * headFreq1 * 2.5) * 0.015 + Math.sin(t * headFreq2 * 3.1) * 0.015;
      headRef.current.rotation.z = micro;
    }
  });
}

// Hook: blink animation — scale eye meshes Y to 0 for 0.1s every 3-5s
function useBlink(
  seed: number,
  ...eyeRefs: React.RefObject<THREE.Mesh | null>[]
) {
  const nextBlink = useRef(3 + seed * 2); // first blink 3-5s in
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);

  useFrame((_, dt) => {
    const cappedDt = Math.min(dt, 0.1);
    if (isBlinking.current) {
      blinkTimer.current -= cappedDt;
      if (blinkTimer.current <= 0) {
        isBlinking.current = false;
        nextBlink.current = 3 + Math.random() * 2; // 3-5s until next
        for (const ref of eyeRefs) {
          if (ref.current) ref.current.scale.y = 1;
        }
      }
    } else {
      nextBlink.current -= cappedDt;
      if (nextBlink.current <= 0) {
        isBlinking.current = true;
        blinkTimer.current = 0.1;
        for (const ref of eyeRefs) {
          if (ref.current) ref.current.scale.y = 0.05;
        }
      }
    }
  });
}

// NPC waypoints — aisles between the 12 chevron gondolas
// Center aisle: x=0 (between left pair and right pair)
// Left aisle: x=-4, Right aisle: x=4
// Cross aisles at z=-3, z=0, z=2.5 (between rows)
export const NPC_WAYPOINTS: [number, number][] = [
  [0, -5.5],    // back center
  [-4, -4.2],   // left aisle, row 1
  [4, -4.2],    // right aisle, row 1
  [0, -3],      // center, between row 1 and 2
  [-4, -1.5],   // left aisle, row 2
  [4, -1.5],    // right aisle, row 2
  [0, 0],       // center, between row 2 and 3
  [-4, 1],      // left aisle, row 3
  [4, 1],       // right aisle, row 3
  [0, 3],       // center front
];

// ── NPC collision helpers ─────────────────────────────────
// Shelf AABB bounds with padding for NPC radius
// AABB bounds expanded for rotated gondolas — sin(0.25)*1.4 ~ 0.35 extra on each axis
export const SHELF_BOUNDS = SHELF_ROWS.map(s => {
  const rot = Math.abs(s.rotY || 0);
  const hw = 1.4; // half-width of shelf
  const hd = 0.18; // half-depth of shelf
  const expandedHW = hw * Math.cos(rot) + hd * Math.sin(rot);
  const expandedHD = hw * Math.sin(rot) + hd * Math.cos(rot);
  return {
    minX: s.x - expandedHW - 0.3, maxX: s.x + expandedHW + 0.3,
    minZ: s.z - expandedHD - 0.15, maxZ: s.z + expandedHD + 0.15,
  };
});

export function npcCollidesShelf(px: number, pz: number): boolean {
  for (const b of SHELF_BOUNDS) {
    if (px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) return true;
  }
  return false;
}

// Global NPC position registry for NPC-to-NPC avoidance
export const npcPositions = new Map<string, { x: number; z: number }>();

function npcTooCloseToOther(id: string, px: number, pz: number, threshold = 0.8): boolean {
  for (const [otherId, pos] of npcPositions) {
    if (otherId === id) continue;
    const dx = px - pos.x;
    const dz = pz - pos.z;
    if (dx * dx + dz * dz < threshold * threshold) return true;
  }
  return false;
}

export function NPCCustomer({ id, startPos, shirtColor, hairColor, skinTone, hairStyle = "flattop", personality }: {
  id: string; startPos: [number, number, number]; shirtColor: string; hairColor: string; skinTone: string;
  hairStyle?: "flattop" | "long" | "cap" | "ponytail";
  personality?: NpcPersonality;
}) {
  const ref = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
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

    // Register position for NPC-to-NPC avoidance
    npcPositions.set(id, { x: ref.current.position.x, z: ref.current.position.z });

    // Reset leg/arm swing when not moving
    const resetLimbs = () => {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    };

    // If waiting at a waypoint, count down
    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      // Still bob slightly while waiting
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      resetLimbs();
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
        const shelfZs = [-4, -1, 2];
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
      // Move toward target with shelf collision + NPC avoidance
      const nx = dx / dist;
      const nz = dz / dist;
      const newX = ref.current.position.x + nx * speed * dt;
      const newZ = ref.current.position.z + nz * speed * dt;

      // NPC-to-NPC avoidance: pause if too close
      if (npcTooCloseToOther(id, newX, newZ)) {
        waitTimer.current = 0.3 + Math.random() * 0.3;
        waitDuration.current = waitTimer.current;
        resetLimbs();
      } else {
        // Shelf collision: slide along edges
        if (!npcCollidesShelf(newX, ref.current.position.z)) ref.current.position.x = newX;
        if (!npcCollidesShelf(ref.current.position.x, newZ)) ref.current.position.z = newZ;
        // Walk bob
        ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
        // Face direction of movement (model faces -z, so add PI)
        ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
        // Leg swing animation
        const swing = Math.sin(t * 8) * 0.3;
        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        // Arm swing (opposite to legs)
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
      }
    }

    // Update spatial audio position for this NPC
    registerNPCPosition(id, ref.current.position.x, ref.current.position.z);
  });

  // Unregister spatial audio + NPC avoidance on unmount
  useEffect(() => {
    return () => { unregisterNPCPosition(id); npcPositions.delete(id); };
  }, [id]);

  const vhsColor = useMemo(() => {
    const colors = ["#2a2a8a", "#8a2a2a", "#2a6a2a", "#6a2a6a", "#1a5a5a", "#8a6a1a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);
  const hasBag = useMemo(() => Math.random() > 0.5, []);

  return (
    <group ref={ref} position={startPos} userData={{ interactType: "customer", label: personality ? getPersonalityLabel(personality) : "Talk to Customer", personalityType: personality?.type, personality }}>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#3a3a4a" roughness={0.8} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#3a3a4a" roughness={0.8} />
      </mesh>
      {/* Body — slightly varied proportions */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.34, 0.44, 0.22]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Collar — two angled flaps at neck */}
      <mesh position={[-0.05, 1.01, -0.08]} rotation={[0.3, 0, 0.2]}>
        <boxGeometry args={[0.07, 0.04, 0.02]} />
        <Mat color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 1.01, -0.08]} rotation={[0.3, 0, -0.2]}>
        <boxGeometry args={[0.07, 0.04, 0.02]} />
        <Mat color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Belt line */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[0.35, 0.03, 0.23]} />
        <Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* Left arm with VHS tape in hand */}
      <mesh ref={leftArmRef} position={[-0.22, 0.78, 0]}>
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
      <mesh ref={rightArmRef} position={[0.22, 0.78, 0]}>
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
      <mesh position={[0, 1.2, 0]} scale={[1, 1.1, 0.9]}>
        <sphereGeometry args={[0.16, 12, 14]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>
      {/* Head top (taller shape) */}
      <mesh position={[0, 1.26, 0]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>
      {/* Chin / jaw — slightly wider below head */}
      <mesh position={[0, 1.1, -0.02]}>
        <boxGeometry args={[0.2, 0.06, 0.14]} />
        <Mat color={skinTone} roughness={0.75} />
      </mesh>

      {/* Hair — style-dependent */}
      {hairStyle === "flattop" && (
        <mesh position={[0, 1.36, 0]}>
          <boxGeometry args={[0.26, 0.06, 0.22]} />
          <Mat color={hairColor} roughness={0.9} />
        </mesh>
      )}
      {hairStyle === "long" && (
        <group>
          <mesh position={[0, 1.36, 0.02]}>
            <boxGeometry args={[0.3, 0.14, 0.26]} />
            <Mat color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.2, 0.12]}>
            <boxGeometry args={[0.24, 0.2, 0.06]} />
            <Mat color={hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
      {hairStyle === "cap" && (
        <group>
          <mesh position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.18, 12, 8]} />
            <Mat color="#2a5a2a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.32, -0.16]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.12]} />
            <Mat color="#2a5a2a" roughness={0.6} />
          </mesh>
        </group>
      )}
      {hairStyle === "ponytail" && (
        <group>
          <mesh position={[0, 1.34, 0.01]}>
            <sphereGeometry args={[0.15, 12, 8]} />
            <Mat color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.24, 0.18]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <Mat color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.28, 0.14]}>
            <boxGeometry args={[0.04, 0.04, 0.08]} />
            <Mat color={hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Nose — small box protruding from face */}
      <mesh position={[0, 1.18, -0.16]}>
        <boxGeometry args={[0.03, 0.04, 0.03]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Eyebrows — thin boxes above eyes */}
      <mesh position={[-0.05, 1.26, -0.14]}>
        <boxGeometry args={[0.05, 0.012, 0.02]} />
        <Mat color={hairColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.05, 1.26, -0.14]}>
        <boxGeometry args={[0.05, 0.012, 0.02]} />
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


export function KidCustomer({ startPos, shirtColor, hairColor, skinTone }: {
  startPos: [number, number, number]; shirtColor: string; hairColor: string; skinTone: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const kidId = useMemo(() => `kid-${startPos[0].toFixed(1)}-${startPos[2].toFixed(1)}`, [startPos]);
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

    // Register position for NPC-to-NPC avoidance
    npcPositions.set(kidId, { x: ref.current.position.x, z: ref.current.position.z });

    const resetLimbs = () => {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    };

    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      resetLimbs();
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
        const shelfZs = [-4, -1, 2];
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
      const newX = ref.current.position.x + nx * speed * dt;
      const newZ = ref.current.position.z + nz * speed * dt;

      // NPC-to-NPC avoidance
      if (npcTooCloseToOther(kidId, newX, newZ)) {
        waitTimer.current = 0.3 + Math.random() * 0.3;
        waitDuration.current = waitTimer.current;
        resetLimbs();
      } else {
        // Shelf collision: slide along edges
        if (!npcCollidesShelf(newX, ref.current.position.z)) ref.current.position.x = newX;
        if (!npcCollidesShelf(ref.current.position.x, newZ)) ref.current.position.z = newZ;
        ref.current.position.y = Math.abs(Math.sin(t * 2.5)) * 0.025;
        ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
        // Leg swing animation (faster for kids)
        const swing = Math.sin(t * 10) * 0.35;
        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
      }
    }
  });

  // Unregister NPC avoidance on unmount
  useEffect(() => {
    return () => { npcPositions.delete(kidId); };
  }, [kidId]);

  return (
    <group ref={ref} position={startPos} scale={0.65} userData={{ interactType: "customer", label: "Talk to Kid", personalityType: "kid" as PersonalityType, personality: PERSONALITIES.kid }}>
      {/* Legs — shorter kid proportions */}
      <mesh ref={leftLegRef} position={[-0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#4a6fa5" roughness={0.8} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.06, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <Mat color="#4a6fa5" roughness={0.8} />
      </mesh>
      {/* Sneakers — colorful kid shoes */}
      <mesh position={[-0.06, 0.03, -0.02]}>
        <boxGeometry args={[0.12, 0.07, 0.16]} />
        <Mat color="#e74c3c" roughness={0.7} />
      </mesh>
      <mesh position={[-0.06, 0.01, -0.02]}>
        <boxGeometry args={[0.13, 0.03, 0.17]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>
      <mesh position={[0.06, 0.03, -0.02]}>
        <boxGeometry args={[0.12, 0.07, 0.16]} />
        <Mat color="#e74c3c" roughness={0.7} />
      </mesh>
      <mesh position={[0.06, 0.01, -0.02]}>
        <boxGeometry args={[0.13, 0.03, 0.17]} />
        <Mat color="#f0f0f0" roughness={0.6} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.34, 0.44, 0.22]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Backpack on back */}
      <mesh position={[0, 0.82, 0.14]}>
        <boxGeometry args={[0.22, 0.28, 0.1]} />
        <Mat color="#e67e22" roughness={0.8} />
      </mesh>
      {/* Backpack flap */}
      <mesh position={[0, 0.94, 0.14]}>
        <boxGeometry args={[0.2, 0.06, 0.11]} />
        <Mat color="#d35400" roughness={0.8} />
      </mesh>
      {/* Backpack straps (visible from front) */}
      <mesh position={[-0.08, 0.88, -0.1]}>
        <boxGeometry args={[0.03, 0.2, 0.02]} />
        <Mat color="#d35400" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 0.88, -0.1]}>
        <boxGeometry args={[0.03, 0.2, 0.02]} />
        <Mat color="#d35400" roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.22, 0.78, 0]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <Mat color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.22, 0.58, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <Mat color={skinTone} roughness={0.8} />
      </mesh>
      {/* Head — rounder kid proportions */}
      <mesh position={[0, 1.18, 0]} scale={[1, 1.1, 0.9]}>
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

export function CharlieCharacter() {
  /* CharlieCharacter is very long — I'll include the full original code */
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const charlieId = "charlie";
  const speed = 0.8;
  const _cPos = getObjectById("charlie");
  const startPos: [number, number, number] = [_cPos?.x ?? -2, _cPos?.y ?? -0.05, _cPos?.z ?? 1.5];
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

  const charlieSeed = useMemo(() => seedFromId("charlie"), []);

  // Priority 1: breathing + head micro-movements (sway handled in useFrame since Charlie moves)
  useLifelikeIdle(charlieSeed, torsoRef, headRef, ref, undefined /* sway managed manually */);

  // Priority 2: blink
  useBlink(charlieSeed, leftEyeRef, rightEyeRef);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;

    npcPositions.set(charlieId, { x: ref.current.position.x, z: ref.current.position.z });

    const resetLimbs = () => {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    };

    if (waitTimer.current > 0) {
      waitTimer.current -= dt;
      ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.01;
      // Idle sway when stopped
      const swayPhase = charlieSeed * Math.PI * 2;
      ref.current.position.x += Math.sin(t * (Math.PI * 2 / 6) + swayPhase) * 0.0003; // gentle drift
      // Priority 6: Wider aisle scanning — 0.4 rad arc instead of 0.2
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.4;
      }
      // Priority 6: Shelf straightening — right arm extends forward and pulls back on 4s cycle when stopped
      if (rightArmRef.current && isBrowsing.current) {
        const straightenCycle = (t % 4) / 4; // 0..1 over 4s
        // Extend forward (negative X rotation) then pull back
        const extend = Math.sin(straightenCycle * Math.PI) * 0.5; // peak at 0.5 rad forward
        rightArmRef.current.rotation.x = -extend;
      } else {
        resetLimbs();
      }
      return;
    }

    const target = NPC_WAYPOINTS[waypointIdx.current];
    const dx = target[0] - ref.current.position.x;
    const dz = target[1] - ref.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      if (Math.random() < 0.4) {
        isBrowsing.current = true;
        waitTimer.current = 5 + Math.random() * 5;
        const npcZ = ref.current.position.z;
        const shelfZs = [-4, -1, 2];
        let nearestZ = shelfZs[0];
        let nearestDist = Math.abs(npcZ - shelfZs[0]);
        for (const sz of shelfZs) {
          const d = Math.abs(npcZ - sz);
          if (d < nearestDist) { nearestDist = d; nearestZ = sz; }
        }
        ref.current.rotation.y = nearestZ < npcZ ? Math.PI : 0;
      } else {
        isBrowsing.current = false;
        waitTimer.current = 1.0 + Math.random() * 1.5;
      }
      waypointIdx.current = (waypointIdx.current + direction.current + NPC_WAYPOINTS.length) % NPC_WAYPOINTS.length;
    } else {
      const nx = dx / dist;
      const nz = dz / dist;
      const newX = ref.current.position.x + nx * speed * dt;
      const newZ = ref.current.position.z + nz * speed * dt;

      if (npcTooCloseToOther(charlieId, newX, newZ)) {
        waitTimer.current = 0.3 + Math.random() * 0.3;
        resetLimbs();
      } else {
        if (!npcCollidesShelf(newX, ref.current.position.z)) ref.current.position.x = newX;
        if (!npcCollidesShelf(ref.current.position.x, newZ)) ref.current.position.z = newZ;
        ref.current.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
        ref.current.rotation.y = Math.atan2(nx, nz) + Math.PI;
        const swing = Math.sin(t * 8) * 0.3;
        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
      }
    }

    // When walking, head still scans at wider arc (Priority 6)
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.3;
    }

    // Priority 5: Mouth movement during conversation
    if (mouthRef.current) {
      if (activeDialogueTarget === "charlie") {
        const mouthAnim = 0.5 + 0.5 * (Math.sin(t * 11.1 + charlieSeed * 8) * 0.55 + Math.sin(t * 8.3 + 1.7) * 0.45);
        mouthRef.current.scale.y = 0.5 + mouthAnim;
      } else {
        mouthRef.current.scale.y = 1;
      }
    }
  });

  useEffect(() => {
    return () => { npcPositions.delete(charlieId); };
  }, []);

  return (
    <group ref={ref} position={startPos} scale={1.5} userData={{ interactType: "charlie", label: "Talk to Charlie" }}>
      {/* ── Legs (longer/skinnier than Vinny — he's lean) ── */}
      <mesh ref={leftLegRef} position={[-0.07, 0.2, 0]} userData={{ interactType: "charlie", label: "Talk to Charlie" }}>
        <boxGeometry args={[0.1, 0.4, 0.1]} /><Mat color="#1a3050" roughness={0.85} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.07, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} /><Mat color="#1a3050" roughness={0.85} />
      </mesh>
      {/* ── Shoes ── */}
      <mesh position={[-0.07, 0.025, 0]}>
        <boxGeometry args={[0.11, 0.05, 0.12]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0.07, 0.025, 0]}>
        <boxGeometry args={[0.11, 0.05, 0.12]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Belt ── */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.19]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Torso (narrow and tall — skinny film student) ── */}
      <RoundedBox ref={torsoRef} args={[0.28, 0.4, 0.18]} radius={0.03} smoothness={2} position={[0, 0.64, 0]}>
        <Mat color="#0a4a8a" roughness={0.7} />
      </RoundedBox>
      {/* ── Name tag (gold CHARLIE) ── */}
      <mesh position={[0.08, 0.67, -0.095]}>
        <boxGeometry args={[0.12, 0.06, 0.01]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.08, 0.67, -0.105]} rotation={[0, Math.PI, 0]} fontSize={0.022} color="#1a1a1a" anchorX="center" font={undefined}>CHARLIE</Text>
      {/* ── Staff badge (blue) ── */}
      <mesh position={[-0.08, 0.7, -0.095]}>
        <boxGeometry args={[0.1, 0.05, 0.01]} /><Mat color="#2266bb" emissive="#2266bb" emissiveIntensity={0.15} />
      </mesh>
      <Text position={[-0.08, 0.7, -0.105]} rotation={[0, Math.PI, 0]} fontSize={0.02} color="#ffffff" anchorX="center" font={undefined}>STAFF</Text>
      {/* ── Arms (skinny, blue shirt) ── */}
      <group position={[-0.19, 0.72, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.08]} /><Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} /><Mat color="#e8c4a0" roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.19, 0.72, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.08]} /><Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} /><Mat color="#e8c4a0" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Head (BIG, Minecraft-style, slightly less round than Vinny) ── */}
      <group ref={headRef} position={[0, 1.1, 0]}>
        {/* Head block */}
        <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.06} smoothness={2} position={[0, 0, 0]}>
          <Mat color="#e8c4a0" roughness={0.75} />
        </RoundedBox>
        {/* Brown hair — messy on top */}
        <mesh position={[0, 0.18, -0.01]}>
          <boxGeometry args={[0.36, 0.08, 0.36]} /><Mat color="#5a3a1a" roughness={0.9} />
        </mesh>
        {/* Tall messy tuft */}
        <mesh position={[0.02, 0.24, -0.02]}>
          <boxGeometry args={[0.2, 0.06, 0.2]} /><Mat color="#5a3a1a" roughness={0.9} />
        </mesh>
        {/* Eyes (no glasses — he's young) */}
        <mesh position={[-0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh ref={leftEyeRef} position={[-0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.03, -0.18]}>
          <sphereGeometry args={[0.02, 8, 8]} /><Mat color="#d4a574" roughness={0.8} />
        </mesh>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.1, -0.17]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} /><Mat color="#c07060" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Billboard name label ── */}
      <Billboard position={[0, 1.6, 0]}>
        <Text fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>CHARLIE</Text>
      </Billboard>
      {/* ── Shadow circle ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.25, 16]} /><Mat color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export function VinnyCharacter() {
  const ref = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  const vinnySeed = useMemo(() => seedFromId("vinny"), []);
  const { camera } = useThree();

  // Priority 1: breathing + head micro-movements (sway replaced by Priority 4 weight shift below)
  useLifelikeIdle(vinnySeed, torsoRef, headRef, ref, undefined);

  // Priority 2: blink
  useBlink(vinnySeed, leftEyeRef, rightEyeRef);

  // Counter lean timer
  const counterLeanTimer = useRef(12 + vinnySeed * 3); // first lean at 12-15s
  const isLeaning = useRef(false);
  const leanDuration = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);

    if (ref.current) {
      ref.current.position.y = Math.sin(t * 0.8) * 0.015;
      ref.current.rotation.z = Math.sin(t * 0.4) * 0.02;

      // Priority 4: Weight shift — subtle X oscillation on ~6s cycle
      const vinnyBaseX = getObjectById("vinny")?.x ?? 7;
      ref.current.position.x = vinnyBaseX + Math.sin(t * (Math.PI * 2 / 6)) * 0.02;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 0.6) * 0.15;
      leftArmRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    if (rightArmRef.current) {
      // Priority 9: Vinny pointing gesture during talking_to_player
      if (activeDialogueTarget === "vinny") {
        // Arm raises slightly and extends forward — "You gotta see this one"
        const pointTarget = -0.5; // forward rotation (negative X = arm extends forward)
        rightArmRef.current.rotation.x += (pointTarget - rightArmRef.current.rotation.x) * 0.05;
        rightArmRef.current.rotation.z += (-0.15 - rightArmRef.current.rotation.z) * 0.05; // slight outward
      } else {
        rightArmRef.current.rotation.x = Math.sin(t * 0.5 + 1.5) * 0.2;
        rightArmRef.current.rotation.z = Math.sin(t * 0.35 + 1.0) * 0.06;
      }
    }

    // Priority 4: Head tracking — lerp headRef.rotation.y toward camera X
    if (headRef.current && ref.current) {
      const vinnyWorldX = ref.current.position.x;
      const vinnyWorldZ = ref.current.position.z;
      const dx = camera.position.x - vinnyWorldX;
      const dz = camera.position.z - vinnyWorldZ;
      const targetYaw = Math.atan2(dx, -dz); // -z is forward for Vinny
      // Clamp tracking to ±0.6 rad so head doesn't spin around
      const clampedYaw = Math.max(-0.6, Math.min(0.6, targetYaw));
      // Lerp toward target with some base idle sway layered on
      const idleSway = Math.sin(t * 0.25) * 0.05;
      headRef.current.rotation.y += (clampedYaw + idleSway - headRef.current.rotation.y) * 0.03;
      headRef.current.rotation.x = Math.sin(t * 0.18) * 0.04;
      // head micro-movements (rotation.z) applied via useLifelikeIdle
    }

    // Priority 4: Counter lean — every ~12-15s, tilt torso forward for 3-4s
    if (torsoRef.current) {
      if (isLeaning.current) {
        leanDuration.current -= dt;
        if (leanDuration.current <= 0) {
          isLeaning.current = false;
          counterLeanTimer.current = 12 + Math.random() * 3;
        } else {
          // Smoothly lean forward: ease in/out over the duration
          const leanProgress = 1 - leanDuration.current / 3.5;
          const leanAmount = Math.sin(leanProgress * Math.PI) * 0.08; // peak 0.08 rad forward
          torsoRef.current.rotation.x = leanAmount;
        }
      } else {
        counterLeanTimer.current -= dt;
        if (counterLeanTimer.current <= 0) {
          isLeaning.current = true;
          leanDuration.current = 3 + Math.random(); // 3-4s
        }
        // Decay any residual lean
        torsoRef.current.rotation.x *= 0.95;
      }
    }

    // Priority 5: Mouth movement during conversation
    if (mouthRef.current) {
      if (activeDialogueTarget === "vinny") {
        // Semi-random fast oscillation: two overlapping sine waves
        const mouthAnim = 0.5 + 0.5 * (Math.sin(t * 12.3 + vinnySeed * 10) * 0.6 + Math.sin(t * 7.7 + 2.1) * 0.4);
        mouthRef.current.scale.y = 0.5 + mouthAnim; // range 0.5 to 1.5
      } else {
        mouthRef.current.scale.y = 1;
      }
    }
  });

  return (
    <group ref={ref} position={[getObjectById("vinny")?.x ?? 7, 0, getObjectById("vinny")?.z ?? 5.8]} scale={1.6} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
      {/* ── Legs (short, stubby, slightly apart) — scaled 1.15x for proper counter height ── */}
      <mesh position={[-0.08, 0.175, 0]} userData={{ interactType: "vinny", label: "Talk to Vinny" }}>
        <boxGeometry args={[0.12, 0.35, 0.12]} /><Mat color="#c2a66b" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.175, 0]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} /><Mat color="#c2a66b" roughness={0.85} />
      </mesh>
      {/* ── Shoes ── */}
      <mesh position={[-0.08, 0.025, 0]}>
        <boxGeometry args={[0.13, 0.05, 0.14]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.025, 0]}>
        <boxGeometry args={[0.13, 0.05, 0.14]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Belt ── */}
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[0.36, 0.04, 0.21]} /><Mat color="#2a1a0a" roughness={0.7} />
      </mesh>
      {/* ── Torso (short and wide) ── */}
      <RoundedBox ref={torsoRef} args={[0.35, 0.35, 0.2]} radius={0.03} smoothness={2} position={[0, 0.57, 0]}>
        <Mat color="#0a4a8a" roughness={0.7} />
      </RoundedBox>
      {/* ── Name tag (gold VINNY) ── */}
      <mesh position={[0.1, 0.6, -0.105]}>
        <boxGeometry args={[0.12, 0.06, 0.01]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.1, 0.6, -0.115]} rotation={[0, Math.PI, 0]} fontSize={0.025} color="#1a1a1a" anchorX="center" font={undefined}>VINNY</Text>
      {/* ── Manager badge (red) ── */}
      <mesh position={[-0.1, 0.63, -0.105]}>
        <boxGeometry args={[0.12, 0.05, 0.01]} /><Mat color="#cc2222" emissive="#cc2222" emissiveIntensity={0.15} />
      </mesh>
      <Text position={[-0.1, 0.63, -0.115]} rotation={[0, Math.PI, 0]} fontSize={0.02} color="#ffffff" anchorX="center" font={undefined}>MANAGER</Text>
      {/* ── Arms (short stubby) ── */}
      <group ref={leftArmRef} position={[-0.225, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.1]} /><Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} /><Mat color="#d4a574" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.225, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.1]} /><Mat color="#0a4a8a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} /><Mat color="#d4a574" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Head (BIG, Minecraft-style) ── */}
      <group ref={headRef} position={[0, 1.02, 0]}>
        {/* Head block */}
        <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.04} smoothness={2} position={[0, 0, 0]}>
          <Mat color="#d4a574" roughness={0.75} />
        </RoundedBox>
        {/* Hair (flat cap on top) */}
        <mesh position={[0, 0.17, -0.01]}>
          <boxGeometry args={[0.36, 0.06, 0.36]} /><Mat color="#2a1a0a" roughness={0.9} />
        </mesh>
        {/* Glasses — two square frames + bridge */}
        <mesh position={[-0.08, 0.02, -0.176]}>
          <boxGeometry args={[0.09, 0.07, 0.01]} /><Mat color="#5a3a1a" roughness={0.4} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.176]}>
          <boxGeometry args={[0.09, 0.07, 0.01]} /><Mat color="#5a3a1a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, -0.176]}>
          <boxGeometry args={[0.04, 0.015, 0.01]} /><Mat color="#5a3a1a" roughness={0.4} />
        </mesh>
        {/* Eyes (white spheres behind glasses) */}
        <mesh position={[-0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils (black, animated via refs) */}
        <mesh ref={leftEyeRef} position={[-0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        {/* Nose (small bump) */}
        <mesh position={[0, -0.03, -0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} /><Mat color="#c49a6a" roughness={0.8} />
        </mesh>
        {/* Mustache (one dark brown box) */}
        <mesh position={[0, -0.07, -0.175]}>
          <boxGeometry args={[0.14, 0.04, 0.03]} /><Mat color="#2a1a0a" roughness={0.9} />
        </mesh>
        {/* Mouth (small pink box, animated via ref) */}
        <mesh ref={mouthRef} position={[0, -0.1, -0.17]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} /><Mat color="#c07060" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Billboard name label ── */}
      <Billboard position={[0, 1.55, 0]}>
        <Text fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>VINNY</Text>
      </Billboard>
      {/* ── Shadow circle ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 16]} /><Mat color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ── Tony — Pizza Palace clerk (static, behind counter) ──
export function TonyCharacter() {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Subtle idle sway
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 0.7) * 0.01;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.3) * 0.12;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 0.45 + 1.2) * 0.12;
    }
  });

  return (
    <group ref={ref} position={[-13, 0, 4.8]} rotation={[0, Math.PI, 0]} scale={1.5} userData={{ interactType: "pizza_clerk", label: "Talk to Tony" }}>
      {/* ── Legs (short, stubby — like Vinny) ── */}
      <mesh position={[-0.09, 0.175, 0]} userData={{ interactType: "pizza_clerk", label: "Talk to Tony" }}>
        <boxGeometry args={[0.13, 0.35, 0.13]} /><Mat color="#1a1a2e" roughness={0.85} />
      </mesh>
      <mesh position={[0.09, 0.175, 0]}>
        <boxGeometry args={[0.13, 0.35, 0.13]} /><Mat color="#1a1a2e" roughness={0.85} />
      </mesh>
      {/* ── Shoes ── */}
      <mesh position={[-0.09, 0.025, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.15]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0.09, 0.025, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.15]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Belt ── */}
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.23]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Torso (wide and burly — broader than Vinny) ── */}
      <RoundedBox args={[0.38, 0.35, 0.22]} radius={0.03} smoothness={2} position={[0, 0.57, 0]}>
        <Mat color="#cc2222" roughness={0.7} />
      </RoundedBox>
      {/* ── Apron (white box on front of torso) ── */}
      <mesh position={[0, 0.52, -0.115]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} /><Mat color="#f5f5f0" roughness={0.6} />
      </mesh>
      {/* ── Name tag (gold TONY) ── */}
      <mesh position={[0.1, 0.6, -0.115]}>
        <boxGeometry args={[0.12, 0.06, 0.01]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.1, 0.6, -0.125]} rotation={[0, Math.PI, 0]} fontSize={0.025} color="#1a1a1a" anchorX="center" font={undefined}>TONY</Text>
      {/* ── Arms (red shirt, stubby) ── */}
      <group ref={leftArmRef} position={[-0.245, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.11, 0.3, 0.11]} /><Mat color="#cc2222" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} /><Mat color="#c49a6c" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.245, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.11, 0.3, 0.11]} /><Mat color="#cc2222" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} /><Mat color="#c49a6c" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Head (BIG, Minecraft-style) ── */}
      <group ref={headRef} position={[0, 1.02, 0]}>
        {/* Head block */}
        <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.04} smoothness={2} position={[0, 0, 0]}>
          <Mat color="#c49a6c" roughness={0.75} />
        </RoundedBox>
        {/* Dark hair (flat on top) */}
        <mesh position={[0, 0.17, -0.01]}>
          <boxGeometry args={[0.36, 0.06, 0.36]} /><Mat color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Eyes (no glasses) */}
        <mesh position={[-0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        <mesh position={[0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.03, -0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} /><Mat color="#b8896c" roughness={0.8} />
        </mesh>
        {/* Bushy mustache (wider than Vinny's) */}
        <mesh position={[0, -0.07, -0.175]}>
          <boxGeometry args={[0.18, 0.05, 0.03]} /><Mat color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, -0.1, -0.17]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} /><Mat color="#c07060" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Billboard name label ── */}
      <Billboard position={[0, 1.55, 0]}>
        <Text fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>TONY</Text>
      </Billboard>
      {/* ── Shadow circle ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 16]} /><Mat color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// ── Earl — Laundromat attendant (static, near folding table) ──
export function EarlCharacter() {
  const ref = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 0.6) * 0.01;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.1;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 0.4) * 0.08;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 0.35 + 1.0) * 0.1;
    }
  });

  return (
    <group ref={ref} position={[13, 0, 4.45]} rotation={[0, Math.PI, 0]} scale={1.45} userData={{ interactType: "laundro_clerk", label: "Talk to Earl" }}>
      {/* ── Legs (short, stubby) ── */}
      <mesh position={[-0.08, 0.175, 0]} userData={{ interactType: "laundro_clerk", label: "Talk to Earl" }}>
        <boxGeometry args={[0.12, 0.35, 0.12]} /><Mat color="#2a3a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.175, 0]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} /><Mat color="#2a3a2a" roughness={0.85} />
      </mesh>
      {/* ── Shoes ── */}
      <mesh position={[-0.08, 0.025, 0]}>
        <boxGeometry args={[0.13, 0.05, 0.14]} /><Mat color="#3a3a3a" roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.025, 0]}>
        <boxGeometry args={[0.13, 0.05, 0.14]} /><Mat color="#3a3a3a" roughness={0.7} />
      </mesh>
      {/* ── Belt ── */}
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.21]} /><Mat color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* ── Torso (normal build) ── */}
      <RoundedBox args={[0.32, 0.35, 0.2]} radius={0.03} smoothness={2} position={[0, 0.57, 0]}>
        <Mat color="#707070" roughness={0.7} />
      </RoundedBox>
      {/* ── Name tag (gold EARL) ── */}
      <mesh position={[0.1, 0.6, -0.105]}>
        <boxGeometry args={[0.12, 0.06, 0.01]} /><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.1, 0.6, -0.115]} rotation={[0, Math.PI, 0]} fontSize={0.025} color="#1a1a1a" anchorX="center" font={undefined}>EARL</Text>
      {/* ── Arms (gray shirt, stubby) ── */}
      <group ref={leftArmRef} position={[-0.21, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.1]} /><Mat color="#707070" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} /><Mat color="#b8896c" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.21, 0.65, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.1]} /><Mat color="#707070" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} /><Mat color="#b8896c" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Head (BIG, Minecraft-style — BALD, slightly darker skin) ── */}
      <group ref={headRef} position={[0, 1.02, 0]}>
        {/* Head block — no hair, just skin */}
        <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.04} smoothness={2} position={[0, 0, 0]}>
          <Mat color="#b8896c" roughness={0.75} />
        </RoundedBox>
        {/* Glasses — box frames (similar to Vinny) */}
        <mesh position={[-0.08, 0.02, -0.176]}>
          <boxGeometry args={[0.09, 0.07, 0.01]} /><Mat color="#2a2a2a" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.176]}>
          <boxGeometry args={[0.09, 0.07, 0.01]} /><Mat color="#2a2a2a" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, -0.176]}>
          <boxGeometry args={[0.04, 0.015, 0.01]} /><Mat color="#2a2a2a" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Eyes (behind glasses) */}
        <mesh position={[-0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.02, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><Mat color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        <mesh position={[0.08, 0.02, -0.2]}>
          <sphereGeometry args={[0.018, 8, 8]} /><Mat color="#1a1a1a" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.03, -0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} /><Mat color="#a07a5a" roughness={0.8} />
        </mesh>
        {/* Mouth (no mustache — he's clean-shaven) */}
        <mesh position={[0, -0.1, -0.17]}>
          <boxGeometry args={[0.08, 0.025, 0.02]} /><Mat color="#c07060" roughness={0.8} />
        </mesh>
      </group>
      {/* ── Billboard name label ── */}
      <Billboard position={[0, 1.55, 0]}>
        <Text fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>EARL</Text>
      </Billboard>
      {/* ── Shadow circle ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.28, 16]} /><Mat color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export const NPC_POOL = [
  { id: 'npc-a', shirtColor: '#3498db', hairColor: '#2a1a0a', skinTone: '#d4a574', hairStyle: 'flattop' as const },
  { id: 'npc-b', shirtColor: '#e74c3c', hairColor: '#4a3020', skinTone: '#c49a6c', hairStyle: 'long' as const },
  { id: 'npc-c', shirtColor: '#27ae60', hairColor: '#1a1a1a', skinTone: '#e8c4a0', hairStyle: 'cap' as const },
  { id: 'npc-d', shirtColor: '#9b59b6', hairColor: '#8b6914', skinTone: '#d4a574', hairStyle: 'ponytail' as const },
  { id: 'npc-e', shirtColor: '#e67e22', hairColor: '#3a1a0a', skinTone: '#c49a6c', hairStyle: 'flattop' as const },
  { id: 'npc-f', shirtColor: '#1abc9c', hairColor: '#2a2a2a', skinTone: '#e8c4a0', hairStyle: 'long' as const },
  { id: 'npc-g', shirtColor: '#c0392b', hairColor: '#6a4a2a', skinTone: '#d4a574', hairStyle: 'cap' as const },
  { id: 'npc-h', shirtColor: '#8e44ad', hairColor: '#1a1a1a', skinTone: '#c49a6c', hairStyle: 'ponytail' as const },
  { id: 'npc-i', shirtColor: '#2980b9', hairColor: '#4a2a0a', skinTone: '#e8c4a0', hairStyle: 'flattop' as const },
  { id: 'npc-j', shirtColor: '#d35400', hairColor: '#2a1a0a', skinTone: '#d4a574', hairStyle: 'long' as const },
  { id: 'npc-k', shirtColor: '#16a085', hairColor: '#3a3a3a', skinTone: '#c49a6c', hairStyle: 'cap' as const },
  { id: 'npc-l', shirtColor: '#f39c12', hairColor: '#1a1a1a', skinTone: '#e8c4a0', hairStyle: 'ponytail' as const },
];

export function KenneyModel({ model, position, rotation = [0, 0, 0], scale = 1 }: {
  model: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF(`/models/${model}.glb`);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />;
}

export { getRandomAdultPersonality };
