"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat } from "./store-materials";

// ── Apartment dimensions ──
const APT_W = 6;    // width (x)
const APT_D = 5;    // depth (z)  — slightly deeper than laundromat for a real studio feel
const APT_H = 2.8;  // ceiling height
const APT_Y = 4;    // one floor above ground (laundromat ceiling ~3.5 + slab)

// Laundromat group center is at x=13, z=5.75
// Apartment sits directly above: same x center, z center
const APT_X = 13;
const APT_Z = 5.75;

// Colors — warm 90s wood-paneling vibes
const FLOOR_COLOR = "#8B6914";      // warm hardwood
const WALL_COLOR = "#F5E6CC";       // cream walls
const BASEBOARD_COLOR = "#5C3A1E";  // dark wood baseboard
const CEILING_COLOR = "#E8DCC8";    // warm off-white
const TRIM_COLOR = "#6B4226";       // door/window trim

function ApartmentFloor() {
  return (
    <group>
      {/* Main hardwood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={FLOOR_COLOR} />
      </mesh>
      {/* Plank lines for texture */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-APT_W / 2 + 0.5 * i + 0.25, 0.012, 0]}>
          <planeGeometry args={[0.02, APT_D]} />
          <meshBasicMaterial color="#7A5A10" />
        </mesh>
      ))}
    </group>
  );
}

