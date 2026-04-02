"use client";

import React, { useRef, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  type ActiveNPC,
  type NPCManagerState,
  type NPCState,
  createInitialManagerState,
  tickNPCManager,
  DEFAULT_MANAGER_CONFIG,
  startPlayerDialogue,
  endPlayerDialogue,
  WAYPOINTS,
} from "@/lib/npc-behavior";
import { registerNPCPosition, unregisterNPCPosition } from "@/lib/audio";

// ── Inline NPC mesh (matches NPCCustomer visual style) ─────────
// Simplified version that accepts external position/facing/opacity
// instead of self-managing movement.

function NPCMesh({
  npc,
  groupRef,
}: {
  npc: ActiveNPC;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const { shirtColor, pantsColor, hairColor, skinTone, hairStyle, height } =
    npc.config.appearance;

  // Animate legs when walking
  useFrame((_, dt) => {
    const isWalking =
      npc.state === "walking" ||
      npc.state === "entering" ||
      npc.state === "leaving";
    if (isWalking) {
      const t = performance.now() * 0.008;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t) * 0.4;
      if (rightLegRef.current)
        rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.4;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
    }
  });

  return (
    <group ref={groupRef} scale={height}>
      {/* Body / torso */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.35, 0.45, 0.2]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Hair */}
      {hairStyle === "flattop" && (
        <mesh position={[0, 1.33, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.22]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {hairStyle === "long" && (
        <mesh position={[0, 1.26, -0.04]}>
          <boxGeometry args={[0.28, 0.2, 0.18]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {hairStyle === "cap" && (
        <mesh position={[0, 1.33, 0.02]}>
          <boxGeometry args={[0.28, 0.06, 0.3]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {hairStyle === "ponytail" && (
        <>
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[0.26, 0.08, 0.26]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          <mesh position={[0, 1.22, -0.15]}>
            <boxGeometry args={[0.06, 0.15, 0.06]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      )}
      {hairStyle === "buzzcut" && (
        <mesh position={[0, 1.32, 0]}>
          <sphereGeometry args={[0.135, 8, 8]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {hairStyle === "mohawk" && (
        <mesh position={[0, 1.38, 0]}>
          <boxGeometry args={[0.04, 0.12, 0.2]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {hairStyle === "afro" && (
        <mesh position={[0, 1.32, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {/* Arms */}
      <mesh position={[-0.24, 0.85, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      <mesh position={[0.24, 0.85, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.08, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.08, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
}

// ── Single managed NPC ──────────────────────────────────────────

function ManagedNPC({ npc }: { npc: ActiveNPC }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(npc.position[0], -0.05, npc.position[2]);
    groupRef.current.rotation.y = npc.facing;

    // Opacity for spawn/despawn
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

    // Register spatial audio position
    registerNPCPosition(npc.config.id, npc.position[0], npc.position[2]);
  });

  return (
    <NPCMesh
      npc={npc}
      groupRef={groupRef}
    />
  );
}

// ── NPCManager — the main component ────────────────────────────

export interface NPCManagerHandle {
  /** Try to start dialogue with an NPC by config ID. Returns the ActiveNPC if successful. */
  startDialogue: (npcId: string) => ActiveNPC | null;
  /** End dialogue with an NPC by config ID. */
  endDialogue: (npcId: string) => void;
  /** Get all active NPCs near a world position. */
  getNearby: (pos: [number, number, number], radius: number) => ActiveNPC[];
  /** Get the manager state (for debug). */
  getState: () => NPCManagerState;
}

export function NPCManager({
  isMobile,
  onRef,
}: {
  isMobile: boolean;
  onRef?: (handle: NPCManagerHandle) => void;
}) {
  const stateRef = useRef<NPCManagerState>(createInitialManagerState(isMobile));
  // Force re-render when NPC count changes
  const [, setNpcCount] = React.useState(0);
  const lastCount = useRef(0);

  // Expose handle to parent
  React.useEffect(() => {
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
    // Cap delta to prevent huge jumps on tab switch
    const cappedDt = Math.min(dt, 0.1);
    tickNPCManager(stateRef.current, cappedDt, DEFAULT_MANAGER_CONFIG, isMobile);

    // Trigger re-render when NPC count changes (so React adds/removes meshes)
    const count = stateRef.current.activeNPCs.size;
    if (count !== lastCount.current) {
      lastCount.current = count;
      setNpcCount(count);
    }
  });

  // Cleanup spatial audio on unmount
  React.useEffect(() => {
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
        <ManagedNPC key={npc.config.id} npc={npc} />
      ))}
    </group>
  );
}
