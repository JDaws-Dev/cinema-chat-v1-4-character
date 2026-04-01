"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getObjectById } from "@/lib/store-layout";
import { ROOM_W, ROOM_D, ROOM_H, WALL_COLOR } from "./store-constants";
import { Mat, getOrCreatePosterTexture } from "./store-materials";

const WALL_POSTER_PATHS: Record<string, string> = {
  JAWS: "https://image.tmdb.org/t/p/w342/lxM6kqilAdpdhqUl2biYp5frUxE.jpg",
  ALIEN: "https://image.tmdb.org/t/p/w342/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
  "BLADE RUNNER": "https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
  RAIDERS: "https://image.tmdb.org/t/p/w342/ceG9VzoRAVGwivFU403Wc3AHRys.jpg",
  "THE SHINING": "https://image.tmdb.org/t/p/w342/nRj5511mZdTl4saWEPoj9QroTIu.jpg",
  "STAR WARS": "https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  "BACK TO THE FUTURE": "https://image.tmdb.org/t/p/w342/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg",
  "E.T.": "https://image.tmdb.org/t/p/w342/an0nD6uq6byfxXCfk6lQBzdL2J1.jpg",
};

export function WallPoster({ x, y, z, rotY = 0, title }: { x: number; y: number; z: number; rotY?: number; color?: string; title: string }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => {
    const tmdbUrl = WALL_POSTER_PATHS[title];
    if (!tmdbUrl) return;
    getOrCreatePosterTexture(tmdbUrl, (t) => {
      if (matRef.current) { matRef.current.map = t; matRef.current.color.set("#ffffff"); matRef.current.needsUpdate = true; }
    });
  }, [title]);
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh><boxGeometry args={[1.0, 1.4, 0.04]} /><Mat color="#1a1a1a" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.9, 1.3]} /><meshBasicMaterial ref={matRef} color="#2a2a3a" side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

