"use client";

import React from "react";
import * as THREE from "three";
import { Mat } from "../store-materials";

// ── Shared apartment dimensions (re-exported for sibling modules) ──
export const APT_W = 6;    // width (x)
export const APT_D = 5;    // depth (z)
export const APT_H = 2.8;  // ceiling height
export const WALL_T = 0.2;

// ── Strip mall integration constants ──
// Ground floor (commercial) ceiling = ROOM_H = 3.5m
// Floor slab thickness = 0.2m sits on top of commercial roof: 3.5 to 3.7m
// Apartment floor starts at 3.7m (top of slab)
export const ROOM_H_COMMERCIAL = 3.5;
export const FLOOR_SLAB_T = 0.2;
export const APT_Y = ROOM_H_COMMERCIAL + FLOOR_SLAB_T; // 3.7m — apartment floor level

// Apartment front wall outer face at world z = 7.0 - 0.3 = 6.7 (0.3m setback from storefront)
// Front wall outer face in local coords = APT_D/2 + WALL_T = 2.7
// So APT_Z + 2.7 = 6.7 → APT_Z = 4.0
export const APT_X = 13;
export const APT_Z = 4.0;  // set back 0.3m from storefront facade

// Full building height helpers
export const BLDG_GROUND = -APT_Y;           // -3.7 (ground level in local coords)
export const BLDG_ROOF = APT_H;              // 2.8 (apartment roof in local coords)
export const BLDG_FULL_H = APT_Y + APT_H;   // 6.5m total
export const BLDG_MID_Y = (BLDG_GROUND + BLDG_ROOF) / 2;
export const FLOOR_SEP_Y = -0.15;

// Parapet constants (shared with Store.tsx)
export const PARAPET_H = 0.5;  // parapet height above commercial roofline
export const PARAPET_TOP_Y = ROOM_H_COMMERCIAL + PARAPET_H; // 4.0m world coords

// Colors — warm 90s wood-paneling vibes (interior)
export const FLOOR_COLOR = "#8B6914";
export const WALL_COLOR = "#F5E6CC";
export const BASEBOARD_COLOR = "#5C3A1E";
export const CEILING_COLOR = "#E8DCC8";
export const TRIM_COLOR = "#6B4226";

function ApartmentFloor() {
  return (
    <group>
      {/* Main hardwood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={FLOOR_COLOR} />
      </mesh>
      {/* Plank lines for texture */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-APT_W / 2 + 0.5 * i + 0.25, 0.012, 0]}>
          <planeGeometry args={[0.02, APT_D]} />
          <meshBasicMaterial color="#7A5A10" />
        </mesh>
      ))}
    </group>
  );
}

