"use client";

import React from "react";
import { Text } from "@react-three/drei";
import { Mat } from "../store-materials";
import { ROOM_H } from "../store-constants";

/**
 * BuildingShell — Continuous exterior envelope wrapping all three stores.
 *
 * Provides: back wall, back alley ground, service doors, roof cap, and
 * fills any gaps between tenant spaces. This makes the strip mall a REAL
 * BUILDING with four sides, not three open-backed boxes.
 *
 * World coordinates:
 *   Building front (storefront): z = +7
 *   Building back wall:          z = -7
 *   Pizza Palace left wall:      x = -16
 *   Stair enclosure right wall:  x = +17.4
 *   Ground: y = 0
 *   Commercial ceiling: y = 3.5
 *   Apartment roof: y = 6.5
 */

const BACK_WALL_Z = -7;       // Back wall position (shared with video store)
const FRONT_Z = 7;             // Storefront line
const LEFT_X = -16;            // Pizza Palace left wall
const RIGHT_X = 16;            // Laundromat right wall (stairwell extends beyond)
const CEIL_H = ROOM_H;         // 3.5m commercial ceiling
const WALL_T = 0.3;            // Exterior wall thickness
const BRICK = "#A0826A";       // Brick color (matches BuildingExterior)
const ROOF_COLOR = "#3a3a3a";
const CONCRETE = "#4a4a4a";
const ASPHALT = "#1a1a22";
const DOOR_COLOR = "#5a5a5a";  // Service door (metal gray)
const ALLEY_DEPTH = 5;         // Back alley depth
const BACK_FACE_Z = BACK_WALL_Z - WALL_T - 0.08;

function AlleyDumpster({
  x,
  color,
  label,
}: {
  x: number;
  color: string;
  label: string;
}) {
  return (
    <group position={[x, 0, BACK_WALL_Z - 1.85]}>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.45, 0.95, 0.82]} />
        <Mat color={color} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.0, -0.06]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[1.55, 0.1, 0.9]} />
        <Mat color="#202826" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.2, 0.46]}>
        <boxGeometry args={[1.25, 0.18, 0.05]} />
        <Mat color="#151515" roughness={0.7} />
      </mesh>
      <Text position={[0, 0.58, 0.47]} fontSize={0.12} color="#d8e6d8" anchorX="center" anchorY="middle" font={undefined}>
        {label}
      </Text>
    </group>
  );
}

