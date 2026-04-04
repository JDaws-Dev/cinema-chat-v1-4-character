"use client";

import React, { createContext, useContext, useMemo } from "react";
import * as THREE from "three";

/**
 * SmartBox — position Y means BOTTOM, not center.
 * 
 * The #1 source of floating objects is Three.js positioning from center.
 * This component auto-offsets so position={[x, 0, z]} sits ON the floor.
 * 
 * Usage:
 *   <SmartBox size={[2, 3, 0.2]} position={[0, 0, -5]} color="#1a3a6a" />
 *   // This box sits on the floor at y=0, not floating at y=-1.5
 */
export function SmartBox({
  size = [1, 1, 1] as [number, number, number],
  position = [0, 0, 0] as [number, number, number],
  color = "#ccc",
  children,
  ...props
}: {
  size?: [number, number, number];
  position?: [number, number, number];
  color?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  const [w, h, d] = size;
  const [x, y, z] = position;

  return (
    <mesh position={[x, y + h / 2, z]} {...props}>
      <boxGeometry args={[w, h, d]} />
      {children ?? <meshStandardMaterial color={color} />}
    </mesh>
  );
}

/**
 * PivotBottom — wraps any children so position Y = bottom, not center.
 * 
 * Unlike SmartBox (which creates its own box), PivotBottom wraps
 * arbitrary children and shifts them up by height/2.
 * 
 * Usage:
 *   <PivotBottom height={3} position={[0, 0, 0]}>
 *     <boxGeometry args={[1, 3, 1]} />
 *     <meshToonMaterial color="red" />
 *   </PivotBottom>
 */
export function PivotBottom({
  height,
  position = [0, 0, 0] as [number, number, number],
  children,
  ...props
}: {
  height: number;
  position?: [number, number, number];
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <group position={position} {...props}>
      <group position={[0, height / 2, 0]}>
        {children}
      </group>
    </group>
  );
}

/**
 * WORLD_ANCHORS — named reference points in the scene.
 * 
 * Instead of position={[13.2, 0, -4.1]}, use:
 *   const pos = offsetFrom(WORLD_ANCHORS.LAUNDROMAT_ENTRANCE, [2, 0, 0])
 *   // = [15.2, 0, -4.1] — "2 meters right of the laundromat entrance"
 * 
 * All positions in WORLD coordinates (not local to any group).
 */
export const WORLD_ANCHORS = {
  // Strip mall storefronts (front door positions)
  VIDEO_STORE_ENTRANCE: [0, 0, 7] as [number, number, number],
  PIZZA_PALACE_ENTRANCE: [-12.5, 0, 7] as [number, number, number],
  LAUNDROMAT_ENTRANCE: [13.5, 0, 7] as [number, number, number],

  // Strip mall corners
  STRIP_MALL_LEFT_EDGE: [-16, 0, 7] as [number, number, number],
  STRIP_MALL_RIGHT_EDGE: [16, 0, 7] as [number, number, number],
  STRIP_MALL_BACK: [0, 0, -7] as [number, number, number],

  // Apartment
  APARTMENT_DOOR: [16.2, 3.7, 0.87] as [number, number, number],  // world coords of apt door
  APARTMENT_STAIRS_BOTTOM: [16.8, 0, 8.25] as [number, number, number],  // ground entry to stairs
  APARTMENT_INTERIOR: [13, 3.7, 4] as [number, number, number],  // center of apartment

  // Parking lot
  PARKING_LOT_CENTER: [0, 0, 12] as [number, number, number],
  SIDEWALK_CENTER: [0, 0, 7.8] as [number, number, number],
  STREET_CENTER: [0, 0, 16] as [number, number, number],

  // Key interior points
  COUNTER: [7, 0, 5] as [number, number, number],
  NEW_RELEASES_WALL: [0, 0, -6.85] as [number, number, number],

  // Named NPCs
  VINNY: [7, 0, 5.8] as [number, number, number],
  CHARLIE: [-7.81, 0, 2.52] as [number, number, number],
  TONY: [-13, 0, 4.8] as [number, number, number],
  EARL: [13, 0, 4.45] as [number, number, number],
} as const;

/**
 * Offset from a named anchor point.
 * 
 * Usage:
 *   const trashCanPos = offsetFrom(WORLD_ANCHORS.LAUNDROMAT_ENTRANCE, [2, 0, -1])
 *   // "2m right and 1m behind the laundromat entrance"
 */
export function offsetFrom(
  anchor: readonly [number, number, number],
  offset: [number, number, number]
): [number, number, number] {
  return [anchor[0] + offset[0], anchor[1] + offset[1], anchor[2] + offset[2]];
}

/**
 * Snap a value to a grid increment.
 * Prevents "magic decimals" like -4.13 in positions.
 * 
 * Usage:
 *   snapToGrid(3.87, 0.5) // returns 4.0
 *   snapToGrid(3.87, 0.25) // returns 3.75
 */
export function snapToGrid(value: number, gridSize: number = 0.5): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * BUILDING_CODES — non-negotiable real-world measurements.
 * Use these instead of guessing dimensions.
 */
export const BUILDING_CODES = {
  // Doors
  RESIDENTIAL_DOOR: { width: 0.91, height: 2.03, depth: 0.05 },
  COMMERCIAL_DOOR: { width: 1.07, height: 2.13, depth: 0.05 },

  // Ceilings
  COMMERCIAL_CEILING: 3.5,
  RESIDENTIAL_CEILING: 2.8,

  // Walls
  INTERIOR_WALL: 0.2,
  EXTERIOR_WALL: 0.3,

  // Stairs
  MAX_RISER: 0.197,
  MIN_TREAD: 0.254,
  HANDRAIL_HEIGHT: { min: 0.86, max: 0.97 },
  MIN_STAIR_WIDTH: 0.91,

  // Furniture
  COUNTER_HEIGHT: 0.91,
  TABLE_HEIGHT: 0.75,
  CHAIR_SEAT: 0.45,

  // Human
  PERSON_HEIGHT: 1.7,
  EYE_LEVEL: 1.6,

  // Parking
  PARKING_SPACE: { width: 2.7, depth: 5.5 },
  SIDEWALK_WIDTH: 1.5,

  // Parapet
  PARAPET_HEIGHT: { min: 0.76, max: 1.07 },
} as const;
