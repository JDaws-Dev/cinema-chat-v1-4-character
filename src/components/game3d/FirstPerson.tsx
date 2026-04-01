"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";
import { setPlayerPosition } from "@/lib/audio";

const SPEED = 3.5;
const MOUSE_SENS = 0.002;
const ROOM_BOUNDS = { minX: -9.5, maxX: 9.5, minZ: -6.5, maxZ: 14 }; // extended +z for outside area
const PLAYER_RADIUS = 0.4;

// Collision boxes derived from layout data — positions stay in sync with editor
import { getObjectById, getShelfRows } from "@/lib/store-layout";

function buildColliders(): { x: number; z: number; hw: number; hd: number }[] {
  const colliders: { x: number; z: number; hw: number; hd: number }[] = [];

  // ── Gondola shelves ──
  // Each is 3.2w x 0.6d but rotated, so compute AABB from rotation.
  // Add 15% padding for comfortable clearance.
  for (const row of getShelfRows()) {
    const absRot = Math.abs(row.rotY || 0);
    const cosR = Math.cos(absRot);
    const sinR = Math.sin(absRot);
    const shelfW = 3.2; // layout width
    const shelfD = 0.6; // layout depth
    // AABB half-extents of a rotated rectangle, +15% padding
    const hw = ((shelfW * cosR + shelfD * sinR) / 2) * 1.15;
    const hd = ((shelfW * sinR + shelfD * cosR) / 2) * 1.15;
    colliders.push({ x: row.x, z: row.z, hw, hd });
  }

  // ── Counter (x=7, z=5, 6w x 1.2d) ──
  const counter = getObjectById("counter");
  if (counter) colliders.push({ x: counter.x, z: counter.z, hw: 3.2, hd: 0.8 });

  // ── New Releases back wall display (x=0, z=-6.85, full width) ──
  const nr = getObjectById("new-releases-wall");
  if (nr) colliders.push({ x: nr.x, z: nr.z, hw: 9.5, hd: 0.4 });

  // ── Wall shelf: DRAMA on back wall (x=-5, z=-6.85, 6w) ──
  const dramWall = getObjectById("wallshelf-back-drama");
  if (dramWall) colliders.push({ x: dramWall.x, z: dramWall.z, hw: 3.2, hd: 0.4 });

  // ── Wall shelf: FOREIGN on left wall (x=-9.85, z=-3, 4 tall along wall) ──
  // Against the left wall — room bounds handle x, but add thin collider for z extent
  const foreignWall = getObjectById("wallshelf-left-foreign");
  if (foreignWall) colliders.push({ x: foreignWall.x, z: foreignWall.z, hw: 0.4, hd: 2.2 });

  // ── Wall shelf: DOCS on left wall (x=-9.85, z=1, 4 tall along wall) ──
  const docsWall = getObjectById("wallshelf-left-docs");
  if (docsWall) colliders.push({ x: docsWall.x, z: docsWall.z, hw: 0.4, hd: 2.2 });

  // ── Wall shelf: NEW RELEASES on right wall (x=9.85, z=-2, 8 tall along wall) ──
  const newWall = getObjectById("wallshelf-right-new");
  if (newWall) colliders.push({ x: newWall.x, z: newWall.z, hw: 0.4, hd: 4.2 });

  // ── Cooler (x=8.63, z=3.5, 0.8w x 0.6d) ──
  const cooler = getObjectById("cooler");
  if (cooler) colliders.push({ x: cooler.x, z: cooler.z, hw: 0.5, hd: 0.4 });

  // ── Trophy shelf (x=9.7, z=-4, rotated 90deg so 0.6w x 2.5d) ──
  const trophy = getObjectById("trophy-shelf");
  if (trophy) colliders.push({ x: trophy.x, z: trophy.z, hw: 0.4, hd: 1.4 });

  // ── Return bin (x=3.5, z=5.2, 0.8w x 0.6d) ──
  const returnBin = getObjectById("return-bin");
  if (returnBin) colliders.push({ x: returnBin.x, z: returnBin.z, hw: 0.5, hd: 0.4 });

  // ── Return chute near right wall (x=9, z=5.5, 0.9w x 0.6d) ──
  const returnChute = getObjectById("return-chute");
  if (returnChute) colliders.push({ x: returnChute.x, z: returnChute.z, hw: 0.55, hd: 0.4 });

  // ── Bargain crate (x=-1.5, z=4.5, 0.9w x 0.7d) — small floor bin ──
  const bargainCrate = getObjectById("bargain-crate");
  if (bargainCrate) colliders.push({ x: bargainCrate.x, z: bargainCrate.z, hw: 0.55, hd: 0.45 });

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

    // Update spatial audio listener to match player position
    setPlayerPosition(camera.position.x, camera.position.z);
  });

  return null;
}
