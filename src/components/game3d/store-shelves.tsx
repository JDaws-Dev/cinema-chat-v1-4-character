"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { LayoutInteraction } from "@/lib/store-layout";
import { getObjectById } from "@/lib/store-layout";
import { ROOM_D, ROOM_W, SHELF_COLOR, SHELF_ROWS } from "./store-constants";
import { Mat, PosterBox, usePosterUrls, getOrCreatePosterTexture, toonGradientTexture } from "./store-materials";
import { InstancedVHSBoxes as InstancedVHSBoxesNew, SharedVHSBox, type VHSInstanceConfig } from "./InstancedVHSBoxes";
import { getWoodTexture } from "./procedural-textures";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// ── Shared shelf plank geometries & materials ──────────────────────
// Reused across all ShelfUnit / WallShelf / NewReleasesWall instances
// so the GPU stores each shape once instead of per-plank.

// Bevelled, not boxy.
//
// Every fixture in the store was a hard-edged BoxGeometry, which is the single
// biggest reason the place read as blocky: a sharp 90° edge between two faces
// at similar angles produces almost no value change, so boxes flatten into
// silhouettes. A small bevel gives each edge a narrow band angled differently
// from both faces, which catches a highlight and draws the corner. It costs a
// handful of triangles and does more for "this is a real fixture" than any
// amount of light tuning.
//
// Radius must stay under half the smallest dimension or the geometry inverts —
// these boards are only 0.04 thick, hence 0.012.

/** ShelfUnit horizontal boards (gondola planks) — 2.76 x 0.04 x 0.35 */
const sharedPlankGeometry = new RoundedBoxGeometry(2.76, 0.04, 0.35, 1, 0.012);
/** ShelfUnit top cap — 2.85 x 0.04 x 0.38 */
const sharedTopCapGeometry = new RoundedBoxGeometry(2.85, 0.04, 0.38, 1, 0.014);

/** NewReleasesWall shelf boards — 7.8 x 0.04 x 0.32 */
const sharedNRBoardGeometry = new RoundedBoxGeometry(7.8, 0.04, 0.32, 1, 0.012);

/** Front price rail — the lip along the leading edge of each shelf board.
    Real retail gondolas have one; it also breaks the flat board silhouette. */
const sharedRailGeometry = new RoundedBoxGeometry(2.76, 0.045, 0.022, 1, 0.009);

/** End post — vertical trim at each end of the unit, proud of the shelf depth
    so the gondola has a visible frame instead of a flush slab edge. */
const sharedEndPostGeometry = new RoundedBoxGeometry(0.07, 1.56, 0.43, 1, 0.022);

/** Gondola-top genre sign: gold bezel + navy face raised proud of it. Same
    construction as the hanging aisle signs, so all signage in the store reads
    as one system of physical objects rather than a mix of panels and decals. */
const sharedGenreBezelGeometry = new RoundedBoxGeometry(1.24, 0.19, 0.045, 1, 0.013);
const sharedGenreFaceGeometry = new RoundedBoxGeometry(1.18, 0.135, 0.065, 1, 0.009);

// Shelf boards were the last MeshToonMaterial in the store (toonGradientTexture
// has been a null stub since the PBR conversion, so these were toon-shaded with
// no gradient — i.e. flat brown slabs that ignored the zone lights entirely).
// Now standard PBR with wood grain, so boards catch the warm falloff and read
// as fixtures. Textures are created lazily: this module is evaluated during SSR
// where there's no document to draw a canvas on.
// The wood map carries its own brown albedo, so color stays white when it's
// present — tinting a brown map with a brown color multiplies to mud. The
// literal colors are kept only as the no-canvas (SSR) fallback.
let _plankMat: THREE.MeshStandardMaterial | null = null;
function getPlankMaterial(): THREE.MeshStandardMaterial {
  if (!_plankMat) {
    const t = getWoodTexture(6, 1);
    _plankMat = new THREE.MeshStandardMaterial({
      color: t ? "#ffffff" : "#6a4226",
      roughness: 0.78,
    });
    if (t) _plankMat.map = t;
  }
  return _plankMat;
}
let _topCapMat: THREE.MeshStandardMaterial | null = null;
function getTopCapMaterial(): THREE.MeshStandardMaterial {
  if (!_topCapMat) {
    const t = getWoodTexture(6, 1);
    _topCapMat = new THREE.MeshStandardMaterial({
      // Slight warm lift so the cap still reads a shade lighter than the boards.
      color: t ? "#c9a877" : "#8a6838",
      roughness: 0.7,
    });
    if (t) _topCapMat.map = t;
  }
  return _topCapMat;
}

