"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard, Text } from "@react-three/drei";
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

// ── NPC mesh — simplified box-geometry character ───────────────

function NPCMesh({
  npc,
  groupRef,
}: {
  npc: ActiveNPC;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

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

      // Approach deceleration: when stateTimer is low, dampen leg swing
      if (npc.stateTimer < 0.5 && (npc.state === "walking")) {
        const dampFactor = Math.max(0, npc.stateTimer / 0.5);
        if (leftLegRef.current) leftLegRef.current.rotation.x *= dampFactor;
        if (rightLegRef.current) rightLegRef.current.rotation.x *= dampFactor;
        if (leftArmRef.current) leftArmRef.current.rotation.x *= dampFactor;
        if (rightArmRef.current) rightArmRef.current.rotation.x *= dampFactor;
        if (torsoRef.current) torsoRef.current.rotation.y *= dampFactor;
      }
    } else {
      // Decay limbs to rest
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9;
      if (torsoRef.current) torsoRef.current.rotation.y *= 0.9;
    }
  });

  return (
    <group ref={groupRef} scale={height}>
      {/* Body (torso) */}
      <mesh ref={torsoRef} position={[0, 0.85, 0]}>
        <boxGeometry args={[0.35, 0.45, 0.2]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Eyes */}
      <mesh ref={leftEyeRef} position={[-0.04, 1.24, -0.11]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.04, 1.24, -0.11]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
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
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.24, 0.85, 0]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={skinTone} /></mesh>
      <mesh ref={rightArmRef} position={[0.24, 0.85, 0]}><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color={skinTone} /></mesh>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.08, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} /><meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.08, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} /><meshStandardMaterial color={pantsColor} />
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
}: {
  npc: ActiveNPC;
  speechLine: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Per-NPC sway phase so they never sync
  const swayPhase = useMemo(() => seedFromId(npc.config.id) * Math.PI * 2, [npc.config.id]);

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
    groupRef.current.position.set(npc.position[0] + swayOffset, feetOffset, npc.position[2]);
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
      <NPCMesh npc={npc} groupRef={groupRef} />
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

  return (
    <group>
      {npcs.map((npc) => (
        <ManagedNPC
          key={npc.config.id}
          npc={npc}
          speechLine={activeSpeech.get(npc.config.id) ?? null}
        />
      ))}
    </group>
  );
}
