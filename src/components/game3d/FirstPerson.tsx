"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";
import { setPlayerPosition } from "@/lib/audio";

const SPEED = 3.5;
const MOUSE_SENS = 0.002;
const ROOM_BOUNDS = { minX: -20, maxX: 20, minZ: -6.5, maxZ: 20 }; // full strip mall + side streets + parking lot + road
const PLAYER_RADIUS = 0.4;

// Collision boxes derived from layout data — positions stay in sync with editor
import { getLayoutColliders } from "@/lib/store-layout";

function buildColliders(): { x: number; z: number; hw: number; hd: number }[] {
  const colliders = getLayoutColliders().map((collider) => ({
    x: collider.x,
    z: collider.z,
    hw: collider.hw,
    hd: collider.hd,
  }));

  // Structural shell colliders remain fixed until the shell itself becomes layout-driven.
  // ── Video Store walls ──
  // Left wall (x=-10) — gap at z=-5.19 for employees door
  colliders.push({ x: -10.2, z: 0, hw: 0.2, hd: 7 });
  // Right wall (x=+10)
  colliders.push({ x: 10.2, z: 0, hw: 0.2, hd: 7 });
  // Front wall — left of door (x=-10 to x=-1.7, z=7)
  colliders.push({ x: -5.85, z: 7.2, hw: 4.15, hd: 0.2 });
  // Front wall — right of door (x=1.7 to x=10, z=7)
  colliders.push({ x: 5.85, z: 7.2, hw: 4.15, hd: 0.2 });
  // Back wall (z=-7)
  colliders.push({ x: 0, z: -7.2, hw: 10, hd: 0.2 });

  // ── Pizza Palace walls (x=-16 to x=-10) — 8m deep ──
  // Left wall of pizza place (x=-16) — extends from front z=7 to back z=0 (world)
  colliders.push({ x: -16.2, z: 2, hw: 0.2, hd: 5.5 });
  // Front wall — left of pizza door (x=-16 to x=-13, z=7.3)
  colliders.push({ x: -14.75, z: 7.3, hw: 1.25, hd: 0.2 });
  // Front wall — right of pizza door (x=-12 to x=-10, z=7.3)
  colliders.push({ x: -11, z: 7.3, hw: 1, hd: 0.2 });
  // Back wall of pizza place (z=0 — deeper interior, was z=4.5)
  colliders.push({ x: -13, z: -0.2, hw: 3, hd: 0.2 });

  // ── Laundromat walls (x=10 to x=16) — 8m deep ──
  // Front wall — left of door (x=10 to x=12.85, z=7)
  colliders.push({ x: 11.5, z: 7.2, hw: 1.5, hd: 0.2 });
  // Front wall — right of door (x=14.15 to x=16, z=7)
  colliders.push({ x: 15.1, z: 7.2, hw: 0.9, hd: 0.2 });
  // Right wall of laundromat (x=16) — extends from front z=7 to back z=0.25 (world)
  colliders.push({ x: 16.2, z: 2.5, hw: 0.2, hd: 5 });
  // Back wall of laundromat (z=0.25 — deeper interior, was z=4.5)
  colliders.push({ x: 13, z: 0.05, hw: 3, hd: 0.2 });

  // ── World-edge invisible walls (side streets) ──
  // Left world edge (x=-20)
  colliders.push({ x: -20, z: 5, hw: 0.2, hd: 20 });
  // Right world edge (x=+20)
  colliders.push({ x: 20, z: 5, hw: 0.2, hd: 20 });

  return colliders;
}

const COLLIDERS = buildColliders();

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
  const velocityY = useRef(0);
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
      camera.position.set(0, 1.6, 19); // Out in the street — full strip mall view
      camera.lookAt(0, 3.5, 7); // Face toward store signage
      camera.getWorldDirection(new THREE.Vector3()); // force update
      euler.current.setFromQuaternion(camera.quaternion); // sync euler to camera
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

    // ── Vertical movement: stairs, jump, gravity ──
    const APT_FLOOR_Y = 4 + 1.6; // apartment floor y=4 + eye height 1.6
    const GROUND_Y = 1.6;
    const GRAVITY = 12;
    const JUMP_VELOCITY = 5.5;

    // Determine ground height at current position
    const inStairX = camera.position.x > 15 && camera.position.x < 17.5;
    const inStairZ = camera.position.z > 3 && camera.position.z < 9;
    const inApartment = camera.position.x > 10 && camera.position.x < 16 &&
                        camera.position.z > 3 && camera.position.z < 8.5 &&
                        camera.position.y > 3.5;

    let groundY: number;
    if (inStairX && inStairZ) {
      // Stairs ramp: z=9 is ground level, z=3 is apartment level
      const stairProgress = 1 - Math.max(0, Math.min(1, (camera.position.z - 3) / 6));
      groundY = GROUND_Y + stairProgress * (APT_FLOOR_Y - GROUND_Y);
    } else if (inApartment) {
      groundY = APT_FLOOR_Y;
    } else {
      groundY = GROUND_Y;
    }

    // Jump: spacebar triggers jump if on the ground
    if (!velocityY.current && (keys.current.has(" ") || keys.current.has("space"))) {
      if (Math.abs(camera.position.y - groundY) < 0.2) {
        velocityY.current = JUMP_VELOCITY;
      }
    }

    // Apply gravity and velocity
    if (velocityY.current || camera.position.y > groundY + 0.1) {
      velocityY.current -= GRAVITY * delta;
      camera.position.y += velocityY.current * delta;
      // Land
      if (camera.position.y <= groundY) {
        camera.position.y = groundY;
        velocityY.current = 0;
      }
    } else {
      // On the ground — snap to ground height (smooth for stairs)
      camera.position.y += (groundY - camera.position.y) * 0.2;
      velocityY.current = 0;
    }

    // Crouch mechanic: hold Shift to lower camera
    if (keys.current.has("shift") && velocityY.current === 0) {
      camera.position.y -= 0.8;
    }

    // Update spatial audio listener to match player position
    setPlayerPosition(camera.position.x, camera.position.z);
  });

  return null;
}