export function WallCrtTv({ position, yaw = 0, tilt = 0, scale = 1, pipeDrop = 0.8 }: { position: [number, number, number]; yaw?: number; tilt?: number; scale?: number; pipeDrop?: number }) {
  const SCREEN_Y = -0.7;
  const SCREEN_TOP = SCREEN_Y + 0.3;
  const SCREEN_SWEEP = 0.6;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const scanBandRef = useRef<THREE.Mesh>(null);
  const glareRef = useRef<THREE.Mesh>(null);
  const playTextRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current?.color) { const r = 0.14 + Math.sin(t * 0.7) * 0.08; const g = 0.28 + Math.sin(t * 1.1 + 1) * 0.1; const b = 0.56 + Math.sin(t * 0.5 + 2) * 0.15; matRef.current.color.setRGB(r, g, b); }
    if (scanBandRef.current) { scanBandRef.current.position.y = SCREEN_TOP - ((t * 0.55) % 1) * SCREEN_SWEEP; const m = scanBandRef.current.material as THREE.MeshBasicMaterial; m.opacity = 0.12 + Math.sin(t * 11) * 0.03; }
    if (glareRef.current) { const m = glareRef.current.material as THREE.MeshBasicMaterial; m.opacity = 0.05 + (Math.sin(t * 6.5) > 0.9 ? 0.03 : 0); }
    if (playTextRef.current) { playTextRef.current.visible = Math.sin(t * 3.2) > -0.2; }
  });
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale} userData={{ interactType: "tv", label: "Friday Night Pick" }}>
      <mesh position={[0, 0.66 + pipeDrop * 0.5, -0.02]}><cylinderGeometry args={[0.045, 0.05, pipeDrop + 0.12, 10]} /><Mat color="#353535" roughness={0.45} metalness={0.45} /></mesh>
      <mesh position={[0, 0.72 + pipeDrop, -0.02]}><boxGeometry args={[0.26, 0.06, 0.2]} /><Mat color="#444444" roughness={0.5} metalness={0.35} /></mesh>
      <group position={[0, 0.66, -0.06]} rotation={[tilt, 0, 0]}>
        <mesh position={[0, -0.06, 0]}><boxGeometry args={[0.3, 0.08, 0.18]} /><Mat color="#383838" roughness={0.5} metalness={0.3} /></mesh>
        <RoundedBox args={[1.45, 1.05, 0.62]} radius={0.05} smoothness={3} position={[0, -0.7, 0.06]} userData={{ interactType: "tv", label: "Friday Night Pick" }}><Mat color="#141414" roughness={0.58} /></RoundedBox>
        <mesh position={[0, -0.68, -0.32]}><boxGeometry args={[1.18, 0.82, 0.32]} /><Mat color="#101010" roughness={0.72} /></mesh>
        <RoundedBox args={[1.28, 0.92, 0.07]} radius={0.03} smoothness={2} position={[0, -0.7, 0.3]}><Mat color="#090909" roughness={0.45} /></RoundedBox>
        <mesh position={[0, SCREEN_Y, 0.338]}><planeGeometry args={[1.05, 0.74]} /><meshBasicMaterial ref={matRef} color="#2f8dff" side={THREE.DoubleSide} toneMapped={false} /></mesh>
        <mesh position={[0, SCREEN_Y + 0.11, 0.341]}><planeGeometry args={[0.9, 0.26]} /><meshBasicMaterial color="#7c3aed" transparent opacity={0.64} toneMapped={false} /></mesh>
        <mesh position={[-0.18, SCREEN_Y - 0.08, 0.342]}><planeGeometry args={[0.32, 0.18]} /><meshBasicMaterial color="#2dd4bf" transparent opacity={0.72} toneMapped={false} /></mesh>
        <mesh position={[0.16, SCREEN_Y - 0.05, 0.342]}><planeGeometry args={[0.28, 0.22]} /><meshBasicMaterial color="#fb923c" transparent opacity={0.7} toneMapped={false} /></mesh>
        <mesh position={[0, SCREEN_Y - 0.23, 0.342]}><planeGeometry args={[0.95, 0.09]} /><meshBasicMaterial color="#fde047" transparent opacity={0.45} toneMapped={false} /></mesh>
        <group ref={playTextRef} position={[-0.31, SCREEN_Y + 0.23, 0.344]}><Text fontSize={0.07} color="#f4f8ff" anchorX="left" anchorY="middle" font={undefined}>PLAY<meshBasicMaterial color="#f4f8ff" toneMapped={false} /></Text></group>
        <mesh ref={scanBandRef} position={[0, SCREEN_Y + 0.18, 0.343]}><planeGeometry args={[1.0, 0.1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.2} toneMapped={false} /></mesh>
        <mesh ref={glareRef} position={[-0.12, SCREEN_Y + 0.1, 0.344]} rotation={[0, 0, -0.2]}><planeGeometry args={[0.34, 0.62]} /><meshBasicMaterial color="#f6f2d8" transparent opacity={0.07} toneMapped={false} /></mesh>
        {[-0.2, -0.05, 0.15].map((dy, i) => (<mesh key={`scan-${i}`} position={[0, SCREEN_Y + dy, 0.342]}><planeGeometry args={[0.98, 0.01]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.08} toneMapped={false} /></mesh>))}
        <mesh position={[0.49, -0.8, 0.31]}><boxGeometry args={[0.18, 0.46, 0.02]} /><Mat color="#1c1c1c" roughness={0.85} /></mesh>
        {[-0.22, -0.1, 0.02, 0.14].map((dy, i) => (<mesh key={`speaker-slot-${i}`} position={[0.49, -0.7 + dy, 0.322]}><boxGeometry args={[0.13, 0.012, 0.008]} /><Mat color="#050505" roughness={0.5} /></mesh>))}
        <mesh position={[0.43, -0.44, 0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.03, 10]} /><Mat color="#4d4d4d" roughness={0.38} /></mesh>
        <mesh position={[0.43, -0.54, 0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.024, 0.024, 0.03, 10]} /><Mat color="#4d4d4d" roughness={0.38} /></mesh>
        <mesh position={[-0.08, 0.02, -0.23]} rotation={[0.2, 0, -0.35]}><cylinderGeometry args={[0.01, 0.01, 0.28, 6]} /><Mat color="#7a7a7a" roughness={0.35} metalness={0.55} /></mesh>
        <mesh position={[0.08, 0.02, -0.23]} rotation={[-0.15, 0, 0.35]}><cylinderGeometry args={[0.01, 0.01, 0.28, 6]} /><Mat color="#7a7a7a" roughness={0.35} metalness={0.55} /></mesh>
      </group>
    </group>
  );
}

export function AnimatedEntranceDoor({ side, doorOpen, children }: { side: 'left' | 'right'; doorOpen: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  // Doors swing outward toward parking lot (+z)
  const targetAngle = doorOpen ? (side === 'left' ? Math.PI / 3 : -Math.PI / 3) : 0;
  useFrame(() => { if (ref.current) ref.current.rotation.y += (targetAngle - ref.current.rotation.y) * 0.08; });
  // Hinge at outer edge of door frame (±1.7), door swings from there
  const hingeX = side === 'left' ? -1.7 : 1.7;
  const doorCenterX = side === 'left' ? 0.85 : -0.85;
  return (
    <group position={[hingeX, 0, ROOM_D / 2 - 0.05]}>
      <group ref={ref}><group position={[doorCenterX, 0, 0]}>{children}</group></group>
    </group>
  );
}

export function AnimatedEmployeeDoor({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const targetAngle = open ? -Math.PI / 2.5 : 0;
  useFrame(() => { if (ref.current) ref.current.rotation.y += (targetAngle - ref.current.rotation.y) * 0.08; });
  return (
    <group position={[-0.45, 0, 0]}><group ref={ref}><group position={[0.45, 0, 0]}>{children}</group></group></group>
  );
}

export function Baseboard({ pos, rot, width }: { pos: [number, number, number]; rot: [number, number, number]; width: number }) {
  return (<mesh position={pos} rotation={rot}><boxGeometry args={[width, 0.15, 0.05]} /><Mat color="#0a1428" roughness={0.8} /></mesh>);
}
