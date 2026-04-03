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

      {/* BACK WALL — full height (apartment depth) */}
      <mesh position={[0, BLDG_MID_Y, -halfD - WALL_T / 2]}>
        <boxGeometry args={[APT_W, BLDG_FULL_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* ── GROUND-FLOOR EXTENSION — laundromat extends 3m deeper than apartment ── */}
      {/* Back wall extension (ground floor only, z=-2.5 to z=-5.5 in local) */}
      <mesh position={[0, BLDG_GROUND + APT_Y / 2, -halfD - 1.5 - WALL_T / 2]}>
        <boxGeometry args={[APT_W + WALL_T * 2, APT_Y, 3]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Right side wall extension for deeper ground floor */}
      <mesh position={[halfW + WALL_T / 2, BLDG_GROUND + APT_Y / 2, -halfD - 1.5]}>
        <boxGeometry args={[WALL_T, APT_Y, 3 + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Left side wall extension for deeper ground floor */}
      <mesh position={[-halfW - WALL_T / 2, BLDG_GROUND + APT_Y / 2, -halfD - 1.5]}>
        <boxGeometry args={[WALL_T, APT_Y, 3 + WALL_T]} />
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

      {/* Door, awning, and porch light are now part of ExteriorStairs for alignment */}
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

// ── Exterior Stairs — clean rewrite ──
/*
 * EXTERIOR STAIRS — runs along the right side of the building.
 *
 * Real-world reference: exterior metal staircase to 2nd-floor apartment above store.
 * - Stairs run PARALLEL to the building side wall (along z-axis)
 * - Start near the front (parking/street side, high z) going toward the back (low z)
 * - 1m clearance from building wall
 * - Landing at top with door on the building wall
 * - 14 risers at 0.19m (7.5") each = 2.66m rise... but we need 4m rise (APT_Y)
 *   So use 16 risers at 0.25m = 4.0m total rise
 * - Tread depth: 0.28m (11")
 * - Width: 1.0m (39")
 * - Handrail height: 0.95m above tread
 *
 * Coordinate reference (all LOCAL to apartment group at x=13, y=4, z=5.75):
 *   Building right wall surface: x = halfW + WALL_T/2 = 3.1 + 0.1 = 3.2
 *   Ground level: y = -APT_Y = -4
 *   Apartment floor: y = 0
 *   Front of building (parking side): z = halfD + WALL_T = 2.6
 *   Back of building: z = -halfD = -2.5
 */
function ExteriorStairs() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;
  const wallSurface = halfW + WALL_T / 2; // right wall outer surface x

  const STEP_COUNT = 16;
  const STEP_W = 1.0;      // stair width (x-axis)
  const STEP_RISE = 0.25;  // height per step
  const STEP_DEPTH = 0.28; // tread depth (z-axis)
  const TOTAL_RISE = STEP_COUNT * STEP_RISE; // 4.0
  const TOTAL_RUN = STEP_COUNT * STEP_DEPTH; // 4.48
  const GROUND_Y = -APT_Y; // -4
  const RAIL_H = 0.95;     // handrail height above tread

  // Stair center x: flush against building wall (0.1m gap + half stair width)
  const stairCenterX = wallSurface + 0.1 + STEP_W / 2; // 3.2 + 0.1 + 0.5 = 3.8

  // Stairs run from front (high z) to back (low z)
  // Bottom step z: near front of building
  const bottomZ = halfD; // 2.5 (front of building)
  // Top step z: bottomZ - TOTAL_RUN
  const topZ = bottomZ - TOTAL_RUN; // 2.5 - 4.48 = -1.98

  // Door position: on the right wall at the top landing z
  const doorZ = topZ - 0.3; // slightly past the top step

  return (
    <group>
      {/* ── GROUND LANDING ── */}
      <mesh position={[stairCenterX, GROUND_Y + 0.06, bottomZ + 0.5]}>
        <boxGeometry args={[STEP_W + 0.3, 0.12, 1.0]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* ── STAIR TREADS (individual steps, not solid blocks) ── */}
      {/* Each tread is a thin slab. An angled stringer underneath supports them. */}
      {Array.from({ length: STEP_COUNT }).map((_, i) => {
        const treadY = GROUND_Y + (i + 1) * STEP_RISE;
        const treadZ = bottomZ - i * STEP_DEPTH;
        return (
          <mesh key={`tread-${i}`} position={[stairCenterX, treadY, treadZ]}>
            <boxGeometry args={[STEP_W, 0.04, STEP_DEPTH + 0.02]} />
            <Mat color={STAIR_COLOR} />
          </mesh>
        );
      })}

      {/* ── SOLID UNDERSIDE (angled slab under all treads) ── */}
      {/* A single thick angled box that forms the solid underside of the staircase */}
      {(() => {
        const angle = Math.atan2(TOTAL_RISE, TOTAL_RUN);
        const hyp = Math.sqrt(TOTAL_RISE * TOTAL_RISE + TOTAL_RUN * TOTAL_RUN);
        const midY = GROUND_Y + TOTAL_RISE / 2;
        const midZ = bottomZ - TOTAL_RUN / 2;
        return (
          <mesh position={[stairCenterX, midY - 0.08, midZ]} rotation={[angle, 0, 0]}>
            <boxGeometry args={[STEP_W, 0.12, hyp]} />
            <Mat color="#666666" />
          </mesh>
        );
      })()}

      {/* ── TOP LANDING — connects stairs to building wall ── */}
      {/* Landing platform extends from stair edge to building wall */}
      <mesh position={[(wallSurface + stairCenterX + STEP_W / 2) / 2, -0.06, topZ - 0.5]}>
        <boxGeometry args={[stairCenterX + STEP_W / 2 - wallSurface + 0.2, 0.12, 1.5]} />
        <Mat color={STAIR_COLOR} />
      </mesh>
      {/* Landing support — solid fill underneath */}
      <mesh position={[stairCenterX, GROUND_Y + TOTAL_RISE / 2, topZ - 0.5]}>
        <boxGeometry args={[STEP_W + 0.3, TOTAL_RISE, 1.5]} />
        <Mat color="#555555" />
      </mesh>

      {/* ── RAILINGS ── */}
      {[-1, 1].map((side) => {
        const railX = stairCenterX + side * (STEP_W / 2 + 0.05);
        const angle = Math.atan2(TOTAL_RISE, TOTAL_RUN);
        const hyp = Math.sqrt(TOTAL_RISE * TOTAL_RISE + TOTAL_RUN * TOTAL_RUN);

        return (
          <group key={`rail-${side}`}>
            {/* Bottom post */}
            <mesh position={[railX, GROUND_Y + RAIL_H / 2, bottomZ]}>
              <boxGeometry args={[0.04, RAIL_H, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Top post */}
            <mesh position={[railX, RAIL_H / 2, topZ]}>
              <boxGeometry args={[0.04, RAIL_H, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Angled handrail */}
            <mesh
              position={[railX, GROUND_Y + TOTAL_RISE / 2 + RAIL_H, bottomZ - TOTAL_RUN / 2]}
              rotation={[angle, 0, 0]}
            >
              <boxGeometry args={[0.04, 0.04, hyp]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* 4 balusters */}
            {[0.2, 0.4, 0.6, 0.8].map((t) => (
              <mesh key={`bal-${side}-${t}`} position={[railX, GROUND_Y + t * TOTAL_RISE + RAIL_H / 2, bottomZ - t * TOTAL_RUN]}>
                <boxGeometry args={[0.025, RAIL_H, 0.025]} />
                <Mat color={RAIL_COLOR} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* ── TOP LANDING RAILING ── */}
      {/* Front edge railing (facing parking) */}
      <mesh position={[stairCenterX, RAIL_H, topZ + 0.2]}>
        <boxGeometry args={[STEP_W + 0.5, 0.04, 0.04]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      {/* Outer edge railing (away from building) */}
      <mesh position={[stairCenterX + STEP_W / 2 + 0.2, RAIL_H, topZ - 0.5]}>
        <boxGeometry args={[0.04, 0.04, 1.5]} />
        <Mat color={RAIL_COLOR} />
      </mesh>

      {/* ── DOOR on building wall at top landing ── */}
      <group position={[wallSurface + 0.06, 1.0, doorZ]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-0.45, 0, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0.45, 0, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.96, 0.06, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.84, 2.0, 0.05]} /><Mat color={DOOR_EXT_COLOR} /></mesh>
        <mesh position={[0.3, -0.1, 0.07]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#b8960a" /></mesh>
        <Text position={[0, 0.65, 0.07]} fontSize={0.1} color="#d4a017" anchorX="center" anchorY="middle" font={undefined}>2A</Text>
      </group>

      {/* ── AWNING above door ── */}
      <mesh position={[wallSurface + 0.5, 2.15, doorZ]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
        <Mat color={AWNING_COLOR} />
      </mesh>

      {/* ── PORCH LIGHT ── */}
      <mesh position={[wallSurface + 0.05, 2.3, doorZ + 0.4]}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshBasicMaterial color="#d4a017" />
      </mesh>
      <pointLight position={[stairCenterX, 2.2, doorZ]} intensity={0.8} distance={6} color="#ffe0a0" />
    </group>
  );
}

/** Full building exterior: facade, roof, stairs (includes door, awning, porch light) */
export function BuildingExterior() {
  return (
    <group>
      <BuildingFacade />
      <BuildingRoof />
      <ExteriorStairs />
    </group>
  );
}
