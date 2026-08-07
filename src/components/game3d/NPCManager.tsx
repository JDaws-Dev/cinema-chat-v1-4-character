"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  type ActiveNPC,
  type NPCManagerState,
  type NPCConversation,
  type NPCState,
  createInitialManagerState,
  tickNPCManager,
  DEFAULT_MANAGER_CONFIG,
  startPlayerDialogue,
  endPlayerDialogue,
  WAYPOINTS,
  CONVERSATION_TOPICS,
} from "@/lib/npc-behavior";
import { getEraConversationTopics } from "@/lib/era-npc-scripts";
import { registerNPCPosition, unregisterNPCPosition, playNpcLine } from "@/lib/audio";
import { getPersonalityLabel } from "@/lib/npc-personalities";

// ── Speech bubble styles (inline — rendered via Html) ──────────
const BUBBLE_STYLE: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.92)",
  border: "2px solid #ffd700",
  color: "#fff",
  padding: "6px 10px",
  fontSize: "0.45rem",
  fontFamily: "var(--font-pixel, monospace)",
  maxWidth: "180px",
  textAlign: "center",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
  pointerEvents: "none" as const,
  boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
};

// ── Lifelike animation seed helper ──────────────────────────────
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295; // 0..1
}

// Deterministic seed from two values (for browse height per-shelf-stop)
function seedFromIdAndStep(id: string, step: number): number {
  let h = 0;
  const combined = id + ":" + step;
  for (let i = 0; i < combined.length; i++) h = ((h << 5) - h + combined.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295; // 0..1
}

// Browse height type: squat (30%), eye-level (50%), reach-up (20%)
type BrowseHeight = "squat" | "eye_level" | "reach_up";
function browseHeightFromSeed(s: number): BrowseHeight {
  if (s < 0.3) return "squat";
  if (s < 0.8) return "eye_level";
  return "reach_up";
}

// ── NPC mesh — simplified box-geometry character ───────────────

// ── Priority 9: VHS genre colors ─────────────────────────────
const VHS_GENRE_COLORS: { genre: string; color: string }[] = [
  { genre: "action", color: "#cc2222" },
  { genre: "drama", color: "#2244aa" },
  { genre: "comedy", color: "#dd8800" },
  { genre: "horror", color: "#7722aa" },
];

function NPCMesh({
  npc,
  groupRef,
  allNpcs,
}: {
  npc: ActiveNPC;
  groupRef: React.RefObject<THREE.Group | null>;
  allNpcs: ActiveNPC[];
}) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  // Groups, not meshes — the blink scales the whole eye (white + pupil).
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const vhsBoxRef = useRef<THREE.Mesh>(null);

  // Per-NPC seed for animation desync
  const seed = useMemo(() => seedFromId(npc.config.id), [npc.config.id]);
  const breathPeriod = useMemo(() => 3.5 + seed * 1.0, [seed]); // 3.5-4.5s
  const swayPhase = useMemo(() => seed * Math.PI * 2, [seed]);
  const headFreq1 = useMemo(() => 0.7 + seed * 0.4, [seed]);
  const headFreq2 = useMemo(() => 1.3 + (1 - seed) * 0.5, [seed]);

  // Blink state
  const nextBlink = useRef(3 + seed * 2);
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);

  // Priority 7: Browsing height — deterministic per NPC + goalStepIndex
  const browseHeightSeed = useMemo(
    () => seedFromIdAndStep(npc.config.id, npc.goalStepIndex),
    [npc.config.id, npc.goalStepIndex]
  );
  const browseHeight = useMemo(() => browseHeightFromSeed(browseHeightSeed), [browseHeightSeed]);

  // Priority 9: Track whether NPC has checked out (carries VHS after)
  const hasCheckedOut = useRef(false);
  const vhsGenreColor = useMemo(() => {
    const idx = Math.floor(seedFromId(npc.config.id + ":vhs") * VHS_GENRE_COLORS.length);
    return VHS_GENRE_COLORS[idx % VHS_GENRE_COLORS.length].color;
  }, [npc.config.id]);

  // Priority 8: Environmental reactions state
  const enterTimer = useRef(0); // tracks time since entering state began
  const prevState = useRef<string>(npc.state);
  const glanceTimer = useRef(0); // cooldown for mutual NPC glance
  const glanceActive = useRef(false);
  const glanceDuration = useRef(0);
  const glanceTargetDir = useRef(0); // Y rotation toward glance target

  // LOD: frame counter for half-rate animation at medium distance
  const frameCounter = useRef(0);
  // LOD: track if we applied static pose (to avoid re-applying every frame)
  const wasStaticPose = useRef(false);

  const { camera } = useThree();

  const { shirtColor, pantsColor, hairColor, skinTone, hairStyle, height } =
    npc.config.appearance;

  // ── SINGLE combined useFrame: positioning + animation with distance-based LOD ──
  useFrame((state, dt) => {
    const cappedDt = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime;
    frameCounter.current++;

    // ── Positioning (from ManagedNPC — always runs regardless of LOD) ──
    if (groupRef.current) {
      const isWalkingPos = npc.state === "walking" || npc.state === "entering" || npc.state === "leaving";
      const feetOffset = 0; // Minecraft-style model feet at Y=0
      const swayOffset = isWalkingPos ? 0 : Math.sin(t * (Math.PI * 2 / 6) + swayPhase) * 0.02;
      const squatOffset = (npc.state === "browsing" && browseHeight === "squat") ? -0.3 : 0;
      groupRef.current.position.set(npc.position[0] + swayOffset, feetOffset + squatOffset, npc.position[2]);
      groupRef.current.rotation.y = npc.facing;
      groupRef.current.visible = npc.opacity > 0.01;

      // Opacity handling
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          if (npc.opacity < 0.99) {
            child.material.transparent = true;
            child.material.opacity = npc.opacity;
          } else {
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        }
      });

      registerNPCPosition(npc.config.id, npc.position[0], npc.position[2]);
    }

    // ── Distance-based LOD ──
    const dx = npc.position[0] - camera.position.x;
    const dz = npc.position[2] - camera.position.z;
    const distToCamera = Math.sqrt(dx * dx + dz * dz);

    // FAR (>12 units): skip ALL animation, set static pose once
    if (distToCamera > 12) {
      if (!wasStaticPose.current) {
        wasStaticPose.current = true;
        // Reset to neutral static pose
        if (torsoRef.current) { torsoRef.current.scale.y = 1; torsoRef.current.rotation.y = 0; }
        if (headRef.current) { headRef.current.rotation.z = 0; headRef.current.rotation.y = 0; headRef.current.rotation.x = 0; }
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
        if (mouthRef.current) mouthRef.current.scale.y = 1;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
        if (leftHandRef.current) leftHandRef.current.scale.set(1, 1, 1);
        if (rightHandRef.current) rightHandRef.current.scale.set(1, 1, 1);
      }
      // Still track checkout state and VHS visibility (cheap)
      if (npc.state === "checking_out") hasCheckedOut.current = true;
      if (vhsBoxRef.current) vhsBoxRef.current.visible = hasCheckedOut.current;
      return;
    }

    wasStaticPose.current = false;

    // MEDIUM (8-12 units): run animation at half rate (skip every other frame)
    if (distToCamera >= 8 && distToCamera <= 12) {
      if (frameCounter.current % 2 !== 0) {
        // Still track state changes even on skipped frames
        if (npc.state === "checking_out") hasCheckedOut.current = true;
        if (vhsBoxRef.current) vhsBoxRef.current.visible = hasCheckedOut.current;
        if (npc.state !== prevState.current) {
          if (npc.state === "entering") enterTimer.current = 0;
          prevState.current = npc.state;
        }
        return;
      }
      // Double dt to compensate for half-rate updates
      // (cappedDt is already set, we use it as-is since visual effect is acceptable)
    }

    // NEAR (<8 units) or MEDIUM (on active frames): run full animation

    const isWalking =
      npc.state === "walking" ||
      npc.state === "entering" ||
      npc.state === "leaving";

    // ── Priority 1: Breathing — torso scaleY pulses 1.0 → 1.008 ──
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1.0 + 0.008 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / breathPeriod));
    }

    // ── Priority 1: Head micro-movements — two sine waves, 0.03 rad max ──
    if (headRef.current) {
      const micro = Math.sin(t * headFreq1 * 2.5) * 0.015 + Math.sin(t * headFreq2 * 3.1) * 0.015;
      headRef.current.rotation.z = micro;
      // Also small Y rotation for head look variation
      if (!isWalking) {
        headRef.current.rotation.y = Math.sin(t * 0.3 + swayPhase) * 0.08;
      }
    }

    // ── Priority 2: Blink — scale eye Y to 0.05 for 0.1s every 3-5s ──
    if (isBlinking.current) {
      blinkTimer.current -= cappedDt;
      if (blinkTimer.current <= 0) {
        isBlinking.current = false;
        nextBlink.current = 3 + Math.random() * 2;
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
      }
    } else {
      nextBlink.current -= cappedDt;
      if (nextBlink.current <= 0) {
        isBlinking.current = true;
        blinkTimer.current = 0.1;
        if (leftEyeRef.current) leftEyeRef.current.scale.y = 0.05;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = 0.05;
      }
    }

    // ── Priority 5: Mouth movement during conversation ──
    if (mouthRef.current) {
      const isTalking = npc.state === "talking_to_player" || npc.state === "talking_to_npc";
      if (isTalking) {
        const mouthAnim = 0.5 + 0.5 * (Math.sin(t * 10.7 + seed * 12) * 0.55 + Math.sin(t * 7.1 + seed * 5) * 0.45);
        mouthRef.current.scale.y = 0.5 + mouthAnim; // range 0.5 to 1.5
      } else {
        mouthRef.current.scale.y = 1;
      }
    }

    // ── Priority 3: Walking improvements ──
    if (isWalking) {
      const walkT = performance.now() * 0.008;
      const legSwing = Math.sin(walkT) * 0.4;

      // Leg animation
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;

      // Torso counter-rotation: ±0.06 rad opposite to legs
      if (torsoRef.current) {
        torsoRef.current.rotation.y = -Math.sin(walkT) * 0.06;
      }

      // Arm swing with phase lag (~0.15 rad offset from legs)
      const armSwing = Math.sin(walkT - 0.15) * 0.4 * 0.6;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;

      // Priority 7: Approach deceleration — dampen limbs when close to target waypoint
      if (npc.state === "walking" && npc.currentPath.length > 0 && npc.pathIndex < npc.currentPath.length) {
        const targetWpId = npc.currentPath[npc.pathIndex];
        const targetWp = WAYPOINTS[targetWpId];
        if (targetWp) {
          const wpDx = targetWp.position[0] - npc.position[0];
          const wpDz = targetWp.position[2] - npc.position[2];
          const dist = Math.sqrt(wpDx * wpDx + wpDz * wpDz);
          if (dist < 0.5) {
            // Smooth deceleration: lerp swing amplitude toward 0
            const dampFactor = Math.max(0, dist / 0.5);
            if (leftLegRef.current) leftLegRef.current.rotation.x *= dampFactor;
            if (rightLegRef.current) rightLegRef.current.rotation.x *= dampFactor;
            if (leftArmRef.current) leftArmRef.current.rotation.x *= dampFactor;
            if (rightArmRef.current) rightArmRef.current.rotation.x *= dampFactor;
            if (torsoRef.current) torsoRef.current.rotation.y *= dampFactor;
          }
        }
      }

      // Priority 8: Near counter — slow leg swing to 0.8x when walking near counter
      {
        const cDx = npc.position[0] - 7;
        const cDz = npc.position[2] - 5;
        const cDist = Math.sqrt(cDx * cDx + cDz * cDz);
        if (cDist < 2.0) {
          const slowFactor = 0.8;
          if (leftLegRef.current) leftLegRef.current.rotation.x *= slowFactor;
          if (rightLegRef.current) rightLegRef.current.rotation.x *= slowFactor;
          if (leftArmRef.current) leftArmRef.current.rotation.x *= slowFactor;
          if (rightArmRef.current) rightArmRef.current.rotation.x *= slowFactor;
        }
      }
    } else {
      // Decay limbs to rest
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9;
      if (torsoRef.current) torsoRef.current.rotation.y *= 0.9;
    }

    // ── Priority 7: Browsing height variety ──
    if (npc.state === "browsing") {
      if (browseHeight === "squat") {
        // Bend legs outward to simulate crouching (Y offset handled in positioning above)
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.max(leftLegRef.current.rotation.x, 0.5);
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.max(rightLegRef.current.rotation.x, 0.5);
      } else if (browseHeight === "reach_up") {
        // One arm extends high, head tilts up
        if (rightArmRef.current) rightArmRef.current.rotation.x = -2.8; // arm extends upward
        if (headRef.current) headRef.current.rotation.x = -0.15; // head tilts up
      }
      // eye_level: no modification needed
    }

    // ── Priority 8: Environmental reactions ──

    // Track state transitions for enter timer
    if (npc.state !== prevState.current) {
      if (npc.state === "entering") {
        enterTimer.current = 0; // reset on entering state
      }
      prevState.current = npc.state;
    }

    // Near door (z > 5.5, entering state): head pans left-right for first 2s
    if (npc.state === "entering" && npc.position[2] > 5.5 && headRef.current) {
      enterTimer.current += cappedDt;
      if (enterTimer.current < 2.0) {
        // Wide head pan: oscillate Y rotation ±0.5 rad over 2s
        const panProgress = enterTimer.current / 2.0;
        headRef.current.rotation.y = Math.sin(panProgress * Math.PI * 3) * 0.5;
      }
    }

    // Near counter (within 2 units of x:7, z:5): head glance toward counter
    const counterDx = npc.position[0] - 7;
    const counterDz = npc.position[2] - 5;
    const counterDist = Math.sqrt(counterDx * counterDx + counterDz * counterDz);
    if (counterDist < 2.0 && isWalking && headRef.current) {
      // Glance toward counter: rotate head toward (7, 5) relative to NPC facing
      const angleToCounter = Math.atan2(7 - npc.position[0], 5 - npc.position[2]);
      const relAngle = angleToCounter - npc.facing;
      // Blend head Y toward counter direction (soft glance)
      headRef.current.rotation.y = headRef.current.rotation.y * 0.85 + relAngle * 0.15 * 0.5;
    }

    // Near another NPC (< 1.5 units, not in conversation): mutual glance
    if (!glanceActive.current) {
      glanceTimer.current -= cappedDt;
      if (glanceTimer.current <= 0 && npc.state !== "talking_to_npc" && npc.state !== "talking_to_player") {
        // Check for nearby NPCs
        for (const other of allNpcs) {
          if (other.config.id === npc.config.id) continue;
          if (other.state === "talking_to_npc" || other.state === "talking_to_player") continue;
          const npcDx = npc.position[0] - other.position[0];
          const npcDz = npc.position[2] - other.position[2];
          const dist = Math.sqrt(npcDx * npcDx + npcDz * npcDz);
          if (dist < 1.5 && dist > 0.1) {
            glanceActive.current = true;
            glanceDuration.current = 0.5;
            glanceTargetDir.current = Math.atan2(other.position[0] - npc.position[0], other.position[2] - npc.position[2]) - npc.facing;
            break;
          }
        }
        if (!glanceActive.current) {
          glanceTimer.current = 2.0 + Math.random() * 3.0; // check again in 2-5s
        }
      }
    }

    if (glanceActive.current && headRef.current) {
      glanceDuration.current -= cappedDt;
      if (glanceDuration.current > 0) {
        // Rotate head toward the other NPC
        headRef.current.rotation.y = headRef.current.rotation.y * 0.7 + glanceTargetDir.current * 0.3;
      } else {
        glanceActive.current = false;
        glanceTimer.current = 3.0 + Math.random() * 4.0; // cooldown before next glance
      }
    }

    // ── Priority 9: Hand shape toggle ──
    // Idle/browsing = open palm (flattened sphere), other states = closed fist (uniform)
    const isBrowsingOrIdle = npc.state === "browsing" || npc.state === "waiting" || npc.state === "entering";
    if (leftHandRef.current) {
      if (isBrowsingOrIdle) {
        leftHandRef.current.scale.set(1.2, 0.7, 1);
      } else {
        leftHandRef.current.scale.set(1, 1, 1);
      }
    }
    if (rightHandRef.current) {
      if (isBrowsingOrIdle) {
        rightHandRef.current.scale.set(1.2, 0.7, 1);
      } else {
        rightHandRef.current.scale.set(1, 1, 1);
      }
    }

    // ── Priority 9: Track checkout state for VHS carry ──
    if (npc.state === "checking_out") {
      hasCheckedOut.current = true;
    }
    // Show/hide VHS box: visible after checking_out through leaving/despawning
    if (vhsBoxRef.current) {
      vhsBoxRef.current.visible = hasCheckedOut.current;
    }
  });

  // Head scale factor: 0.26 / 0.35. Applied to the whole head group so every
  // feature (hair variants, eyes, nose, mouth) trims together and the existing
  // offsets stay valid.
  const HEAD_TRIM = 0.743;

  // ── Priority 10: Body proportion tweaks by personality (Minecraft/Crossy Road style) ──
  const pType = npc.config.personalityType;

  // Per-NPC build variance.
  //
  // `height` (0.85–1.15) is applied as a uniform scale on the root group, which
  // gives different STATURES but identical BUILDS — every customer was the same
  // person at a different zoom level, which is what made a crowd read as clones.
  // These offsets vary limb and torso dimensions independently of that scale, so
  // two NPCs of the same height can still be a lanky one and a stocky one.
  // Hashed off the stable config id rather than random, so a given customer
  // looks the same every visit instead of reshuffling their body each spawn.
  // Not memoised on purpose: it's a pure deterministic hash of a stable string,
  // cheap enough to recompute, and adding a hook this far down the component
  // body risks hook-ordering problems for no gain.
  let buildSeed = 0;
  for (let i = 0; i < npc.config.id.length; i++) {
    buildSeed = (buildSeed * 31 + npc.config.id.charCodeAt(i)) | 0;
  }
  // Two decorrelated values in -1..1 from the one hash.
  const vBuild = (((buildSeed >>> 3) & 255) / 127.5) - 1;
  const vLeg = (((buildSeed >>> 13) & 255) / 127.5) - 1;

  const torsoW = (pType === "parent" ? 0.38 : 0.35) + vBuild * 0.035;
  const torsoD = (pType === "parent" ? 0.22 : 0.2) + vBuild * 0.018;
  const legH = (pType === "teenager" ? 0.4 : 0.35) + vLeg * 0.045;
  const headScale = pType === "kid" ? 1.15 : 1.0; // kid: proportionally bigger head

  return (
    <group ref={groupRef} scale={height * 1.6}>
      <group rotation={[0, Math.PI, 0]}>
      {/* ── Legs (short, stubby — Vinny proportions) ── */}
      <group ref={leftLegRef} position={[-0.08, legH, 0]}>
        <RoundedBox args={[0.12, legH, 0.12]} radius={0.022} smoothness={2} position={[0, -legH / 2, 0]} castShadow>
          <meshStandardMaterial color={pantsColor} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.05, 0.15]} radius={0.016} smoothness={2} position={[0, -legH + 0.025, -0.005]} castShadow>
          <meshStandardMaterial color="#2a2a2a" roughness={0.55} />
        </RoundedBox>
      </group>
      <group ref={rightLegRef} position={[0.08, legH, 0]}>
        <RoundedBox args={[0.12, legH, 0.12]} radius={0.022} smoothness={2} position={[0, -legH / 2, 0]} castShadow>
          <meshStandardMaterial color={pantsColor} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.05, 0.15]} radius={0.016} smoothness={2} position={[0, -legH + 0.025, -0.005]} castShadow>
          <meshStandardMaterial color="#2a2a2a" roughness={0.55} />
        </RoundedBox>
      </group>
      {/* ── Belt ── */}
      <mesh position={[0, legH + 0.02, 0]}>
        <boxGeometry args={[torsoW + 0.01, 0.04, torsoD + 0.01]} /><meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* ── Torso ── */}
      <RoundedBox ref={torsoRef} args={[torsoW, 0.35, torsoD]} radius={0.03} smoothness={2} position={[0, legH + 0.2, 0]} castShadow>
        <meshStandardMaterial color={shirtColor} />
      </RoundedBox>
      {/* ── Shoulder yoke ──────────────────────────────────────────────────
          A slightly wider, shallow slab across the top of the torso. This is
          what turns the silhouette from "box with a head on it" into
          something with a shoulder line — the single cheapest read of a
          human shape. Sits flush with the torso top (legH + 0.375). */}
      <mesh position={[0, legH + 0.355, 0]} castShadow>
        <boxGeometry args={[torsoW + 0.05, 0.075, torsoD + 0.005]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* ── Neck ── the gap that stops the head reading as welded on */}
      <mesh position={[0, legH + 0.425, 0]} castShadow>
        <boxGeometry args={[0.085, 0.075, 0.085]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* ── Arms ── inset closer to the ribs (was +0.06 off the torso edge,
          which left them floating with a visible air gap) and dropped to the
          new shoulder line. */}
      <group ref={leftArmRef} position={[-(torsoW / 2 + 0.035), legH + 0.36, 0]}>
        <RoundedBox args={[0.085, 0.3, 0.095]} radius={0.02} smoothness={2} position={[0, -0.15, 0]} castShadow>
          <meshStandardMaterial color={shirtColor} />
        </RoundedBox>
        <mesh ref={leftHandRef} position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={skinTone} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[(torsoW / 2 + 0.035), legH + 0.36, 0]}>
        <RoundedBox args={[0.085, 0.3, 0.095]} radius={0.02} smoothness={2} position={[0, -0.15, 0]} castShadow>
          <meshStandardMaterial color={shirtColor} />
        </RoundedBox>
        <mesh ref={rightHandRef} position={[0, -0.33, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={skinTone} />
        </mesh>
        {/* Priority 9: VHS box in right hand — visible after checking_out */}
        <mesh ref={vhsBoxRef} position={[0, -0.39, -0.03]} visible={false}>
          <boxGeometry args={[0.08, 0.05, 0.02]} /><meshStandardMaterial color={vhsGenreColor} />
        </mesh>
      </group>
      {/* ── Head ────────────────────────────────────────────────────────────
          Was a 0.35 cube on a 0.35-wide torso — the head was exactly as wide
          as the body, which is what made these read as placeholder rather
          than as a chosen blocky style. HEAD_TRIM scales the whole head group
          (skull, all 7 hair variants, eyes, nose, mouth) as one unit, so the
          proportions change without having to re-tune every feature offset.
          Sits on top of the neck: neck top (legH+0.4625) + half of the
          trimmed skull. */}
      <group ref={headRef} position={[0, legH + 0.592, 0]} scale={headScale * HEAD_TRIM}>
        <RoundedBox args={[0.35, 0.35, 0.35]} radius={0.04} smoothness={2} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color={skinTone} />
        </RoundedBox>
        {/* Hair variants */}
        {hairStyle === "flattop" && (
          <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.36, 0.06, 0.36]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {hairStyle === "long" && (
          <mesh position={[0, 0.1, -0.04]}><boxGeometry args={[0.36, 0.16, 0.3]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {hairStyle === "cap" && (
          <mesh position={[0, 0.17, 0.02]}><boxGeometry args={[0.37, 0.06, 0.4]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {hairStyle === "ponytail" && (
          <>
            <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.36, 0.06, 0.36]} /><meshStandardMaterial color={hairColor} /></mesh>
            <mesh position={[0, 0.0, 0.18]}><boxGeometry args={[0.06, 0.15, 0.06]} /><meshStandardMaterial color={hairColor} /></mesh>
          </>
        )}
        {hairStyle === "buzzcut" && (
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.34, 0.04, 0.34]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {hairStyle === "mohawk" && (
          <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.04, 0.1, 0.2]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {hairStyle === "afro" && (
          <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.38, 0.2, 0.38]} /><meshStandardMaterial color={hairColor} /></mesh>
        )}
        {/* ── Eyes ────────────────────────────────────────────────────────
            Were sphere-on-sphere: a 0.03 white ball at z=-0.17 with a 0.018
            pupil ball in FRONT of it at z=-0.20, so the pupils stuck ~4cm
            proud of a face whose front plane is z=-0.175. Fine at aisle
            distance, googly at conversation range. Now flat discs sitting on
            the face plane. The ref moved from the pupil to the eye group so a
            blink closes the whole eye rather than squashing the pupil inside a
            staring white ball. circleGeometry faces local +Z, so each disc is
            turned to face -Z (the front of the head) rather than relying on
            DoubleSide to paper over the orientation. */}
        <group ref={leftEyeRef} position={[-0.075, 0.02, -0.176]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.032, 14]} /><meshStandardMaterial color="#f4f1ea" />
          </mesh>
          <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.016, 12]} /><meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
        <group ref={rightEyeRef} position={[0.075, 0.02, -0.176]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.032, 14]} /><meshStandardMaterial color="#f4f1ea" />
          </mesh>
          <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.016, 12]} /><meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
        {/* Nose — kept as a small proud form; noses are meant to stick out */}
        <mesh position={[0, -0.035, -0.178]}>
          <sphereGeometry args={[0.017, 8, 8]} /><meshStandardMaterial color={skinTone} />
        </mesh>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.1, -0.17]}>
          <boxGeometry args={[0.06, 0.02, 0.02]} /><meshStandardMaterial color="#c07060" />
        </mesh>
      </group>
      </group>
    </group>
  );
}

