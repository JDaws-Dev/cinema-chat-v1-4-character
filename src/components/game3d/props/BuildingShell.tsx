"use client";

import React from "react";
import { Mat } from "../store-materials";
import { ROOM_H } from "../store-constants";

/**
 * BuildingShell — Continuous exterior envelope wrapping all three stores.
 *
 * Provides: back wall, back alley ground, service doors, roof cap, and
 * fills any gaps between tenant spaces. This makes the strip mall a REAL
 * BUILDING with four sides, not three open-backed boxes.
 *
 * World coordinates:
 *   Building front (storefront): z = +7
 *   Building back wall:          z = -7
 *   Pizza Palace left wall:      x = -16
 *   Stair enclosure right wall:  x = +17.4
 *   Ground: y = 0
 *   Commercial ceiling: y = 3.5
 *   Apartment roof: y = 6.5
 */

const BACK_WALL_Z = -7;       // Back wall position (shared with video store)
const FRONT_Z = 7;             // Storefront line
const LEFT_X = -16;            // Pizza Palace left wall
const RIGHT_X = 16;            // Laundromat right wall (stairwell extends beyond)
const STAIR_X = 17.6;          // Stair enclosure outer wall
const GROUND_Y = 0;
const CEIL_H = ROOM_H;         // 3.5m commercial ceiling
const WALL_T = 0.3;            // Exterior wall thickness
const BRICK = "#A0826A";       // Brick color (matches BuildingExterior)
const ROOF_COLOR = "#3a3a3a";
const CONCRETE = "#4a4a4a";
const ASPHALT = "#1a1a22";
const DOOR_COLOR = "#5a5a5a";  // Service door (metal gray)
const ALLEY_DEPTH = 5;         // Back alley depth

