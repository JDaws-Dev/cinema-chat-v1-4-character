"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat } from "../store-materials";
import {
  APT_W, APT_D, APT_H, APT_Y,
  WALL_T, BLDG_GROUND, BLDG_ROOF, BLDG_FULL_H, BLDG_MID_Y, FLOOR_SEP_Y,
  TRIM_COLOR,
} from "./ApartmentInterior";

// Exterior colors
const BRICK_COLOR = "#A0826A";
const TRIM_BAND = "#7A6A5A";
const ROOF_COLOR = "#3a3a3a";
const FASCIA_COLOR = "#5C4A3A";
const STAIR_COLOR = "#888888";
const RAIL_COLOR = "#4a4a4a";
const DOOR_EXT_COLOR = "#5a3828";
const AWNING_COLOR = "#6B4226";

// ── Building Exterior Facade ──
function BuildingFacade() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;

  return (
    <group>
      {/* LEFT SIDE WALL — full height */}
      <mesh position={[-halfW - WALL_T / 2, BLDG_MID_Y, 0]}>
        <boxGeometry args={[WALL_T, BLDG_FULL_H, APT_D + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* RIGHT SIDE WALL — full height, with stair gap at top */}
      {/* Lower portion (ground to slab) */}
      <mesh position={[halfW + WALL_T / 2, BLDG_GROUND + APT_Y / 2, 0]}>
        <boxGeometry args={[WALL_T, APT_Y, APT_D + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Back section of right wall (z < 0.5) */}
      <mesh position={[halfW + WALL_T / 2, APT_H / 2, -halfD / 2 - 0.5]}>
        <boxGeometry args={[WALL_T, APT_H, halfD - 0.5]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Front section of right wall (z > 1.7, past door) */}
      <mesh position={[halfW + WALL_T / 2, APT_H / 2, halfD - 0.4]}>
        <boxGeometry args={[WALL_T, APT_H, 0.8]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Above door on right wall */}
      <mesh position={[halfW + WALL_T / 2, APT_H - 0.3, 1.15]}>
        <boxGeometry args={[WALL_T, 0.6, 1.0]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* BACK WALL — full height */}
      <mesh position={[0, BLDG_MID_Y, -halfD - WALL_T / 2]}>
        <boxGeometry args={[APT_W, BLDG_FULL_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* FRONT WALL — full height with window openings */}
      {/* Ground floor: far left section */}
      <mesh position={[-halfW + 0.6, BLDG_GROUND + APT_Y / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.2, APT_Y, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: far right section */}
      <mesh position={[halfW - 0.6, BLDG_GROUND + APT_Y / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.2, APT_Y, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: above laundromat window */}
      <mesh position={[-0.5, BLDG_GROUND + APT_Y - 0.4, halfD + WALL_T / 2]}>
        <boxGeometry args={[2.6, 0.8, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: below laundromat window */}
      <mesh position={[-0.5, BLDG_GROUND + 0.35, halfD + WALL_T / 2]}>
        <boxGeometry args={[2.6, 0.7, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: between laundromat window and door */}
      <mesh position={[1.2, BLDG_GROUND + APT_Y / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[0.6, APT_Y, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: above laundromat door */}
      <mesh position={[2.0, BLDG_GROUND + APT_Y - 0.5, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.0, 1.0, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* Upper floor front wall — with window opening */}
      {/* Left of apartment window */}
      <mesh position={[-halfW + 0.8, APT_H / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.6, APT_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Right of apartment window */}
      <mesh position={[halfW - 0.8, APT_H / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.6, APT_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Above apartment window */}
      <mesh position={[0.5, APT_H - 0.2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.8, 0.4, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Below apartment window */}
      <mesh position={[0.5, 0.25, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.8, 0.5, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* HORIZONTAL FLOOR SEPARATOR BAND */}
      <mesh position={[0, FLOOR_SEP_Y, halfD + WALL_T / 2 + 0.02]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.1, 0.15, 0.06]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      <mesh position={[-halfW - WALL_T / 2 - 0.02, FLOOR_SEP_Y, 0]}>
        <boxGeometry args={[0.06, 0.15, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      <mesh position={[halfW + WALL_T / 2 + 0.02, FLOOR_SEP_Y, 0]}>
        <boxGeometry args={[0.06, 0.15, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      <mesh position={[0, FLOOR_SEP_Y, -halfD - WALL_T / 2 - 0.02]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.1, 0.15, 0.06]} />
        <Mat color={TRIM_BAND} />
      </mesh>

      {/* STRUCTURAL FLOOR SLAB */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.4, 0.2, APT_D + WALL_T * 2 + 0.4]} />
        <Mat color="#9a9080" />
      </mesh>

      {/* EXTERIOR WINDOW FRAME (apartment level, front) */}
      <group position={[0.5, 1.4, halfD + WALL_T + 0.02]}>
        <mesh position={[0, 0.65, 0]}><boxGeometry args={[1.7, 0.08, 0.06]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0, -0.65, 0.02]}><boxGeometry args={[1.7, 0.08, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[-0.82, 0, 0]}><boxGeometry args={[0.08, 1.4, 0.06]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0.82, 0, 0]}><boxGeometry args={[0.08, 1.4, 0.06]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh>
          <planeGeometry args={[1.5, 1.2]} />
          <Mat color="#4a6a8a" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* EXTERIOR DOOR (apartment entrance, right side) */}
      <group position={[halfW + WALL_T + 0.01, 1.05, 1.15]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-0.48, 0, 0]}><boxGeometry args={[0.07, 2.15, 0.08]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0.48, 0, 0]}><boxGeometry args={[0.07, 2.15, 0.08]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[1.03, 0.07, 0.08]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.88, 2.05, 0.06]} /><Mat color={DOOR_EXT_COLOR} /></mesh>
        <mesh position={[0.32, 0, 0.05]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#b8960a" /></mesh>
        <Text position={[0, 0.7, 0.04]} fontSize={0.1} color="#d4a017" anchorX="center" anchorY="middle" font={undefined}>
          2A
        </Text>
      </group>

      {/* SMALL AWNING above exterior door */}
      <group position={[halfW + WALL_T + 0.3, 2.2, 1.15]}>
        <mesh rotation={[0.3, 0, 0]}><boxGeometry args={[1.2, 0.05, 0.6]} /><Mat color={AWNING_COLOR} /></mesh>
        <mesh position={[0, -0.03, 0.15]} rotation={[0.3, 0, 0]}>
          <planeGeometry args={[1.15, 0.5]} />
          <Mat color="#5a3a20" />
        </mesh>
      </group>
    </group>
  );
}

// ── Roof with overhang and fascia ──
function BuildingRoof() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;
  const overhang = 0.35;
  const roofThickness = 0.25;

  return (
    <group position={[0, BLDG_ROOF, 0]}>
      <mesh position={[0, roofThickness / 2, 0]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2, roofThickness, APT_D + WALL_T * 2 + overhang * 2]} />
        <Mat color={ROOF_COLOR} />
      </mesh>
      <mesh position={[0, 0, halfD + WALL_T + overhang]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2 + 0.1, 0.2, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      <mesh position={[0, 0, -halfD - WALL_T - overhang]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2 + 0.1, 0.2, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      <mesh position={[-halfW - WALL_T - overhang, 0, 0]}>
        <boxGeometry args={[0.06, 0.2, APT_D + WALL_T * 2 + overhang * 2]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      <mesh position={[halfW + WALL_T + overhang, 0, 0]}>
        <boxGeometry args={[0.06, 0.2, APT_D + WALL_T * 2 + overhang * 2]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
    </group>
  );
}

// ── Exterior Stairs with balusters and ground landing ──
function ExteriorStairs() {
  const stairCount = 10;
  const stairW = 1.1;
  const totalRise = APT_Y;
  const stairH = totalRise / stairCount;
  const stairD = 0.38;
  const halfW = APT_W / 2;
  const stairBaseY = -APT_Y;

  return (
    <group position={[halfW + WALL_T + 0.7, 0, 1.5]}>
      {/* Ground-level landing platform */}
      <mesh position={[0, stairBaseY + 0.06, stairD / 2 + 0.2]}>
        <boxGeometry args={[stairW + 0.3, 0.12, 0.8]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* Stair steps */}
      {Array.from({ length: stairCount }).map((_, i) => (
        <mesh key={`stair-${i}`} position={[0, stairBaseY + stairH * i + stairH / 2, -stairD * i]}>
          <boxGeometry args={[stairW, stairH, stairD]} />
          <Mat color={STAIR_COLOR} />
        </mesh>
      ))}

      {/* Stair stringer (left) */}
      <mesh position={[-stairW / 2 - 0.04, stairBaseY + totalRise / 2, -stairD * stairCount / 2]}
            rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
        <boxGeometry args={[0.06, Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount)) + 0.2, 0.15]} />
        <Mat color="#666666" />
      </mesh>
      {/* Stair stringer (right) */}
      <mesh position={[stairW / 2 + 0.04, stairBaseY + totalRise / 2, -stairD * stairCount / 2]}
            rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
        <boxGeometry args={[0.06, Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount)) + 0.2, 0.15]} />
        <Mat color="#666666" />
      </mesh>

      {/* Railing — left side */}
      <group>
        <mesh position={[-stairW / 2 - 0.06, stairBaseY + 0.55, 0.3]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        <mesh position={[-stairW / 2 - 0.06, -0.45, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {(() => {
          const railLen = Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount));
          return (
            <mesh position={[-stairW / 2 - 0.06, stairBaseY + totalRise / 2 + 0.55, -stairD * stairCount / 2 + 0.15]}
                  rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
              <boxGeometry args={[0.04, railLen, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
          );
        })()}
        {Array.from({ length: Math.floor(stairCount / 1.5) }).map((_, i) => {
          const t = (i + 0.5) / Math.floor(stairCount / 1.5);
          const by = stairBaseY + t * totalRise;
          const bz = -t * stairD * stairCount + 0.15;
          return (
            <mesh key={`bal-l-${i}`} position={[-stairW / 2 - 0.06, by + 0.35, bz]}>
              <boxGeometry args={[0.02, 0.7, 0.02]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
          );
        })}
      </group>

      {/* Railing — right side */}
      <group>
        <mesh position={[stairW / 2 + 0.06, stairBaseY + 0.55, 0.3]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        <mesh position={[stairW / 2 + 0.06, -0.45, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {(() => {
          const railLen = Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount));
          return (
            <mesh position={[stairW / 2 + 0.06, stairBaseY + totalRise / 2 + 0.55, -stairD * stairCount / 2 + 0.15]}
                  rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
              <boxGeometry args={[0.04, railLen, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
          );
        })()}
        {Array.from({ length: Math.floor(stairCount / 1.5) }).map((_, i) => {
          const t = (i + 0.5) / Math.floor(stairCount / 1.5);
          const by = stairBaseY + t * totalRise;
          const bz = -t * stairD * stairCount + 0.15;
          return (
            <mesh key={`bal-r-${i}`} position={[stairW / 2 + 0.06, by + 0.35, bz]}>
              <boxGeometry args={[0.02, 0.7, 0.02]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
          );
        })}
      </group>

      {/* Top landing platform */}
      <mesh position={[0, -0.06, -stairD * stairCount - 0.3]}>
        <boxGeometry args={[stairW + 0.4, 0.12, 1.0]} />
        <Mat color={STAIR_COLOR} />
      </mesh>
      {/* Landing railing (front edge) */}
      <mesh position={[0, 0.45, -stairD * stairCount - 0.75]}>
        <boxGeometry args={[stairW + 0.4, 0.04, 0.04]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      {/* Landing railing posts */}
      <mesh position={[-stairW / 2 - 0.15, 0.25, -stairD * stairCount - 0.75]}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      <mesh position={[stairW / 2 + 0.15, 0.25, -stairD * stairCount - 0.75]}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
    </group>
  );
}

/** Exterior porch light near apartment door */
function PorchLight() {
  const halfW = APT_W / 2;
  return (
    <group>
      {/* Light fixture on wall above door */}
      <mesh position={[halfW + WALL_T + 0.05, 2.4, 1.15]}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshBasicMaterial color="#d4a017" />
      </mesh>
      {/* Warm porch light — illuminates stairs and entrance */}
      <pointLight
        position={[halfW + WALL_T + 0.4, 2.3, 1.15]}
        intensity={0.8}
        distance={8}
        color="#ffe0a0"
      />
    </group>
  );
}

/** Full building exterior: facade, roof, stairs, porch light */
export function BuildingExterior() {
  return (
    <group>
      <BuildingFacade />
      <BuildingRoof />
      <ExteriorStairs />
      <PorchLight />
    </group>
  );
}
