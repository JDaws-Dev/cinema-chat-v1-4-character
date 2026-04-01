"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Overhead camera for layout debugging.
 * Smoothly lerps to a bird's-eye view looking straight down.
 * Stores the player's camera state and restores it on unmount.
 */
export function TopDownCamera() {
  const { camera } = useThree();
  const savedPos = useRef(new THREE.Vector3());
  const savedQuat = useRef(new THREE.Quaternion());
  const mounted = useRef(false);

  useEffect(() => {
    // Save current camera state on mount
    savedPos.current.copy(camera.position);
    savedQuat.current.copy(camera.quaternion);
    mounted.current = true;

    // Exit pointer lock when entering top-down
    document.exitPointerLock();

    return () => {
      // Restore camera state on unmount
      camera.position.copy(savedPos.current);
      camera.quaternion.copy(savedQuat.current);
    };
  }, [camera]);

  useFrame(() => {
    if (!mounted.current) return;

    // Target: high above store, looking straight down at floor layout
    // Ceiling/roof are hidden via Store topDown prop so we see inside
    const targetPos = new THREE.Vector3(0, 18, 0);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // Smooth lerp to target
    camera.position.lerp(targetPos, 0.08);

    // Look straight down
    const targetQuat = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    m.lookAt(camera.position, targetLookAt, new THREE.Vector3(0, 0, -1));
    targetQuat.setFromRotationMatrix(m);
    camera.quaternion.slerp(targetQuat, 0.08);
  });

  return null;
}
