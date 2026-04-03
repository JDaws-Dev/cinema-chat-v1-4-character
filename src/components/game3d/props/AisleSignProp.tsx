"use client";

import React from "react";
import { Text } from "@react-three/drei";
import { Mat } from "../store-materials";
import { ROOM_H } from "../store-constants";

/**
 * Hanging genre sign above an aisle — Blockbuster-blue with gold text,
 * readable from both sides.
 */
export function AisleSignProp({ z, label }: { z: number; label: string }) {
  return (
    <group position={[0, 0, z]}>
      {/* Hanging rod — ends 0.15m below ceiling to avoid clipping */}
      <mesh position={[0, ROOM_H - 0.55, 0]}>
        <boxGeometry args={[0.02, 0.7, 0.02]} />
        <Mat color="#888888" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Blockbuster blue background with yellow border */}
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[6.2, 0.42, 0.02]} />
        <Mat color="#ffd700" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[6.1, 0.36, 0.03]} />
        <Mat color="#00006e" roughness={0.5} />
      </mesh>
      {/* Front text */}
      <Text
        position={[0, 2.45, 0.025]}
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
        position={[0, 2.45, -0.025]}
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
