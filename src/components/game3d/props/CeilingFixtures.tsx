"use client";

import React from "react";
import * as THREE from "three";
import { ROOM_H } from "../store-constants";
import { Mat } from "../store-materials";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Troffer housing and diffuser, shared across all ~17 fixtures. Bevelled: the
// housing hangs at eye-line in most of the frame and a hard-edged slab up there
// was one of the more visible boxes left in the store.
const housingGeo = new RoundedBoxGeometry(1.8, 0.07, 0.3, 1, 0.018);
const diffuserGeo = new RoundedBoxGeometry(1.7, 0.02, 0.25, 1, 0.008);
// The lit element is a tube, so it's a cylinder. A box "fluorescent tube" reads
// wrong even at a glance, and this is the brightest object in the room — it's
// what bloom picks up, so its silhouette gets seen more than anything else.
const tubeGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.6, 10);
tubeGeo.rotateZ(Math.PI / 2);

/** Fluorescent ceiling light fixture — housing + diffuser + glowing tube */
function Fixture({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Housing */}
      <mesh geometry={housingGeo}><Mat color="#d0d0c8" roughness={0.6} /></mesh>
      {/* Diffuser panel */}
      <mesh position={[0, -0.02, 0]} geometry={diffuserGeo}><Mat color="#f0efe8" roughness={0.2} /></mesh>
      {/* Glowing tube — emissive for bloom pickup */}
      <mesh position={[0, -0.05, 0]} geometry={tubeGeo}>
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
