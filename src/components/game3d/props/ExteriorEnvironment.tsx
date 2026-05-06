"use client";

import React from "react";
import { ROOM_D } from "../store-constants";
import { DumpsterProp, FireHydrantProp, MailboxProp, StreetSignProp } from "./index";
import { SmartBox, WORLD_ANCHORS, offsetFrom, BUILDING_CODES } from "../helpers";

/**
 * Exterior environment: sky dome, parking lot, roads, side streets,
 * facades, collision walls, and street furniture.
 */
export function ExteriorEnvironment({ topDown }: { topDown: boolean }) {
  return (
    <>
      {/* Sky dome (hidden in top-down) */}
      {!topDown && <>
      {[{ pos: [0, 10, -30] as [number,number,number], rot: [0, 0, 0] as [number,number,number] },{ pos: [0, 10, 35] as [number,number,number], rot: [0, Math.PI, 0] as [number,number,number] },{ pos: [-35, 10, 0] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number] },{ pos: [35, 10, 0] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number] }].map((sky, i) => (<mesh key={`sky-${i}`} position={sky.pos} rotation={sky.rot}><planeGeometry args={[80, 30]} /><meshBasicMaterial color="#1a2a48" /></mesh>))}
      <mesh position={[0, 22, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshBasicMaterial color="#1a2a48" /></mesh>
      {Array.from({ length: 15 }).map((_, i) => (<mesh key={`star-${i}`} position={[(Math.sin(i * 7.3) * 25), 5 + Math.abs(Math.sin(i * 3.7)) * 12, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.06, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>))}
      <mesh position={[12, 14, 34]} rotation={[0, Math.PI, 0]}><circleGeometry args={[1.0, 16]} /><meshBasicMaterial color="#d8dce8" /></mesh>
      <mesh position={[12.3, 14.2, 33.9]} rotation={[0, Math.PI, 0]}><circleGeometry args={[0.7, 16]} /><meshBasicMaterial color="#c0c4d0" /></mesh>
      </>}

      {/* Parking lot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, ROOM_D / 2 + 5]}><planeGeometry args={[36, 14]} /><meshBasicMaterial color="#2a2a40" /></mesh>
      {/* Sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, ROOM_D / 2 + 0.8]}><planeGeometry args={[36, 1.5]} /><meshBasicMaterial color="#4a4a4a" /></mesh>
      {/* Curb edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, ROOM_D / 2 + 0.5]}><planeGeometry args={[36, 1.5]} /><meshBasicMaterial color="#2a2520" /></mesh>
      {/* Parking lines — bright white stripes between each space, plus front bumper line */}
      {[-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15].map((px, i) => (
        <mesh key={`pline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, -0.035, ROOM_D / 2 + 6]}>
          <planeGeometry args={[0.12, 4.2]} />
          <meshBasicMaterial color="#e8e2c8" />
        </mesh>
      ))}
      {/* Front-of-space bumper-stop line (perpendicular, at the storefront-facing edge of each space) */}
      {[-13.5, -10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5, 13.5].map((px, i) => (
        <mesh key={`pbump-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, -0.035, ROOM_D / 2 + 3.95]}>
          <planeGeometry args={[2.6, 0.12]} />
          <meshBasicMaterial color="#e8e2c8" />
        </mesh>
      ))}

      {/* Exterior nighttime lighting */}
      <pointLight position={[0, 3.2, ROOM_D / 2 + 1.2]} intensity={0.7} distance={10} color="#ffe0a0" />
      <pointLight position={[0, 2.0, ROOM_D / 2 + 0.8]} intensity={0.5} distance={6} color="#ffd700" />
      <pointLight position={[1.18, 3.0, 18.41]} intensity={0.8} distance={8} color="#ffe4a0" />
      <pointLight position={[-5.94, 3.0, 18.2]} intensity={0.8} distance={8} color="#ffe4a0" />
      <pointLight position={[-4.76, 0.6, 11.5]} intensity={0.3} distance={4} color="#fff8e0" />
      <pointLight position={[0, 2, ROOM_D / 2]} intensity={0.15} distance={8} color="#2244aa" />

      {/* Curb */}
      <mesh position={[0, 0.05, ROOM_D / 2 + 1.5]}><boxGeometry args={[36, 0.1, 0.15]} /><meshBasicMaterial color="#555555" /></mesh>

      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, ROOM_D / 2 + 13]}><planeGeometry args={[40, 6]} /><meshBasicMaterial color="#111116" /></mesh>
      {[-12, -8, -4, 0, 4, 8, 12].map((dx, i) => (<mesh key={`roadline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dx, -0.055, ROOM_D / 2 + 13]}><planeGeometry args={[1.5, 0.08]} /><meshBasicMaterial color="#555533" /></mesh>))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 13.05]}><planeGeometry args={[40, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.054, ROOM_D / 2 + 12.9]}><planeGeometry args={[40, 0.06]} /><meshBasicMaterial color="#ccaa22" /></mesh>

      {/* Left side street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, -0.06, 5]}><planeGeometry args={[4, 30]} /><meshBasicMaterial color="#111116" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, -0.054, 5]}><planeGeometry args={[0.06, 30]} /><meshBasicMaterial color="#ccaa22" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16.4, -0.04, 5]}><planeGeometry args={[0.8, 30]} /><meshBasicMaterial color="#4a4a4a" /></mesh>
      <mesh position={[-16.8, 0.05, 5]}><boxGeometry args={[0.15, 0.1, 30]} /><meshBasicMaterial color="#555555" /></mesh>
      <mesh position={[-19.9, 1.75, 2]}><boxGeometry args={[0.2, 3.5, 10]} /><meshBasicMaterial color="#5a4a3a" /></mesh>
      <mesh position={[-19.9, 1.75, 12]}><boxGeometry args={[0.2, 3.5, 10]} /><meshBasicMaterial color="#6a5a4a" /></mesh>
      <mesh position={[-19.85, 3.6, 7]}><boxGeometry args={[0.3, 0.2, 24]} /><meshBasicMaterial color="#3a3a3a" /></mesh>
      {[-1, 3, 7, 11, 15].map((dz, i) => (
        <mesh key={`lfacade-win-${i}`} position={[-19.84, 2.0, dz]}><boxGeometry args={[0.05, 1.0, 1.2]} /><meshBasicMaterial color="#1a1a2a" /></mesh>
      ))}
      <DumpsterProp position={[-17.5, 0, -2]} />
      <FireHydrantProp position={[-16.5, 0, 10]} />

      {/* Right side street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, -0.06, 5]}><planeGeometry args={[4, 30]} /><meshBasicMaterial color="#111116" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, -0.054, 5]}><planeGeometry args={[0.06, 30]} /><meshBasicMaterial color="#ccaa22" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16.4, -0.04, 5]}><planeGeometry args={[0.8, 30]} /><meshBasicMaterial color="#4a4a4a" /></mesh>
      <mesh position={[16.8, 0.05, 5]}><boxGeometry args={[0.15, 0.1, 30]} /><meshBasicMaterial color="#555555" /></mesh>
      <mesh position={[19.9, 1.75, 2]}><boxGeometry args={[0.2, 3.5, 10]} /><meshBasicMaterial color="#5a4a3a" /></mesh>
      <mesh position={[19.9, 1.75, 12]}><boxGeometry args={[0.2, 3.5, 10]} /><meshBasicMaterial color="#4a4a5a" /></mesh>
      <mesh position={[19.85, 3.6, 7]}><boxGeometry args={[0.3, 0.2, 24]} /><meshBasicMaterial color="#3a3a3a" /></mesh>
      {[-1, 3, 7, 11, 15].map((dz, i) => (
        <mesh key={`rfacade-win-${i}`} position={[19.84, 2.0, dz]}><boxGeometry args={[0.05, 1.0, 1.2]} /><meshBasicMaterial color="#1a1a2a" /></mesh>
      ))}
      <MailboxProp position={[16.5, 0, 10]} />
      <StreetSignProp position={[17.0, 0, 14]} label="OAK ST" showText={!topDown} />

      {/* ── Street furniture using SmartBox + WORLD_ANCHORS ── */}
      {/* Bus stop bench — 3m right of the video store entrance, on the sidewalk */}
      {(() => {
        const benchPos = offsetFrom(WORLD_ANCHORS.VIDEO_STORE_ENTRANCE, [3.5, 0, 0.8]);
        return (
          <group position={benchPos}>
            {/* Bench seat */}
            <SmartBox size={[1.2, 0.05, 0.4]} position={[0, BUILDING_CODES.CHAIR_SEAT, 0]} color="#6B4226" />
            {/* Bench back */}
            <SmartBox size={[1.2, 0.4, 0.05]} position={[0, BUILDING_CODES.CHAIR_SEAT, -0.2]} color="#6B4226" />
            {/* Left leg */}
            <SmartBox size={[0.05, BUILDING_CODES.CHAIR_SEAT, 0.35]} position={[-0.55, 0, 0]} color="#444" />
            {/* Right leg */}
            <SmartBox size={[0.05, BUILDING_CODES.CHAIR_SEAT, 0.35]} position={[0.55, 0, 0]} color="#444" />
            {/* Armrest left */}
            <SmartBox size={[0.05, 0.25, 0.4]} position={[-0.55, BUILDING_CODES.CHAIR_SEAT, 0]} color="#444" />
            {/* Armrest right */}
            <SmartBox size={[0.05, 0.25, 0.4]} position={[0.55, BUILDING_CODES.CHAIR_SEAT, 0]} color="#444" />
          </group>
        );
      })()}

      {/* Newspaper box — 2m left of the video store entrance, on the sidewalk */}
      {(() => {
        const newsPos = offsetFrom(WORLD_ANCHORS.VIDEO_STORE_ENTRANCE, [-2.5, 0, 0.8]);
        return (
          <group position={newsPos}>
            {/* Main box body */}
            <SmartBox size={[0.45, 1.0, 0.4]} position={[0, 0, 0]} color="#cc2222" />
            {/* Viewing window */}
            <SmartBox size={[0.35, 0.25, 0.01]} position={[0, 0.65, 0.2]} color="#88aacc" />
            {/* Coin slot */}
            <SmartBox size={[0.1, 0.04, 0.02]} position={[0.1, 0.5, 0.2]} color="#333" />
            {/* Handle */}
            <SmartBox size={[0.2, 0.03, 0.03]} position={[0, 0.4, 0.22]} color="#666" />
          </group>
        );
      })()}

      {/* Invisible collision walls at world edges */}
      <mesh position={[-20, 1.5, 5]} visible={false}><boxGeometry args={[0.2, 4, 40]} /><meshBasicMaterial transparent opacity={0} /></mesh>
      <mesh position={[20, 1.5, 5]} visible={false}><boxGeometry args={[0.2, 4, 40]} /><meshBasicMaterial transparent opacity={0} /></mesh>
    </>
  );
}
