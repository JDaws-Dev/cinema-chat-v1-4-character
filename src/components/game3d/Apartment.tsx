"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat } from "./store-materials";

// ── Apartment dimensions ──
const APT_W = 6;    // width (x)
const APT_D = 5;    // depth (z)  — slightly deeper than laundromat for a real studio feel
const APT_H = 2.8;  // ceiling height
const APT_Y = 4;    // one floor above ground (laundromat ceiling ~3.5 + slab)

// Laundromat group center is at x=13, z=5.75
// Apartment sits directly above: same x center, z center
const APT_X = 13;
const APT_Z = 5.75;

// Full building height from ground (world y=0) to apartment roof
// In local coords (group is at y=APT_Y), ground = -APT_Y, roof = APT_H
const BLDG_GROUND = -APT_Y;          // local y for world ground level
const BLDG_ROOF = APT_H;             // local y for roof top
const BLDG_FULL_H = APT_Y + APT_H;   // total building height = 6.8
const BLDG_MID_Y = (BLDG_GROUND + BLDG_ROOF) / 2; // center of full height

// Floor separator at laundromat ceiling / apartment floor
const SLAB_Y = 0;         // local y = 0 is the apartment floor / top of slab
const SLAB_WORLD_Y = APT_Y; // world y = 4
const FLOOR_SEP_Y = -0.15;  // just below apartment floor in local coords

// Wall thickness for exterior
const WALL_T = 0.2;

// Colors — warm 90s wood-paneling vibes (interior)
const FLOOR_COLOR = "#8B6914";      // warm hardwood
const WALL_COLOR = "#F5E6CC";       // cream walls
const BASEBOARD_COLOR = "#5C3A1E";  // dark wood baseboard
const CEILING_COLOR = "#E8DCC8";    // warm off-white
const TRIM_COLOR = "#6B4226";       // door/window trim

// Exterior colors
const BRICK_COLOR = "#A0826A";      // brick/tan exterior
const BRICK_DARK = "#8B7060";       // slightly darker for variation
const TRIM_BAND = "#7A6A5A";        // floor separator trim
const ROOF_COLOR = "#3a3a3a";       // dark roof
const FASCIA_COLOR = "#5C4A3A";     // roof edge trim
const STAIR_COLOR = "#888888";      // concrete stairs
const RAIL_COLOR = "#4a4a4a";       // metal railing
const DOOR_EXT_COLOR = "#5a3828";   // exterior door
const AWNING_COLOR = "#6B4226";     // door awning

