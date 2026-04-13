"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat } from "../store-materials";
import {
  APT_W, APT_D, APT_H, APT_Y,
  WALL_T, BLDG_GROUND, BLDG_ROOF, BLDG_FULL_H, BLDG_MID_Y, FLOOR_SEP_Y,
  TRIM_COLOR, ROOM_H_COMMERCIAL, FLOOR_SLAB_T, PARAPET_H,
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
/*
 * BuildingFacade — ONLY the 2nd floor (apartment level) exterior.
 *
 * The ground floor is the laundromat, rendered by props/Laundromat.tsx
 * and Store.tsx with the same commercial storefront style as the rest
 * of the strip mall (glass windows, aluminum frames, signage band).
 *
 * The apartment brick facade sits ON TOP of the shared strip mall
 * roofline, only covering the laundromat section. This makes the
 * building look like a unified strip mall with one section that has
 * a 2nd-floor apartment addition.
 */
function BuildingFacade() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;

  // Apartment level only: y=0 to y=APT_H (local), which is the 2nd floor
  const aptMidY = APT_H / 2; // center of apartment level (1.4)

  return (
    <group>
      {/* LEFT SIDE WALL — apartment level only */}
      <mesh position={[-halfW - WALL_T / 2, aptMidY, 0]}>
        <boxGeometry args={[WALL_T, APT_H, APT_D + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* RIGHT SIDE WALL — apartment level only, SOLID (fire code, stair side)
          Extended in Z to cover the stair landing area (landCZ ≈ -4.13 local) */}
      <mesh position={[halfW + WALL_T / 2, aptMidY, -0.8]}>
        <boxGeometry args={[WALL_T, APT_H, APT_D + WALL_T + 3.6]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* BACK WALL — apartment level, extended right to cover stair enclosure */}
      <mesh position={[0.6, aptMidY, -halfD - WALL_T / 2]}>
        <boxGeometry args={[APT_W + 1.2, APT_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* FRONT WALL — apartment level with window opening */}
      {/* Left of window */}
      <mesh position={[-halfW + 0.8, aptMidY, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.6, APT_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Right of window */}
      <mesh position={[halfW - 0.8, aptMidY, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.6, APT_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Above window */}
      <mesh position={[0.5, APT_H - 0.2, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.8, 0.4, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Below window */}
      <mesh position={[0.5, 0.25, halfD + WALL_T / 2]}>
        <boxGeometry args={[1.8, 0.5, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* NO ground-floor front wall — the laundromat storefront handles that,
          matching the strip mall's continuous commercial facade */}

      {/* TRIM BAND at apartment floor level — sits on top of the strip mall roofline */}
      <mesh position={[0, 0.02, halfD + WALL_T / 2 + 0.02]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.1, 0.08, 0.06]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      <mesh position={[-halfW - WALL_T / 2 - 0.02, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      <mesh position={[halfW + WALL_T / 2 + 0.02, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>

      {/* STRUCTURAL FLOOR SLAB — 0.2m thick, bottom at local y = -FLOOR_SLAB_T (world y = ROOM_H_COMMERCIAL) */}
      <mesh position={[0, -FLOOR_SLAB_T / 2, 0]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.4, FLOOR_SLAB_T, APT_D + WALL_T * 2 + 0.4]} />
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

// ── Exterior Stairs — COMPLETE REWRITE ──
/*
 * EXTERIOR STAIRS — solid stair enclosure attached to the right side of the building.
 *
 * Real-world reference: 2-story mixed-use building in a 1990s strip mall.
 * Ground floor is the laundromat, upper floor is the apartment.
 * Exterior stairs on the right side, enclosed in matching brick.
 *
 * Design:
 * - Staircase is a SOLID STRUCTURE (brick walls + closed underside) flush to building right wall
 * - Inner wall IS the building right wall (shared, no gap)
 * - Stairs run along right wall from front (high z, ground level) toward back (low z, apartment level)
 * - Underside is CLOSED by the outer wall + under-stair fill panel
 * - Small COVERED LANDING/PORCH at top (1.5m x 1.2m) with roof/awning
 * - Apartment door on landing, on building wall, facing toward stairs (rotated to face +z)
 * - Outer railing: metal with vertical balusters on outer (open) side of stairs
 * - Inner handrail mounted on building wall
 * - No windows on stair-side building wall (fire code) — handled by BuildingFacade
 * - Ground entry at front (high z): open face to walk in from sidewalk
 *
 * Dimensions (real-world based):
 * - 20 steps x 0.185m rise = 3.7m total rise (matches APT_Y = 3.7m)
 * - 20 steps x 0.28m tread = 5.6m total run
 * - Stair width: 1.0m
 * - Outer wall thickness: 0.15m
 * - Enclosure total width: 1.2m (1.0m stairs + 0.05m gap each side + 0.15m outer wall)
 * - Handrail height: 0.95m above tread
 * - Landing: 1.5m deep (z) x 1.2m wide (x)
 * - Door: 0.91m wide x 2.03m tall
 *
 * Coordinate reference (all LOCAL to apartment group at world x=13, y=3.7, z=4.0):
 *   Building right wall outer surface: x = halfW + WALL_T = 3.2
 *   Ground level: y = -APT_Y = -3.7
 *   Apartment floor: y = 0
 *   Front of building (street side): z = halfD = 2.5
 *   Back of building: z = -halfD = -2.5
 *
 *   Stair bottom (ground entry): y=-3.7, z=2.5
 *   Stair top (last step):       y≈0,   z=2.5 - 5.6 = -3.1
 *   Landing center:               y=0,   z=-3.85
 *   Landing back edge:            y=0,   z=-4.6
 */
function ExteriorStairs() {
  const halfW = APT_W / 2;   // 3.0
  const halfD = APT_D / 2;   // 2.5

  // Building right wall outer surface
  const wallX = halfW + WALL_T; // 3.2

  // Stair geometry — derived from APT_Y (3.7m rise from ground to apartment floor)
  const STAIR_W = 1.0;        // tread width (x)
  const RISE = 0.185;         // per step rise (3.7m / 20 steps)
  const TREAD = 0.28;         // per step depth (z)
  const STEPS = Math.round(APT_Y / RISE); // 20 steps
  const TOTAL_RISE = STEPS * RISE;  // 3.7m
  const TOTAL_RUN = STEPS * TREAD;  // 5.6m
  const GND = -APT_Y;         // -3.7 (ground level in local coords)

  // Enclosure dimensions
  const ENCL_W = 1.2;         // total width of stair structure (x)
  const WALL_THICK = 0.15;    // outer wall thickness
  const RAIL_H = 0.95;        // handrail height above tread

  // Landing
  const LAND_D = 1.5;         // landing depth (z)
  const LAND_W = ENCL_W;      // landing width = enclosure width

  // Key x positions
  const stairCX = wallX + ENCL_W / 2;   // 3.8 — center of stair treads
  const outerX = wallX + ENCL_W;         // 4.4 — outer face of enclosure

  // Key z positions — stairs descend from front (high z) to back (low z)
  const botZ = halfD;                    // 2.5 — ground entry (front of building)
  const topZ = botZ - TOTAL_RUN;         // -3.38 — top step
  const landCZ = topZ - LAND_D / 2;     // -4.13 — landing center
  const landBackZ = topZ - LAND_D;       // -4.88 — landing back edge

  // Enclosure extents
  const enclFrontZ = botZ + 0.15;       // slight frame at front
  const enclBackZ = landBackZ - 0.1;    // past landing back
  const enclLen = enclFrontZ - enclBackZ;
  const enclMidZ = (enclFrontZ + enclBackZ) / 2;

  // Enclosure height: ground to APARTMENT ROOF — fully closes the stair structure
  const enclH = APT_Y + APT_H;          // 6.5m (ground to apt roof)
  const enclMidY = GND + enclH / 2;     // -0.45

  return (
    <group>
      {/* ══════════════════════════════════════════════════════════════
          1. STAIR ENCLOSURE — brick walls forming the stair structure
          ══════════════════════════════════════════════════════════════ */}

      {/* OUTER WALL (positive x) — from ground to apartment floor, full length */}
      <mesh position={[outerX - WALL_THICK / 2, enclMidY, enclMidZ]}>
        <boxGeometry args={[WALL_THICK, enclH, enclLen]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* BACK WALL (low z) — closes the back of the stair enclosure */}
      <mesh position={[stairCX, enclMidY, enclBackZ + WALL_THICK / 2]}>
        <boxGeometry args={[ENCL_W, enclH, WALL_THICK]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* FRONT — open stairway (no wall blocking the stairs) */}
      {/* Entry columns only — frame the ground-level opening */}
      <mesh position={[outerX - WALL_THICK / 2, GND + 1.25, enclFrontZ]}>
        <boxGeometry args={[WALL_THICK, 2.5, 0.2]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* FLOOR SLAB inside enclosure at ground level — the concrete floor you walk on */}
      <mesh position={[stairCX, GND + 0.025, botZ + 0.3]}>
        <boxGeometry args={[STAIR_W + 0.1, 0.05, 0.6]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════
          2. SOLID UNDERSIDE — angled panel closing the stair soffit
          ══════════════════════════════════════════════════════════════ */}
      {(() => {
        const angle = Math.atan2(TOTAL_RISE, TOTAL_RUN);
        const hyp = Math.sqrt(TOTAL_RISE * TOTAL_RISE + TOTAL_RUN * TOTAL_RUN);
        return (
          <mesh
            position={[stairCX, GND + TOTAL_RISE / 2 - 0.15, botZ - TOTAL_RUN / 2]}
            rotation={[angle, 0, 0]}
          >
            <boxGeometry args={[STAIR_W + 0.04, 0.12, hyp]} />
            <Mat color="#666666" />
          </mesh>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          3. STAIR TREADS — 21 individual steps (tread + riser)
          ══════════════════════════════════════════════════════════════ */}
      {Array.from({ length: STEPS }).map((_, i) => {
        const y = GND + (i + 1) * RISE;
        const z = botZ - i * TREAD;
        return (
          <group key={`step-${i}`}>
            {/* Tread — horizontal surface */}
            <mesh position={[stairCX, y, z]}>
              <boxGeometry args={[STAIR_W, 0.05, TREAD + 0.02]} />
              <Mat color={STAIR_COLOR} />
            </mesh>
            {/* Riser — vertical face */}
            <mesh position={[stairCX, y - RISE / 2, z + TREAD / 2 + 0.01]}>
              <boxGeometry args={[STAIR_W, RISE, 0.04]} />
              <Mat color="#777777" />
            </mesh>
          </group>
        );
      })}

      {/* ══════════════════════════════════════════════════════════════
          4. TOP LANDING / PORCH — covered platform at apartment level
          ══════════════════════════════════════════════════════════════ */}

      {/* Landing floor slab */}
      <mesh position={[stairCX, -0.06, landCZ]}>
        <boxGeometry args={[LAND_W, 0.12, LAND_D]} />
        <Mat color={STAIR_COLOR} />
      </mesh>

      {/* Landing support — ONLY under the landing platform, set back from stair run
          so it doesn't block the player walking up. Extends from ground to just
          below the landing floor slab (y=-3.7 to y=-0.18 local). */}
      <mesh position={[stairCX, GND + (APT_Y - 0.24) / 2, landCZ - 0.3]}>
        <boxGeometry args={[LAND_W, APT_Y - 0.24, LAND_D * 0.6]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* Landing roof/awning */}
      <mesh position={[stairCX, APT_H - 0.3, landCZ]}>
        <boxGeometry args={[LAND_W + 0.3, 0.10, LAND_D + 0.3]} />
        <Mat color={ROOF_COLOR} />
      </mesh>
      {/* Awning fascia — front edge */}
      <mesh position={[stairCX, APT_H - 0.35, landCZ + LAND_D / 2 + 0.15]}>
        <boxGeometry args={[LAND_W + 0.3, 0.15, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      {/* Awning fascia — outer edge */}
      <mesh position={[outerX + 0.15, APT_H - 0.35, landCZ]}>
        <boxGeometry args={[0.06, 0.15, LAND_D + 0.3]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      {/* Awning fascia — back edge */}
      <mesh position={[stairCX, APT_H - 0.35, landCZ - LAND_D / 2 - 0.15]}>
        <boxGeometry args={[LAND_W + 0.3, 0.15, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════
          5. APARTMENT DOOR — on building right wall, at the landing
             Faces toward the stairs (+x direction, rotated 90deg)
          ══════════════════════════════════════════════════════════════ */}
      <group position={[wallX + 0.02, 1.015, landCZ]} rotation={[0, Math.PI / 2, 0]}
        userData={{ interactType: "apartment_door", label: "Enter Apartment 2A" }}>
        {/* Door frame */}
        <mesh position={[-0.47, 0, 0]}>
          <boxGeometry args={[0.06, 2.1, 0.1]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        <mesh position={[0.47, 0, 0]}>
          <boxGeometry args={[0.06, 2.1, 0.1]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.0, 0.06, 0.1]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Door panel (0.91m wide x 2.03m tall) */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.91, 2.03, 0.05]} />
          <Mat color={DOOR_EXT_COLOR} />
        </mesh>
        {/* Brass door knob */}
        <mesh position={[0.33, -0.1, 0.07]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#b8960a" />
        </mesh>
        {/* Apartment number "2A" */}
        <Text
          position={[0, 0.65, 0.07]}
          fontSize={0.12}
          color="#d4a017"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          2A
        </Text>
      </group>

      {/* ══════════════════════════════════════════════════════════════
          6. OUTER RAILING — metal with vertical balusters
             Runs along the outer (positive x) side of the open stairway
          ══════════════════════════════════════════════════════════════ */}

      {/* ── Stair-run railing (angled, follows the stair slope) ── */}
      {(() => {
        const angle = Math.atan2(TOTAL_RISE, TOTAL_RUN);
        const hyp = Math.sqrt(TOTAL_RISE * TOTAL_RISE + TOTAL_RUN * TOTAL_RUN);
        const railX = outerX - WALL_THICK + 0.02; // inner face of outer wall + small offset

        return (
          <group>
            {/* Angled top handrail */}
            <mesh
              position={[railX, GND + TOTAL_RISE / 2 + RAIL_H, botZ - TOTAL_RUN / 2]}
              rotation={[angle, 0, 0]}
            >
              <boxGeometry args={[0.05, 0.05, hyp]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Bottom post */}
            <mesh position={[railX, GND + RAIL_H / 2, botZ]}>
              <boxGeometry args={[0.05, RAIL_H, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Top post */}
            <mesh position={[railX, RAIL_H / 2, topZ]}>
              <boxGeometry args={[0.05, RAIL_H, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Vertical balusters every ~0.6m along the stair run */}
            {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => {
              const bY = GND + t * TOTAL_RISE;
              const bZ = botZ - t * TOTAL_RUN;
              return (
                <mesh key={`sb-${t}`} position={[railX, bY + RAIL_H / 2, bZ]}>
                  <boxGeometry args={[0.025, RAIL_H, 0.025]} />
                  <Mat color={RAIL_COLOR} />
                </mesh>
              );
            })}
          </group>
        );
      })()}

      {/* ── Inner handrail (wall-mounted, on the building wall side) ── */}
      {(() => {
        const angle = Math.atan2(TOTAL_RISE, TOTAL_RUN);
        const hyp = Math.sqrt(TOTAL_RISE * TOTAL_RISE + TOTAL_RUN * TOTAL_RUN);
        return (
          <mesh
            position={[wallX + 0.05, GND + TOTAL_RISE / 2 + RAIL_H, botZ - TOTAL_RUN / 2]}
            rotation={[angle, 0, 0]}
          >
            <boxGeometry args={[0.04, 0.04, hyp]} />
            <Mat color={RAIL_COLOR} />
          </mesh>
        );
      })()}

      {/* ── Top landing railings (metal with balusters) ── */}
      {(() => {
        const frontZ = landCZ + LAND_D / 2;
        const backZ = landCZ - LAND_D / 2;
        const railX = outerX - WALL_THICK + 0.02;
        const railHalf = RAIL_H / 2;
        return (
          <group>
            {/* Outer railing top bar (positive x edge, runs front-to-back) */}
            <mesh position={[railX, RAIL_H, landCZ]}>
              <boxGeometry args={[0.04, 0.04, LAND_D]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Back railing top bar (low z edge, runs wall-to-outer) */}
            <mesh position={[stairCX, RAIL_H, backZ]}>
              <boxGeometry args={[LAND_W, 0.04, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            {/* Short front railing segment (from stair opening edge to outer corner) */}
            <mesh position={[stairCX + STAIR_W / 2 + (ENCL_W - STAIR_W) / 4, RAIL_H, frontZ]}>
              <boxGeometry args={[(ENCL_W - STAIR_W) / 2, 0.04, 0.04]} />
              <Mat color={RAIL_COLOR} />
            </mesh>

            {/* Corner posts */}
            <mesh position={[railX, railHalf, frontZ]}>
              <boxGeometry args={[0.05, RAIL_H, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            <mesh position={[railX, railHalf, backZ]}>
              <boxGeometry args={[0.05, RAIL_H, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>
            <mesh position={[wallX, railHalf, backZ]}>
              <boxGeometry args={[0.05, RAIL_H, 0.05]} />
              <Mat color={RAIL_COLOR} />
            </mesh>

            {/* Balusters on outer railing (4 evenly spaced) */}
            {[0.2, 0.4, 0.6, 0.8].map((t) => (
              <mesh key={`lo-${t}`} position={[railX, railHalf, backZ + t * LAND_D]}>
                <boxGeometry args={[0.025, RAIL_H, 0.025]} />
                <Mat color={RAIL_COLOR} />
              </mesh>
            ))}
            {/* Balusters on back railing (3 evenly spaced) */}
            {[0.25, 0.5, 0.75].map((t) => (
              <mesh key={`lb-${t}`} position={[wallX + t * LAND_W, railHalf, backZ]}>
                <boxGeometry args={[0.025, RAIL_H, 0.025]} />
                <Mat color={RAIL_COLOR} />
              </mesh>
            ))}
          </group>
        );
      })()}

      {/* ── PORCH LIGHT (above door) ── */}
      <mesh position={[wallX + 0.06, 2.2, landCZ]}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshBasicMaterial color="#d4a017" />
      </mesh>
      <pointLight
        position={[stairCX, 1.8, landCZ]}
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
