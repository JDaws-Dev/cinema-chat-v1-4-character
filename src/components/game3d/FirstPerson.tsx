"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";
import { setPlayerPosition } from "@/lib/audio";

const SPEED = 3.5;
const MOUSE_SENS = 0.002;
const ROOM_BOUNDS = { minX: -9.5, maxX: 9.5, minZ: -6.5, maxZ: 14 }; // extended +z for outside area
// Back room bounds: x=-13.5 to -10.5, z=-6.0 to -4.0
const BACK_ROOM_BOUNDS = { minX: -13.5, maxX: -10.0, minZ: -6.0, maxZ: -4.0 };
const PLAYER_RADIUS = 0.4;

// Collision boxes derived from layout data — positions stay in sync with editor
import { getObjectById, getShelfRows } from "@/lib/store-layout";

function buildColliders(): { x: number; z: number; hw: number; hd: number }[] {
  const colliders: { x: number; z: number; hw: number; hd: number }[] = [];

  // Shelves — use layout positions, inflate AABB slightly for rotation
  for (const row of getShelfRows()) {
    const absRot = Math.abs(row.rotY || 0);
    colliders.push({ x: row.x, z: row.z, hw: 1.7, hd: 0.4 + absRot * 0.5 });
  }

  // Counter
  const counter = getObjectById("counter");
  if (counter) colliders.push({ x: counter.x, z: counter.z, hw: 3.2, hd: 0.8 });

  // New Releases back wall
  const nr = getObjectById("new-releases-wall");
  if (nr) colliders.push({ x: nr.x, z: nr.z, hw: 9.5, hd: 0.4 });

  // Cooler
  const cooler = getObjectById("cooler");
  if (cooler) colliders.push({ x: cooler.x, z: cooler.z, hw: 0.5, hd: 0.4 });

  // Trophy shelf
  const trophy = getObjectById("trophy-shelf");
  if (trophy) colliders.push({ x: trophy.x, z: trophy.z, hw: 0.4, hd: 1.3 });

  // Bargain bin
  const bargain = getObjectById("bargain-bin");
  if (bargain) colliders.push({ x: bargain.x, z: bargain.z, hw: 0.5, hd: 0.4 });

  return colliders;
}

const COLLIDERS = buildColliders();

// Employees Only door collider — reads from layout
const doorPos = getObjectById("employees-door");
const DOOR_COLLIDER = { x: doorPos?.x ?? -9.8, z: doorPos?.z ?? -5.19, hw: 0.3, hd: 0.55 };

// Back room desk collider
const BACK_ROOM_COLLIDERS = [
  { x: -13.2, z: -4.2, hw: 0.55, hd: 0.35 },
];

function collidesWithAny(px: number, pz: number, doorOpen: boolean): boolean {
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
  // Door collider — only when door is closed
  if (!doorOpen) {
    const c = DOOR_COLLIDER;
    if (
      px + PLAYER_RADIUS > c.x - c.hw &&
      px - PLAYER_RADIUS < c.x + c.hw &&
      pz + PLAYER_RADIUS > c.z - c.hd &&
      pz - PLAYER_RADIUS < c.z + c.hd
    ) {
      return true;
    }
  }
  // Back room colliders — only relevant when door is open
  if (doorOpen) {
    for (const c of BACK_ROOM_COLLIDERS) {
      if (
        px + PLAYER_RADIUS > c.x - c.hw &&
        px - PLAYER_RADIUS < c.x + c.hw &&
        pz + PLAYER_RADIUS > c.z - c.hd &&
        pz - PLAYER_RADIUS < c.z + c.hd
      ) {
        return true;
      }
    }
  }
  return false;
}

// Check if position is within the back room area (used for extended bounds)
function isInBackRoomArea(px: number, pz: number): boolean {
  return px < ROOM_BOUNDS.minX &&
    px >= BACK_ROOM_BOUNDS.minX &&
    pz >= BACK_ROOM_BOUNDS.minZ &&
    pz <= BACK_ROOM_BOUNDS.maxZ;
}

// Check if position is in the doorway transition zone
function isInDoorway(px: number, pz: number): boolean {
  return px <= -9.0 && px >= -10.5 && pz >= -5.75 && pz <= -4.65;
}

export function FirstPersonControls({ disabled = false, backRoomOpen = false }: { disabled?: boolean; backRoomOpen?: boolean }) {
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
      camera.position.set(0, 1.6, 14); // Outside in parking lot — can see the sign
      camera.lookAt(0, 2.5, 7); // Face toward store sign
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

      // Room bounds — extend for back room when door is open
      let clampedX: number;
      let clampedZ: number;

      if (backRoomOpen && (isInBackRoomArea(newX, newZ) || isInDoorway(newX, newZ))) {
        // In back room or doorway — use extended bounds
        clampedX = Math.max(BACK_ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, newX));
        clampedZ = Math.max(BACK_ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, newZ));
      } else if (backRoomOpen && isInBackRoomArea(camera.position.x, camera.position.z)) {
        // Currently in back room, trying to move — use back room bounds
        clampedX = Math.max(BACK_ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, newX));
        clampedZ = Math.max(BACK_ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, newZ));
      } else {
        // Normal main store bounds
        clampedX = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, newX));
        clampedZ = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, newZ));
      }

      // Try full movement first
      if (!collidesWithAny(clampedX, clampedZ, backRoomOpen)) {
        camera.position.x = clampedX;
        camera.position.z = clampedZ;
      }
      // Try sliding along X only
      else if (!collidesWithAny(clampedX, camera.position.z, backRoomOpen)) {
        camera.position.x = clampedX;
      }
      // Try sliding along Z only
      else if (!collidesWithAny(camera.position.x, clampedZ, backRoomOpen)) {
        camera.position.z = clampedZ;
      }
      // Blocked both ways — don't move
    }

    // Crouch mechanic: hold Shift or C to lower camera
    const crouchTarget = keys.current.has("shift") ? 0.8 : 1.6;
    camera.position.y += (crouchTarget - camera.position.y) * 0.15;

    // Update spatial audio listener to match player position
    setPlayerPosition(camera.position.x, camera.position.z);
  });

  return null;
}
