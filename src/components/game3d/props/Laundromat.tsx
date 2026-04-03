"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ROOM_W, ROOM_D, ROOM_H } from "../store-constants";
import { Mat } from "../store-materials";

/** Laundromat — walkable interior + exterior signage + window */
export function Laundromat() {
  return (
    <>
      {/* ── LAUNDROMAT INTERIOR ── (6m wide x 8m deep) */}
      <group position={[13, 0, 5.75]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]}><planeGeometry args={[6, 8]} /><meshBasicMaterial color="#b8c4b0" /></mesh>
        {/* Linoleum tile pattern */}
        {Array.from({ length: 6 }).map((_, ix) => Array.from({ length: 8 }).map((_, iz) => (
          (ix + iz) % 2 === 0 ? <mesh key={`laund-tile-${ix}-${iz}`} rotation={[-Math.PI / 2, 0, 0]} position={[-2.5 + ix, 0.012, -5 + iz]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#a8b8a0" /></mesh> : null
        )))}
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, -1.5]}><planeGeometry args={[6, 8]} /><meshBasicMaterial color="#d8d8e0" /></mesh>

        {/* Walls */}
        {/* Back wall — moved from z=-1.25 to z=-5.5 */}
        <mesh position={[0, ROOM_H / 2, -5.5]}><planeGeometry args={[6, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        {/* Right wall — extended to 8m depth */}
        <mesh position={[3, ROOM_H / 2, -1.5]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[8, ROOM_H]} /><meshBasicMaterial color="#c0d0e0" /></mesh>
        {/* Front wall with door gap */}
        <mesh position={[-1.5, ROOM_H / 2, 1.25]}><planeGeometry args={[3, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        <mesh position={[2.15, ROOM_H / 2, 1.25]}><planeGeometry args={[1.7, ROOM_H]} /><meshBasicMaterial color="#c8d8e8" /></mesh>
        <mesh position={[0.5, 2.7, 1.25]}><planeGeometry args={[1.3, 1.1]} /><meshBasicMaterial color="#c8d8e8" /></mesh>

        {/* ── Washing machines along LEFT wall (10 units — real laundromat) ── */}
        {[-5, -4.2, -3.4, -2.6, -1.8, -1, -0.2, 0.6].map((dz, i) => (
          <group key={`washer-int-${i}`} position={[-2.65, 0, dz]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.65, 1.0, 0.7]} /><Mat color="#e0e0e0" roughness={0.5} /></mesh>
            <mesh position={[0, 1.01, 0]}><boxGeometry args={[0.67, 0.02, 0.72]} /><Mat color="#cccccc" roughness={0.4} /></mesh>
            <mesh position={[0.33, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.22, 20]} /><Mat color="#aabbcc" transparent opacity={0.4} roughness={0.05} metalness={0.3} /></mesh>
            <mesh position={[0.335, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}><ringGeometry args={[0.2, 0.24, 20]} /><Mat color="#888888" roughness={0.3} metalness={0.5} /></mesh>
            <mesh position={[0.3, 0.85, 0]}><boxGeometry args={[0.04, 0.15, 0.5]} /><meshBasicMaterial color="#333344" /></mesh>
            <mesh position={[0.3, 0.85, 0.15]}><cylinderGeometry args={[0.03, 0.03, 0.03, 8]} /><Mat color="#cccccc" roughness={0.3} metalness={0.6} /></mesh>
          </group>
        ))}

        {/* ── Dryers along RIGHT wall (6 units) ── */}
        {[-4.5, -3.7, -2.9, -2.1, -1.3, -0.5].map((dz, i) => (
          <group key={`dryer-${i}`} position={[2.65, 0, dz]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.65, 1.0, 0.7]} /><Mat color="#d8d0c8" roughness={0.5} /></mesh>
            <mesh position={[0, 1.01, 0]}><boxGeometry args={[0.67, 0.02, 0.72]} /><Mat color="#c8c0b8" roughness={0.4} /></mesh>
            <mesh position={[-0.33, 0.45, 0]} rotation={[0, -Math.PI / 2, 0]}><circleGeometry args={[0.22, 20]} /><Mat color="#99aabb" transparent opacity={0.35} roughness={0.05} metalness={0.3} /></mesh>
            <mesh position={[-0.335, 0.45, 0]} rotation={[0, -Math.PI / 2, 0]}><ringGeometry args={[0.2, 0.24, 20]} /><Mat color="#888888" roughness={0.3} metalness={0.5} /></mesh>
            <mesh position={[-0.3, 0.85, 0]}><boxGeometry args={[0.04, 0.15, 0.5]} /><meshBasicMaterial color="#333344" /></mesh>
          </group>
        ))}

        {/* ── Folding tables in center (2 tables, spread out) ── */}
        {[-1.5, -3.8].map((fz, fi) => (
          <group key={`fold-table-${fi}`} position={[0, 0, fz]}>
            <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.5, 0.05, 0.9]} /><Mat color="#d0c8b8" roughness={0.6} /></mesh>
            {[[-1.15, -0.35], [-1.15, 0.35], [1.15, -0.35], [1.15, 0.35]].map(([lx, lz], i) => (
              <mesh key={`ftleg-${fi}-${i}`} position={[lx, 0.4, lz]}><boxGeometry args={[0.04, 0.8, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
            ))}
            {fi === 0 && <>
              <mesh position={[-0.6, 0.88, 0]}><boxGeometry args={[0.4, 0.12, 0.3]} /><meshBasicMaterial color="#e8c8a8" /></mesh>
              <mesh position={[0.3, 0.88, 0.1]}><boxGeometry args={[0.35, 0.08, 0.25]} /><meshBasicMaterial color="#a8c8e8" /></mesh>
              <mesh position={[0.8, 0.88, -0.1]}><boxGeometry args={[0.3, 0.1, 0.3]} /><meshBasicMaterial color="#c8a8c8" /></mesh>
            </>}
          </group>
        ))}

        {/* ── Vending machines in back-right corner (2 machines) ── */}
        <group position={[2.5, 0, -5]}>
          {/* Drink vending machine */}
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.8, 2.0, 0.65]} /><Mat color="#cc2222" roughness={0.5} /></mesh>
          <mesh position={[0, 1.2, 0.33]}><boxGeometry args={[0.6, 1.0, 0.02]} /><Mat color="#222222" transparent opacity={0.6} /></mesh>
          <Text position={[0, 1.85, 0.34]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>DRINKS</Text>
          <mesh position={[0.3, 1.0, 0.34]}><boxGeometry args={[0.08, 0.15, 0.02]} /><Mat color="#888888" roughness={0.3} metalness={0.6} /></mesh>
        </group>
        {/* Snack vending machine */}
        <group position={[2.5, 0, -4.1]}>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.8, 2.0, 0.65]} /><Mat color="#2244aa" roughness={0.5} /></mesh>
          <mesh position={[0, 1.2, 0.33]}><boxGeometry args={[0.6, 1.0, 0.02]} /><Mat color="#222222" transparent opacity={0.6} /></mesh>
          <Text position={[0, 1.85, 0.34]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>SNACKS</Text>
        </group>

        {/* ── Plastic chairs along front-left (4 chairs for waiting) ── */}
        {[-0.6, 0.1, 0.8].map((dz, i) => (
          <group key={`chair-front-${i}`} position={[-1.5, 0, dz]}>
            <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.4, 0.04, 0.4]} /><Mat color={["#d04020", "#2060c0", "#d0a020"][i]} roughness={0.6} /></mesh>
            <mesh position={[-0.18, 0.7, 0]}><boxGeometry args={[0.04, 0.55, 0.38]} /><Mat color={["#d04020", "#2060c0", "#d0a020"][i]} roughness={0.6} /></mesh>
            {[[-0.15, -0.15], [-0.15, 0.15], [0.15, -0.15], [0.15, 0.15]].map(([cx, cz], j) => (
              <mesh key={`cleg-${j}`} position={[cx, 0.2, cz]}><cylinderGeometry args={[0.015, 0.015, 0.4, 6]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
            ))}
          </group>
        ))}
        {/* Extra chair near back */}
        <group position={[-1.5, 0, -2.5]}>
          <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.4, 0.04, 0.4]} /><Mat color="#20a060" roughness={0.6} /></mesh>
          <mesh position={[-0.18, 0.7, 0]}><boxGeometry args={[0.04, 0.55, 0.38]} /><Mat color="#20a060" roughness={0.6} /></mesh>
          {[[-0.15, -0.15], [-0.15, 0.15], [0.15, -0.15], [0.15, 0.15]].map(([cx, cz], j) => (
            <mesh key={`cleg-extra-${j}`} position={[cx, 0.2, cz]}><cylinderGeometry args={[0.015, 0.015, 0.4, 6]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
          ))}
        </group>

        {/* ── Bulletin board on back wall ── */}
        <group position={[1, 1.6, -5.48]}>
          <mesh><boxGeometry args={[1.0, 0.7, 0.04]} /><Mat color="#7a5a30" roughness={0.85} /></mesh>
          <mesh position={[0, 0, 0.025]}><boxGeometry args={[0.9, 0.6, 0.01]} /><Mat color="#c4a060" roughness={0.9} /></mesh>
          {[[-0.25, 0.12, "#ffd700", "LOST CAT"], [0.15, 0.15, "#ef4444", "YARD SALE"], [-0.1, -0.1, "#22c55e", "GUITAR\nLESSONS"], [0.25, -0.12, "#3b82f6", "APT FOR\nRENT"]].map(([dx, dy, c, txt], i) => (
            <group key={`flyer-${i}`} position={[dx as number, dy as number, 0.035]} rotation={[0, 0, (i - 1.5) * 0.08]}>
              <mesh><planeGeometry args={[0.22, 0.18]} /><meshBasicMaterial color={c as string} /></mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.03} color="#111111" anchorX="center" anchorY="middle" font={undefined}>{txt as string}</Text>
            </group>
          ))}
          {[[-0.25, 0.2], [0.15, 0.22], [-0.1, -0.02], [0.25, -0.04]].map(([px, py], i) => (
            <mesh key={`pin-${i}`} position={[px, py, 0.04]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color={["#ff0000", "#ffaa00", "#00cc00", "#0066ff"][i]} /></mesh>
          ))}
        </group>

        {/* ── Ceiling lights — spread over longer room (3 fixtures) ── */}
        {[-0.5, -2.5, -4.5].map((fx) => (
          <group key={`laund-light-${fx}`} position={[0, ROOM_H - 0.04, fx]}>
            <mesh><boxGeometry args={[1.5, 0.05, 0.3]} /><Mat color="#d0d0c8" roughness={0.6} /></mesh>
            <mesh position={[0, -0.04, 0]}><boxGeometry args={[1.3, 0.03, 0.08]} /><meshBasicMaterial color="#fffae8" /></mesh>
            <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.4, 0.01, 0.25]} /><Mat color="#e8e8e0" roughness={0.2} /></mesh>
          </group>
        ))}
        <pointLight position={[0, ROOM_H - 0.2, -1]} intensity={0.5} distance={6} color="#f0f4ff" />
        <pointLight position={[0, ROOM_H - 0.2, -4]} intensity={0.5} distance={6} color="#f0f4ff" />

        {/* ── Detergent shelf on back wall ── */}
        <group position={[-1.5, 1.5, -5.48]}>
          <mesh><boxGeometry args={[1.2, 0.06, 0.3]} /><Mat color="#5a5a5a" roughness={0.5} /></mesh>
          {[-0.4, -0.15, 0.1, 0.35].map((bx, i) => (
            <mesh key={`det-${i}`} position={[bx, 0.15, 0]}><boxGeometry args={[0.18, 0.25, 0.12]} /><meshBasicMaterial color={["#ff6633", "#3366ff", "#33cc66", "#ff33cc"][i]} /></mesh>
          ))}
        </group>

        {/* Out of Order sign on one washer */}
        <group position={[-2.65, 1.15, -5]}>
          <mesh><boxGeometry args={[0.4, 0.15, 0.02]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <Text position={[0, 0, 0.015]} fontSize={0.04} color="#cc0000" anchorX="center" anchorY="middle" font={undefined}>OUT OF ORDER</Text>
        </group>

        {/* Laundry baskets */}
        <group position={[0.5, 0, 0.6]}>
          <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.5, 0.5, 0.4]} /><Mat color="#4488cc" roughness={0.7} /></mesh>
          <mesh position={[0.1, 0.52, 0.05]}><boxGeometry args={[0.3, 0.08, 0.2]} /><meshBasicMaterial color="#e8a0a0" /></mesh>
        </group>
        <group position={[-0.5, 0, -2.8]}>
          <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.5, 0.5, 0.4]} /><Mat color="#cc4488" roughness={0.7} /></mesh>
          <mesh position={[-0.1, 0.52, -0.05]}><boxGeometry args={[0.25, 0.1, 0.2]} /><meshBasicMaterial color="#a0c8e8" /></mesh>
        </group>
      </group>

      {/* ── LAUNDROMAT EXTERIOR ── */}
      <group position={[ROOM_W / 2 + 3, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}><mesh><boxGeometry args={[3.5, 0.6, 0.05]} /><meshBasicMaterial color="#0a0a1a" /></mesh><Text position={[0, 0, 0.035]} fontSize={0.24} color="#77ddff" anchorX="center" anchorY="middle">LAUNDROMAT<meshBasicMaterial color="#77ddff" toneMapped={false} /></Text><mesh position={[0, 0, -0.01]}><planeGeometry args={[3.8, 0.9]} /><meshBasicMaterial color="#3399cc" transparent opacity={0.08} /></mesh></group>
      <mesh position={[ROOM_W / 2 + 3, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[5.5, 0.05, 0.8]} /><meshBasicMaterial color="#113355" /></mesh>
      {/* Window */}
      <group position={[ROOM_W / 2 + 2, 1.4, ROOM_D / 2 + 0.17]}>
        <mesh><planeGeometry args={[2.2, 1.8]} /><Mat color="#a0c0e0" transparent opacity={0.18} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, -0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[-1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#556677" roughness={0.3} metalness={0.6} /></mesh>
      </group>
      {/* OPEN sign */}
      <group position={[ROOM_W / 2 + 1.2, 2.0, ROOM_D / 2 + 0.25]}><mesh><boxGeometry args={[0.7, 0.35, 0.04]} /><meshBasicMaterial color="#111111" /></mesh><Text position={[0, 0, 0.03]} fontSize={0.16} color="#33ff66" anchorX="center" anchorY="middle">OPEN<meshBasicMaterial color="#33ff66" toneMapped={false} /></Text><Text position={[0, 0, -0.03]} rotation={[0, Math.PI, 0]} fontSize={0.16} color="#33ff66" anchorX="center" anchorY="middle">OPEN<meshBasicMaterial color="#33ff66" toneMapped={false} /></Text></group>
    </>
  );
}
