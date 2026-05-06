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
  const savedUp = useRef(new THREE.Vector3(0, 1, 0));
  const savedFov = useRef<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    // Save current camera state on mount
    savedPos.current.copy(camera.position);
    savedQuat.current.copy(camera.quaternion);
    savedUp.current.copy(camera.up);
    if (camera instanceof THREE.PerspectiveCamera) {
      savedFov.current = camera.fov;
      camera.fov = 46;
      camera.updateProjectionMatrix();
    }
    camera.position.set(0, 24, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    mounted.current = true;

    // Exit pointer lock when entering top-down
    try {
      document.exitPointerLock();
    } catch {
      // No active pointer lock in some browser contexts.
    }

    return () => {
      // Restore camera state on unmount
      camera.position.copy(savedPos.current);
      camera.quaternion.copy(savedQuat.current);
      camera.up.copy(savedUp.current);
      if (camera instanceof THREE.PerspectiveCamera && savedFov.current !== null) {
        camera.fov = savedFov.current;
        camera.updateProjectionMatrix();
      }
    };
  }, [camera]);

  useFrame(() => {
    if (!mounted.current) return;

    // Target: high above store, looking straight down at floor layout
    // Ceiling/roof are hidden via Store topDown prop so we see inside
    const targetPos = new THREE.Vector3(0, 24, 0);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    camera.position.lerp(targetPos, 0.3);
    camera.up.set(0, 0, -1);
    camera.lookAt(targetLookAt);
  });

  return null;
}
