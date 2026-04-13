#!/usr/bin/env node
/**
 * test-stair-path.mjs — Verify the player can walk from sidewalk to apartment
 *
 * Traces a path from the sidewalk to the apartment door and checks every
 * step for collision. Reports blocked points and the viable path.
 *
 * Usage: node scripts/test-stair-path.mjs
 */

const PLAYER_RADIUS = 0.4;

// Reproduce the collision boxes from FirstPerson.tsx
const COLLIDERS = [
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

function collides(px, pz) {
  for (const c of COLLIDERS) {
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

// Test path: sidewalk → stair bottom → stair top → apartment door
const PATH = [
  { x: 0, z: 8, label: "Store entrance (sidewalk)" },
  { x: 5, z: 8, label: "Walking right on sidewalk" },
  { x: 10, z: 8, label: "Past video store" },
  { x: 13, z: 8, label: "In front of laundromat" },
  { x: 15, z: 8, label: "Past laundromat door" },
  { x: 16, z: 8, label: "Right edge of laundromat" },
  { x: 16.5, z: 8, label: "Approaching stairs" },
  { x: 16.8, z: 8, label: "At stair X position" },
  { x: 16.8, z: 7, label: "Turning toward building" },
  { x: 16.8, z: 6.5, label: "Stair entrance" },
  { x: 16.8, z: 6, label: "On stairs (bottom)" },
  { x: 16.8, z: 5, label: "On stairs (1/4)" },
  { x: 16.8, z: 4, label: "On stairs (mid)" },
  { x: 16.8, z: 3, label: "On stairs (3/4)" },
  { x: 16.8, z: 2.5, label: "Near stair top" },
  { x: 16.8, z: 2, label: "Landing area" },
  { x: 16.8, z: 1, label: "At apartment door Z" },
  { x: 16.2, z: 0.87, label: "Apartment door" },
  { x: 15, z: 0.87, label: "Inside apartment entrance" },
  { x: 13, z: 4, label: "Apartment center" },
];

console.log("=== STAIR PATH TEST ===\n");
console.log("Player radius:", PLAYER_RADIUS);
console.log("");

let blocked = 0;
let clear = 0;

for (const point of PATH) {
  const hit = collides(point.x, point.z);
  if (hit) {
    console.log(`❌ BLOCKED at (${point.x}, ${point.z}) — ${point.label}`);
    console.log(`   Collides with: ${hit}`);
    blocked++;
  } else {
    console.log(`✅ CLEAR  at (${point.x}, ${point.z}) — ${point.label}`);
    clear++;
  }
}

console.log(`\n=== RESULTS: ${clear} clear, ${blocked} blocked ===`);

if (blocked > 0) {
  console.log("\n⚠️  Path is NOT fully walkable. Fix collision boxes above.");
} else {
  console.log("\n✅ Full path from sidewalk to apartment is clear!");
}

// Also test stair climbing heights
console.log("\n=== STAIR HEIGHT CHECK ===\n");
const APT_FLOOR_Y = 3.7 + 1.6;
const GROUND_Y = 1.6;

for (let z = 8.5; z >= 1.5; z -= 0.5) {
  const inStairZ = z > 2.2 && z < 8.5;
  const inLanding = z > 0.6 && z < 2.6;

  let groundY;
  if (inLanding) {
    groundY = APT_FLOOR_Y;
  } else if (inStairZ) {
    const progress = 1 - Math.max(0, Math.min(1, (z - 2.37) / (8.25 - 2.37)));
    groundY = GROUND_Y + progress * (APT_FLOOR_Y - GROUND_Y);
  } else {
    groundY = GROUND_Y;
  }

  const worldY = groundY - 1.6; // feet position
  console.log(`z=${z.toFixed(1)}  eye=${groundY.toFixed(2)}m  feet=${worldY.toFixed(2)}m  ${inLanding ? "(LANDING)" : inStairZ ? "(STAIRS)" : "(GROUND)"}`);
}