export { SHELF_ROWS };

function buildInteractionUserData(
  interaction: LayoutInteraction | undefined,
  fallback: { type: string; label: string; data?: string }
) {
  const resolved = {
    ...fallback,
    ...(interaction ?? {}),
  };
  return {
    interactType: resolved.type,
    label: resolved.label,
    interactData: resolved.data,
  };
}

/** @deprecated Use InstancedVHSBoxes from ./InstancedVHSBoxes.tsx instead */
export function InstancedVHSBoxes({ positions, color }: { positions: [number, number, number][]; color: string }) {
  const instances: VHSInstanceConfig[] = useMemo(
    () => positions.map((p) => ({ position: p })),
    [positions]
  );
  return <InstancedVHSBoxesNew instances={instances} color={color} />;
}

export function ShelfUnit({
  shelfId,
  x,
  z,
  genre,
  color,
  backGenre,
  backColor,
  rotY = 0,
  interaction,
}: {
  shelfId: string;
  x: number;
  z: number;
  genre: string;
  color: string;
  backGenre?: string;
  backColor?: string;
  rotY?: number;
  interaction?: LayoutInteraction;
}) {
  const frontPosters = usePosterUrls(genre, 15, `${shelfId}:front`); // 5 tapes x 3 tiers = 15
  const backPosters = usePosterUrls(backGenre || genre, 15, `${shelfId}:back`);
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");
  const backGenreKey = (backGenre || genre).toLowerCase().replace(/[- ]/g, "");
  const bColor = backColor || color;
  // Front-side interaction (used by raycasts hitting the gondola from -z):
  const frontUserData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: `Browse ${genre}`,
    data: JSON.stringify({ genre: genreKey, shelfId: `${shelfId}:front`, count: 15, label: genre }),
  });
  // Back-side interaction (only when the gondola has a backGenre):
  const backUserData = backGenre ? buildInteractionUserData(undefined, {
    type: "shelf",
    label: `Browse ${backGenre}`,
    data: JSON.stringify({ genre: backGenreKey, shelfId: `${shelfId}:back`, count: 15, label: backGenre }),
  }) : frontUserData;

  const positions = useMemo(() => {
    const result: { x: number; y: number; z: number; side: string; idx: number }[] = [];
    const count = 5; // fewer per tier so the bigger tapes don't crowd
    const spacing = 0.42; // increased to keep gaps after tape grew 0.15 → 0.20 wide
    const startX = -(count - 1) * spacing * 0.5;
    let idx = 0;
    for (const side of ["front", "back"] as const) {
      const z = side === "front" ? -0.16 : 0.16;
      // Tapes sit on shelf boards at y=0.02, 0.50, 1.0; bumped Y centers so the
      // taller (0.34m) tape rests on top of each board instead of clipping it.
      for (const y of [1.21, 0.71, 0.23]) {
        for (let i = 0; i < count; i++) {
          result.push({ x: startX + i * spacing, y, z, side, idx: idx++ });
        }
      }
    }
    return result;
  }, []);

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Gondola shelf — open frame with visible shelf boards, narrower (0.35 deep) */}
      {/* Back panel — split into a front face + back face so raycasts on each
          side of the gondola hit the matching genre (was a single mesh with
          frontUserData on both sides, which made the back side open the front
          genre's browser). */}
      {/* castShadow is on the gondola STRUCTURE only — panels, sides, cap,
          boards. Deliberately not on the ~30 tapes per unit: they'd multiply the
          shadow pass by an order of magnitude for contact shadows nobody can see
          behind a poster. The carcass is what needs to sit on the carpet. */}
      <mesh position={[0, 0.75, -0.02]} userData={frontUserData} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.5, 0.02]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, 0.02]} userData={backUserData} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.5, 0.02]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* ── End posts ──────────────────────────────────────────────────────
          Replaces the flush 0.04 side slabs. These are deeper than the shelf
          (0.43 vs 0.35) and taller than the carcass, so they stand proud at
          both ends — the gondola now has a frame rather than a sheared edge,
          which is most of what stops it reading as an extruded rectangle. */}
      <mesh position={[-1.42, 0.78, 0]} geometry={sharedEndPostGeometry} castShadow receiveShadow>
        <Mat color="#4a2818" roughness={0.78} />
      </mesh>
      <mesh position={[1.42, 0.78, 0]} geometry={sharedEndPostGeometry} castShadow receiveShadow>
        <Mat color="#4a2818" roughness={0.78} />
      </mesh>
      {/* Top cap — shared geometry + material */}
      <mesh position={[0, 1.52, 0]} geometry={sharedTopCapGeometry} material={getTopCapMaterial()} castShadow receiveShadow />
      {/* Genre sign on top — gold bezel with a raised navy face, matching the
          aisle signs and wall runs. These were 0.02-thick decals stuck to the
          air above the cap. */}
      {/* Front side (faces -z in local space) */}
      <mesh position={[0, 1.62, -0.125]} geometry={sharedGenreBezelGeometry} castShadow>
        <Mat color="#ffd700" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.62, -0.125]} geometry={sharedGenreFaceGeometry}>
        <Mat color="#00006e" roughness={0.5} />
      </mesh>
      <Text position={[0, 1.62, -0.163]} rotation={[0, Math.PI, 0]} fontSize={0.065} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{genre}</Text>
      {/* Back side (faces +z in local space) */}
      {backGenre && (
        <>
          <mesh position={[0, 1.62, 0.125]} geometry={sharedGenreBezelGeometry} castShadow>
            <Mat color="#ffd700" roughness={0.45} metalness={0.15} />
          </mesh>
          <mesh position={[0, 1.62, 0.125]} geometry={sharedGenreFaceGeometry}>
            <Mat color="#00006e" roughness={0.5} />
          </mesh>
          <Text position={[0, 1.62, 0.163]} fontSize={0.065} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{backGenre}</Text>
        </>
      )}
      {/* 3 visible shelf boards, each with a price rail on both leading edges.
          Board depth is 0.35 (spans z −0.175..+0.175) and the gondola is
          double-sided, so each board gets a rail front and back. */}
      {[0.02, 0.50, 1.0].map((sy, i) => (
        <React.Fragment key={`board-${i}`}>
          <mesh position={[0, sy, 0]} geometry={sharedPlankGeometry} material={getPlankMaterial()} castShadow receiveShadow />
          <mesh position={[0, sy + 0.03, -0.171]} geometry={sharedRailGeometry} castShadow>
            <Mat color="#3a2010" roughness={0.6} />
          </mesh>
          <mesh position={[0, sy + 0.03, 0.171]} geometry={sharedRailGeometry} castShadow>
            <Mat color="#3a2010" roughness={0.6} />
          </mesh>
        </React.Fragment>
      ))}

      {/* VHS Boxes — PosterBoxes when loaded, solid-color placeholders otherwise so shelves never look bare */}
      {(() => {
        const posterElements: React.ReactNode[] = [];

        positions.forEach((pos) => {
          const isBack = pos.side === "back";
          const sidePosters = isBack ? backPosters : frontPosters;
          const sideColor = isBack ? bColor : color;
          const sideIdx = positions.filter(p => p.side === pos.side).indexOf(pos);
          // Wrap instead of running off the end. Thin genres return fewer than the
          // 15 slots a gondola face has (getCuratedShelfPosterData slices the genre
          // catalog across placements), which used to leave the tail as solid navy
          // blocks — the single ugliest thing in the store. Cycling fills every slot
          // with real art, and stacking multiple copies of a title is what an actual
          // video store looked like. Safe for pickup: PosterBox keys availability off
          // the per-slot slotKey, not movieId, so copies check out independently.
          const poster = sidePosters.length > 0
            ? sidePosters[sideIdx % sidePosters.length]
            : null;
          const flipRot = isBack ? Math.PI : 0;
          if (poster) {
            posterElements.push(
              <PosterBox
                key={`${pos.side}-${pos.idx}`}
                url={poster.url}
                position={[pos.x, pos.y, pos.z]}
                rotation={flipRot}
                movieTitle={poster.title}
                movieId={poster.id}
                genreColor={sideColor}
                slotKey={`${shelfId}:${pos.side}:${sideIdx}`}
              />
            );
          } else {
            posterElements.push(
              <SharedVHSBox
                key={`${pos.side}-${pos.idx}-placeholder`}
                position={[pos.x, pos.y, pos.z]}
                rotation={[0, flipRot, 0]}
                color={sideColor}
              />
            );
          }
        });

        return (
          <>
            {posterElements}
          </>
        );
      })()}

    </group>
  );
}

