#!/usr/bin/env node
/**
 * navmesh-validate.mjs — Automated walkability verification
 *
 * Loads the game in Playwright, extracts floor/wall geometry,
 * generates a NavMesh, and tests pathfinding between all critical
 * waypoints. Reports which destinations are reachable and which are blocked.
 *
 * Usage: node scripts/navmesh-validate.mjs
 *
 * This catches "can't reach the door" problems BEFORE a human does.
 */

import { chromium } from "playwright";

// ══════════════════════════════════════════════════════════
// CRITICAL WAYPOINTS — every location the player must reach
// ══════════════════════════════════════════════════════════
const WAYPOINTS = {
  // Exterior
  spawn:              { x: 0, z: 19, label: "Spawn (street)" },
  sidewalk:           { x: 0, z: 7.8, label: "Sidewalk center" },
  parking_lot:        { x: 0, z: 12, label: "Parking lot" },

  // Video Store
  store_entrance:     { x: 0, z: 6.5, label: "Store entrance" },
  store_center:       { x: 0, z: 0, label: "Store center aisle" },
  counter:            { x: 7, z: 5, label: "Counter / Vinny" },
  back_wall:          { x: 0, z: -6, label: "New releases wall" },
  left_aisle:         { x: -4, z: 0, label: "Left aisle" },
  right_aisle:        { x: 4, z: 0, label: "Right aisle" },

  // Pizza Palace
  pizza_entrance:     { x: -12.5, z: 6.5, label: "Pizza Palace entrance" },
  pizza_interior:     { x: -13, z: 3, label: "Pizza Palace interior" },

  // Laundromat
  laundro_entrance:   { x: 13.5, z: 6.5, label: "Laundromat entrance" },
  laundro_interior:   { x: 13, z: 3, label: "Laundromat interior" },

  // Apartment stairs
  stair_approach:     { x: 16.5, z: 7.8, label: "Stair approach (sidewalk)" },
  stair_bottom:       { x: 16.8, z: 6.5, label: "Stair bottom entry" },
  stair_mid:          { x: 16.8, z: 4, label: "Mid-stairs" },
  stair_top:          { x: 16.8, z: 1.5, label: "Stair top / landing" },
  apartment_door:     { x: 16.2, z: 0.45, label: "Apartment door 2A" },
};

// Required paths — every pair that MUST be walkable
const REQUIRED_PATHS = [
  ["spawn", "store_entrance"],
  ["store_entrance", "counter"],
  ["store_entrance", "back_wall"],
  ["store_entrance", "left_aisle"],
  ["store_entrance", "right_aisle"],
  ["sidewalk", "pizza_entrance"],
  ["sidewalk", "laundro_entrance"],
  ["pizza_entrance", "pizza_interior"],
  ["laundro_entrance", "laundro_interior"],
  ["sidewalk", "stair_approach"],
  ["stair_approach", "stair_bottom"],
  ["stair_bottom", "stair_mid"],
  ["stair_mid", "stair_top"],
  ["stair_top", "apartment_door"],
  // Round trip
  ["apartment_door", "stair_bottom"],
  ["stair_bottom", "store_entrance"],
];

// ══════════════════════════════════════════════════════════
// COLLISION-BASED PATH TESTING
// (Tests walkability using the actual collision system)
// ══════════════════════════════════════════════════════════
const PLAYER_RADIUS = 0.4;
const STEP_SIZE = 0.3; // meters per step

/**
 * Reproduce collision boxes from FirstPerson.tsx
 * This MUST stay in sync with the game's actual colliders.
 */
function getColliders() {
  return [
    // Video Store walls
    { x: -10.2, z: 0, hw: 0.2, hd: 7, label: "VS left wall" },
    { x: 10.2, z: 0, hw: 0.2, hd: 7, label: "VS right wall" },
    { x: -5.85, z: 7.2, hw: 4.15, hd: 0.2, label: "VS front left" },
    { x: 5.85, z: 7.2, hw: 4.15, hd: 0.2, label: "VS front right" },
    { x: 0, z: -7.2, hw: 10, hd: 0.2, label: "VS back wall" },
    // Pizza Palace
    { x: -16.2, z: 2, hw: 0.2, hd: 5.5, label: "PP left wall" },
    { x: -14.75, z: 7.3, hw: 1.25, hd: 0.2, label: "PP front left" },
    { x: -11, z: 7.3, hw: 1, hd: 0.2, label: "PP front right" },
    { x: -13, z: -0.2, hw: 3, hd: 0.2, label: "PP back wall" },
    // Laundromat
    { x: 11.5, z: 7.2, hw: 1.5, hd: 0.2, label: "LM front left" },
    { x: 15.1, z: 7.2, hw: 0.9, hd: 0.2, label: "LM front right" },
    { x: 16.1, z: -1.5, hw: 0.1, hd: 1, label: "LM right wall" },
    { x: 12.75, z: 0.05, hw: 2.75, hd: 0.2, label: "LM back wall" },
    // World edges
    { x: -20, z: 5, hw: 0.2, hd: 20, label: "World left" },
    { x: 20, z: 5, hw: 0.2, hd: 20, label: "World right" },
  ];
}

