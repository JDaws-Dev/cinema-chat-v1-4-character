"use client";

import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat, PosterBox } from "./store-materials";

/**
 * SimpleApartment — a small one-bedroom MVP apartment used as the "watch
 * the movie + rewind the tape" level after each Blockbuster visit.
 *
 * Layout (top-down, rendered at world origin so the standalone Canvas works):
 *
 *     z=-3     +-------------------------+
 *              |          BEDROOM        |
 *              | [bed]   [nightstand]    |
 *     z=-1     +-----+-------------------+
 *              |     |    LIVING ROOM    |
 *              |     |   [coffee table]  |
 *              | (no |   [couch]         |
 *              |  br | [TV][VCR][shelf]  |
 *              | dr) |                   |
 *     z=+3     +-----+---[counter]-[DOOR]+
 *
 * Walls span x=[-3.5, 3.5], z=[-3, 3]. Front door at (1.0, 0, 3).
 * Counter at (-1.5, 0, 2.5) holds the held tapes.
 * VCR at (2.5, 0, -2.5).
 */

const FLOOR_COLOR = "#6a4226";        // hardwood
const WALL_COLOR = "#e6dac3";         // warm cream
const BASEBOARD_COLOR = "#3a2010";
const CEIL_COLOR = "#dcd0bd";
const TRIM_COLOR = "#5a3a1a";
const APT_W = 7;     // x extent
const APT_D = 6;     // z extent
const APT_H = 2.6;   // ceiling
const WALL_T = 0.15;

interface HeldMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  slotKey?: string;
}

interface SimpleApartmentProps {
  heldMovies: HeldMovie[];
  rewoundIds: Set<number>;
}

