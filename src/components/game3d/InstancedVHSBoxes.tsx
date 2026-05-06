"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { toonGradientTexture } from "./store-materials";

/**
 * Shared VHS box geometry — reused across all instanced renderers.
 * Bumped from 0.15 × 0.26 × 0.025 → 0.20 × 0.34 × 0.035 so titles read clearly
 * from a normal browsing distance (was too small to read on shelf).
 */
const sharedVHSGeometry = new THREE.BoxGeometry(0.20, 0.34, 0.035);

/**
 * Material cache — one meshToonMaterial per color string.
 * Prevents recreating identical materials for boxes of the same color.
 */
const materialCache = new Map<string, THREE.MeshToonMaterial>();

function getSharedMaterial(color: string): THREE.MeshToonMaterial {
  let mat = materialCache.get(color);
  if (!mat) {
    mat = new THREE.MeshToonMaterial({ color, gradientMap: toonGradientTexture });
    materialCache.set(color, mat);
  }
  return mat;
}

export interface VHSInstanceConfig {
  position: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * InstancedVHSBoxes — renders N solid-colored VHS boxes in a single draw call.
 *
 * Uses THREE.InstancedMesh with shared geometry and a cached material per color.
 * Each instance gets its own position/rotation via instanceMatrix.
 */
export function InstancedVHSBoxes({
  instances,
  color,
}: {
  instances: VHSInstanceConfig[];
  color: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => getSharedMaterial(color), [color]);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || instances.length === 0) return;

    instances.forEach((inst, i) => {
      tempObj.position.set(inst.position[0], inst.position[1], inst.position[2]);
      if (inst.rotation) {
        tempObj.rotation.set(inst.rotation[0], inst.rotation[1], inst.rotation[2]);
      } else {
        tempObj.rotation.set(0, 0, 0);
      }
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [instances, tempObj]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[sharedVHSGeometry, material, instances.length]}
      frustumCulled
    />
  );
}

/**
 * SharedVHSBox — a single VHS box that reuses the shared geometry and cached material.
 * Drop-in replacement for individual <mesh><boxGeometry /><Mat /></mesh> VHS boxes.
 */
export function SharedVHSBox({
  position,
  rotation,
  color,
  userData,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  userData?: Record<string, unknown>;
}) {
  const material = useMemo(() => getSharedMaterial(color), [color]);
  return (
    <mesh
      position={position}
      rotation={rotation}
      geometry={sharedVHSGeometry}
      material={material}
      userData={userData}
    />
  );
}