function PalletStack({ x, z, count = 3 }: { x: number; z: number; count?: number }) {
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: count }).map((_, index) => (
        <group key={`pallet-${index}`} position={[0, index * 0.11, 0]}>
          {[-0.32, 0, 0.32].map((px) => (
            <mesh key={`slat-${index}-${px}`} position={[px, 0.04, 0]}>
              <boxGeometry args={[0.16, 0.06, 0.88]} />
              <Mat color="#6b4a2f" roughness={0.9} />
            </mesh>
          ))}
          {[-0.26, 0.26].map((pz) => (
            <mesh key={`runner-${index}-${pz}`} position={[0, 0.01, pz]}>
              <boxGeometry args={[0.88, 0.05, 0.1]} />
              <Mat color="#4a2f1d" roughness={0.94} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function WallVent({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.78, 0.38, 0.05]} />
        <Mat color="#34383d" roughness={0.5} metalness={0.35} />
      </mesh>
      {[-0.22, 0, 0.22].map((dy) => (
        <mesh key={`vent-slat-${dy}`} position={[0, dy, 0.035]}>
          <boxGeometry args={[0.62, 0.035, 0.025]} />
          <Mat color="#9aa0a8" roughness={0.32} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function BuildingShell() {
  const buildingWidth = RIGHT_X - LEFT_X;  // 32m
  const buildingDepth = FRONT_Z - BACK_WALL_Z;  // 14m

  return (
    <group>
      {/* ══════════════════════════════════════════════════════════
          1. CONTINUOUS BACK WALL — closes the entire back of the building
          Spans from Pizza Palace left edge to Laundromat right edge
          ══════════════════════════════════════════════════════════ */}

      {/* Back wall — full width, ground to ceiling.
          Front face pulled back 5cm so it doesn't z-fight with the store's
          interior back wall (PlaneGeometry at z=BACK_WALL_Z in MergedArchitecture). */}
      <mesh position={[(LEFT_X + RIGHT_X) / 2, CEIL_H / 2, BACK_WALL_Z - WALL_T / 2 - 0.05]}>
        <boxGeometry args={[buildingWidth + WALL_T, CEIL_H, WALL_T]} />
        <Mat color={BRICK} roughness={0.9} />
      </mesh>

      {/* Back wall — interior face (visible from inside stores looking back) */}
      {/* Video store back wall is already in store-architecture.tsx MergedArchitecture */}
      {/* Pizza Palace back wall interior */}
      <mesh position={[-13, CEIL_H / 2, BACK_WALL_Z + 0.01]}>
        <planeGeometry args={[6, CEIL_H]} />
        <Mat color="#4a3030" roughness={0.85} />
      </mesh>
      {/* Laundromat back wall interior */}
      <mesh position={[13, CEIL_H / 2, BACK_WALL_Z + 0.01]}>
        <planeGeometry args={[6, CEIL_H]} />
        <Mat color="#3a4a5a" roughness={0.85} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          2. ROOF CAP — flat commercial roof, SPLIT to avoid covering apartment section
          Left section: Pizza Palace + Video Store (x=-16 to x=10)
          Apartment section (x=10 to x=16) has its own roof from BuildingExterior
          ══════════════════════════════════════════════════════════ */}
      {/* Left roof: Pizza Palace + Video Store */}
      <mesh position={[(LEFT_X + 10) / 2, CEIL_H, (FRONT_Z + BACK_WALL_Z) / 2]}>
        <boxGeometry args={[10 - LEFT_X + WALL_T, 0.15, buildingDepth + WALL_T]} />
        <Mat color={ROOF_COLOR} roughness={0.95} />
      </mesh>

      {/* Removed: 2ND FLOOR FACADE INFILL.
          The apartment's BuildingFacade front wall is already flush with the
          storefront at z=7.0 (APT_Z + halfD + WALL_T = 4.3 + 2.5 + 0.2). The
          0.4m-thick brick infill at z=7.2 sat directly in front of that wall
          and obscured the apartment windows entirely. */}

      {/* ══════════════════════════════════════════════════════════
          3. SERVICE DOORS — one per tenant on the back wall
          Metal fire doors for deliveries and emergency exit
          ══════════════════════════════════════════════════════════ */}

      {/* Pizza Palace service door */}
      <group position={[-13, 0, BACK_FACE_Z]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Door frame */}
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Push bar */}
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Video Store service door */}
      <group position={[0, 0, BACK_FACE_Z]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Laundromat service door */}
      <group position={[13, 0, BACK_FACE_Z]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 1.07, 0]}>
          <boxGeometry args={[1.0, 2.13, 0.06]} />
          <Mat color={DOOR_COLOR} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0.53, 1.07, 0]}>
          <boxGeometry args={[0.06, 2.2, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.12, 0.06, 0.08]} />
          <Mat color="#444" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0.04]}>
          <boxGeometry args={[0.7, 0.04, 0.04]} />
          <Mat color="#888" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════
          4. BACK ALLEY — service road behind the building
          ══════════════════════════════════════════════════════════ */}

      {/* Alley ground (asphalt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, BACK_WALL_Z - ALLEY_DEPTH / 2]}>
        <planeGeometry args={[buildingWidth + 6, ALLEY_DEPTH]} />
        <Mat color={ASPHALT} roughness={0.95} />
      </mesh>

      {/* Alley curb against building */}
      <mesh position={[0, 0.05, BACK_WALL_Z - 0.4]}>
        <boxGeometry args={[buildingWidth + 2, 0.1, 0.2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>

      {/* Painted safety stripe breaks up the rear wall and gives the service
          doors a readable scale from the alley cameras. */}
      <mesh position={[0, 1.95, BACK_FACE_Z - 0.035]}>
        <boxGeometry args={[buildingWidth - 1.2, 0.08, 0.035]} />
        <meshBasicMaterial color="#c69b34" />
      </mesh>
      {[-13, 0, 13].map((x) => (
        <group key={`tenant-rear-label-${x}`} position={[x, 2.45, BACK_FACE_Z - 0.055]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[1.55, 0.34, 0.04]} />
            <Mat color="#1f252b" roughness={0.68} />
          </mesh>
          <Text position={[0, 0, 0.03]} fontSize={0.09} color="#e8d28a" anchorX="center" anchorY="middle" font={undefined}>
            {x < 0 ? "VACANT" : x > 0 ? "LAUNDROMAT" : "VIDEO STORE"}
          </Text>
        </group>
      ))}

      {/* Back fence / wall (across from building) */}
      <mesh position={[0, 1.2, BACK_WALL_Z - ALLEY_DEPTH]}>
        <boxGeometry args={[buildingWidth + 6, 2.4, 0.15]} />
        <Mat color="#3a3020" roughness={0.9} />
      </mesh>

      {/* Dumpster pads (concrete) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, -0.02, BACK_WALL_Z - 2]}>
        <planeGeometry args={[3, 2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.02, BACK_WALL_Z - 2]}>
        <planeGeometry args={[3, 2]} />
        <Mat color={CONCRETE} roughness={0.9} />
      </mesh>
      <AlleyDumpster x={-14} color="#284631" label="TRASH" />
      <AlleyDumpster x={14} color="#26394c" label="RECYCLE" />
      <PalletStack x={-10.8} z={BACK_WALL_Z - 1.65} count={4} />
      <PalletStack x={10.8} z={BACK_WALL_Z - 1.55} count={3} />
      <mesh position={[-5.8, 0.25, BACK_WALL_Z - 1.05]}>
        <sphereGeometry args={[0.24, 10, 8]} />
        <Mat color="#191b1f" roughness={0.85} />
      </mesh>
      <mesh position={[-5.45, 0.2, BACK_WALL_Z - 1.18]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <Mat color="#24262b" roughness={0.88} />
      </mesh>

      {/* Utility meters (on back wall, between doors) */}
      {[-7, 7].map((x, i) => (
        <group key={`meter-${i}`} position={[x, 1.2, BACK_FACE_Z - 0.06]}>
          <mesh><boxGeometry args={[0.3, 0.4, 0.15]} /><Mat color="#666" roughness={0.4} metalness={0.4} /></mesh>
          <mesh position={[0, -0.05, 0.08]}>
            <circleGeometry args={[0.06, 8]} />
            <Mat color="#ddd" roughness={0.3} metalness={0.3} />
          </mesh>
        </group>
      ))}
      <WallVent x={-3.7} y={2.6} z={BACK_FACE_Z - 0.055} />
      <WallVent x={3.7} y={2.6} z={BACK_FACE_Z - 0.055} />
      {[-15.5, -8.5, 8.5, 15.5].map((x) => (
        <mesh key={`downspout-${x}`} position={[x, 1.45, BACK_FACE_Z - 0.06]}>
          <boxGeometry args={[0.06, 2.3, 0.05]} />
          <Mat color="#34383a" roughness={0.45} metalness={0.35} />
        </mesh>
      ))}

      {/* Security light above video store service door */}
      <mesh position={[0, 2.8, BACK_FACE_Z - 0.08]}>
        <boxGeometry args={[0.2, 0.1, 0.15]} />
        <meshBasicMaterial color="#ffeecc" />
      </mesh>
      <pointLight position={[0, 2.5, BACK_WALL_Z - 1.5]} intensity={0.6} distance={8} color="#ffe0a0" />

      {/* ══════════════════════════════════════════════════════════
          5. SHARED TENANT WALLS — close gaps between stores
          (Video store already has left/right walls in MergedArchitecture,
           but the adjacent store sides need their interior walls too)
          ══════════════════════════════════════════════════════════ */}

      {/* Removed: shared interior walls at x=±10.
          MergedArchitecture renders the video store's blue walls at x=±10, and
          PizzaPalace/Laundromat each render their own interior walls. The shared
          walls here were redundant and (a) misoriented as horizontal slabs through
          z=0 originally, (b) painted brown over the store's blue walls when fixed
          with DoubleSide. Cleaner to drop them entirely. */}

      {/* Exterior side faces — without these, side security cameras see
          exposed single-sided interior wall planes and the strip mall reads
          like a stage set. */}
      <mesh position={[RIGHT_X + 0.04, CEIL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[buildingDepth, CEIL_H]} />
        <Mat color="#6d5a48" roughness={0.92} />
      </mesh>
      <mesh position={[LEFT_X - 0.04, CEIL_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[buildingDepth, CEIL_H]} />
        <Mat color="#4a342b" roughness={0.94} />
      </mesh>
      {[-4.5, 0, 4.5].map((z) => (
        <group key={`right-side-detail-${z}`} position={[RIGHT_X + 0.08, 1.75, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.45, 0.05]} />
            <Mat color="#252a30" roughness={0.64} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.78, 0.08, 0.025]} />
            <Mat color="#8b929a" roughness={0.36} metalness={0.45} />
          </mesh>
        </group>
      ))}
      <group position={[RIGHT_X + 0.08, 1.1, 3.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 1.75, 0.05]} />
          <Mat color="#4a4f56" roughness={0.68} metalness={0.25} />
        </mesh>
        <Text position={[0, 0.55, 0.035]} fontSize={0.1} color="#d8e5ef" anchorX="center" anchorY="middle" font={undefined}>
          EMPLOYEES
        </Text>
        <mesh position={[0.36, -0.1, 0.04]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <Mat color="#b8a24a" roughness={0.28} metalness={0.55} />
        </mesh>
      </group>
      <group position={[LEFT_X - 0.08, 1.85, 1.8]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.7, 0.05]} />
          <Mat color="#f1ead4" roughness={0.72} />
        </mesh>
        <Text position={[0, 0.12, 0.035]} fontSize={0.16} color="#8a1010" anchorX="center" anchorY="middle" font={undefined}>
          FOR LEASE
        </Text>
        <Text position={[0, -0.16, 0.035]} fontSize={0.07} color="#3a2010" anchorX="center" anchorY="middle" font={undefined}>
          SIDE ACCESS
        </Text>
      </group>

      {/* ══════════════════════════════════════════════════════════
          6. PIZZA-PALACE-SLOT FOR LEASE PLACEHOLDER
          The Pizza Palace was removed; this fills the visual gap on the
          left side of the strip mall with a boarded-up storefront and a
          "FOR LEASE" sign so the absence reads as intentional.
          ══════════════════════════════════════════════════════════ */}

      {/* Boarded-up front wall — covers x=[-16, -10] at the storefront line */}
      <mesh position={[-13, ROOM_H / 2, FRONT_Z - 0.05]}>
        <boxGeometry args={[6, ROOM_H, 0.12]} />
        <Mat color="#3a2820" roughness={0.95} />
      </mesh>
      {/* Horizontal plywood slats for that boarded-up look */}
      {[0.6, 1.4, 2.2, 3.0].map((y, i) => (
        <mesh key={`board-${i}`} position={[-13, y, FRONT_Z + 0.01]}>
          <boxGeometry args={[6.2, 0.08, 0.04]} />
          <Mat color="#2a1810" roughness={0.95} />
        </mesh>
      ))}
      {/* FOR LEASE placard */}
      <group position={[-13, 1.8, FRONT_Z + 0.05]}>
        <mesh>
          <boxGeometry args={[2.4, 1.2, 0.04]} />
          <Mat color="#f1ead4" roughness={0.7} />
        </mesh>
        <Text position={[0, 0.28, 0.025]} fontSize={0.32} color="#8a1010" anchorX="center" anchorY="middle" font={undefined}>
          FOR LEASE
        </Text>
        <Text position={[0, -0.05, 0.025]} fontSize={0.1} color="#3a2010" anchorX="center" anchorY="middle" font={undefined}>
          GREAT LOCATION
        </Text>
        <Text position={[0, -0.2, 0.025]} fontSize={0.08} color="#3a2010" anchorX="center" anchorY="middle" font={undefined}>
          ASK INSIDE FOR DETAILS
        </Text>
        <Text position={[0, -0.42, 0.025]} fontSize={0.07} color="#5a3020" anchorX="center" anchorY="middle" font={undefined}>
          (555) 867-5309
        </Text>
      </group>
      {/* Awning above the entrance — empty hooks where signage used to be */}
      <mesh position={[-13, ROOM_H - 0.25, FRONT_Z + 0.15]}>
        <boxGeometry args={[6.2, 0.5, 0.4]} />
        <Mat color="#1a1818" roughness={0.85} />
      </mesh>
    </group>
  );
}
