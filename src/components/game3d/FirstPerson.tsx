"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";

const SPEED = 3.5;
const MOUSE_SENS = 0.002;
const ROOM_BOUNDS = { minX: -9.5, maxX: 9.5, minZ: -6.5, maxZ: 14 }; // extended +z for outside area
const PLAYER_RADIUS = 0.4;

// Collision boxes: { x, z, halfW, halfD } — rectangular obstacles
const COLLIDERS = [
  // Shelf Row 1 (z = -3)
  { x: -5.5, z: -3, hw: 1.6, hd: 0.5 },
  { x: -2,   z: -3, hw: 1.6, hd: 0.5 },
  { x: 1.5,  z: -3, hw: 1.6, hd: 0.5 },
  { x: 5,    z: -3, hw: 1.6, hd: 0.5 },
  // Shelf Row 2 (z = 0)
  { x: -5.5, z: 0, hw: 1.6, hd: 0.5 },
  { x: -2,   z: 0, hw: 1.6, hd: 0.5 },
  { x: 1.5,  z: 0, hw: 1.6, hd: 0.5 },
  { x: 5,    z: 0, hw: 1.6, hd: 0.5 },
  // Shelf Row 3 (z = 3)
  { x: -5.5, z: 3, hw: 1.6, hd: 0.5 },
  { x: -2,   z: 3, hw: 1.6, hd: 0.5 },
  { x: 1.5,  z: 3, hw: 1.6, hd: 0.5 },
  // Counter (left side near entrance)
  { x: -7, z: 5, hw: 0.8, hd: 3.2 },
  // New Releases back wall shelf
  { x: 0, z: -6.8, hw: 9.5, hd: 0.4 },
  // Candy rack (near counter)
  { x: -5, z: 5, hw: 0.6, hd: 0.4 },
];

function collidesWithAny(px: number, pz: number): boolean {
  for (const c of COLLIDERS) {
    if (
      px + PLAYER_RADIUS > c.x - c.hw &&
      px - PLAYER_RADIUS < c.x + c.hw &&
      pz + PLAYER_RADIUS > c.z - c.hd &&
      pz - PLAYER_RADIUS < c.z + c.hd
    ) {
      return true;
    }
  }
  return false;
}

export function FirstPersonControls({ disabled = false }: { disabled?: boolean }) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const locked = useRef(false);
  const initialized = useRef(false);
  const lookVelocityX = useRef(0);
  const lookVelocityY = useRef(0);

  // Pointer lock
  const requestLock = useCallback(() => {
    if (disabled) return;
    gl.domElement.requestPointerLock();
  }, [gl, disabled]);

  useEffect(() => {
    // Set spawn position only on very first mount
    if (!initialized.current) {
      camera.position.set(0, 1.6, 5);
      euler.current.set(0, 0, 0);
      camera.quaternion.setFromEuler(euler.current);
      initialized.current = true;
    }

    const onLockChange = () => {
      locked.current = document.pointerLockElement === gl.domElement;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!locked.current || disabled) return;
      euler.current.y -= e.movementX * MOUSE_SENS;
      euler.current.x -= e.movementY * MOUSE_SENS;
      euler.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      keys.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => { keys.current.delete(e.key.toLowerCase()); };

    const onClick = () => {
      if (!locked.current && !disabled) requestLock();
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [camera, gl, requestLock, disabled]);

  // Clear movement keys when disabled (prevents stuck movement)
  useEffect(() => {
    if (disabled) keys.current.clear();
  }, [disabled]);

  useFrame((_, delta) => {
    if (disabled) return;

    // Apply mobile camera look from right thumbstick
    if (mobileInput.lookDeltaX !== 0 || mobileInput.lookDeltaY !== 0) {
      const STICK_LOOK_SPEED = 0.035; // radians per frame at full tilt
      euler.current.y -= mobileInput.lookDeltaX * STICK_LOOK_SPEED;
      euler.current.x -= mobileInput.lookDeltaY * STICK_LOOK_SPEED;
      euler.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    }

    const dir = new THREE.Vector3();
    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    front.y = 0;
    front.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current.has("w") || keys.current.has("arrowup")) dir.add(front);
    if (keys.current.has("s") || keys.current.has("arrowdown")) dir.sub(front);
    if (keys.current.has("a") || keys.current.has("arrowleft")) dir.sub(right);
    if (keys.current.has("d") || keys.current.has("arrowright")) dir.add(right);

    // Add mobile joystick input
    if (mobileInput.moveX !== 0 || mobileInput.moveZ !== 0) {
      dir.addScaledVector(right, mobileInput.moveX);
      dir.addScaledVector(front, mobileInput.moveZ);
    }

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(SPEED * delta);
      const newX = camera.position.x + dir.x;
      const newZ = camera.position.z + dir.z;

      // Room bounds
      const clampedX = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, newX));
      const clampedZ = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, newZ));

      // Try full movement first
      if (!collidesWithAny(clampedX, clampedZ)) {
        camera.position.x = clampedX;
        camera.position.z = clampedZ;
      }
      // Try sliding along X only
      else if (!collidesWithAny(clampedX, camera.position.z)) {
        camera.position.x = clampedX;
      }
      // Try sliding along Z only
      else if (!collidesWithAny(camera.position.x, clampedZ)) {
        camera.position.z = clampedZ;
      }
      // Blocked both ways — don't move
    }

    // Crouch mechanic: hold Shift or C to lower camera
    const crouchTarget = keys.current.has("shift") ? 0.8 : 1.6;
    camera.position.y += (crouchTarget - camera.position.y) * 0.15;
  });

  return null;
}
