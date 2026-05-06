"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";
import { getRegisteredNPCPositions, setPlayerPosition } from "@/lib/audio";

const SPEED = 3.5;
const MOUSE_SENS = 0.002;
const ROOM_BOUNDS = { minX: -20, maxX: 20, minZ: -6.5, maxZ: 20 }; // full strip mall + side streets + parking lot + road
const PLAYER_RADIUS = 0.4;
const NPC_COLLISION_RADIUS = 0.72;
const CROUCH_OFFSET = 0.96;
const CROUCH_DAMPING = 16;

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

  // ── Laundromat walls (x=10 to x=16) — 8m deep ──
  // Front wall — left of door (x=10 to x=12.85, z=7)
  colliders.push({ x: 11.5, z: 7.2, hw: 1.5, hd: 0.2 });
  // Front wall — right of door (x=14.15 to x=16, z=7)
  colliders.push({ x: 15.1, z: 7.2, hw: 0.9, hd: 0.2 });
  // Right wall of laundromat (x=16) — deep interior only, clears stair path AND apartment door (z=0.87)
  colliders.push({ x: 16.1, z: -1.5, hw: 0.1, hd: 1 });  // z=-2.5 to z=-0.5 only
  // Back wall of laundromat — shortened to x=10..15.5 to leave stair corridor (x=16+) clear
  colliders.push({ x: 12.75, z: 0.05, hw: 2.75, hd: 0.2 });

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

function collidesWithNpc(px: number, pz: number): boolean {
  for (const npc of getRegisteredNPCPositions()) {
    const dx = px - npc.x;
    const dz = pz - npc.z;
    if (dx * dx + dz * dz < NPC_COLLISION_RADIUS * NPC_COLLISION_RADIUS) {
      return true;
    }
  }
  return false;
}

