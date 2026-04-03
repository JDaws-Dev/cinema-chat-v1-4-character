"use client";

import React from "react";
import { Text } from "@react-three/drei";
import { getObjectById } from "@/lib/store-layout";
import { Mat } from "../store-materials";
import { ROOM_D } from "../store-constants";

/**
 * Main store neon sign — "FRIDAY NIGHT VIDEO" on a dark backing plate.
 * Positioned via layout engine (neon-sign) with manual fallback.
 */
export function NeonSignProp() {
  const pos = getObjectById("neon-sign");
  return (
    <group position={[pos?.x ?? 0, pos?.y ?? 3.1, pos?.z ?? (-ROOM_D / 2 + 0.15)]}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[5.8, 0.4, 0.03]} />
        <Mat color="#0a0a18" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.2}
        color="#ffd700"
        anchorX="center"
        font={undefined}
      >
        FRIDAY NIGHT VIDEO
        <meshBasicMaterial color="#ffd700" toneMapped={false} />
      </Text>
    </group>
  );
}
