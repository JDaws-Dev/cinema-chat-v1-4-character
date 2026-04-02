"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { LayoutInteraction } from "@/lib/store-layout";
import { getObjectById } from "@/lib/store-layout";
import { ROOM_D, ROOM_W, SHELF_COLOR, SHELF_ROWS } from "./store-constants";
import { Mat, toonGradientTexture, PosterBox, usePosterUrls, getOrCreatePosterTexture } from "./store-materials";

export { SHELF_ROWS };

function buildInteractionUserData(
  interaction: LayoutInteraction | undefined,
  fallback: { type: string; label: string; data?: string }
) {
  const resolved = interaction ?? fallback;
  return {
    interactType: resolved.type,
    label: resolved.label,
    interactData: resolved.data,
  };
}

/** Instanced fallback VHS boxes — one draw call for all solid-colored boxes on a side */
export function InstancedVHSBoxes({ positions, color }: { positions: [number, number, number][]; color: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    if (!meshRef.current || positions.length === 0) return;
    positions.forEach((pos, i) => {
      tempMatrix.setPosition(pos[0], pos[1], pos[2]);
      meshRef.current!.setMatrixAt(i, tempMatrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, tempMatrix]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[0.15, 0.26, 0.025]} />
      <meshToonMaterial color={color} gradientMap={toonGradientTexture} />
    </instancedMesh>
  );
}

export function ShelfUnit({
  x,
  z,
  genre,
  color,
  backGenre,
  backColor,
  rotY = 0,
  interaction,
}: {
  x: number;
  z: number;
  genre: string;
  color: string;
  backGenre?: string;
  backColor?: string;
  rotY?: number;
  interaction?: LayoutInteraction;
}) {
  const frontPosters = usePosterUrls(genre, 18); // 6 tapes x 3 tiers = 18
  const backPosters = usePosterUrls(backGenre || genre, 18);
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");
  const backGenreKey = (backGenre || genre).toLowerCase().replace(/[- ]/g, "");
  const bColor = backColor || color;
  const userData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: `Browse ${genre}`,
    data: genreKey,
  });

  const positions = useMemo(() => {
    const result: { x: number; y: number; z: number; side: string; idx: number }[] = [];
    const count = 6;
    const spacing = 0.35; // wider gaps, fewer tapes for perf
    const startX = -(count - 1) * spacing * 0.5;
    let idx = 0;
    for (const side of ["front", "back"] as const) {
      const z = side === "front" ? -0.16 : 0.16; // narrower shelf (0.35 deep)
      for (const y of [1.17, 0.67, 0.19]) { // sit on shelf boards at y=0.04, 0.54, 1.04
        for (let i = 0; i < count; i++) {
          result.push({ x: startX + i * spacing, y, z, side, idx: idx++ });
        }
      }
    }
    return result;
  }, []);

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]} userData={userData}>
      {/* Gondola shelf — open frame with visible shelf boards, narrower (0.35 deep) */}
      {/* Back panel — thin vertical board running the length */}
      <mesh position={[0, 0.75, 0]} userData={userData}>
        <boxGeometry args={[2.8, 1.5, 0.04]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.35]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      <mesh position={[1.4, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.35]} />
        <Mat color="#4a2818" roughness={0.8} />
      </mesh>
      {/* Top cap */}
      <RoundedBox args={[2.85, 0.04, 0.38]} radius={0.01} smoothness={2} position={[0, 1.52, 0]}>
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </RoundedBox>
      {/* Genre sign on top — Blockbuster blue with yellow text */}
      {/* Front side (faces -z in local space) */}
      <mesh position={[0, 1.62, -0.12]}>
        <boxGeometry args={[1.2, 0.16, 0.02]} />
        <Mat color="#00006e" roughness={0.5} />
      </mesh>
      <Text position={[0, 1.62, -0.14]} rotation={[0, Math.PI, 0]} fontSize={0.065} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{genre}</Text>
      {/* Back side (faces +z in local space) */}
      {backGenre && (
        <>
          <mesh position={[0, 1.62, 0.12]}>
            <boxGeometry args={[1.2, 0.16, 0.02]} />
            <Mat color="#00006e" roughness={0.5} />
          </mesh>
          <Text position={[0, 1.62, 0.14]} fontSize={0.065} color="#ffd700" anchorX="center" anchorY="middle" font={undefined}>{backGenre}</Text>
        </>
      )}
      {/* 3 visible shelf boards — these are what the VHS tapes sit on */}
      {[0.02, 0.50, 1.0].map((sy, i) => (
        <RoundedBox key={`board-${i}`} args={[2.76, 0.04, 0.35]} radius={0.01} smoothness={2} position={[0, sy, 0]}>
          <Mat color="#6a4226" roughness={0.7} />
        </RoundedBox>
      ))}

      {/* VHS Boxes — PosterBoxes rendered individually, fallbacks instanced for perf */}
      {(() => {
        const frontFallbacks: [number, number, number][] = [];
        const backFallbacks: [number, number, number][] = [];
        const posterElements: React.ReactNode[] = [];

        positions.forEach((pos) => {
          const isBack = pos.side === "back";
          const sidePosters = isBack ? backPosters : frontPosters;
          const sideColor = isBack ? bColor : color;
          const sideIdx = positions.filter(p => p.side === pos.side).indexOf(pos);
          // Cycle posters to fill all slots — wrap around if fewer posters than slots
          const poster = sidePosters.length > 0 ? sidePosters[sideIdx % sidePosters.length] : null;
          const flipRot = isBack ? Math.PI : 0;
          if (poster) {
            posterElements.push(
              <PosterBox key={`${pos.side}-${pos.idx}`} url={poster.url} position={[pos.x, pos.y, pos.z]} rotation={flipRot} movieTitle={poster.title} movieId={poster.id} genreColor={sideColor} />
            );
          } else {
            if (isBack) backFallbacks.push([pos.x, pos.y, pos.z]);
            else frontFallbacks.push([pos.x, pos.y, pos.z]);
          }
        });

        return (
          <>
            {posterElements}
            <InstancedVHSBoxes positions={frontFallbacks} color={color} />
            <InstancedVHSBoxes positions={backFallbacks} color={bColor} />
          </>
        );
      })()}

    </group>
  );
}

