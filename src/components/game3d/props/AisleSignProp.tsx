"use client";

import React from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { Mat } from "../store-materials";
import { ROOM_H } from "../store-constants";

/**
 * Hanging genre sign above an aisle — Blockbuster-blue with gold text,
 * readable from both sides.
 */
export function AisleSignProp({ z, label }: { z: number; label: string }) {
  return (
    <group position={[0, 0, z]}>
      {/* ── Suspension ─────────────────────────────────────────────────────
          Two rods at the quarter points rather than one in the middle. A 6.2m
          sign on a single central rod is the kind of thing the eye reads as
          wrong without being able to say why — real hanging signage is picked
          up near its ends. Cylinders, not boxes: a square "rod" is one of the
          tells that everything here was extruded from a cube. */}
      {[-2.5, 2.5].map((rx) => (
        <mesh key={`rod-${rx}`} position={[rx, ROOM_H - 0.55, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.7, 8]} />
          <Mat color="#888888" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* ── Panel ──────────────────────────────────────────────────────────
          Was two overlapping slabs 0.02 and 0.03 thick — effectively a decal
          floating in the air. Now a gold bezel with real depth and a navy face
          raised proud of it on both sides, so the sign has an edge that catches
          the ceiling lights and casts. */}
      <RoundedBox args={[6.2, 0.46, 0.06]} radius={0.016} smoothness={2} position={[0, 2.45, 0]} castShadow>
        <Mat color="#ffd700" roughness={0.45} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[6.02, 0.33, 0.082]} radius={0.012} smoothness={2} position={[0, 2.45, 0]}>
        <Mat color="#00006e" roughness={0.5} />
      </RoundedBox>
      {/* Front text */}
      <Text
        position={[0, 2.45, 0.046]}
        fontSize={0.09}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
      {/* Back text (readable from other side) */}
      <Text
        position={[0, 2.45, -0.046]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.09}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

/** Static aisle sign data — genres in each row */
export const AISLE_SIGNS: { z: number; label: string }[] = [
  { z: -4.2, label: "ACTION/ADVENTURE \u2022 COMEDY \u2022 HORROR \u2022 DRAMA" },
  { z: -1.5, label: "THRILLER \u2022 ROMANCE \u2022 SCI-FI & FANTASY \u2022 KIDS & FAMILY" },
  { z: 1, label: "MUSICALS \u2022 CLASSICS \u2022 SCI-FI & FANTASY" },
];
