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
// 12 steps from ground (local y = -APT_Y = -4) up to apartment floor (local y = 0).
// Right side of building (positive x, beyond right wall).
// Stairs ascend from parking-lot side (+z) toward building back (-z).
// Door on right wall at top landing.
function ExteriorStairs() {
  const halfW = APT_W / 2; // 3

  // Step geometry
  const stepCount = 12;
  const stepW = 1.0;
  const stepRise = 0.33;
  const stepDepth = 0.35;
  const totalRise = stepCount * stepRise; // 3.96
  const totalRun = stepCount * stepDepth; // 4.2

  // X position: center of stairway, just outside right wall
  const stairX = halfW + WALL_T + stepW / 2 + 0.1; // 3.0 + 0.2 + 0.5 + 0.1 = 3.8

  // Ground level in local coords
  const groundY = -APT_Y; // -4

  // Door z-position on right wall (centered in a reasonable spot)
  const doorZ = 0.6;

  // Top of stairs z = door z + small landing depth/2
  const topLandingZ = doorZ;
  // Bottom of stairs: further into parking lot (higher z)
  const bottomStepZ = topLandingZ + totalRun; // 0.6 + 4.2 = 4.8

  // Railing math
  const railAngle = Math.atan2(totalRise, totalRun); // angle in radians
  const railLength = Math.sqrt(totalRise * totalRise + totalRun * totalRun);
  const postH = 1.0; // post height above stair surface

  return (
    <group>
      {/* ── GROUND LANDING (bottom, toward parking lot) ── */}
      <mesh position={[stairX, groundY + 0.06, bottomStepZ + 0.6]}>
        <boxGeometry args={[stepW + 0.4, 0.12, 1.2]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* ── STAIR STEPS ── */}
      {/* i=0 is bottom step (near ground), i=11 is top step (near door) */}
      {Array.from({ length: stepCount }).map((_, i) => {
        // Each step top surface: groundY + (i+1)*stepRise
        // Z goes from bottomStepZ (i=0) toward topLandingZ (i=11)
        const stepTopY = groundY + (i + 1) * stepRise;
        const stepZ = bottomStepZ - i * stepDepth - stepDepth / 2;
        // Solid block from ground up to step surface
        const blockH = (i + 1) * stepRise;
        return (
          <mesh key={`step-${i}`} position={[stairX, groundY + blockH / 2, stepZ]}>
            <boxGeometry args={[stepW, blockH, stepDepth + 0.01]} />
            <Mat color={STAIR_COLOR} />
          </mesh>
        );
      })}

      {/* ── TOP LANDING PLATFORM ── */}
      {/* Sits at apartment floor level (y=0), connects last step to door */}
      <mesh position={[stairX, -0.06, topLandingZ]}>
        <boxGeometry args={[stepW + 0.4, 0.12, stepDepth + 0.8]} />
        <Mat color={STAIR_COLOR} />
      </mesh>
      {/* Fill underneath top landing to make it solid */}
      <mesh position={[stairX, groundY + totalRise / 2, topLandingZ]}>
        <boxGeometry args={[stepW + 0.4, totalRise, stepDepth + 0.8]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* ── STAIR RAILINGS (both sides) ── */}
      {[-1, 1].map((side) => {
        const railX = stairX + side * (stepW / 2 + 0.08);

        // Bottom post at ground landing
        const botPostY = groundY + postH / 2;
        const botPostZ = bottomStepZ;

        // Top post at top landing
        const topPostY = postH / 2; // top of stairs is y=0
        const topPostZ = topLandingZ + 0.2;

        // Angled rail: center point between bottom-post-top and top-post-top
        // Bottom post top: y = groundY + postH, z = bottomStepZ
        // Top post top: y = postH, z = topLandingZ + 0.2
        const railMidY = (groundY + postH + postH) / 2;
        const railMidZ = (bottomStepZ + topPostZ) / 2;

        return (
          <group key={`rail-${side}`}>
            {/* Bottom post */}
            <mesh position={[railX, botPostY, botPostZ]}>
              <boxGeometry args={[0.05, postH, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Top post */}
            <mesh position={[railX, topPostY, topPostZ]}>
              <boxGeometry args={[0.05, postH, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>

            {/* Angled top rail bar */}
            {/* The bar runs along z (depth), tilting upward in y. */}
            {/* rotation around x-axis tilts the z-extent into y. */}
            {/* For a box with depth along z, rotating by -railAngle around x raises the -z end. */}
            <mesh
              position={[railX, railMidY, railMidZ]}
              rotation={[-railAngle, 0, 0]}
            >
              <boxGeometry args={[0.04, 0.04, railLength + 0.2]} />
              <Mat color={RAIL_COLOR} />
            </mesh>

            {/* Balusters — 5 evenly spaced */}
            {Array.from({ length: 5 }).map((_, bi) => {
              const t = (bi + 1) / 6;
              const balBaseY = groundY + t * totalRise; // stair surface at this point
              const balZ = bottomStepZ - t * totalRun;
              return (
                <mesh key={`bal-${side}-${bi}`} position={[railX, balBaseY + postH / 2, balZ]}>
                  <boxGeometry args={[0.03, postH, 0.03]} />
                  <Mat color={RAIL_COLOR} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── TOP LANDING RAILINGS ── */}
      {/* Outer railing along parking-facing edge of landing */}
      <mesh position={[stairX, 0.5, topLandingZ + 0.55]}>
        <boxGeometry args={[stepW + 0.4, 0.04, 0.04]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      {/* Landing railing posts (parking-facing edge) */}
      <mesh position={[stairX - stepW / 2 - 0.15, 0.25, topLandingZ + 0.55]}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      <mesh position={[stairX + stepW / 2 + 0.15, 0.25, topLandingZ + 0.55]}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <Mat color={RAIL_COLOR} />
      </mesh>
      {/* Far-side railing (away from building, along x+) */}
      <mesh position={[stairX + stepW / 2 + 0.15, 0.5, topLandingZ]}>
        <boxGeometry args={[0.04, 0.04, stepDepth + 0.8]} />
        <Mat color={RAIL_COLOR} />
      </mesh>

      {/* ── EXTERIOR DOOR at top landing on right wall ── */}
      {/* Door faces +x direction, centered at doorZ on the right wall surface */}
      <group position={[halfW + WALL_T / 2 + 0.02, 1.05, doorZ]} rotation={[0, Math.PI / 2, 0]}>
        {/* Door frame — left jamb */}
        <mesh position={[-0.48, 0, 0]}>
          <boxGeometry args={[0.07, 2.15, 0.12]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Door frame — right jamb */}
        <mesh position={[0.48, 0, 0]}>
          <boxGeometry args={[0.07, 2.15, 0.12]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Door frame — header */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.03, 0.07, 0.12]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Door panel */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.88, 2.05, 0.06]} />
          <Mat color={DOOR_EXT_COLOR} />
        </mesh>
        {/* Door knob */}
        <mesh position={[0.32, -0.1, 0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#b8960a" />
        </mesh>
        {/* Unit number "2A" */}
        <Text
          position={[0, 0.7, 0.08]}
          fontSize={0.12}
          color="#d4a017"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          2A
        </Text>
      </group>

      {/* ── AWNING above door ── */}
      <group position={[halfW + WALL_T / 2 + 0.4, 2.2, doorZ]}>
        <mesh rotation={[0.25, 0, 0]}>
          <boxGeometry args={[1.3, 0.06, 0.7]} />
          <Mat color={AWNING_COLOR} />
        </mesh>
        {/* Awning underside */}
        <mesh position={[0, -0.04, 0.2]} rotation={[0.25, 0, 0]}>
          <planeGeometry args={[1.25, 0.6]} />
          <Mat color="#5a3a20" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── PORCH LIGHT ── */}
      {/* Fixture on wall above and to right of door */}
      <mesh position={[halfW + WALL_T / 2 + 0.06, 2.4, doorZ + 0.5]}>
        <boxGeometry args={[0.12, 0.18, 0.12]} />
        <meshBasicMaterial color="#d4a017" />
      </mesh>
      {/* Warm point light */}
      <pointLight
        position={[stairX, 2.3, doorZ]}
        intensity={0.8}
        distance={6}
        color="#ffe0a0"
      />
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