function ApartmentWalls() {
  const halfW = APT_W / 2;
  const halfD = APT_D / 2;
  return (
    <group>
      {/* Back wall (z = -halfD) */}
      <mesh position={[0, APT_H / 2, -halfD]}>
        <planeGeometry args={[APT_W, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Left wall (x = -halfW) */}
      <mesh position={[-halfW, APT_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[APT_D, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Right wall (x = halfW) — with door gap */}
      <mesh position={[halfW, APT_H / 2, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.4, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[halfW, APT_H / 2, 1.9]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.7, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[halfW, 2.3, 1.15]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      {/* Front wall (z = halfD) — with window */}
      <mesh position={[-1.5, APT_H / 2, halfD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[2.25, APT_H / 2, halfD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, APT_H]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[0.5, 2.3, halfD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <Mat color={WALL_COLOR} />
      </mesh>
      <mesh position={[0.5, 0.3, halfD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.6]} />
        <Mat color={WALL_COLOR} />
      </mesh>

      {/* Baseboards on all walls */}
      <mesh position={[0, 0.05, -halfD + 0.01]}>
        <boxGeometry args={[APT_W, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[-halfW + 0.01, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[APT_D, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[halfW - 0.01, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[APT_D, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
      <mesh position={[0, 0.05, halfD - 0.01]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[APT_W, 0.1, 0.02]} />
        <Mat color={BASEBOARD_COLOR} />
      </mesh>
    </group>
  );
}

function ApartmentCeiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, APT_H, 0]}>
        <planeGeometry args={[APT_W, APT_D]} />
        <Mat color={CEILING_COLOR} />
      </mesh>
      {/* Ceiling light fixture */}
      <group position={[0, APT_H - 0.02, 0]}>
        {/* Base plate */}
        <mesh><boxGeometry args={[0.6, 0.04, 0.6]} /><Mat color="#c8c0b0" /></mesh>
        {/* Glass dome */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#fff8e0" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function ApartmentWindow() {
  const halfD = APT_D / 2;
  return (
    <group position={[0.5, 1.4, halfD]}>
      {/* Window glass — looking out to parking lot */}
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 1.2]} />
        <Mat color="#4a6a8a" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Frame — wood trim */}
      <mesh position={[0, 0.62, -0.01]}><boxGeometry args={[1.5, 0.06, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0, -0.62, -0.01]}><boxGeometry args={[1.5, 0.06, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[-0.72, 0, -0.01]}><boxGeometry args={[0.06, 1.3, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0.72, 0, -0.01]}><boxGeometry args={[0.06, 1.3, 0.04]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Center divider */}
      <mesh position={[0, 0, -0.01]}><boxGeometry args={[0.04, 1.2, 0.03]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Curtain rod */}
      <mesh position={[0, 0.8, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 1.8, 6]} />
        <Mat color="#8B7355" />
      </mesh>
      {/* Simple curtain panels */}
      <mesh position={[-0.65, 0.2, -0.04]}><planeGeometry args={[0.4, 1.1]} /><Mat color="#8B4513" /></mesh>
      <mesh position={[0.65, 0.2, -0.04]}><planeGeometry args={[0.4, 1.1]} /><Mat color="#8B4513" /></mesh>
    </group>
  );
}

/** TV stand with CRT TV and VCR — against the back wall */
function TVArea() {
  return (
    <group position={[0, 0, -APT_D / 2 + 0.4]} userData={{ interactType: "apartment_vcr", label: "Watch & Rewind" }}>
      {/* TV stand / entertainment center */}
      <mesh position={[0, 0.35, 0]}><boxGeometry args={[1.4, 0.7, 0.5]} /><Mat color="#5C3A1E" /></mesh>
      {/* Shelf inside stand */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.3, 0.03, 0.45]} /><Mat color="#4A2E14" /></mesh>
      {/* Open front of cabinet */}
      <mesh position={[0, 0.35, 0.26]}><planeGeometry args={[1.2, 0.5]} /><meshBasicMaterial color="#2a1a0a" /></mesh>

      {/* CRT TV body */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.9, 0.7, 0.55]} /><Mat color="#333333" /></mesh>
      {/* CRT screen */}
      <mesh position={[0, 1.02, 0.28]}>
        <planeGeometry args={[0.65, 0.48]} />
        <meshBasicMaterial color="#1a2a1a" />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[0, 1.02, 0.279]}><planeGeometry args={[0.72, 0.55]} /><Mat color="#2a2a2a" /></mesh>
      {/* TV buttons on right side */}
      {[0, 0.08, 0.16].map((dy, i) => (
        <mesh key={`btn-${i}`} position={[0.42, 0.88 + dy, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <Mat color="#555555" />
        </mesh>
      ))}
      {/* Power LED */}
      <mesh position={[0.42, 0.75, 0.28]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>

      {/* VCR — sitting on shelf under TV */}
      <mesh position={[0, 0.28, 0.05]}><boxGeometry args={[0.6, 0.1, 0.35]} /><Mat color="#1a1a1a" /></mesh>
      {/* VCR slot */}
      <mesh position={[0, 0.30, 0.23]}><boxGeometry args={[0.35, 0.03, 0.01]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
      {/* VCR display */}
      <mesh position={[-0.1, 0.30, 0.231]}><planeGeometry args={[0.15, 0.04]} /><meshBasicMaterial color="#003300" /></mesh>
      {/* VCR buttons */}
      {[0.12, 0.17, 0.22, 0.27].map((bx, i) => (
        <mesh key={`vcr-btn-${i}`} position={[bx, 0.30, 0.231]}>
          <boxGeometry args={[0.03, 0.03, 0.005]} />
          <Mat color="#333333" />
        </mesh>
      ))}
      {/* REWIND label */}
      <Text position={[0, 0.38, 0.24]} fontSize={0.035} color="#cc9900" anchorX="center" anchorY="middle" font={undefined}>
        REWIND
      </Text>

      {/* A couple of VHS tapes next to VCR */}
      <mesh position={[0.4, 0.26, 0.05]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.12, 0.02, 0.19]} /><Mat color="#1a3a6a" /></mesh>
      <mesh position={[0.4, 0.28, 0.05]} rotation={[0, -0.1, 0]}><boxGeometry args={[0.12, 0.02, 0.19]} /><Mat color="#6a1a2a" /></mesh>
    </group>
  );
}

/** Couch facing the TV — 2 cushions, back, armrests */
function Couch() {
  return (
    <group position={[0, 0, 0.3]}>
      {/* Couch base/frame */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.8, 0.15, 0.7]} /><Mat color="#5a3a22" /></mesh>
      {/* Left cushion */}
      <mesh position={[-0.42, 0.35, 0.02]}><boxGeometry args={[0.8, 0.15, 0.6]} /><Mat color="#8B5E3C" /></mesh>
      {/* Right cushion */}
      <mesh position={[0.42, 0.35, 0.02]}><boxGeometry args={[0.8, 0.15, 0.6]} /><Mat color="#8B5E3C" /></mesh>
      {/* Back rest */}
      <mesh position={[0, 0.6, -0.28]}><boxGeometry args={[1.8, 0.45, 0.15]} /><Mat color="#7A4E2E" /></mesh>
      {/* Left armrest */}
      <mesh position={[-0.88, 0.45, 0]}><boxGeometry args={[0.15, 0.35, 0.7]} /><Mat color="#7A4E2E" /></mesh>
      {/* Right armrest */}
      <mesh position={[0.88, 0.45, 0]}><boxGeometry args={[0.15, 0.35, 0.7]} /><Mat color="#7A4E2E" /></mesh>
      {/* Throw pillow */}
      <mesh position={[-0.55, 0.48, 0.05]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.25, 0.25, 0.08]} />
        <Mat color="#cc8833" />
      </mesh>
    </group>
  );
}

/** Coffee table between couch and TV */
function CoffeeTable() {
  return (
    <group position={[0, 0, -0.6]}>
      {/* Table top */}
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.0, 0.05, 0.5]} /><Mat color={BASEBOARD_COLOR} /></mesh>
      {/* Legs */}
      {[[-0.42, -0.18], [-0.42, 0.18], [0.42, -0.18], [0.42, 0.18]].map(([lx, lz], i) => (
        <mesh key={`ctleg-${i}`} position={[lx, 0.2, lz]}><boxGeometry args={[0.04, 0.4, 0.04]} /><Mat color="#4A2E14" /></mesh>
      ))}
      {/* Magazine on table */}
      <mesh position={[-0.15, 0.44, 0.05]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.2, 0.01, 0.28]} /><meshBasicMaterial color="#cc4444" /></mesh>
      {/* Remote control */}
      <mesh position={[0.2, 0.44, -0.05]}><boxGeometry args={[0.05, 0.015, 0.15]} /><Mat color="#222222" /></mesh>
    </group>
  );
}

/** Trophy shelf — empty, will be populated with game rewards later */
function TrophyShelf() {
  return (
    <group position={[-APT_W / 2 + 0.15, 1.5, 0]} userData={{ interactType: "apartment_trophies", label: "Your Collection" }}>
      {/* Wall-mount back board — wood paneling vibe */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.0, 1.2, 0.06]} />
        <Mat color="#6B4226" />
      </mesh>
      {/* Three shelves */}
      {[-0.35, 0, 0.35].map((dy, i) => (
        <mesh key={`tshelf-${i}`} position={[0.04, dy, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.8, 0.04, 0.2]} />
          <Mat color="#7A5A30" />
        </mesh>
      ))}
      {/* Small brass label */}
      <mesh position={[0.04, -0.55, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.5]} />
        <meshBasicMaterial color="#b8960a" />
      </mesh>
      <Text position={[0.06, -0.55, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.04} color="#1a1a0a" anchorX="center" anchorY="middle" font={undefined}>
        TROPHIES & COLLECTIBLES
      </Text>
    </group>
  );
}

/** Kitchen corner — counter, sink, fridge */
function KitchenArea() {
  return (
    <group position={[-APT_W / 2 + 0.8, 0, -APT_D / 2 + 0.5]}>
      {/* Counter — L-shape along back-left corner */}
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[1.4, 0.05, 0.55]} /><Mat color="#8B7355" /></mesh>
      {/* Cabinet base */}
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[1.4, 0.82, 0.5]} /><Mat color="#5C3A1E" /></mesh>
      {/* Cabinet door lines */}
      <mesh position={[-0.35, 0.42, 0.26]}><planeGeometry args={[0.6, 0.7]} /><Mat color="#4A2E14" /></mesh>
      <mesh position={[0.35, 0.42, 0.26]}><planeGeometry args={[0.6, 0.7]} /><Mat color="#4A2E14" /></mesh>
      {/* Cabinet knobs */}
      <mesh position={[-0.08, 0.42, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#b8960a" /></mesh>
      <mesh position={[0.62, 0.42, 0.27]}><sphereGeometry args={[0.02, 6, 6]} /><meshBasicMaterial color="#b8960a" /></mesh>

      {/* Sink basin */}
      <mesh position={[0.2, 0.84, 0]}><boxGeometry args={[0.4, 0.08, 0.3]} /><meshBasicMaterial color="#c0c0c0" /></mesh>
      <mesh position={[0.2, 0.82, 0]}><boxGeometry args={[0.3, 0.06, 0.22]} /><meshBasicMaterial color="#a0a0a0" /></mesh>
      {/* Faucet */}
      <mesh position={[0.2, 0.95, -0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 6]} />
        <Mat color="#c0c0c0" />
      </mesh>
      <mesh position={[0.2, 1.02, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
        <Mat color="#c0c0c0" />
      </mesh>

      {/* Fridge — taller, to the left */}
      <mesh position={[-1.0, 0.95, 0]}><boxGeometry args={[0.7, 1.9, 0.6]} /><Mat color="#e0ddd8" /></mesh>
      {/* Fridge handle */}
      <mesh position={[-0.72, 1.2, 0.31]}><boxGeometry args={[0.03, 0.5, 0.03]} /><Mat color="#aaaaaa" /></mesh>
      {/* Freezer door line */}
      <mesh position={[-1.0, 1.55, 0.305]}><planeGeometry args={[0.65, 0.02]} /><meshBasicMaterial color="#cccccc" /></mesh>
      {/* Fridge magnets */}
      <mesh position={[-0.85, 1.35, 0.305]}><boxGeometry args={[0.06, 0.06, 0.01]} /><meshBasicMaterial color="#ff4444" /></mesh>
      <mesh position={[-1.1, 1.45, 0.305]}><boxGeometry args={[0.05, 0.05, 0.01]} /><meshBasicMaterial color="#44aa44" /></mesh>

      {/* Upper cabinet */}
      <mesh position={[0, 1.8, -0.05]}><boxGeometry args={[1.2, 0.6, 0.35]} /><Mat color="#5C3A1E" /></mesh>
      <mesh position={[0, 1.8, 0.13]}><planeGeometry args={[1.1, 0.5]} /><Mat color="#4A2E14" /></mesh>
    </group>
  );
}

/** Door/entrance from exterior stairs on right side */
function ApartmentDoor() {
  const halfW = APT_W / 2;
  return (
    <group position={[halfW - 0.02, 0, 1.15]} rotation={[0, -Math.PI / 2, 0]}
           userData={{ interactType: "apartment_exit", label: "Head Back to the Store" }}>
      {/* Door frame */}
      <mesh position={[-0.48, 1.05, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0.48, 1.05, 0]}><boxGeometry args={[0.06, 2.1, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      <mesh position={[0, 2.12, 0]}><boxGeometry args={[1.02, 0.06, 0.1]} /><Mat color={TRIM_COLOR} /></mesh>
      {/* Door panel */}
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.85, 2.0, 0.05]} /><Mat color="#4a3020" /></mesh>
      {/* Door knob */}
      <mesh position={[0.3, 1.0, 0.04]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#b8960a" /></mesh>
      {/* Peephole */}
      <mesh position={[0, 1.55, 0.03]}><sphereGeometry args={[0.015, 6, 6]} /><meshBasicMaterial color="#333333" /></mesh>
      {/* Welcome mat (inside) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0.4]}>
        <planeGeometry args={[0.7, 0.4]} />
        <Mat color="#5a4a30" />
      </mesh>
    </group>
  );
}

/** Exterior stairs on the right side of the laundromat leading up to apartment */
function ExteriorStairs() {
  const stairCount = 10;
  const stairW = 1.0;
  const stairH = APT_Y / stairCount;
  const stairD = 0.35;
  return (
    <group position={[APT_W / 2 + 0.6, 0, 1.2]}>
      {/* Stair steps */}
      {Array.from({ length: stairCount }).map((_, i) => (
        <mesh key={`stair-${i}`} position={[0, stairH * i + stairH / 2, -stairD * i]}>
          <boxGeometry args={[stairW, stairH, stairD]} />
          <Mat color="#666666" />
        </mesh>
      ))}
      {/* Railing — left side */}
      <group>
        {/* Bottom post */}
        <mesh position={[-stairW / 2 - 0.05, 0.5, 0.1]}>
          <boxGeometry args={[0.05, 1.0, 0.05]} />
          <Mat color="#555555" />
        </mesh>
        {/* Top post */}
        <mesh position={[-stairW / 2 - 0.05, APT_Y - 0.4, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.0, 0.05]} />
          <Mat color="#555555" />
        </mesh>
        {/* Rail bar (angled) */}
        <mesh position={[-stairW / 2 - 0.05, APT_Y / 2 + 0.3, -stairD * (stairCount / 2)]}
              rotation={[Math.atan2(APT_Y, stairD * stairCount), 0, 0]}>
          <boxGeometry args={[0.04, Math.sqrt(APT_Y * APT_Y + (stairD * stairCount) * (stairD * stairCount)), 0.04]} />
          <Mat color="#555555" />
        </mesh>
      </group>
      {/* Railing — right side */}
      <group>
        <mesh position={[stairW / 2 + 0.05, 0.5, 0.1]}>
          <boxGeometry args={[0.05, 1.0, 0.05]} />
          <Mat color="#555555" />
        </mesh>
        <mesh position={[stairW / 2 + 0.05, APT_Y - 0.4, -stairD * (stairCount - 1)]}>
          <boxGeometry args={[0.05, 1.0, 0.05]} />
          <Mat color="#555555" />
        </mesh>
        <mesh position={[stairW / 2 + 0.05, APT_Y / 2 + 0.3, -stairD * (stairCount / 2)]}
              rotation={[Math.atan2(APT_Y, stairD * stairCount), 0, 0]}>
          <boxGeometry args={[0.04, Math.sqrt(APT_Y * APT_Y + (stairD * stairCount) * (stairD * stairCount)), 0.04]} />
          <Mat color="#555555" />
        </mesh>
      </group>
      {/* Landing platform at top */}
      <mesh position={[0, APT_Y - 0.05, -stairD * stairCount - 0.3]}>
        <boxGeometry args={[stairW + 0.3, 0.1, 0.8]} />
        <Mat color="#555555" />
      </mesh>
    </group>
  );
}

/** Small area rug under the coffee table */
function AreaRug() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, -0.2]}>
        <planeGeometry args={[2.2, 1.6]} />
        <Mat color="#6B3A3A" />
      </mesh>
      {/* Rug border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, -0.2]}>
        <planeGeometry args={[2.4, 1.8]} />
        <Mat color="#8B5A3A" />
      </mesh>
    </group>
  );
}

/** Wall clock above the TV */
function WallClock() {
  return (
    <group position={[0, 2.2, -APT_D / 2 + 0.05]}>
      <mesh><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#f0e8d0" /></mesh>
      <mesh position={[0, 0, 0.005]}><ringGeometry args={[0.16, 0.19, 16]} /><Mat color="#4a3020" /></mesh>
      {/* Hour hand */}
      <mesh position={[0, 0.04, 0.01]}><boxGeometry args={[0.015, 0.09, 0.005]} /><meshBasicMaterial color="#222222" /></mesh>
      {/* Minute hand */}
      <mesh position={[0.03, 0, 0.01]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.01, 0.12, 0.005]} /><meshBasicMaterial color="#222222" /></mesh>
    </group>
  );
}

/** Small poster/art on left wall */
function WallArt() {
  return (
    <group position={[-APT_W / 2 + 0.04, 1.6, -1.2]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      <mesh><boxGeometry args={[0.6, 0.45, 0.03]} /><Mat color="#3a2a1a" /></mesh>
      {/* "Poster" */}
      <mesh position={[0, 0, 0.02]}><planeGeometry args={[0.5, 0.35]} /><meshBasicMaterial color="#1a2a4a" /></mesh>
      <Text position={[0, 0, 0.025]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        BE KIND{"\n"}REWIND
      </Text>
    </group>
  );
}

// ── Main Apartment Component ──
export function Apartment() {
  return (
    <group position={[APT_X, APT_Y, APT_Z]}>
      {/* Warm ambient + point light */}
      <ambientLight intensity={0.3} color="#fff0d0" />
      <pointLight position={[0, APT_H - 0.3, 0]} intensity={0.8} distance={10} color="#ffe8c0" />
      {/* Secondary fill light near kitchen */}
      <pointLight position={[-2, 2, -1.5]} intensity={0.3} distance={5} color="#ffd8a0" />

      {/* Structure */}
      <ApartmentFloor />
      <ApartmentWalls />
      <ApartmentCeiling />
      <ApartmentWindow />
      <ApartmentDoor />

      {/* Furniture */}
      <TVArea />
      <Couch />
      <CoffeeTable />
      <AreaRug />
      <TrophyShelf />
      <KitchenArea />

      {/* Decor */}
      <WallClock />
      <WallArt />

      {/* Exterior stairs */}
      <ExteriorStairs />

      {/* Exterior wall (visible from outside — the apartment "box") */}
      <mesh position={[0, APT_H / 2, -APT_D / 2 - 0.05]}>
        <boxGeometry args={[APT_W + 0.1, APT_H, 0.1]} />
        <Mat color="#8B7355" />
      </mesh>
      <mesh position={[0, APT_H / 2, APT_D / 2 + 0.05]}>
        <boxGeometry args={[APT_W + 0.1, APT_H, 0.1]} />
        <Mat color="#8B7355" />
      </mesh>
      <mesh position={[-APT_W / 2 - 0.05, APT_H / 2, 0]}>
        <boxGeometry args={[0.1, APT_H, APT_D + 0.1]} />
        <Mat color="#8B7355" />
      </mesh>
      <mesh position={[APT_W / 2 + 0.05, APT_H / 2, 0]}>
        <boxGeometry args={[0.1, APT_H, APT_D + 0.1]} />
        <Mat color="#8B7355" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, APT_H + 0.05, 0]}>
        <boxGeometry args={[APT_W + 0.3, 0.1, APT_D + 0.3]} />
        <Mat color="#4a4a4a" />
      </mesh>
    </group>
  );
}