export function WallShelf({
  shelfId,
  position, rotation, width, genre, color, interaction
}: {
  shelfId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  genre: string;
  color: string;
  interaction?: LayoutInteraction;
}) {
  const posters = usePosterUrls(genre, 20, shelfId);
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");
  const userData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: `Browse ${genre}`,
    data: JSON.stringify({ genre: genreKey, shelfId, count: 20, label: genre }),
  });

  // Wall shelves have 3 tiers, single-sided (face one direction)
  const tapeCount = Math.floor(width / 0.22);

  return (
    <group position={position} rotation={rotation}
      userData={userData}>

      {/* Back panel (against wall) */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[width, 1.8, 0.03]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>

      {/* 3 shelf boards, bevelled, each with a front price rail — same
          treatment as the gondolas. Wall runs are single-sided so they only
          need one rail, on the +z face. */}
      {[0.15, 0.65, 1.15].map((y, i) => (
        <React.Fragment key={`ws-board-${i}`}>
          <RoundedBox args={[width - 0.1, 0.04, 0.2]} radius={0.012} smoothness={2} position={[0, y, 0.1]} castShadow receiveShadow>
            <Mat color="#6a4226" roughness={0.7} />
          </RoundedBox>
          <RoundedBox args={[width - 0.1, 0.045, 0.022]} radius={0.009} smoothness={2} position={[0, y + 0.03, 0.197]} castShadow>
            <Mat color="#3a2010" roughness={0.6} />
          </RoundedBox>
        </React.Fragment>
      ))}

      {/* Genre sign — gold bezel with the navy face raised proud of it, so it
          has an edge that catches light instead of being a flat decal. */}
      <RoundedBox args={[Math.min(width, 2), 0.23, 0.05]} radius={0.014} smoothness={2} position={[0, 1.85, 0.05]} castShadow>
        <Mat color="#ffd700" roughness={0.45} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[Math.min(width, 2) - 0.06, 0.16, 0.07]} radius={0.01} smoothness={2} position={[0, 1.85, 0.05]}>
        <Mat color="#00006e" roughness={0.6} />
      </RoundedBox>
      <Text position={[0, 1.85, 0.09]} fontSize={0.12} color="#ffd700" anchorX="center" font={undefined}>
        {genre}
      </Text>

      {/* VHS tapes on each tier — placeholder box if poster not yet loaded */}
      {[0.32, 0.82, 1.32].map((ty, tier) => {
        const startX = -(tapeCount - 1) * 0.22 * 0.5;
        return Array.from({ length: tapeCount }).map((_, i) => {
          // Wrap, same as the gondolas — a genre whose slice is shorter than
          // the wall run's slot count used to leave the tail as solid blocks.
          const wallIdx = tier * tapeCount + i;
          const poster = posters.length > 0 ? posters[wallIdx % posters.length] : undefined;
          return poster ? (
            <PosterBox key={`wt-${tier}-${i}`}
              url={poster.url}
              position={[startX + i * 0.22, ty, 0.12]}
              movieTitle={poster.title} movieId={poster.id} genreColor={color}
              slotKey={`${shelfId}:tier-${tier}:slot-${i}`} />
          ) : (
            <SharedVHSBox key={`wt-${tier}-${i}-placeholder`}
              position={[startX + i * 0.22, ty, 0.12]}
              color={color} />
          );
        });
      })}
    </group>
  );
}

