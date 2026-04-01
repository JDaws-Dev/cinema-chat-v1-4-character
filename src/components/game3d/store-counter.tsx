"use client";

import React from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { getObjectById } from "@/lib/store-layout";
import { Mat } from "./store-materials";
import { KenneyModel } from "./store-characters";

export function Counter() {
  const pos = getObjectById("counter");
  return (
    <group position={[pos?.x ?? 7, pos?.y ?? 0, pos?.z ?? 5]} rotation={[0, 0, 0]}>
      <RoundedBox args={[6, 0.85, 1.2]} radius={0.03} smoothness={3} position={[0, 0.425, 0]}><Mat color="#5a3820" roughness={0.8} /></RoundedBox>
      <RoundedBox args={[6.15, 0.06, 1.3]} radius={0.02} smoothness={2} position={[0, 0.87, 0]}><Mat color="#9a7850" roughness={0.35} metalness={0.08} /></RoundedBox>
      <mesh position={[0, 0.05, -0.55]}><boxGeometry args={[5.9, 0.1, 0.06]} /><Mat color="#3a2010" roughness={0.9} /></mesh>
      <mesh position={[0, 0.64, -0.56]}><boxGeometry args={[5.92, 0.16, 0.05]} /><Mat color="#1c3f73" roughness={0.55} /></mesh>
      <mesh position={[0, 0.18, -0.71]}><boxGeometry args={[5.15, 0.04, 0.04]} /><Mat color="#b8952a" roughness={0.3} metalness={0.65} /></mesh>

      {/* Candy display — mounted on front face of counter */}
      {[0.25, 0.50].map((y) => (
        <mesh key={`candy-shelf-${y}`} position={[0, y, -0.75]}><boxGeometry args={[4, 0.03, 0.3]} /><Mat color="#5a3820" roughness={0.7} /></mesh>
      ))}
      {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((dx, i) => {
        const topSnacks = [
          { name: "Red Vines", emoji: "\ud83c\udf6c" },{ name: "Butterfinger", emoji: "\ud83c\udf6b" },{ name: "Skittles", emoji: "\ud83c\udf08" },{ name: "Junior Mints", emoji: "\ud83c\udf43" },{ name: "Twizzlers", emoji: "\ud83e\udee2" },{ name: "Sour Patch Kids", emoji: "\ud83d\ude1d" },{ name: "M&Ms", emoji: "\ud83d\udfe4" },
        ];
        const bottomSnacks = [
          { name: "Milk Duds", emoji: "\ud83d\udfe1" },{ name: "Nerds", emoji: "\ud83e\udd13" },{ name: "Gummy Bears", emoji: "\ud83d\udc3b" },{ name: "Hot Tamales", emoji: "\ud83c\udf36\ufe0f" },{ name: "Swedish Fish", emoji: "\ud83d\udc1f" },{ name: "Reese's Pieces", emoji: "\ud83e\udd5c" },{ name: "Raisinets", emoji: "\ud83c\udf47" },
        ];
        const topSnack = topSnacks[i];
        const bottomSnack = bottomSnacks[i];
        return (
        <group key={`candy-row-${i}`}>
          <group position={[dx, 0.62, -0.75]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: topSnack.name, emoji: topSnack.emoji }), label: `Pick up: ${topSnack.name}` }}>
            <KenneyModel model={i % 2 === 0 ? "candy-bar" : "chocolate"} position={[0, 0, 0]} scale={0.3} />
          </group>
          <group position={[dx, 0.37, -0.75]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: bottomSnack.name, emoji: bottomSnack.emoji }), label: `Pick up: ${bottomSnack.name}` }}>
            <KenneyModel model={i % 2 === 0 ? "candy-bar-wrapper" : "cookie-chocolate"} position={[0, 0, 0]} scale={0.3} />
          </group>
        </group>
        );
      })}
      <Text position={[0, 0.73, -0.78]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>CANDY & SNACKS</Text>

      <group position={[-1.5, 0.95, 0]}>
        <RoundedBox args={[0.55, 0.35, 0.4]} radius={0.03} smoothness={3}><Mat color="#2a2a2a" roughness={0.4} /></RoundedBox>
        <mesh position={[0, 0.22, -0.12]} rotation={[-0.4, 0, 0]}><boxGeometry args={[0.42, 0.22, 0.02]} /><meshBasicMaterial color="#0a3a0a" /></mesh>
        {Array.from({length: 12}).map((_, i) => (
          <mesh key={`key-${i}`} position={[-0.1 + (i % 3) * 0.07, 0.04, -0.08 - Math.floor(i / 3) * 0.06]}><boxGeometry args={[0.05, 0.02, 0.04]} /><Mat color="#444" roughness={0.5} /></mesh>
        ))}
        <mesh position={[0, -0.12, -0.05]}><boxGeometry args={[0.5, 0.08, 0.35]} /><Mat color="#333" roughness={0.5} /></mesh>
      </group>

      <Text position={[0, 1.00, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.1} color="#ffd700" anchorX="center" font={undefined}>CHECKOUT</Text>

      <group position={[2.15, 1.0, 0.16]} rotation={[0, -0.2, 0]}>
        <mesh rotation={[0.35, 0, 0]}><boxGeometry args={[0.3, 0.18, 0.02]} /><Mat color="#f4efe2" roughness={0.65} /></mesh>
        <Text position={[0, 0.03, -0.01]} rotation={[0.35, Math.PI, 0]} fontSize={0.028} color="#1a3a6a" anchorX="center" anchorY="middle" font={undefined}>JOIN</Text>
        <Text position={[0, -0.03, -0.01]} rotation={[0.35, Math.PI, 0]} fontSize={0.028} color="#cc2222" anchorX="center" anchorY="middle" font={undefined}>REWARDS</Text>
      </group>

      {[1.0, 1.3, 1.6, 1.9].map((dx, i) => {
        const counterSnacks = [{ name: "Popcorn", emoji: "\ud83c\udf7f" },{ name: "Soda", emoji: "\ud83e\udd64" },{ name: "Nachos", emoji: "\ud83e\uddc0" },{ name: "Cookie", emoji: "\ud83c\udf6a" }];
        const counterModels = ["candy-bar-wrapper", "soda-can", "chocolate", "cookie-chocolate"] as const;
        const snack = counterSnacks[i];
        const model = counterModels[i];
        return (
        <group key={`snk${i}`} position={[dx, 1.00, 0.2]} userData={{ interactType: "snack", interactData: JSON.stringify({ name: snack.name, emoji: snack.emoji }), label: `Pick up: ${snack.name}` }}>
          {model ? (
            <KenneyModel model={model} position={[0, 0, 0]} scale={0.3} />
          ) : (
            <mesh userData={{ interactType: "snack", interactData: JSON.stringify({ name: snack.name, emoji: snack.emoji }), label: `Pick up: ${snack.name}` }}><boxGeometry args={[0.12, 0.18, 0.06]} /><Mat color="#5a3a20" roughness={0.5} /></mesh>
          )}
        </group>
        );
      })}

      <mesh position={[2.3, 1.00, -0.2]}><boxGeometry args={[0.5, 0.25, 0.35]} /><Mat color="#2a2a3a" roughness={0.7} /></mesh>
      <Text position={[2.3, 1.20, -0.38]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#888" anchorX="center" font={undefined}>RETURNS</Text>

      {/* Monitor on counter — base sits on surface at y=0.90 */}
      <group position={[0.5, 1.10, 0.3]}>
        <mesh><boxGeometry args={[0.4, 0.35, 0.05]} /><Mat color="#2a2a2a" roughness={0.4} /></mesh>
        <mesh position={[0, 0.01, -0.026]}><planeGeometry args={[0.34, 0.26]} /><Mat color="#1a3a6a" emissive="#1a4a8a" emissiveIntensity={0.6} /></mesh>
        <mesh position={[0, -0.22, 0.02]}><boxGeometry args={[0.08, 0.1, 0.06]} /><Mat color="#2a2a2a" roughness={0.4} /></mesh>
        <mesh position={[0, -0.27, 0.02]}><boxGeometry args={[0.18, 0.02, 0.12]} /><Mat color="#2a2a2a" roughness={0.4} /></mesh>
      </group>

      <mesh position={[1.0, 0.95, -0.2]}><boxGeometry args={[0.15, 0.08, 0.2]} /><Mat color="#333333" roughness={0.5} /></mesh>
      <mesh position={[1.0, 0.995, -0.2]}><boxGeometry args={[0.12, 0.005, 0.02]} /><Mat color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} /></mesh>

      {[0, 1, 2, 3].map((i) => (
        <mesh key={`vhs-stack-${i}`} position={[-0.5, 1.00 + i * 0.04, -0.2]} rotation={[0, (i * 0.15), 0]}><boxGeometry args={[0.2, 0.035, 0.12]} /><Mat color={["#1a3a6a", "#6a1a3a", "#3a6a1a", "#5a3a6a"][i]} roughness={0.6} /></mesh>
      ))}

      <Text position={[2, 1.25, -0.6]} rotation={[0, Math.PI, 0]} fontSize={0.06} color="#ffd700" anchorX="center" font={undefined}>MEMBERSHIP CARDS</Text>
      {[-0.15, 0, 0.15].map((dx, i) => (
        <mesh key={`form-stack-${i}`} position={[2.05 + dx, 0.97 + i * 0.01, -0.1 + i * 0.03]} rotation={[0, -0.1 + i * 0.08, 0]}><boxGeometry args={[0.22, 0.02, 0.14]} /><Mat color={i === 1 ? "#f1eddc" : "#ece6d4"} roughness={0.8} /></mesh>
      ))}
    </group>
  );
}