export function BuildingShell() {
  const buildingWidth = RIGHT_X - LEFT_X;  // 32m
  const buildingDepth = FRONT_Z - BACK_WALL_Z;  // 14m

  return (
    <group>
      {/* ══════════════════════════════════════════════════════════
          1. CONTINUOUS BACK WALL — closes the entire back of the building
          Spans from Pizza Palace left edge to Laundromat right edge
          ══════════════════════════════════════════════════════════ */}

      {/* Back wall — full width, ground to ceiling */}
      <mesh position={[(LEFT_X + RIGHT_X) / 2, CEIL_H / 2, BACK_WALL_Z - WALL_T / 2]}>
        <boxGeometry args={[buildingWidth + WALL_T, CEIL_H, WALL_T]} />
        <Mat color={BRICK} roughness={0.9} />
      </mesh>

      {/* Back wall — interior face (visible from inside stores looking back) */}
      {/* Video store back wall is already in store-architecture.tsx MergedArchitecture */}
      {/* Pizza Palace back wall interior */}
      <mesh position={[-13, CEIL_H / 2, BACK_WALL_Z + 0.01]}>
        <planeGeometry args={[6, CEIL_H]} />
        <Mat color="#4a3030" roughness={0.85} />
      </mesh>
      {/* Laundromat back wall interior */}
      <mesh position={[13, CEIL_H / 2, BACK_WALL_Z + 0.01]}>
        <planeGeometry args={[6, CEIL_H]} />
        <Mat color="#3a4a5a" roughness={0.85} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          2. ROOF CAP — flat commercial roof, SPLIT to avoid covering apartment section
          Left section: Pizza Palace + Video Store (x=-16 to x=10)
          Apartment section (x=10 to x=16) has its own roof from BuildingExterior
          ══════════════════════════════════════════════════════════ */}
      {/* Left roof: Pizza Palace + Video Store */}
      <mesh position={[(LEFT_X + 10) / 2, CEIL_H, (FRONT_Z + BACK_WALL_Z) / 2]}>
        <boxGeometry args={[10 - LEFT_X + WALL_T, 0.15, buildingDepth + WALL_T]} />
        <Mat color={ROOF_COLOR} roughness={0.95} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          2B. FACADE INFILL — closes the gap between storefront and apartment
          The laundromat storefront ends at z=7, y=3.5.
          The apartment front wall starts at z=6.7, y=3.7.
          Without infill, there's a black void visible from the parking lot.
          ══════════════════════════════════════════════════════════ */}

      {/* 2ND FLOOR FACADE — single solid brick wall covering the ENTIRE front
          of the 2-story section. Sits FORWARD of the storefront (z=7.2) so it's
          never occluded by awning/soffit geometry. Spans from commercial ceiling
          (y=3.5) to apartment roof (y=6.5), covering laundromat + stair section. */}
      <mesh position={[14.5, (CEIL_H + 6.5) / 2, FRONT_Z + 0.2]}>
        <boxGeometry args={[STAIR_X - 10 + 0.4, 6.5 - CEIL_H, 0.4]} />
        <Mat color={BRICK} roughness={0.9} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          3. SERVICE DOORS — one per tenant on the back wall
          Metal fire doors for deliveries and emergency exit
          ══════════════════════════════════════════════════════════ */}

      {/* Pizza Palace service door */}
      <group position={[-13, 0, BACK_WALL_Z - WALL_T / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Door frame */}
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Video Store service door */}
      <group position={[0, 0, BACK_WALL_Z - WALL_T / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Laundromat service door */}
      <group position={[13, 0, BACK_WALL_Z - WALL_T / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════
          4. BACK ALLEY — service road behind the building
          ══════════════════════════════════════════════════════════ */}

      {/* Alley ground (asphalt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, BACK_WALL_Z - ALLEY_DEPTH / 2]}>
        <planeGeometry args={[buildingWidth + 6, ALLEY_DEPTH]} />
        <Mat color={ASPHALT} roughness={0.95} />
      </mesh>

      {/* Alley curb against building */}
      <mesh position={[0, 0.05, BACK_WALL_Z - 0.4]}>
        <boxGeometry args={[buildingWidth + 2, 0.1, 0.2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>

      {/* Back fence / wall (across from building) */}
      <mesh position={[0, 1.2, BACK_WALL_Z - ALLEY_DEPTH]}>
        <boxGeometry args={[buildingWidth + 6, 2.4, 0.15]} />
        <Mat color="#3a3020" roughness={0.9} />
      </mesh>

      {/* Dumpster pads (concrete) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, -0.02, BACK_WALL_Z - 2]}>
        <planeGeometry args={[3, 2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.02, BACK_WALL_Z - 2]}>
        <planeGeometry args={[3, 2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>

      {/* Utility meters (on back wall, between doors) */}
      {[-7, 7].map((x, i) => (
        <group key={`meter-${i}`} position={[x, 1.2, BACK_WALL_Z - WALL_T - 0.05]}>
          <mesh><boxGeometry args={[0.3, 0.4, 0.15]} /><Mat color="#666" roughness={0.4} metalness={0.4} /></mesh>
          <mesh position={[0, -0.05, 0.08]}>
            <circleGeometry args={[0.06, 8]} />
            <Mat color="#ddd" roughness={0.3} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Security light above video store service door */}
      <mesh position={[0, 2.8, BACK_WALL_Z - WALL_T - 0.1]}>
        <boxGeometry args={[0.2, 0.1, 0.15]} />
        <meshBasicMaterial color="#ffeecc" />
      </mesh>
      <pointLight position={[0, 2.5, BACK_WALL_Z - 1.5]} intensity={0.6} distance={8} color="#ffe0a0" />

      {/* ══════════════════════════════════════════════════════════
          5. SHARED TENANT WALLS — close gaps between stores
          (Video store already has left/right walls in MergedArchitecture,
           but the adjacent store sides need their interior walls too)
          ══════════════════════════════════════════════════════════ */}

      {/* Pizza Palace right wall (shared with video store left wall at x=-10) */}
      {/* This is the interior face of the shared wall, visible from pizza side */}
      <mesh position={[-10 + 0.01, CEIL_H / 2, (BACK_WALL_Z + FRONT_Z) / 2]}>
        <planeGeometry args={[buildingDepth, CEIL_H]} />
        <Mat color="#4a3030" roughness={0.85} side={2} />
      </mesh>

      {/* Laundromat left wall (shared with video store right wall at x=+10) */}
      <mesh position={[10 - 0.01, CEIL_H / 2, (BACK_WALL_Z + FRONT_Z) / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[buildingDepth, CEIL_H]} />
        <Mat color="#3a4a5a" roughness={0.85} side={2} />
      </mesh>
    </group>
  );
}