export function EndcapDisplay({ x, z, rotY, label, vhsColors }: { x: number; z: number; rotY: number; label: string; vhsColors: string[] }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Endcap shelf body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.0, 1.5, 0.4]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top surface */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[1.05, 0.04, 0.45]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.5, 0.4]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>

      {/* Endcap genre label — small sign on front face */}
      <mesh position={[0, 1.42, -0.22]}>
        <boxGeometry args={[0.8, 0.14, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.1} roughness={0.5} />
      </mesh>
      <Text position={[0, 1.42, -0.24]} rotation={[0, Math.PI, 0]} fontSize={0.055} color="#0a1830" anchorX="center" anchorY="middle" font={undefined}>
        {label}
      </Text>

      {/* Face-out VHS boxes — 3 on top shelf, 3 on bottom (shared geometry/material) */}
      {vhsColors.map((color, i) => (
        <group key={`et-${i}`} position={[-0.28 + i * 0.28, 1.1, -0.25]}>
          <SharedVHSBox position={[0, 0, 0]} color={color} />
          {/* White label strip on face */}
          <mesh position={[0, -0.08, -0.051]}>
            <planeGeometry args={[0.14, 0.06]} />
            <meshBasicMaterial color="#e8e8e0" />
          </mesh>
        </group>
      ))}
      {vhsColors.map((color, i) => (
        <group key={`eb-${i}`} position={[-0.28 + i * 0.28, 0.55, -0.25]}>
          <SharedVHSBox position={[0, 0, 0]} color={color} />
          {/* White label strip on face */}
          <mesh position={[0, -0.08, -0.051]}>
            <planeGeometry args={[0.14, 0.06]} />
            <meshBasicMaterial color="#e8e8e0" />
          </mesh>
        </group>
      ))}

    </group>
  );
}