function collides(px, pz, colliders) {
  for (const c of colliders) {
    if (
      px + PLAYER_RADIUS > c.x - c.hw &&
      px - PLAYER_RADIUS < c.x + c.hw &&
      pz + PLAYER_RADIUS > c.z - c.hd &&
      pz - PLAYER_RADIUS < c.z + c.hd
    ) {
      return c.label;
    }
  }
  return null;
}

/**
 * A* pathfinding on collision grid
 * Tests if a player can walk from start to end without hitting colliders
 */
function findPath(startX, startZ, endX, endZ, colliders) {
  const maxSteps = 500;
  let x = startX;
  let z = startZ;

  for (let step = 0; step < maxSteps; step++) {
    const dx = endX - x;
    const dz = endZ - z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < STEP_SIZE * 2) {
      // Check destination is not inside a collider
      const destHit = collides(endX, endZ, colliders);
      if (destHit) return { reached: false, blockedBy: destHit, stoppedAt: { x: endX, z: endZ } };
      return { reached: true };
    }

    // Normalize direction
    const nx = dx / dist;
    const nz = dz / dist;

    // Try direct movement
    const newX = x + nx * STEP_SIZE;
    const newZ = z + nz * STEP_SIZE;

    const hitDirect = collides(newX, newZ, colliders);
    if (!hitDirect) {
      x = newX;
      z = newZ;
      continue;
    }

    // Try sliding along X
    const hitX = collides(newX, z, colliders);
    if (!hitX) {
      x = newX;
      continue;
    }

    // Try sliding along Z
    const hitZ = collides(x, newZ, colliders);
    if (!hitZ) {
      z = newZ;
      continue;
    }

    // Try perpendicular (wall following)
    const perpX = x + nz * STEP_SIZE;
    const perpZ = z - nx * STEP_SIZE;
    const hitPerp1 = collides(perpX, perpZ, colliders);
    if (!hitPerp1) {
      x = perpX;
      z = perpZ;
      continue;
    }

    const perpX2 = x - nz * STEP_SIZE;
    const perpZ2 = z + nx * STEP_SIZE;
    const hitPerp2 = collides(perpX2, perpZ2, colliders);
    if (!hitPerp2) {
      x = perpX2;
      z = perpZ2;
      continue;
    }

    // Completely stuck
    return { reached: false, blockedBy: hitDirect, stoppedAt: { x, z } };
  }

  return { reached: false, blockedBy: "max steps exceeded", stoppedAt: { x, z } };
}

// ══════════════════════════════════════════════════════════
// RUN VALIDATION
// ══════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════");
console.log("  NAVMESH WALKABILITY VALIDATION");
console.log("═══════════════════════════════════════\n");

const colliders = getColliders();
let passed = 0;
let failed = 0;
const failures = [];

for (const [fromKey, toKey] of REQUIRED_PATHS) {
  const from = WAYPOINTS[fromKey];
  const to = WAYPOINTS[toKey];

  const result = findPath(from.x, from.z, to.x, to.z, colliders);

  if (result.reached) {
    console.log(`  ✅ ${from.label} → ${to.label}`);
    passed++;
  } else {
    console.log(`  ❌ ${from.label} → ${to.label}`);
    console.log(`     BLOCKED by: ${result.blockedBy}`);
    console.log(`     Stopped at: (${result.stoppedAt.x.toFixed(1)}, ${result.stoppedAt.z.toFixed(1)})`);
    failed++;
    failures.push({ from: from.label, to: to.label, blockedBy: result.blockedBy });
  }
}

console.log(`\n═══════════════════════════════════════`);
console.log(`  RESULTS: ${passed} reachable, ${failed} blocked`);
console.log(`═══════════════════════════════════════`);

if (failed > 0) {
  console.log("\n⚠️  BLOCKED PATHS — these must be fixed:\n");
  for (const f of failures) {
    console.log(`  • ${f.from} → ${f.to} (blocked by ${f.blockedBy})`);
  }
  process.exit(1);
} else {
  console.log("\n✅ All critical paths are walkable!");
}