// ── Speech bubble component (renders above NPC head) ───────────

function SpeechBubble({ text }: { text: string }) {
  return (
    <Html position={[0, 2.15, 0]} center distanceFactor={10} occlude={false}>
      <div style={BUBBLE_STYLE}>{text}</div>
    </Html>
  );
}

// ── Single managed NPC with name label + interaction userData ──

function ManagedNPC({
  npc,
  speechLine,
  allNpcs,
}: {
  npc: ActiveNPC;
  speechLine: string | null;
  allNpcs: ActiveNPC[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Set userData for interaction system raycast
  useEffect(() => {
    if (!groupRef.current) return;
    const label = `Talk to ${npc.config.name}`;
    groupRef.current.userData = {
      interactType: "customer",
      label,
      personalityType: npc.config.personalityType,
      npcManagerId: npc.config.id,
    };
  }, [npc.config.id, npc.config.name, npc.config.personalityType]);

  // NOTE: All useFrame logic (positioning + animation) is now consolidated
  // inside NPCMesh for a single useFrame callback per NPC with distance-based LOD.

  return (
    <group>
      <NPCMesh npc={npc} groupRef={groupRef} allNpcs={allNpcs} />
      {/* Name label — raised for big-head Minecraft proportions */}
      <group position={[npc.position[0], 2.0, npc.position[2]]}>
        {/* Name label removed — customers in a video store don't wear nametags.
            Their names still surface through overheard dialogue and subtitles. */}
      </group>
      {/* Speech bubble when in conversation */}
      {speechLine && (
        <group position={[npc.position[0], 0, npc.position[2]]}>
          <SpeechBubble text={speechLine} />
        </group>
      )}
    </group>
  );
}

// ── Conversation dialogue tracker ──────────────────────────────

function useConversationDialogue(
  state: NPCManagerState,
  eraId: string
) {
  const lineTimers = useRef<Map<string, number>>(new Map());
  const lineIndices = useRef<Map<string, number>>(new Map());
  const [activeSpeech, setActiveSpeech] = useState<Map<string, string>>(new Map());
  const playedLines = useRef<Set<string>>(new Set()); // track npcId:text already sent to TTS
  const { camera } = useThree();

  // Get era-appropriate topics
  const topics = React.useMemo(
    () => getEraConversationTopics(eraId),
    [eraId]
  );

  useFrame((_, dt) => {
    const cappedDt = Math.min(dt, 0.1);
    let changed = false;
    const newSpeech = new Map(activeSpeech);

    for (const [convId, conv] of state.activeConversations) {
      // Pick a topic for this conversation (deterministic from convId)
      const topicIdx = Math.abs(hashStr(convId)) % topics.length;
      const topic = topics[topicIdx];
      if (!topic) continue;

      // Initialize timer for this conversation
      if (!lineTimers.current.has(convId)) {
        lineTimers.current.set(convId, 0);
        lineIndices.current.set(convId, 0);
      }

      const timer = (lineTimers.current.get(convId) ?? 0) + cappedDt;
      lineTimers.current.set(convId, timer);

      const lineIdx = lineIndices.current.get(convId) ?? 0;
      const lineDuration = 3 + (topic.lines[lineIdx]?.length ?? 20) * 0.06;

      // Advance to next line
      if (timer >= lineDuration && lineIdx < topic.lines.length - 1) {
        lineTimers.current.set(convId, 0);
        lineIndices.current.set(convId, lineIdx + 1);
      }

      const currentIdx = lineIndices.current.get(convId) ?? 0;
      const currentLine = topic.lines[currentIdx];
      if (!currentLine) continue;

      // Speaker A = participant[0], B = participant[1]
      const speakerId = currentIdx % 2 === 0
        ? conv.participantIds[0]
        : conv.participantIds[1];

      // Clear previous speaker, set current
      for (const pid of conv.participantIds) {
        if (pid === speakerId) {
          if (newSpeech.get(pid) !== currentLine) {
            newSpeech.set(pid, currentLine);
            changed = true;
          }
        } else {
          if (newSpeech.has(pid)) {
            newSpeech.delete(pid);
            changed = true;
          }
        }
      }
    }

    // Clean up speech for ended conversations
    const activeParticipants = new Set<string>();
    for (const conv of state.activeConversations.values()) {
      for (const pid of conv.participantIds) activeParticipants.add(pid);
    }
    for (const [npcId] of newSpeech) {
      if (!activeParticipants.has(npcId)) {
        newSpeech.delete(npcId);
        changed = true;
      }
    }

    // Clean up timers for ended conversations
    for (const convId of lineTimers.current.keys()) {
      if (!state.activeConversations.has(convId)) {
        lineTimers.current.delete(convId);
        lineIndices.current.delete(convId);
      }
    }

    if (changed) {
      setActiveSpeech(newSpeech);

      // Trigger TTS for newly-speaking NPCs within earshot (~8 units)
      for (const [npcId, line] of newSpeech) {
        const key = `${npcId}:${line}`;
        if (playedLines.current.has(key)) continue;
        const npc = state.activeNPCs.get(npcId);
        if (!npc) continue;
        const dx = npc.position[0] - camera.position.x;
        const dz = npc.position[2] - camera.position.z;
        if (dx * dx + dz * dz > 64) continue; // 8^2 = 64
        playedLines.current.add(key);
        playNpcLine(npc.config.id, line, npc.config.personalityType);
      }
    }

    // Prune played-lines cache for ended conversations
    if (playedLines.current.size > 200) {
      const activeIds = new Set<string>();
      for (const conv of state.activeConversations.values()) {
        for (const pid of conv.participantIds) activeIds.add(pid);
      }
      for (const key of playedLines.current) {
        const npcId = key.split(":")[0];
        if (!activeIds.has(npcId)) playedLines.current.delete(key);
      }
    }
  });

  return activeSpeech;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ── NPCManager — the main component ────────────────────────────

/** Module-level active NPC count for DebugOverlay (avoids prop drilling). */
let _activeNpcCount = 0;
export function getActiveNpcCount() { return _activeNpcCount; }

export interface NPCManagerHandle {
  startDialogue: (npcId: string) => ActiveNPC | null;
  endDialogue: (npcId: string) => void;
  getNearby: (pos: [number, number, number], radius: number) => ActiveNPC[];
  getState: () => NPCManagerState;
}

export function NPCManager({
  isMobile,
  eraId = "early90s",
  onRef,
}: {
  isMobile: boolean;
  eraId?: string;
  onRef?: (handle: NPCManagerHandle) => void;
}) {
  const stateRef = useRef<NPCManagerState>(createInitialManagerState(isMobile));
  const [, setNpcCount] = useState(0);
  const lastCount = useRef(0);

  // Conversation dialogue tracking (speech bubbles)
  const activeSpeech = useConversationDialogue(stateRef.current, eraId);

  // Expose handle to parent
  useEffect(() => {
    if (!onRef) return;
    onRef({
      startDialogue: (npcId: string) => {
        const npc = stateRef.current.activeNPCs.get(npcId);
        if (!npc) return null;
        return startPlayerDialogue(npc) ? npc : null;
      },
      endDialogue: (npcId: string) => {
        const npc = stateRef.current.activeNPCs.get(npcId);
        if (npc) endPlayerDialogue(npc, stateRef.current);
      },
      getNearby: (pos, radius) => {
        const result: ActiveNPC[] = [];
        const r2 = radius * radius;
        for (const npc of stateRef.current.activeNPCs.values()) {
          const dx = npc.position[0] - pos[0];
          const dz = npc.position[2] - pos[2];
          if (dx * dx + dz * dz <= r2) result.push(npc);
        }
        return result;
      },
      getState: () => stateRef.current,
    });
  }, [onRef]);

  useFrame((_, dt) => {
    const cappedDt = Math.min(dt, 0.1);
    tickNPCManager(stateRef.current, cappedDt, DEFAULT_MANAGER_CONFIG, isMobile);

    const count = stateRef.current.activeNPCs.size;
    if (count !== lastCount.current) {
      lastCount.current = count;
      setNpcCount(count);
    }
  });

  useEffect(() => {
    return () => {
      for (const npc of stateRef.current.activeNPCs.values()) {
        unregisterNPCPosition(npc.config.id);
      }
    };
  }, []);

  const npcs = Array.from(stateRef.current.activeNPCs.values());

  // Expose count for DebugOverlay
  useEffect(() => { _activeNpcCount = npcs.length; }, [npcs.length]);

  return (
    <group>
      {npcs.map((npc) => (
        <ManagedNPC
          key={npc.config.id}
          npc={npc}
          speechLine={activeSpeech.get(npc.config.id) ?? null}
          allNpcs={npcs}
        />
      ))}
    </group>
  );
}