export function SimpleApartment({ heldMovies, rewoundIds }: SimpleApartmentProps) {
  return (
    <group>
      {/* ── LIGHTING ── */}
      <ambientLight intensity={1.2} color="#fff2dd" />
      <hemisphereLight args={["#fff6e4", "#3a3020", 0.6]} />
      <directionalLight position={[2, 4, 2]} intensity={0.8} color="#fff3dc" />
      {/* Warm lamp glow over couch */}
      <pointLight position={[0, 2.2, -0.5]} intensity={0.7} distance={5} decay={1.6} color="#ffc888" />
      {/* TV glow */}
      <pointLight position={[2.5, 1.2, -2.4]} intensity={0.4} distance={3} decay={2} color="#7aa8ff" />

      {/* ── FLOOR ── hardwood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={FLOOR_COLOR} roughness={0.85} />
      </mesh>

      {/* ── CEILING ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, APT_H, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={CEIL_COLOR} roughness={0.95} />
      </mesh>

      {/* ── WALLS ──
          Back, left, right are full. Front wall has a door gap. */}
      {/* Back wall (z=-APT_D/2) */}
      <mesh position={[0, APT_H / 2, -APT_D / 2]}>
        <boxGeometry args={[APT_W, APT_H, WALL_T]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall (x=-APT_W/2) */}
      <mesh position={[-APT_W / 2, APT_H / 2, 0]}>
        <boxGeometry args={[WALL_T, APT_H, APT_D]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall (x=+APT_W/2) */}
      <mesh position={[APT_W / 2, APT_H / 2, 0]}>
        <boxGeometry args={[WALL_T, APT_H, APT_D]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Front wall — split around door gap at x=[0.2, 1.8] */}
      <mesh position={[-1.85, APT_H / 2, APT_D / 2]}>
        <boxGeometry args={[3.5 - 0.2, APT_H, WALL_T]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[2.65, APT_H / 2, APT_D / 2]}>
        <boxGeometry args={[1.7, APT_H, WALL_T]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Above door */}
      <mesh position={[1, APT_H - 0.25, APT_D / 2]}>
        <boxGeometry args={[1.6, 0.5, WALL_T]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Bedroom partial wall — divides at z=-1, leaves opening from x=0 to x=APT_W/2 */}
      <mesh position={[-2.25, APT_H / 2, -1]}>
        <boxGeometry args={[2.5, APT_H, WALL_T]} />
        <Mat color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Baseboards on perimeter */}
      <mesh position={[0, 0.06, -APT_D / 2 + WALL_T / 2 + 0.01]}>
        <boxGeometry args={[APT_W, 0.12, 0.02]} />
        <Mat color={BASEBOARD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-APT_W / 2 + WALL_T / 2 + 0.01, 0.06, 0]}>
        <boxGeometry args={[0.02, 0.12, APT_D]} />
        <Mat color={BASEBOARD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[APT_W / 2 - WALL_T / 2 - 0.01, 0.06, 0]}>
        <boxGeometry args={[0.02, 0.12, APT_D]} />
        <Mat color={BASEBOARD_COLOR} roughness={0.8} />
      </mesh>

      {/* ── FRONT DOOR ── interactable, returns to store */}
      <group
        position={[1, 0, APT_D / 2]}
        userData={{ interactType: "apartment_door", label: "[E] Back to the store" }}
      >
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.4, 2, 0.06]} />
          <Mat color={TRIM_COLOR} roughness={0.7} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.55, 1.0, 0.04]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <Mat color="#b8a060" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Door panels */}
        <mesh position={[0, 1.4, 0.035]}>
          <boxGeometry args={[1.0, 0.5, 0.01]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, 0.035]}>
          <boxGeometry args={[1.0, 0.5, 0.01]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        {/* EXIT label glowing above door */}
        <Text position={[0, 2.15, 0.1]} fontSize={0.12} color="#ff3344" anchorX="center" anchorY="middle" font={undefined}>
          ← TO THE STORE
        </Text>
      </group>

      {/* ── ENTRY COUNTER ── (just inside door, holds the tapes you brought home) */}
      <group position={[-1.5, 0, 2.4]}>
        {/* Counter base */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.6, 0.9, 0.45]} />
          <Mat color="#5a3a20" roughness={0.7} />
        </mesh>
        {/* Counter top */}
        <mesh position={[0, 0.91, 0]}>
          <boxGeometry args={[1.7, 0.04, 0.5]} />
          <Mat color="#8a6838" roughness={0.4} />
        </mesh>
        {/* Sticky note "TAPES TO REWIND" */}
        <mesh position={[-0.6, 0.94, -0.18]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[0.3, 0.18]} />
          <Mat color="#fff3a0" roughness={0.8} />
        </mesh>
        <Text position={[-0.6, 0.945, -0.18]} rotation={[-Math.PI / 2, 0, 0.1]} fontSize={0.04} color="#3a2010" anchorX="center" anchorY="middle" font={undefined}>
          REWIND BEFORE
        </Text>
        <Text position={[-0.6, 0.945, -0.13]} rotation={[-Math.PI / 2, 0, 0.1]} fontSize={0.04} color="#3a2010" anchorX="center" anchorY="middle" font={undefined}>
          RETURNING!
        </Text>

        {/* Tapes from the store visit, laid out on the counter */}
        {heldMovies.map((movie, i) => {
          const x = -0.55 + (i % 3) * 0.35;
          const z = 0.05 + Math.floor(i / 3) * 0.18;
          const isRewound = rewoundIds.has(movie.id);
          return (
            <ApartmentTape
              key={`apt-tape-${movie.id}`}
              movie={movie}
              position={[x, 0.94, z]}
              rewound={isRewound}
            />
          );
        })}
      </group>

      {/* ── TV + VCR + STAND ── (back-right corner of living room) */}
      <group position={[2.5, 0, -2.5]}>
        {/* TV stand base */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.6, 0.6, 0.45]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        {/* CRT TV — chunky 90s style */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.0, 0.7, 0.85]} />
          <Mat color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Screen — glowing */}
        <mesh position={[0, 0.95, -0.43]}>
          <planeGeometry args={[0.78, 0.55]} />
          <meshBasicMaterial color="#0a3a8a" />
        </mesh>
        {/* Static lines */}
        <Text position={[0, 0.95, -0.44]} fontSize={0.06} color="#7aa8ff" anchorX="center" anchorY="middle" font={undefined}>
          PRESS PLAY
        </Text>
        {/* VCR — the interactable, sitting on the stand */}
        <group
          position={[0, 0.65, 0]}
          userData={{ interactType: "vcr", label: "[E] Use VCR" }}
        >
          <mesh>
            <boxGeometry args={[1.0, 0.16, 0.4]} />
            <Mat color="#2a2a2a" roughness={0.5} metalness={0.1} />
          </mesh>
          {/* Front face plate */}
          <mesh position={[0, 0, -0.21]}>
            <boxGeometry args={[1.0, 0.16, 0.005]} />
            <Mat color="#1a1a1a" roughness={0.4} metalness={0.2} />
          </mesh>
          {/* Tape slot */}
          <mesh position={[-0.2, 0.02, -0.213]}>
            <boxGeometry args={[0.4, 0.04, 0.003]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          {/* Power LED — green dot */}
          <mesh position={[0.4, 0.0, -0.213]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial color="#00ff44" toneMapped={false} />
          </mesh>
          {/* Display segments — fake clock */}
          <Text position={[0.18, -0.01, -0.213]} fontSize={0.04} color="#00ddff" anchorX="center" anchorY="middle" font={undefined}>
            12:00
          </Text>
        </group>
      </group>

      {/* ── COUCH ── facing the TV (TV at +x/-z, couch at -x/+z roughly oriented) */}
      <group position={[-0.5, 0, -1.0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[2.0, 0.4, 0.85]} />
          <Mat color="#5a3030" roughness={0.7} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.65, -0.4]}>
          <boxGeometry args={[2.0, 0.6, 0.15]} />
          <Mat color="#5a3030" roughness={0.7} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-1.0, 0.45, 0]}>
          <boxGeometry args={[0.15, 0.5, 0.85]} />
          <Mat color="#4a2828" roughness={0.7} />
        </mesh>
        <mesh position={[1.0, 0.45, 0]}>
          <boxGeometry args={[0.15, 0.5, 0.85]} />
          <Mat color="#4a2828" roughness={0.7} />
        </mesh>
        {/* Throw pillow */}
        <mesh position={[0.6, 0.55, 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.3]} />
          <Mat color="#cc8866" roughness={0.8} />
        </mesh>
      </group>

      {/* ── COFFEE TABLE ── */}
      <group position={[1.0, 0, -1.2]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.0, 0.05, 0.55]} />
          <Mat color="#8a6838" roughness={0.4} />
        </mesh>
        <mesh position={[-0.42, 0.2, -0.22]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <Mat color="#5a3a20" />
        </mesh>
        <mesh position={[0.42, 0.2, -0.22]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <Mat color="#5a3a20" />
        </mesh>
        <mesh position={[-0.42, 0.2, 0.22]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <Mat color="#5a3a20" />
        </mesh>
        <mesh position={[0.42, 0.2, 0.22]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <Mat color="#5a3a20" />
        </mesh>
        {/* Pizza box on table */}
        <mesh position={[-0.2, 0.45, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <Mat color="#cc6633" roughness={0.85} />
        </mesh>
        {/* Soda can */}
        <mesh position={[0.3, 0.5, -0.1]}>
          <cylinderGeometry args={[0.04, 0.04, 0.13, 12]} />
          <Mat color="#cc2222" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* ── FLOOR LAMP ── corner of living room */}
      <group position={[-3.0, 0, -2.5]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
          <Mat color="#3a2010" />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
          <Mat color="#222" metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.3, 12]} />
          <meshBasicMaterial color="#fff3c0" />
        </mesh>
      </group>

      {/* ── BEDROOM ── behind partial wall at z<-1 */}
      {/* Bed */}
      <group position={[-1.8, 0, -2.4]}>
        {/* Frame */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.4, 0.4, 1.9]} />
          <Mat color="#3a2010" roughness={0.7} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.35, 0.15, 1.85]} />
          <Mat color="#e8dcc8" roughness={0.85} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.7, -0.92]}>
          <boxGeometry args={[1.4, 0.85, 0.08]} />
          <Mat color="#5a3a20" roughness={0.6} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.55, -0.65]}>
          <boxGeometry args={[1.2, 0.15, 0.4]} />
          <Mat color="#fff5e0" roughness={0.9} />
        </mesh>
        {/* Comforter (off-color block over mattress) */}
        <mesh position={[0, 0.54, 0.2]}>
          <boxGeometry args={[1.32, 0.05, 1.1]} />
          <Mat color="#3a5a8a" roughness={0.85} />
        </mesh>
      </group>
      {/* Nightstand */}
      <group position={[-3.0, 0, -2.4]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.45, 0.6, 0.45]} />
          <Mat color="#5a3a20" roughness={0.7} />
        </mesh>
        {/* Lamp */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.13, 0.1, 0.2, 12]} />
          <meshBasicMaterial color="#ffe28a" />
        </mesh>
        {/* Alarm clock */}
        <mesh position={[0.05, 0.62, 0.13]}>
          <boxGeometry args={[0.18, 0.08, 0.06]} />
          <Mat color="#1a1a1a" />
        </mesh>
        <Text position={[0.05, 0.62, 0.165]} fontSize={0.03} color="#ff3322" anchorX="center" anchorY="middle" font={undefined}>
          11:42
        </Text>
      </group>

      {/* ── WALL DECOR ── poster on living room back wall */}
      <mesh position={[2, 1.6, -APT_D / 2 + 0.08]}>
        <planeGeometry args={[0.7, 1.0]} />
        <meshBasicMaterial color="#1a3a6a" />
      </mesh>
      <Text position={[2, 1.6, -APT_D / 2 + 0.085]} fontSize={0.08} color="#ffd700" anchorX="center" anchorY="middle" font={undefined} maxWidth={0.65}>
        BE KIND. REWIND.
      </Text>
    </group>
  );
}

