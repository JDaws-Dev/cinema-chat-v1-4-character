"use client";

import React from "react";
import { ROOM_H } from "../store-constants";
import { Mat } from "../store-materials";

/** Fluorescent ceiling light fixture — housing + glowing diffuser tube */
function Fixture({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Housing */}
      <mesh><boxGeometry args={[1.8, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
      {/* Diffuser panel (slightly translucent) */}
      <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.7, 0.01, 0.25]} /><Mat color="#f0efe8" roughness={0.2} /></mesh>
      {/* Glowing tube — emissive for bloom pickup */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[1.6, 0.03, 0.06]} />
        <meshStandardMaterial
          color="#fffae8"
          emissive="#fff8e0"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** All fluorescent ceiling fixtures in the video store (hidden in top-down) */
export function CeilingFixtures() {
  const y = ROOM_H - 0.04;
  return (
    <>
      {/* Main rows (left-right) at z=-1.5 and z=2 */}
      {[-6, -2, 2, 6].map((fx) => (
        <group key={fx}>
          <Fixture position={[fx, y, -1.5]} />
          <Fixture position={[fx, y, 2]} />
        </group>
      ))}
      {/* Mid-row at z=0 */}
      {[-4, 0, 4].map((fx) => (
        <Fixture key={`mid-${fx}`} position={[fx, y, 0]} />
      ))}
      {/* Front row near entrance at z=4.9 */}
      {[-4.5, -0.5, 3.5].map((fx) => (
        <Fixture key={`front-${fx}`} position={[fx, y, 4.9]} />
      ))}
    </>
  );
}
