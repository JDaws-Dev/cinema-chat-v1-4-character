"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ROOM_H, ROOM_D } from "../store-constants";
import { Mat } from "../store-materials";

/** Pizza Palace — walkable interior + exterior signage + window */
export function PizzaPalace() {
  return (
    <>
      {/* ── PIZZA PALACE INTERIOR ── (6m wide x 8m deep) */}
      <group position={[-13, 0, 5.5]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]}><planeGeometry args={[6, 8]} /><meshBasicMaterial color="#4a3020" side={THREE.DoubleSide} /></mesh>
        {/* Checkerboard tiles */}
        {Array.from({ length: 6 }).map((_, ix) => Array.from({ length: 8 }).map((_, iz) => (
          (ix + iz) % 2 === 0 ? <mesh key={`tile-${ix}-${iz}`} rotation={[-Math.PI / 2, 0, 0]} position={[-2.5 + ix, 0.012, -5 + iz]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#5a3a28" side={THREE.DoubleSide} /></mesh> : null
        )))}
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, -1.5]}><planeGeometry args={[6, 8]} /><meshBasicMaterial color="#8a7a6a" side={THREE.DoubleSide} /></mesh>
        {/* Walls */}
        {/* Back wall — moved from z=-2.5 to z=-5.5 */}
        <mesh position={[0, ROOM_H / 2, -5.5]}><boxGeometry args={[6, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        {/* Left wall — extended to 8m depth */}
        <mesh position={[-3, ROOM_H / 2, -1.5]}><boxGeometry args={[0.1, ROOM_H, 8]} /><meshBasicMaterial color="#7a1818" /></mesh>
        {/* Front wall with door gap */}
        <mesh position={[-1.7, ROOM_H / 2, 1.5]}><boxGeometry args={[2.6, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        <mesh position={[1.9, ROOM_H / 2, 1.5]}><boxGeometry args={[2.2, ROOM_H, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>
        <mesh position={[-0.3, 2.6, 1.5]}><boxGeometry args={[1.4, 0.9, 0.1]} /><meshBasicMaterial color="#8a2020" /></mesh>

        {/* Counter — pizza display case (near front) */}
        <mesh position={[0, 0.5, -0.5]}><boxGeometry args={[4, 1, 0.8]} /><Mat color="#5a3a20" roughness={0.7} /></mesh>
        <mesh position={[0, 1.02, -0.5]}><boxGeometry args={[4.1, 0.04, 0.85]} /><Mat color="#7a5a30" roughness={0.4} /></mesh>
        {/* Pizza display case glass */}
        <mesh position={[0, 1.3, -0.5]}><boxGeometry args={[3, 0.5, 0.6]} /><Mat color="#aaddee" transparent opacity={0.2} /></mesh>
        {[-1, 0, 1].map((dx, i) => (
          <mesh key={`pizza-${i}`} position={[dx, 1.1, -0.5]}><boxGeometry args={[0.7, 0.08, 0.7]} /><meshBasicMaterial color={["#cc8833", "#dd9944", "#bb7722"][i]} /></mesh>
        ))}

        {/* Soda fountain — near counter */}
        <mesh position={[-2.5, 0.8, -0.3]}><boxGeometry args={[0.8, 1.6, 0.5]} /><Mat color="#333333" roughness={0.5} /></mesh>
        <Text position={[-2.5, 1.5, -0.04]} fontSize={0.08} color="#ff3333" anchorX="center" anchorY="middle" font={undefined}>DRINKS</Text>

        {/* Menu board on back wall */}
        <mesh position={[0, 2.5, -5.48]}><boxGeometry args={[3, 0.8, 0.04]} /><meshBasicMaterial color="#1a0a0a" /></mesh>
        <Text position={[0, 2.7, -5.45]} fontSize={0.12} color="#ffcc44" anchorX="center" anchorY="middle" font={undefined}>PIZZA PALACE</Text>
        <Text position={[-0.8, 2.4, -5.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>SLICE $1.50</Text>
        <Text position={[0, 2.4, -5.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>PIE $8.99</Text>
        <Text position={[0.8, 2.4, -5.45]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>SODA $1</Text>

        {/* Booth seating along left wall — front pair */}
        {[-1.5, 0].map((dz, i) => (
          <group key={`booth-front-${i}`} position={[-2.6, 0, dz]}>
            <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.6, 0.7, 1.2]} /><Mat color="#8b1a1a" roughness={0.6} /></mesh>
            <mesh position={[0.55, 0.55, 0]}><boxGeometry args={[0.6, 0.04, 1]} /><Mat color="#ddd8cc" roughness={0.4} /></mesh>
            <mesh position={[0.55, 0.27, 0]}><boxGeometry args={[0.04, 0.54, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
          </group>
        ))}

        {/* Booth seating along left wall — back pair (new, deeper room) */}
        {[-3.5, -2].map((dz, i) => (
          <group key={`booth-back-${i}`} position={[-2.6, 0, dz]}>
            <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.6, 0.7, 1.2]} /><Mat color="#8b1a1a" roughness={0.6} /></mesh>
            <mesh position={[0.55, 0.55, 0]}><boxGeometry args={[0.6, 0.04, 1]} /><Mat color="#ddd8cc" roughness={0.4} /></mesh>
            <mesh position={[0.55, 0.27, 0]}><boxGeometry args={[0.04, 0.54, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
          </group>
        ))}

        {/* Table seating along right wall — 2 tables */}
        {[-2, -3.5].map((dz, i) => (
          <group key={`table-right-${i}`} position={[2.2, 0, dz]}>
            {/* Table */}
            <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.6, 0.04, 0.8]} /><Mat color="#ddd8cc" roughness={0.4} /></mesh>
            <mesh position={[0, 0.27, 0]}><boxGeometry args={[0.04, 0.54, 0.04]} /><Mat color="#888888" roughness={0.4} metalness={0.5} /></mesh>
            {/* Bench seat against wall */}
            <mesh position={[0.45, 0.35, 0]}><boxGeometry args={[0.5, 0.7, 1.0]} /><Mat color="#8b1a1a" roughness={0.6} /></mesh>
          </group>
        ))}

        {/* Arcade machine in the back corner */}
        <group position={[2.4, 0, -5]}>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.7, 2.0, 0.65]} /><Mat color="#1a1a3a" roughness={0.5} /></mesh>
          <mesh position={[0, 1.4, 0.33]}><boxGeometry args={[0.5, 0.4, 0.02]} /><meshBasicMaterial color="#111111" /></mesh>
          <mesh position={[0, 1.4, 0.34]}><boxGeometry args={[0.45, 0.35, 0.01]} /><meshBasicMaterial color="#003300" /></mesh>
          <Text position={[0, 1.85, 0.34]} fontSize={0.06} color="#33ff33" anchorX="center" anchorY="middle" font={undefined}>SPACE BLASTER</Text>
          {/* Joystick + buttons */}
          <mesh position={[-0.1, 0.95, 0.34]}><cylinderGeometry args={[0.02, 0.02, 0.08, 8]} /><Mat color="#ff0000" roughness={0.4} /></mesh>
          {[0.05, 0.12, 0.19].map((bx, j) => (
            <mesh key={`btn-${j}`} position={[bx, 0.93, 0.34]}><cylinderGeometry args={[0.02, 0.02, 0.02, 8]} /><Mat color={["#ff0000", "#0000ff", "#ffff00"][j]} roughness={0.4} /></mesh>
          ))}
        </group>

        {/* Ceiling lights — spread over longer room */}
        {[0.5, -2, -4.5].map((fz) => (
          <group key={`pp-light-${fz}`}>
            <mesh position={[0, ROOM_H - 0.05, fz]}><boxGeometry args={[1.5, 0.04, 0.3]} /><meshBasicMaterial color="#fffae8" /></mesh>
            <pointLight position={[0, ROOM_H - 0.2, fz]} intensity={0.6} distance={6} color="#fff4d0" />
          </group>
        ))}

        {/* Neon OPEN sign in window */}
        <group position={[1.5, 2, 1.48]}>
          <mesh><boxGeometry args={[0.7, 0.35, 0.03]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.14} color="#ff3366" anchorX="center" anchorY="middle" font={undefined}>OPEN<meshBasicMaterial color="#ff3366" toneMapped={false} /></Text>
          <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.14} color="#ff3366" anchorX="center" anchorY="middle" font={undefined}>OPEN<meshBasicMaterial color="#ff3366" toneMapped={false} /></Text>
        </group>
      </group>

      {/* ── PIZZA PALACE EXTERIOR ── */}
      <group position={[-13, ROOM_H - 0.3, ROOM_D / 2 + 0.17]}>
        <mesh><boxGeometry args={[5.5, 0.7, 0.05]} /><meshBasicMaterial color="#cc3333" /></mesh>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[5.3, 0.55, 0.02]} /><meshBasicMaterial color="#1a0a0a" /></mesh>
        <Text position={[0, 0, 0.05]} fontSize={0.28} color="#ff6666" anchorX="center" anchorY="middle">PIZZA PALACE<meshBasicMaterial color="#ff6666" toneMapped={false} /></Text>
      </group>
      {/* Red & white awning */}
      {Array.from({ length: 11 }).map((_, i) => (<mesh key={`pizza-awning-${i}`} position={[-16 + i * 0.55, ROOM_H + 0.05, ROOM_D / 2 + 0.3]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.55, 0.05, 0.8]} /><meshBasicMaterial color={i % 2 === 0 ? "#cc2222" : "#eeeeee"} /></mesh>))}
      {/* Pizza window */}
      <group position={[-14.5, 1.4, ROOM_D / 2 + 0.17]}>
        <mesh><planeGeometry args={[2.2, 1.8]} /><Mat color="#a0c0e0" transparent opacity={0.18} roughness={0.02} metalness={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, -0.92, 0.01]}><boxGeometry args={[2.3, 0.06, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[-1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[1.12, 0, 0.01]}><boxGeometry args={[0.06, 1.9, 0.04]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
        <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.04, 1.8, 0.03]} /><Mat color="#666666" roughness={0.3} metalness={0.6} /></mesh>
      </group>
    </>
  );
}