// ── Single tape on the apartment counter ──
function ApartmentTape({
  movie,
  position,
  rewound,
}: {
  movie: { id: number; title: string; posterUrl: string; genre: string; slotKey?: string };
  position: [number, number, number];
  rewound: boolean;
}) {
  const userData = useMemo(
    () => ({
      interactType: "apartment_tape",
      label: rewound ? `${movie.title} (rewound)` : `[E] Pick up ${movie.title}`,
      interactData: JSON.stringify({ id: movie.id, title: movie.title, slotKey: movie.slotKey, rewound }),
    }),
    [movie, rewound]
  );

  return (
    <group position={position} userData={userData}>
      {/* VHS box body */}
      <mesh userData={userData}>
        <boxGeometry args={[0.18, 0.04, 0.28]} />
        <Mat color={rewound ? "#3a6a3a" : "#1a1a2a"} roughness={0.7} />
      </mesh>
      {/* Spine label */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.16, 0.005, 0.26]} />
        <Mat color={rewound ? "#5a8a5a" : "#e8e0c8"} roughness={0.85} />
      </mesh>
      <Text
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.03}
        color={rewound ? "#ffffff" : "#1a1a2a"}
        anchorX="center"
        anchorY="middle"
        font={undefined}
        maxWidth={0.24}
      >
        {movie.title}
      </Text>
      {/* Rewound indicator */}
      {rewound && (
        <mesh position={[0, 0.035, 0.1]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color="#00ff44" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
