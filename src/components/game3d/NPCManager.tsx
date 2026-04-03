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
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
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

  const { shirtColor, pantsColor, hairColor, skinTone, hairStyle, height } =
    npc.config.appearance;

  useFrame((state, dt) => {
    const cappedDt = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime;

    const isWalking =
      npc.state === "walking" ||
      npc.state === "entering" ||
      npc.state === "leaving";

    // ── Priority 1: Breathing — torso scaleY pulses 1.0 → 1.008 ──
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1.0 + 0.008 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / breathPeriod));
    }

    // ── Priority 1: Idle sway — ±0.02 on 6s cycle (only when not walking) ──
    if (groupRef.current && !isWalking) {
      // Apply sway as a small X offset relative to positioned location
      // (ManagedNPC sets position each frame, so we apply sway to the inner group indirectly via torso/head)
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
          const dx = targetWp.position[0] - npc.position[0];
          const dz = targetWp.position[2] - npc.position[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
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
        // Bend legs outward to simulate crouching (Y offset handled in ManagedNPC)
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
          const dx = npc.position[0] - other.position[0];
          const dz = npc.position[2] - other.position[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
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

  // ── Priority 10: Body proportion tweaks by personality ──
  const pType = npc.config.personalityType;
  const torsoWidth = pType === "parent" ? 0.40 : 0.35; // parent: wider lower torso
  const legHeight = pType === "teenager" ? 0.50 : 0.45; // teenager: longer legs
  const legY = pType === "teenager" ? 0.375 : 0.4; // adjust position for longer legs
  const armY = pType === "teenager" ? 0.82 : 0.85; // teenager: arms hang lower
  const headScaleY = pType === "kid" ? 1.2 : 1.0; // kid: larger head relative to body
  // critic: arm attachment rotated inward 0.1 rad (applied as Z rotation on arms)
  const armInwardRot = pType === "critic" ? 0.1 : 0;

  return (
    <group ref={groupRef} scale={height}>
      {/* Body (torso) */}
      <RoundedBox ref={torsoRef} args={[0.4, 0.6, 0.25]} radius={0.04} smoothness={2} position={[0, 0.85, 0]}>
        <meshStandardMaterial color={shirtColor} />
      </RoundedBox>
      {/* Head — Priority 10: kid gets larger relative head */}
      <RoundedBox ref={headRef} args={[0.26, 0.26, 0.26]} radius={0.08} smoothness={2} position={[0, 1.22, 0]} scale={[1, headScaleY, 1]}>
        <meshStandardMaterial color={skinTone} />
      </RoundedBox>
      {/* Eyes */}
      <mesh ref={leftEyeRef} position={[-0.04, 1.24, -0.11]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.04, 1.24, -0.11]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Mouth — animated during conversation */}
      <mesh ref={mouthRef} position={[0, 1.15, -0.12]}>
        <boxGeometry args={[0.06, 0.015, 0.02]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Hair variants */}
      {hairStyle === "flattop" && (
        <mesh position={[0, 1.33, 0]}><boxGeometry args={[0.22, 0.06, 0.22]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {hairStyle === "long" && (
        <mesh position={[0, 1.26, -0.04]}><boxGeometry args={[0.28, 0.2, 0.18]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {hairStyle === "cap" && (
        <mesh position={[0, 1.33, 0.02]}><boxGeometry args={[0.28, 0.06, 0.3]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {hairStyle === "ponytail" && (
        <>
          <mesh position={[0, 1.3, 0]}><boxGeometry args={[0.26, 0.08, 0.26]} /><meshStandardMaterial color={hairColor} /></mesh>
          <mesh position={[0, 1.22, -0.15]}><boxGeometry args={[0.06, 0.15, 0.06]} /><meshStandardMaterial color={hairColor} /></mesh>
        </>
      )}
      {hairStyle === "buzzcut" && (
        <mesh position={[0, 1.32, 0]}><sphereGeometry args={[0.135, 8, 8]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {hairStyle === "mohawk" && (
        <mesh position={[0, 1.38, 0]}><boxGeometry args={[0.04, 0.12, 0.2]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {hairStyle === "afro" && (
        <mesh position={[0, 1.32, 0]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color={hairColor} /></mesh>
      )}
      {/* Arms — Priority 10: critic has inward shoulder rounding */}
      <mesh ref={leftArmRef} position={[-0.24, armY, 0]} rotation={[0, 0, armInwardRot]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={skinTone} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.24, armY, 0]} rotation={[0, 0, -armInwardRot]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Hands — Priority 9: sphere hands with shape toggle (scale set in useFrame) */}
      <mesh ref={leftHandRef} position={[-0.24, armY - 0.24, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.24, armY - 0.24, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Priority 9: VHS box in right hand — visible after checking_out */}
      <mesh ref={vhsBoxRef} position={[0.24, armY - 0.30, -0.03]} visible={false}>
        <boxGeometry args={[0.08, 0.05, 0.02]} />
        <meshStandardMaterial color={vhsGenreColor} />
      </mesh>
      {/* Legs — Priority 10: teenager gets longer legs */}
      <mesh ref={leftLegRef} position={[-0.08, legY, 0]}>
        <boxGeometry args={[0.12, legHeight, 0.12]} /><meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.08, legY, 0]}>
        <boxGeometry args={[0.12, legHeight, 0.12]} /><meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
}

// ── Speech bubble component (renders above NPC head) ───────────

function SpeechBubble({ text }: { text: string }) {
  return (
    <Html position={[0, 1.7, 0]} center distanceFactor={10} occlude={false}>
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

  // Per-NPC sway phase so they never sync
  const swayPhase = useMemo(() => seedFromId(npc.config.id) * Math.PI * 2, [npc.config.id]);

  // Priority 7: Browsing height for squat Y offset (applied to position in useFrame)
  const browseHeightSeed = useMemo(
    () => seedFromIdAndStep(npc.config.id, npc.goalStepIndex),
    [npc.config.id, npc.goalStepIndex]
  );
  const browseHeight = useMemo(() => browseHeightFromSeed(browseHeightSeed), [browseHeightSeed]);

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

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Lower NPC so feet touch the floor: leg bottom is at local y=0.175, scaled by height
    const feetOffset = -0.175 * npc.config.appearance.height;

    // Priority 1: idle sway — ±0.02 on 6s cycle when not walking
    const isWalking = npc.state === "walking" || npc.state === "entering" || npc.state === "leaving";
    const swayOffset = isWalking ? 0 : Math.sin(t * (Math.PI * 2 / 6) + swayPhase) * 0.02;

    // Priority 7: squat lowers body by 0.3 when browsing
    const squatOffset = (npc.state === "browsing" && browseHeight === "squat") ? -0.3 : 0;
    groupRef.current.position.set(npc.position[0] + swayOffset, feetOffset + squatOffset, npc.position[2]);
    groupRef.current.rotation.y = npc.facing;

    groupRef.current.visible = npc.opacity > 0.01;
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
  });

  return (
    <group>
      <NPCMesh npc={npc} groupRef={groupRef} allNpcs={allNpcs} />
      {/* Name label */}
      <group position={[npc.position[0], 1.55, npc.position[2]]}>
        <Billboard>
          <Text fontSize={0.07} color="#e0e0e0" anchorX="center" font={undefined}>
            {npc.config.name}
          </Text>
        </Billboard>
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