export function FirstPersonControls({
  disabled = false,
  initialSpawn,
  initialLookAt,
}: {
  disabled?: boolean;
  initialSpawn?: [number, number, number];
  initialLookAt?: [number, number, number];
}) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const locked = useRef(false);
  const initialized = useRef(false);
  const standingEyeY = useRef(1.6);
  const velocityY = useRef(0);
  const crouchAmount = useRef(0);
  const lookVelocityX = useRef(0);
  const lookVelocityY = useRef(0);

  // Pointer lock
  const requestLock = useCallback(() => {
    if (disabled) return;
    try {
      const lockRequest = gl.domElement.requestPointerLock?.();
      if (lockRequest instanceof Promise) {
        lockRequest.catch(() => {});
      }
    } catch {
      // Browser automation/headless contexts can reject pointer lock.
    }
  }, [gl, disabled]);

  // ── Global teleport function — used by apartment door interaction ──
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__teleportPlayer = (x: number, y: number, z: number, lookX?: number, lookZ?: number) => {
      camera.position.set(x, y, z);
      standingEyeY.current = y;
      velocityY.current = 0;
      if (lookX !== undefined && lookZ !== undefined) {
        camera.lookAt(lookX, y, lookZ);
        euler.current.setFromQuaternion(camera.quaternion);
      }
    };
    return () => { delete (window as unknown as Record<string, unknown>).__teleportPlayer; };
  }, [camera]);

  useEffect(() => {
    // Set spawn position only on very first mount
    if (!initialized.current) {
      const sx = initialSpawn?.[0] ?? -0.85;
      const sy = initialSpawn?.[1] ?? 1.6;
      const sz = initialSpawn?.[2] ?? 10.6; // default: welcome-mat view through the left door
      const lx = initialLookAt?.[0] ?? -0.85;
      const ly = initialLookAt?.[1] ?? 1.55;
      const lz = initialLookAt?.[2] ?? 0.5;
      camera.position.set(sx, sy, sz);
      standingEyeY.current = sy;
      camera.lookAt(lx, ly, lz);
      camera.getWorldDirection(new THREE.Vector3());
      euler.current.setFromQuaternion(camera.quaternion);
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
      if (!collidesWithAny(clampedX, clampedZ) && !collidesWithNpc(clampedX, clampedZ)) {
        camera.position.x = clampedX;
        camera.position.z = clampedZ;
      }
      // Try sliding along X only
      else if (!collidesWithAny(clampedX, camera.position.z) && !collidesWithNpc(clampedX, camera.position.z)) {
        camera.position.x = clampedX;
      }
      // Try sliding along Z only
      else if (!collidesWithAny(camera.position.x, clampedZ) && !collidesWithNpc(camera.position.x, clampedZ)) {
        camera.position.z = clampedZ;
      }
      // Blocked both ways — don't move
    }

    // ── Vertical movement: stairs, jump, gravity ──
    const APT_FLOOR_Y = 3.7 + 1.6; // apartment floor y=3.7 + eye height 1.6
    const GROUND_Y = 1.6;
    const GRAVITY = 12;
    const JUMP_VELOCITY = 5.5;

    // Determine ground height at current position
    // Stair world coords — derived from APT_Z=4.3:
    //   Bottom entry (ground): z = APT_Z + halfD = 4.3 + 2.5 = 6.8
    //   Top step:              z = APT_Z + (halfD - totalRun) = 4.3 + (2.5 - 5.6) = 1.1
    //   Landing center:        z = APT_Z + (topZ - landD/2) = 4.3 + (-3.1 - 0.75) = 0.45
    //   Stair X center:        x = APT_X + (halfW + enclW/2) = 13 + (3 + 0.6) = 16.6
    const STAIR_BOT_Z = 7.0;   // ground entry (slightly forward of actual 6.8 for approach)
    const STAIR_TOP_Z = 1.5;   // top step (actual=1.48, must reach full height HERE so player steps onto landing)
    const LANDING_Z = 0.45;    // landing center

    const inStairX = camera.position.x > 16.0 && camera.position.x < 17.8;
    const inStairZ = camera.position.z > STAIR_TOP_Z - 0.3 && camera.position.z < STAIR_BOT_Z + 1.5;
    const inApartment = camera.position.x > 10 && camera.position.x < 16 &&
                        camera.position.z > 1.8 && camera.position.z < 7.0 &&
                        camera.position.y > 3.0;
    // Landing: from top step to landing back edge
    // Landing zone — extends forward to overlap with top 2 stairs for smooth transition
    const inLanding = camera.position.x > 16.0 && camera.position.x < 17.8 &&
                      camera.position.z > LANDING_Z - 1.0 && camera.position.z < STAIR_TOP_Z + 0.5 &&
                      camera.position.y > 3.0;

    let groundY: number;
    if (inLanding) {
      groundY = APT_FLOOR_Y;
    } else if (inStairX && inStairZ) {
      // Stairs ramp: STAIR_BOT_Z is ground level, STAIR_TOP_Z is apartment level
      const stairProgress = 1 - Math.max(0, Math.min(1, (camera.position.z - STAIR_TOP_Z) / (STAIR_BOT_Z - STAIR_TOP_Z)));
      groundY = GROUND_Y + stairProgress * (APT_FLOOR_Y - GROUND_Y);
    } else if (inApartment) {
      groundY = APT_FLOOR_Y;
    } else {
      groundY = GROUND_Y;
    }

    const crouchTarget = keys.current.has("shift") && velocityY.current === 0 ? CROUCH_OFFSET : 0;
    crouchAmount.current = THREE.MathUtils.damp(crouchAmount.current, crouchTarget, CROUCH_DAMPING, delta);
    const stanceGroundY = groundY - crouchAmount.current;

    // Jump: spacebar triggers jump if on the ground
    if (!velocityY.current && (keys.current.has(" ") || keys.current.has("space"))) {
      if (!keys.current.has("shift") && Math.abs(standingEyeY.current - groundY) < 0.12) {
        velocityY.current = JUMP_VELOCITY;
      }
    }

    // Apply gravity against the real floor height; crouch is only a held view offset.
    if (velocityY.current || standingEyeY.current > groundY + 0.1) {
      velocityY.current -= GRAVITY * delta;
      standingEyeY.current += velocityY.current * delta;
      // Land
      if (standingEyeY.current <= groundY) {
        standingEyeY.current = groundY;
        velocityY.current = 0;
      }
    } else {
      // On the ground — snap to ground height (smooth for stairs)
      standingEyeY.current += (groundY - standingEyeY.current) * 0.2;
      velocityY.current = 0;
    }

    camera.position.y = standingEyeY.current - crouchAmount.current;

    // Update spatial audio listener to match player position
    setPlayerPosition(camera.position.x, camera.position.z);
  });

  return null;
}