function ApartmentWalls() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;
  return (
    <group>
      {/* Back wall (z = -halfD) */}
      <mesh position={[0, APT_H / 2, -halfD + 0.01]}>
        <planeGeometry args={[APT_W, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Left wall (x = -halfW) */}
      <mesh position={[-halfW + 0.01, APT_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[APT_D, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Right wall — with door gap */}
      <mesh position={[halfW - 0.01, APT_H / 2, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.4, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[halfW - 0.01, APT_H / 2, 1.9]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.7, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[halfW - 0.01, 2.3, 1.15]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Front wall — with window */}
      <mesh position={[-1.5, APT_H / 2, halfD - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[2.25, APT_H / 2, halfD - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[0.5, 2.3, halfD - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[0.5, 0.3, halfD - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.6]} />
        <Mat color={WALL_COLOR} />
      </mesh>

      {/* Baseboards on all walls */}
      <mesh position={[0, 0.05, -halfD + 0.03]}>
        <boxGeometry args={[APT_W, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[-halfW + 0.03, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[APT_D, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[halfW - 0.03, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[APT_D, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[0, 0.05, halfD - 0.03]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[APT_W, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
    </group>
  );
}

function ApartmentCeiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, APT_H, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={CEILING_COLOR} />
      </mesh>
      {/* Ceiling light fixture */}
      <group position={[0, APT_H - 0.02, 0]}>
        {/* Base plate */}
        <mesh><boxGeometry args={[0.6, 0.04, 0.6]} /><Mat color="#c8c0b0" /></mesh>
        {/* Glass dome */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#fff8e0" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function ApartmentWindow() {
  const halfD = APT_D / 2;
  return (
    <group position={[0.5, 1.4, halfD - 0.02]}>
      {/* Window glass */}
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 1.2]} />
        <Mat color="#4a6a8a" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.62, -0.01]}><boxGeometry args={[1.5, 0.06, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0, -0.62, -0.01]}><boxGeometry args={[1.5, 0.06, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[-0.72, 0, -0.01]}><boxGeometry args={[0.06, 1.3, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0.72, 0, -0.01]}><boxGeometry args={[0.06, 1.3, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Center divider */}
      <mesh position={[0, 0, -0.01]}><boxGeometry args={[0.04, 1.2, 0.03]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Curtain rod */}
      <mesh position={[0, 0.8, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 1.8, 6]} />
        <Mat color="#8B7355" />
      </mesh>
      {/* Simple curtain panels */}
      <mesh position={[-0.65, 0.2, -0.04]}><planeGeometry args={[0.4, 1.1]} /><Mat color="#8B4513" /></mesh>
      <mesh position={[0.65, 0.2, -0.04]}><planeGeometry args={[0.4, 1.1]} /><Mat color="#8B4513" /></mesh>
    </group>
  );
}

function ApartmentDoor() {
  const halfW = APT_W / 2;
  return (
    <group position={[halfW - 0.03, 0, 1.15]} rotation={[0, -Math.PI / 2, 0]}
           userData={{ interactType: "apartment_exit", label: "Head Back to the Store" }}>
      {/* Door frame */}
      <mesh position={[-0.48, 1.05, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0.48, 1.05, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0, 2.12, 0]}><boxGeometry args={[1.02, 0.06, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Door panel */}
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.85, 2.0, 0.05]} /><Mat color="#4a3020" /></mesh>
      {/* Door knob */}
      <mesh position={[0.3, 1.0, 0.04]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#b8960a" /></mesh>
      {/* Peephole */}
      <mesh position={[0, 1.55, 0.03]}><sphereGeometry args={[0.015, 6, 6]} /><meshBasicMaterial color="#333333" /></mesh>
      {/* Welcome mat (inside) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0.4]}>
        <planeGeometry args={[0.7, 0.4]} />
        <Mat color="#5a4a30" />
      </mesh>
    </group>
  );
}

/** Interior lighting — ceiling light, TV-area light, floor fill, ambient boost */
function InteriorLighting() {
  return (
    <group>
      {/* Main ceiling point light */}
      <pointLight position={[0, APT_H - 0.3, 0]} intensity={1.2} distance={12} color="#ffe8c0" />
      {/* Secondary fill light near TV / back wall — warm, lower intensity */}
      <pointLight position={[0, 1.8, -APT_D / 2 + 1.0]} intensity={0.6} distance={6} color="#ffd8a0" />
      {/* Kitchen fill light */}
      <pointLight position={[-2, 2, -1.5]} intensity={0.4} distance={5} color="#ffd8a0" />
      {/* Low fill light — illuminates floor-level furniture (couch, coffee table, rug) */}
      <pointLight position={[0, 0.8, 0.5]} intensity={0.5} distance={6} color="#ffe0c0" />
      {/* Interior ambient boost — makes sure no areas are pitch black */}
      <ambientLight intensity={0.6} color="#fff0d0" />
    </group>
  );
}

/** All interior structure: walls, floor, ceiling, window, door, and interior lighting */
export function ApartmentInterior() {
  return (
    <group>
      <InteriorLighting />
      <ApartmentFloor />
      <ApartmentWalls />
      <ApartmentCeiling />
      <ApartmentWindow />
      <ApartmentDoor />
    </group>
  );
}