// ── Staff Picks wall shelf (right wall) ──
const STAFF_PICK_MOVIES = [
  { url: "/api/catalog-poster?id=900068&rev=2026-04-02c", title: "Pulp Fiction", id: 900068 },
  { url: "/api/catalog-poster?id=900011&rev=2026-04-02c", title: "The Godfather", id: 900011 },
  { url: "/api/catalog-poster?id=900034&rev=2026-04-02c", title: "The Princess Bride", id: 900034 },
  { url: "/api/catalog-poster?id=900024&rev=2026-04-02c", title: "Ghostbusters", id: 900024 },
];

export function StaffPicksShelf() {
  const pos = getObjectById("staff-picks");
  return (
    <group position={[pos?.x ?? (ROOM_W / 2 - 0.3), pos?.y ?? 1.2, pos?.z ?? -0.1]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Shelf board */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.22]} />
        <Mat color="#5a3a1a" roughness={0.7} />
      </mesh>
      {/* Back panel mounted to wall */}
      <mesh position={[0, 0.25, -0.1]}>
        <boxGeometry args={[1.3, 0.55, 0.03]} />
        <Mat color="#3a2010" roughness={0.85} />
      </mesh>
      {/* "STAFF PICKS" sign */}
      <mesh position={[0, 0.48, -0.08]}>
        <boxGeometry args={[0.9, 0.16, 0.02]} />
        <Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      <Text
        position={[0, 0.48, -0.06]}
        fontSize={0.07}
        color="#0a1830"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        STAFF PICKS
      </Text>
      {/* Movie poster boxes on the shelf — sitting on the shelf board (local y=0 + VHS half-height) */}
      {STAFF_PICK_MOVIES.map((m, i) => {
        const dx = -0.36 + i * 0.24;
        return (
          <PosterBox
            key={`staff-pick-${m.id}`}
            url={m.url}
            position={[dx, 0.15, 0.05]}
            movieTitle={m.title}
          />
        );
      })}
    </group>
  );
}

