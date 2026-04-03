"use client";

import React from "react";
import { Text } from "@react-three/drei";

/* ─────────────────────────────────────────────
 * Reusable low-poly street / exterior props.
 * All accept position ([x, y, z]) and optional
 * rotation ([rx, ry, rz]).  Box geometry only —
 * matches the project's cel-shaded aesthetic.
 * ───────────────────────────────────────────── */

type Vec3 = [number, number, number];

interface PropProps {
  position?: Vec3;
  rotation?: Vec3;
}

/* ── DumpsterProp ── green dumpster with lid */
export function DumpsterProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <meshBasicMaterial color="#2a4a2a" />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.3, 0.08, 0.85]} />
        <meshBasicMaterial color="#1a3a1a" />
      </mesh>
    </group>
  );
}

/* ── FireHydrantProp ── red fire hydrant */
export function FireHydrantProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.25, 0.5, 0.25]} />
        <meshBasicMaterial color="#cc2222" />
      </mesh>
      {/* Cap / bonnet */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.35, 0.1, 0.3]} />
        <meshBasicMaterial color="#cc2222" />
      </mesh>
    </group>
  );
}

/* ── MailboxProp ── blue USPS-style collection box */
export function MailboxProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.35, 1.0, 0.3]} />
        <meshBasicMaterial color="#2244aa" />
      </mesh>
      {/* Top / hood */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.35]} />
        <meshBasicMaterial color="#1a3388" />
      </mesh>
    </group>
  );
}

/* ── StreetSignProp ── green street sign on pole */
export function StreetSignProp({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  label = "OAK ST",
  showText = true,
}: PropProps & { label?: string; showText?: boolean }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Pole */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.08, 2.4, 0.08]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      {/* Sign plate */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[1.0, 0.25, 0.04]} />
        <meshBasicMaterial color="#227722" />
      </mesh>
      {showText && (
        <Text position={[0, 2.3, 0.03]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>{label}</Text>
      )}
    </group>
  );
}

/* ── LampPostProp ── street lamp (matches LayoutDrivenPrefabs version) */
export function LampPostProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 3, 8]} />
        <meshBasicMaterial color="#444" />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.15]} />
        <meshBasicMaterial color="#555" />
      </mesh>
      {/* Ground light circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[1.5, 12]} />
        <meshBasicMaterial color="#332a15" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/* ── TrashCanProp ── small outdoor trash can */
export function TrashCanProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Can body */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshBasicMaterial color="#444444" />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.34]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.32]} />
        <meshBasicMaterial color="#555555" />
      </mesh>
    </group>
  );
}

/* ── BenchProp ── simple park / sidewalk bench */
export function BenchProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshBasicMaterial color="#6b4226" />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.7, -0.18]}>
        <boxGeometry args={[1.2, 0.5, 0.05]} />
        <meshBasicMaterial color="#6b4226" />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.5, 0.21, 0]}>
        <boxGeometry args={[0.06, 0.42, 0.35]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.5, 0.21, 0]}>
        <boxGeometry args={[0.06, 0.42, 0.35]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    </group>
  );
}

/* ── NewspaperBoxProp ── coin-operated newspaper dispenser (90s classic) */
export function NewspaperBoxProp({ position = [0, 0, 0], rotation = [0, 0, 0] }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.35]} />
        <meshBasicMaterial color="#cc4400" />
      </mesh>
      {/* Window panel */}
      <mesh position={[0, 0.65, 0.176]}>
        <boxGeometry args={[0.3, 0.35, 0.01]} />
        <meshBasicMaterial color="#88aacc" transparent opacity={0.5} />
      </mesh>
      {/* Coin slot area */}
      <mesh position={[0.12, 0.35, 0.176]}>
        <boxGeometry args={[0.08, 0.08, 0.01]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.2, 0.19]}>
        <boxGeometry args={[0.2, 0.04, 0.03]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
    </group>
  );
}