// ── Building Exterior Facade ──
// Runs from ground (local y = -4) to roof (local y = 2.8)
// This is what you see from the parking lot: a proper 2-story building
function BuildingFacade() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;

  // Front wall faces parking lot (positive z direction)
  // Laundromat has its own front wall with door gap, so we only add
  // the APARTMENT LEVEL portion of the front (above slab) and fill gaps
  // Left/right/back walls run full height.

  return (
    <group>
      {/* ── LEFT SIDE WALL (x = -halfW) — full height ── */}
      <mesh position={[-halfW - WALL_T / 2, BLDG_MID_Y, 0]}>
        <boxGeometry args={[WALL_T, BLDG_FULL_H, APT_D + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* ── RIGHT SIDE WALL (x = +halfW) — full height, with stair gap at top ── */}
      {/* Lower portion (ground to slab) */}
      <mesh position={[halfW + WALL_T / 2, BLDG_GROUND + APT_Y / 2, 0]}>
        <boxGeometry args={[WALL_T, APT_Y, APT_D + WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Upper portion — behind the stairs area, door gap near z=1.15 local */}
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

      {/* ── BACK WALL (z = -halfD) — full height ── */}
      <mesh position={[0, BLDG_MID_Y, -halfD - WALL_T / 2]}>
        <boxGeometry args={[APT_W, BLDG_FULL_H, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>

      {/* ── FRONT WALL (z = +halfD) — full height with window openings ── */}
      {/* This is the parking lot facing wall. */}
      {/* Ground floor (laundromat level) — the laundromat has its own interior walls,
          but we need exterior cladding. Leave openings for laundromat window + door. */}
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
      {/* Ground floor: above laundromat window (transom area) */}
      <mesh position={[-0.5, BLDG_GROUND + APT_Y - 0.4, halfD + WALL_T / 2]}>
        <boxGeometry args={[2.6, 0.8, WALL_T]} />
        <Mat color={BRICK_COLOR} />
      </mesh>
      {/* Ground floor: below laundromat window (knee wall) */}
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

      {/* Upper floor front wall (apartment level) — with window opening */}
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

      {/* ── HORIZONTAL FLOOR SEPARATOR BAND ── */}
      {/* Visible trim band between ground floor and upper floor */}
      <mesh position={[0, FLOOR_SEP_Y, halfD + WALL_T / 2 + 0.02]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.1, 0.15, 0.06]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      {/* Band on left side */}
      <mesh position={[-halfW - WALL_T / 2 - 0.02, FLOOR_SEP_Y, 0]}>
        <boxGeometry args={[0.06, 0.15, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      {/* Band on right side */}
      <mesh position={[halfW + WALL_T / 2 + 0.02, FLOOR_SEP_Y, 0]}>
        <boxGeometry args={[0.06, 0.15, APT_D + WALL_T * 2 + 0.1]} />
        <Mat color={TRIM_BAND} />
      </mesh>
      {/* Band on back */}
      <mesh position={[0, FLOOR_SEP_Y, -halfD - WALL_T / 2 - 0.02]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.1, 0.15, 0.06]} />
        <Mat color={TRIM_BAND} />
      </mesh>

      {/* ── STRUCTURAL FLOOR SLAB ── */}
      {/* Concrete slab between laundromat ceiling and apartment floor */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + 0.4, 0.2, APT_D + WALL_T * 2 + 0.4]} />
        <Mat color="#9a9080" />
      </mesh>

      {/* ── EXTERIOR WINDOW FRAME (apartment level, front) ── */}
      {/* Protrudes from exterior wall so it's visible from parking lot */}
      <group position={[0.5, 1.4, halfD + WALL_T + 0.02]}>
        {/* Top frame */}
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[1.7, 0.08, 0.06]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Bottom frame (sill) — slight protrusion */}
        <mesh position={[0, -0.65, 0.02]}>
          <boxGeometry args={[1.7, 0.08, 0.1]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Left frame */}
        <mesh position={[-0.82, 0, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.06]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Right frame */}
        <mesh position={[0.82, 0, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.06]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Glass pane visible from outside */}
        <mesh>
          <planeGeometry args={[1.5, 1.2]} />
          <Mat color="#4a6a8a" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── EXTERIOR DOOR (apartment entrance, right side) ── */}
      {/* Visible on the right wall at the stair landing */}
      <group position={[halfW + WALL_T + 0.01, 1.05, 1.15]} rotation={[0, Math.PI / 2, 0]}>
        {/* Door frame */}
        <mesh position={[-0.48, 0, 0]}>
          <boxGeometry args={[0.07, 2.15, 0.08]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        <mesh position={[0.48, 0, 0]}>
          <boxGeometry args={[0.07, 2.15, 0.08]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.03, 0.07, 0.08]} />
          <Mat color={TRIM_COLOR} />
        </mesh>
        {/* Door panel */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.88, 2.05, 0.06]} />
          <Mat color={DOOR_EXT_COLOR} />
        </mesh>
        {/* Door knob */}
        <mesh position={[0.32, 0, 0.05]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#b8960a" />
        </mesh>
        {/* Door number */}
        <Text position={[0, 0.7, 0.04]} fontSize={0.1} color="#d4a017" anchorX="center" anchorY="middle" font={undefined}>
          2A
        </Text>
      </group>

      {/* ── SMALL AWNING above exterior door ── */}
      <group position={[halfW + WALL_T + 0.3, 2.2, 1.15]}>
        <mesh rotation={[0.3, 0, 0]}>
          <boxGeometry args={[1.2, 0.05, 0.6]} />
          <Mat color={AWNING_COLOR} />
        </mesh>
        {/* Awning underside */}
        <mesh position={[0, -0.03, 0.15]} rotation={[0.3, 0, 0]}>
          <planeGeometry args={[1.15, 0.5]} />
          <Mat color="#5a3a20" />
        </mesh>
      </group>
    </group>
  );
}

// ── Proper Roof with overhang and fascia ──
function BuildingRoof() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;
  const overhang = 0.35;
  const roofThickness = 0.25;

  return (
    <group position={[0, BLDG_ROOF, 0]}>
      {/* Main roof slab */}
      <mesh position={[0, roofThickness / 2, 0]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2, roofThickness, APT_D + WALL_T * 2 + overhang * 2]} />
        <Mat color={ROOF_COLOR} />
      </mesh>
      {/* Fascia — front */}
      <mesh position={[0, 0, halfD + WALL_T + overhang]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2 + 0.1, 0.2, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      {/* Fascia — back */}
      <mesh position={[0, 0, -halfD - WALL_T - overhang]}>
        <boxGeometry args={[APT_W + WALL_T * 2 + overhang * 2 + 0.1, 0.2, 0.06]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      {/* Fascia — left */}
      <mesh position={[-halfW - WALL_T - overhang, 0, 0]}>
        <boxGeometry args={[0.06, 0.2, APT_D + WALL_T * 2 + overhang * 2]} />
        <Mat color={FASCIA_COLOR} />
      </mesh>
      {/* Fascia — right */}
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
  const totalRise = APT_Y;     // from ground to apartment floor
  const stairH = totalRise / stairCount;
  const stairD = 0.38;
  const halfW = APT_W / 2;

  // Stairs go from ground (local y = -APT_Y) up to apartment floor (local y = 0)
  // They are on the right side, starting at front and going toward back (negative z)
  const stairBaseY = -APT_Y; // ground level in local coords

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

      {/* Stair stringer (side support — left) */}
      <mesh position={[-stairW / 2 - 0.04, stairBaseY + totalRise / 2, -stairD * stairCount / 2]}
            rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
        <boxGeometry args={[0.06, Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount)) + 0.2, 0.15]} />
        <Mat color="#666666" />
      </mesh>
      {/* Stair stringer (side support — right) */}
      <mesh position={[stairW / 2 + 0.04, stairBaseY + totalRise / 2, -stairD * stairCount / 2]}
            rotation={[Math.atan2(totalRise, stairD * stairCount), 0, 0]}>
        <boxGeometry args={[0.06, Math.sqrt(totalRise * totalRise + (stairD * stairCount) * (stairD * stairCount)) + 0.2, 0.15]} />
        <Mat color="#666666" />
      </mesh>

      {/* ── Railing — left side ── */}
      <group>
        {/* Bottom post */}
        <mesh position={[-stairW / 2 - 0.06, stairBaseY + 0.55, 0.3]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {/* Top post */}
        <mesh position={[-stairW / 2 - 0.06, -0.45, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {/* Rail bar (angled) */}
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
        {/* Balusters — left side */}
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

      {/* ── Railing — right side ── */}
      <group>
        {/* Bottom post */}
        <mesh position={[stairW / 2 + 0.06, stairBaseY + 0.55, 0.3]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {/* Top post */}
        <mesh position={[stairW / 2 + 0.06, -0.45, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <Mat color={RAIL_COLOR} />
        </mesh>
        {/* Rail bar (angled) */}
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
        {/* Balusters — right side */}
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

      {/* Top landing platform — connects to apartment door */}
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
  // Interior walls are inset from exterior walls to avoid z-fighting
  const inset = WALL_T + 0.01;
  return (
    <group>
      {/* Back wall (z = -halfD + inset) */}
      <mesh position={[0, APT_H / 2, -halfD + 0.01]}>
        <planeGeometry args={[APT_W, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Left wall (x = -halfW + inset) */}
      <mesh position={[-halfW + 0.01, APT_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[APT_D, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Right wall (x = halfW) — with door gap */}
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
      {/* Front wall (z = halfD) — with window */}
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
      {/* Window glass — looking out to parking lot */}
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 1.2]} />
        <Mat color="#4a6a8a" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Frame — wood trim */}
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

/** TV stand with CRT TV and VCR — against the back wall */
function TVArea() {
  return (
    <group position={[0, 0, -APT_D / 2 + 0.4]} userData={{ interactType: "apartment_vcr", label: "Watch & Rewind" }}>
      {/* TV stand / entertainment center */}
      <mesh position={[0, 0.35, 0]}><boxGeometry args={[1.4, 0.7, 0.5]} /><Mat color="#5C3A1E" /></mesh>
      {/* Shelf inside stand */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.3, 0.03, 0.45]} /><Mat color="#4A2E14" /></mesh>
      {/* Open front of cabinet */}
      <mesh position={[0, 0.35, 0.26]}><planeGeometry args={[1.2, 0.5]} /><meshBasicMaterial color="#2a1a0a" /></mesh>

      {/* CRT TV body */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.9, 0.7, 0.55]} /><Mat color="#333333" /></mesh>
      {/* CRT screen */}
      <mesh position={[0, 1.02, 0.28]}>
        <planeGeometry args={[0.65, 0.48]} />
        <meshBasicMaterial color="#1a2a1a" />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, 1.02, 0.279]}><planeGeometry args={[0.72, 0.55]} /><Mat color="#2a2a2a" /></mesh>
      {/* TV buttons on right side */}
      {[0, 0.08, 0.16].map((dy, i) => (
        <mesh key={`btn-${i}`} position={[0.42, 0.88 + dy, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <Mat color="#555555" />
        </mesh>
      ))}
      {/* Power LED */}
      <mesh position={[0.42, 0.75, 0.28]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>

      {/* VCR — sitting on shelf under TV */}
      <mesh position={[0, 0.28, 0.05]}><boxGeometry args={[0.6, 0.1, 0.35]} /><Mat color="#1a1a1a" /></mesh>
      {/* VCR slot */}
      <mesh position={[0, 0.30, 0.23]}><boxGeometry args={[0.35, 0.03, 0.01]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
      {/* VCR display */}
      <mesh position={[-0.1, 0.30, 0.231]}><planeGeometry args={[0.15, 0.04]} /><meshBasicMaterial color="#003300" /></mesh>
      {/* VCR buttons */}
      {[0.12, 0.17, 0.22, 0.27].map((bx, i) => (
        <mesh key={`vcr-btn-${i}`} position={[bx, 0.30, 0.231]}>
          <boxGeometry args={[0.03, 0.03, 0.005]} />
          <Mat color="#333333" />
        </mesh>
      ))}
      {/* REWIND label */}
      <Text position={[0, 0.38, 0.24]} fontSize={0.035} color="#cc9900" anchorX="center" anchorY="middle" font={undefined}>
        REWIND
      </Text>

      {/* A couple of VHS tapes next to VCR */}
      <mesh position={[0.4, 0.26, 0.05]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.12, 0.02, 0.19]} /><Mat color="#1a3a6a" /></mesh>
      <mesh position={[0.4, 0.28, 0.05]} rotation={[0, -0.1, 0]}><boxGeometry args={[0.12, 0.02, 0.19]} /><Mat color="#6a1a2a" /></mesh>
    </group>
  );
}

/** Couch facing the TV — 2 cushions, back, armrests */
function Couch() {
  return (
    <group position={[0, 0, 0.3]}>
      {/* Couch base/frame */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.8, 0.15, 0.7]} /><Mat color="#5a3a22" /></mesh>
      {/* Left cushion */}
      <mesh position={[-0.42, 0.35, 0.02]}><boxGeometry args={[0.8, 0.15, 0.6]} /><Mat color="#8B5E3C" /></mesh>
      {/* Right cushion */}
      <mesh position={[0.42, 0.35, 0.02]}><boxGeometry args={[0.8, 0.15, 0.6]} /><Mat color="#8B5E3C" /></mesh>
      {/* Back rest */}
      <mesh position={[0, 0.6, -0.28]}><boxGeometry args={[1.8, 0.45, 0.15]} /><Mat color="#7A4E2E" /></mesh>
      {/* Left armrest */}
      <mesh position={[-0.88, 0.45, 0]}><boxGeometry args={[0.15, 0.35, 0.7]} /><Mat color="#7A4E2E" /></mesh>
      {/* Right armrest */}
      <mesh position={[0.88, 0.45, 0]}><boxGeometry args={[0.15, 0.35, 0.7]} /><Mat color="#7A4E2E" /></mesh>
      {/* Throw pillow */}
      <mesh position={[-0.55, 0.48, 0.05]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.25, 0.25, 0.08]} />
        <Mat color="#cc8833" />
      </mesh>
    </group>
  );
}

/** Coffee table between couch and TV */
function CoffeeTable() {
  return (
    <group position={[0, 0, -0.6]}>
      {/* Table top */}
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.0, 0.05, 0.5]} /><Mat color={BASEBOARD_COLOR} /></mesh>
      {/* Legs */}
      {[[-0.42, -0.18], [-0.42, 0.18], [0.42, -0.18], [0.42, 0.18]].map(([lx, lz], i) => (
        <mesh key={`ctleg-${i}`} position={[lx, 0.2, lz]}><boxGeometry args={[0.04, 0.4, 0.04]} /><Mat color="#4A2E14" /></mesh>
      ))}
      {/* Magazine on table */}
      <mesh position={[-0.15, 0.44, 0.05]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.2, 0.01, 0.28]} /><meshBasicMaterial color="#cc4444" /></mesh>
      {/* Remote control */}
      <mesh position={[0.2, 0.44, -0.05]}><boxGeometry args={[0.05, 0.015, 0.15]} /><Mat color="#222222" /></mesh>
    </group>
  );
}

/** Trophy shelf — empty, will be populated with game rewards later */
function TrophyShelf() {
  return (
    <group position={[-APT_W / 2 + 0.15, 1.5, 0]} userData={{ interactType: "apartment_trophies", label: "Your Collection" }}>
      {/* Wall-mount back board — wood paneling vibe */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.0, 1.2, 0.06]} />
        <Mat color="#6B4226" />
      </mesh>
      {/* Three shelves */}
      {[-0.35, 0, 0.35].map((dy, i) => (
        <mesh key={`tshelf-${i}`} position={[0.04, dy, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.8, 0.04, 0.2]} />
          <Mat color="#7A5A30" />
        </mesh>
      ))}
      {/* Small brass label */}
      <mesh position={[0.04, -0.55, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.5]} />
        <meshBasicMaterial color="#b8960a" />
      </mesh>
      <Text position={[0.06, -0.55, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.04} color="#1a1a0a" anchorX="center" anchorY="middle" font={undefined}>
        TROPHIES & COLLECTIBLES
      </Text>
    </group>
  );
}

/** Kitchen corner — counter, sink, fridge */
function KitchenArea() {
  return (
    <group position={[-APT_W / 2 + 0.8, 0, -APT_D / 2 + 0.5]}>
      {/* Counter — L-shape along back-left corner */}
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[1.4, 0.05, 0.55]} /><Mat color="#8B7355" /></mesh>
      {/* Cabinet base */}
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[1.4, 0.82, 0.5]} /><Mat color="#5C3A1E" /></mesh>
      {/* Cabinet door lines */}
      <mesh position={[-0.35, 0.42, 0.26]}><planeGeometry args={[0.6, 0.7]} /><Mat color="#4A2E14" /></mesh>
      <mesh position={[0.35, 0.42, 0.26]}><planeGeometry args={[0.6, 0.7]} /><Mat color="#4A2E14" /></mesh>
      {/* Cabinet knobs */}
      <mesh position={[-0.08, 0.42, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#b8960a" /></mesh>
      <mesh position={[0.62, 0.42, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#b8960a" /></mesh>

      {/* Sink basin */}
      <mesh position={[0.2, 0.84, 0]}><boxGeometry args={[0.4, 0.08, 0.3]} /><meshBasicMaterial color="#c0c0c0" /></mesh>
      <mesh position={[0.2, 0.82, 0]}><boxGeometry args={[0.3, 0.06, 0.22]} /><meshBasicMaterial color="#a0a0a0" /></mesh>
      {/* Faucet */}
      <mesh position={[0.2, 0.95, -0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 6]} />
        <Mat color="#c0c0c0" />
      </mesh>
      <mesh position={[0.2, 1.02, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
        <Mat color="#c0c0c0" />
      </mesh>

      {/* Fridge — taller, to the left */}
      <mesh position={[-1.0, 0.95, 0]}><boxGeometry args={[0.7, 1.9, 0.6]} /><Mat color="#e0ddd8" /></mesh>
      {/* Fridge handle */}
      <mesh position={[-0.72, 1.2, 0.31]}><boxGeometry args={[0.03, 0.5, 0.03]} /><Mat color="#aaaaaa" /></mesh>
      {/* Freezer door line */}
      <mesh position={[-1.0, 1.55, 0.305]}><planeGeometry args={[0.65, 0.02]} /><meshBasicMaterial color="#cccccc" /></mesh>
      {/* Fridge magnets */}
      <mesh position={[-0.85, 1.35, 0.305]}><boxGeometry args={[0.06, 0.06, 0.01]} /><meshBasicMaterial color="#ff4444" /></mesh>
      <mesh position={[-1.1, 1.45, 0.305]}><boxGeometry args={[0.05, 0.05, 0.01]} /><meshBasicMaterial color="#44aa44" /></mesh>

      {/* Upper cabinet */}
      <mesh position={[0, 1.8, -0.05]}><boxGeometry args={[1.2, 0.6, 0.35]} /><Mat color="#5C3A1E" /></mesh>
      <mesh position={[0, 1.8, 0.13]}><planeGeometry args={[1.1, 0.5]} /><Mat color="#4A2E14" /></mesh>
    </group>
  );
}

/** Door/entrance from exterior stairs on right side (interior side) */
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

/** Small area rug under the coffee table */
function AreaRug() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, -0.2]}>
        <planeGeometry args={[2.2, 1.6]} />
        <Mat color="#6B3A3A" />
      </mesh>
      {/* Rug border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, -0.2]}>
        <planeGeometry args={[2.4, 1.8]} />
        <Mat color="#8B5A3A" />
      </mesh>
    </group>
  );
}

/** Wall clock above the TV */
function WallClock() {
  return (
    <group position={[0, 2.2, -APT_D / 2 + 0.05]}>
      <mesh><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#f0e8d0" /></mesh>
      <mesh position={[0, 0, 0.005]}><ringGeometry args={[0.16, 0.19, 16]} /><Mat color="#4a3020" /></mesh>
      {/* Hour hand */}
      <mesh position={[0, 0.04, 0.01]}><boxGeometry args={[0.015, 0.09, 0.005]} /><meshBasicMaterial color="#222222" /></mesh>
      {/* Minute hand */}
      <mesh position={[0.03, 0, 0.01]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.01, 0.12, 0.005]} /><meshBasicMaterial color="#222222" /></mesh>
    </group>
  );
}

/** Small poster/art on left wall */
function WallArt() {
  return (
    <group position={[-APT_W / 2 + 0.04, 1.6, -1.2]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      <mesh><boxGeometry args={[0.6, 0.45, 0.03]} /><Mat color="#3a2a1a" /></mesh>
      {/* "Poster" */}
      <mesh position={[0, 0, 0.02]}><planeGeometry args={[0.5, 0.35]} /><meshBasicMaterial color="#1a2a4a" /></mesh>
      <Text position={[0, 0, 0.025]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        BE KIND{"\n"}REWIND
      </Text>
    </group>
  );
}

// ── Main Apartment Component ──
export function Apartment() {
  return (
    <group position={[APT_X, APT_Y, APT_Z]}>
      {/* Warm ambient + point light */}
      <ambientLight intensity={0.3} color="#fff0d0" />
      <pointLight position={[0, APT_H - 0.3, 0]} intensity={0.8} distance={10} color="#ffe8c0" />
      {/* Secondary fill light near kitchen */}
      <pointLight position={[-2, 2, -1.5]} intensity={0.3} distance={5} color="#ffd8a0" />

      {/* ── Full building exterior facade (ground to roof) ── */}
      <BuildingFacade />
      <BuildingRoof />

      {/* ── Exterior stairs (right side, ground to apartment) ── */}
      <ExteriorStairs />

      {/* ── Interior structure ── */}
      <ApartmentFloor />
      <ApartmentWalls />
      <ApartmentCeiling />
      <ApartmentWindow />
      <ApartmentDoor />

      {/* Furniture */}
      <TVArea />
      <Couch />
      <CoffeeTable />
      <AreaRug />
      <TrophyShelf />
      <KitchenArea />

      {/* Decor */}
      <WallClock />
      <WallArt />
    </group>
  );
}