export function WallShelf({
  position, rotation, width, genre, color, interaction
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  genre: string;
  color: string;
  interaction?: LayoutInteraction;
}) {
  const posters = usePosterUrls(genre, 20);
  const genreKey = genre.toLowerCase().replace(/[- ]/g, "");
  const userData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: `Browse ${genre}`,
    data: genreKey,
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

      {/* 3 shelf boards */}
      {[0.15, 0.65, 1.15].map((y, i) => (
        <mesh key={`ws-board-${i}`} position={[0, y, 0.1]}>
          <boxGeometry args={[width - 0.1, 0.04, 0.2]} />
          <Mat color="#6a4226" roughness={0.7} />
        </mesh>
      ))}

      {/* Genre sign at top */}
      <mesh position={[0, 1.85, 0.05]}>
        <boxGeometry args={[Math.min(width, 2), 0.2, 0.03]} />
        <Mat color="#0a1830" roughness={0.6} />
      </mesh>
      <Text position={[0, 1.85, 0.08]} fontSize={0.12} color={color} anchorX="center" font={undefined}>
        {genre}
      </Text>

      {/* VHS tapes on each tier */}
      {[0.32, 0.82, 1.32].map((ty, tier) => {
        const startX = -(tapeCount - 1) * 0.22 * 0.5;
        return Array.from({ length: tapeCount }).map((_, i) => {
          const poster = posters[tier * tapeCount + i];
          return poster ? (
            <PosterBox key={`wt-${tier}-${i}`}
              url={poster.url}
              position={[startX + i * 0.22, ty, 0.12]}
              movieTitle={poster.title} movieId={poster.id} genreColor={color} />
          ) : null;
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

      {/* Face-out VHS boxes — 3 on top shelf, 3 on bottom */}
      {vhsColors.map((color, i) => (
        <group key={`et-${i}`} position={[-0.28 + i * 0.28, 1.1, -0.25]}>
          <mesh>
            <boxGeometry args={[0.15, 0.26, 0.025]} />
            <Mat color={color} roughness={0.6} />
          </mesh>
          {/* White label strip on face */}
          <mesh position={[0, -0.08, -0.051]}>
            <planeGeometry args={[0.14, 0.06]} />
            <meshBasicMaterial color="#e8e8e0" />
          </mesh>
        </group>
      ))}
      {vhsColors.map((color, i) => (
        <group key={`eb-${i}`} position={[-0.28 + i * 0.28, 0.55, -0.25]}>
          <mesh>
            <boxGeometry args={[0.15, 0.26, 0.025]} />
            <Mat color={color} roughness={0.6} />
          </mesh>
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
  { url: "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", title: "Pulp Fiction", id: 680 },
  { url: "https://image.tmdb.org/t/p/w342/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", title: "The Godfather", id: 238 },
  { url: "https://image.tmdb.org/t/p/w342/gpMR1hnEo0JLEW0oGOAkxRYrf7R.jpg", title: "The Princess Bride", id: 2493 },
  { url: "https://image.tmdb.org/t/p/w342/3E52VpEVKhklKLLjqOGKpjEJBnM.jpg", title: "Ghostbusters", id: 620 },
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
            movieId={m.id}
          />
        );
      })}
    </group>
  );
}

export function NewReleasesWall({
  position = [0, 0, -ROOM_D / 2 + 0.17],
  interaction,
}: {
  position?: [number, number, number];
  interaction?: LayoutInteraction;
}) {
  const posters = usePosterUrls("NEW", 10); // fewer unique movies, more copies of each
  const allPosters = posters;
  const userData = buildInteractionUserData(interaction, {
    type: "shelf",
    label: "Browse NEW RELEASES",
    data: "new",
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
      {/* Shelf unit — centered, not full wall */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[8, 2.0, 0.3]} />
        <Mat color={SHELF_COLOR} roughness={0.8} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[8.2, 0.05, 0.35]} />
        <Mat color="#8a6838" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Shelf boards — aligned to VHS row bottoms (rows at y=1.75,1.25,0.75; VHS half-height=0.13) */}
      {[1.61, 1.11, 0.61, 0.02].map((y, i) => (
        <mesh key={`shelf-${i}`} position={[0, y, 0.05]}>
          <boxGeometry args={[7.8, 0.04, 0.32]} />
          <Mat color="#6a4226" roughness={0.7} />
        </mesh>
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
          <PosterBox key={pos.idx} url={poster.url} position={[pos.x, pos.y, 0.15]} rotation={Math.PI} movieTitle={poster.title} movieId={poster.id} genreColor="#ec4899" />
        ) : (
          <mesh key={pos.idx} position={[pos.x, pos.y, 0.15]}>
            <boxGeometry args={[0.15, 0.26, 0.025]} />
            <Mat color="#ec4899" roughness={0.6} />
          </mesh>
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
