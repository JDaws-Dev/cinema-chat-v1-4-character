"use client";

import React from "react";
import { Text } from "@react-three/drei";
import { Mat } from "../store-materials";

type Vec3 = [number, number, number];

/**
 * Welcome rug with "FRIDAY NIGHT VIDEO" text.
 * Gold border with dark navy center, placed just inside the entrance.
 */
export function FloorRugProp({
  position = [0, 0, 5.2],
  label = "FRIDAY NIGHT VIDEO",
}: {
  position?: Vec3;
  label?: string;
}) {
  return (
    <group position={position}>
      {/* Gold border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[3.4, 2.4]} />
        <Mat color="#ffd700" roughness={0.95} />
      </mesh>
      {/* Dark navy center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <planeGeometry args={[3, 2]} />
        <Mat color="#0a1830" roughness={0.95} />
      </mesh>
      {/* Text */}
      <Text
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.014, 0]}
        fontSize={0.18}
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