export function NewReleasesWall({
  shelfId = "new-releases-wall",
  position = [0, 0, -ROOM_D / 2 + 0.17],
  interaction,
}: {
  shelfId?: string;
  position?: [number, number, number];
  interaction?: LayoutInteraction;
}) {
  const posters = usePosterUrls("NEW", 10, shelfId); // fewer unique movies, more copies of each
  const allPosters = posters;
  const userData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: "Browse NEW RELEASES",
    data: JSON.stringify({ genre: "new", shelfId, count: 10, label: "NEW RELEASES" }),
  });

  // Blockbuster style: each movie gets 3-4 copies side by side, then next movie
  // 20 cols x 3 rows = 60 slots. 10 unique movies = ~6 copies each across the wall.
  const positions = useMemo(() => {
    const result: { x: number; y: number; idx: number }[] = [];
    const cols = 20;
    const rows = 3;
    const spacing = 0.24;
    const startX = -(cols - 1) * spacing * 0.5;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ x: startX + col * spacing, y: 1.75 - row * 0.5, idx: idx++ });
      }
    }
    return result;
  }, []);

  return (
    <group position={position} userData={userData}>
      {/* Back panel — thin + pulled forward off the back wall to avoid z-fighting */}
      <mesh position={[0, 1.0, 0.08]}>
        <boxGeometry args={[8, 2.0, 0.04]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[8.2, 0.05, 0.35]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Shelf boards — shared geometry + material */}
      {[1.61, 1.11, 0.61, 0.02].map((y, i) => (
        <mesh key={`shelf-${i}`} position={[0, y, 0.05]} geometry={sharedNRBoardGeometry} material={getPlankMaterial()} />
      ))}
      {/* Shelf bracket supports — metal L-brackets under each shelf */}
      {[1.61, 1.11, 0.61].map((y, i) =>
        [-3.2, -1.6, 0, 1.6, 3.2].map((x, j) => (
          <group key={`bracket-${i}-${j}`} position={[x, y, 0.05]}>
            {/* Vertical part (against wall) */}
            <mesh position={[0, -0.1, -0.12]}>
              <boxGeometry args={[0.04, 0.2, 0.03]} />
              <Mat color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Horizontal part (under shelf) */}
            <mesh position={[0, -0.03, 0]}>
              <boxGeometry args={[0.04, 0.03, 0.28]} />
              <Mat color="#3a3a3a" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
        ))
      )}
      {/* Side panels */}
      <mesh position={[-4, 1.0, 0]}>
        <boxGeometry args={[0.05, 2.0, 0.32]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[4, 1.0, 0]}>
        <boxGeometry args={[0.05, 2.0, 0.32]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>

      {/* BIG "NEW RELEASES" illuminated sign above */}
      <mesh position={[0, 2.6, 0.05]}>
        <boxGeometry args={[6, 0.5, 0.06]} />
        <Mat color="#1a3a6a" roughness={0.5} />
      </mesh>
      <Text position={[0, 2.6, 0.09]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        {"\u2605"} NEW RELEASES {"\u2605"}
      </Text>
      <Text position={[0, 2.6, -0.01]} rotation={[0, Math.PI, 0]} fontSize={0.22} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>
        {"\u2605"} NEW RELEASES {"\u2605"}
      </Text>

      {/* VHS boxes — Blockbuster style: multiple copies of each movie grouped together */}
      {positions.map((pos) => {
        // Group copies: each row has 20 cols, divide into blocks per movie
        const col = pos.idx % 20;
        const row = Math.floor(pos.idx / 20);
        const moviesPerRow = Math.min(allPosters.length, 5); // 5 movies per row max
        const colsPerMovie = moviesPerRow > 0 ? Math.floor(20 / moviesPerRow) : 20;
        const movieIdx = Math.floor(col / colsPerMovie);
        // Each row shows different set of movies
        const posterIdx = (row * moviesPerRow + movieIdx) % (allPosters.length || 1);
        const poster = allPosters.length > 0 ? allPosters[posterIdx] : null;
        return poster ? (
          <PosterBox
            key={pos.idx}
            url={poster.url}
            position={[pos.x, pos.y, 0.15]}
            rotation={Math.PI}
            movieTitle={poster.title}
            movieId={poster.id}
            genreColor="#ec4899"
            slotKey={`${shelfId}:copy-${pos.idx}`}
          />
        ) : (
          <SharedVHSBox key={pos.idx} position={[pos.x, pos.y, 0.15]} color="#ec4899" />
        );
      })}

      {/* Old small sign removed — big illuminated sign is above */}
    </group>
  );
}

export function NewReleaseVHS({ url, position }: { url: string; position: [number, number, number] }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!url) return;
    getOrCreatePosterTexture(url, (t) => {
      if (matRef.current) {
        matRef.current.map = t;
        matRef.current.color.set("#ffffff");
        matRef.current.needsUpdate = true;
      }
    });
  }, [url]);

  return (
    <group position={position}>
      {/* VHS box */}
      <mesh>
        <boxGeometry args={[0.15, 0.26, 0.025]} />
        <meshBasicMaterial color="#1a1a2a" />
      </mesh>
      {/* Cover art facing into the room (+z) */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[0.14, 0.25]} />
        <meshBasicMaterial ref={matRef} color="#333" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
