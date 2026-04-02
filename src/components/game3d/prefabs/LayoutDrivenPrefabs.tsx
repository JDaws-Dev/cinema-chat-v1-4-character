"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  getVisibleLayoutObjects,
  type LayoutObject,
  type ResolvedLayoutObject,
} from "@/lib/store-layout";
import { Mat } from "../store-materials";
import { KenneyModel } from "../store-characters";
import { Counter } from "../store-counter";
import { NewReleasesWall, ShelfUnit, WallShelf } from "../store-shelves";
import { WallCrtTv, WallPoster } from "../store-walls";

function getUserData(
  obj: ResolvedLayoutObject
): Record<string, unknown> | undefined {
  if (!obj.interaction) return undefined;
  return {
    interactType: obj.interaction.type,
    label: obj.interaction.label,
    interactData: obj.interaction.data,
  };
}

function getMetaString(obj: LayoutObject, key: string, fallback: string): string {
  const value = obj.meta?.[key];
  return typeof value === "string" ? value : fallback;
}

function LayoutSignGroup({
  obj,
  children,
}: {
  obj: ResolvedLayoutObject;
  children: React.ReactNode;
}) {
  return (
    <group
      position={[obj.x, obj.y, obj.z]}
      rotation={[0, obj.rotY ?? 0, 0]}
      userData={getUserData(obj)}
    >
      {children}
    </group>
  );
}

function PlasticStoreSign({ obj }: { obj: ResolvedLayoutObject }) {
  const width = obj.w ?? 1.5;
  const text = obj.label;
  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <boxGeometry args={[width, 0.35, 0.03]} />
        <Mat color="#0a1a3a" roughness={0.6} />
      </mesh>
      <Text position={[0, 0, 0.025]} fontSize={0.09} color="#ffd700" anchorX="center">
        {text}
      </Text>
      <Text position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]} fontSize={0.09} color="#ffd700" anchorX="center">
        {text}
      </Text>
    </LayoutSignGroup>
  );
}

function NeonSignPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[obj.w ?? 5.8, 0.4, 0.03]} />
        <Mat color="#0a0a18" roughness={0.5} />
      </mesh>
      <Text position={[0, 0, 0.02]} fontSize={0.2} color="#ffd700" anchorX="center">
        {obj.label}
        <meshBasicMaterial color="#ffd700" toneMapped={false} />
      </Text>
    </LayoutSignGroup>
  );
}

function OpenSignPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const color = obj.category === "exterior" ? "#33ff66" : "#ff3e7a";
  const width = obj.w ?? 1;
  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <boxGeometry args={[width, 0.45, 0.03]} />
        <Mat color="#0a0a18" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[width + 0.1, 0.55, 0.01]} />
        <Mat color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.5} />
      </mesh>
      <Text position={[0, 0, 0.03]} fontSize={0.22} color={color} anchorX="center">
        OPEN
        <meshBasicMaterial color={color} toneMapped={false} />
      </Text>
      <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.22} color={color} anchorX="center">
        OPEN
        <meshBasicMaterial color={color} toneMapped={false} />
      </Text>
    </LayoutSignGroup>
  );
}

function StoreHoursPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[1.3, 0.9, 0.03]} />
        <Mat color="#1a3a6a" roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.2, 0.8, 0.03]} />
        <Mat color="#f0f0e8" roughness={0.7} />
      </mesh>
      <Text position={[0, 0.25, 0.025]} fontSize={0.08} color="#1a3a6a" anchorX="center">
        STORE HOURS
      </Text>
      <Text position={[0, 0.05, 0.025]} fontSize={0.05} color="#333333" anchorX="center">
        MON-SAT 10AM - 11PM
      </Text>
      <Text position={[0, -0.1, 0.025]} fontSize={0.05} color="#333333" anchorX="center">
        SUN 11AM - 9PM
      </Text>
      <Text position={[0, -0.28, 0.025]} fontSize={0.035} color="#cc3333" anchorX="center">
        OPEN LATE FRIDAYS!
      </Text>
    </LayoutSignGroup>
  );
}

function PromoBoardPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <boxGeometry args={[1.02, 0.78, 0.04]} />
        <Mat color="#1a2f58" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[1.12, 0.88, 0.02]} />
        <Mat color="#d4a514" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.98, 0.74, 0.012]} />
        <Mat color="#10203e" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.23, 0.028]}>
        <boxGeometry args={[0.7, 0.14, 0.008]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      <Text position={[0, 0.23, 0.034]} fontSize={0.075} color="#0a1830" anchorX="center" anchorY="middle">
        {obj.label}
      </Text>
      <Text position={[0, 0.04, 0.03]} fontSize={0.065} color="#ffffff" anchorX="center" anchorY="middle">
        RENT 2 GET 1 FREE
      </Text>
      <Text position={[0, -0.11, 0.03]} fontSize={0.055} color="#ffe88a" anchorX="center" anchorY="middle">
        KIDS FAVORITES $0.99
      </Text>
      <Text position={[0, -0.25, 0.03]} fontSize={0.042} color="#7ec8ff" anchorX="center" anchorY="middle">
        NEW RELEASES TUESDAY
      </Text>
    </LayoutSignGroup>
  );
}

function ChallengeBoardPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh position={[0, 0, -0.02]} userData={getUserData(obj)}>
        <boxGeometry args={[0.82, 0.6, 0.04]} />
        <Mat color="#d4a514" emissive="#ffd700" emissiveIntensity={0.08} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.68, 0.46, 0.02]} />
        <Mat color="#0f1a33" roughness={0.5} />
      </mesh>
      <Text position={[0, 0.115, 0.03]} fontSize={0.05} color="#ffd700" anchorX="center" anchorY="middle">
        MOVIE NIGHT
      </Text>
      <Text position={[0, 0.03, 0.03]} fontSize={0.038} color="#7ec8ff" anchorX="center" anchorY="middle">
        CHALLENGE
      </Text>
      <Text position={[0, -0.045, 0.03]} fontSize={0.021} color="#ffffff" anchorX="center" anchorY="middle">
        Pick tonight&apos;s theme
      </Text>
      <Text position={[0, -0.115, 0.03]} fontSize={0.02} color="#d4c28a" anchorX="center" anchorY="middle">
        Click to open
      </Text>
    </LayoutSignGroup>
  );
}

function BulletinBoardPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <Mat color="#7a5a30" roughness={0.85} />
      </mesh>
      {[
        [-0.3, 0.15, "#ffd700"],
        [0.1, 0.2, "#ef4444"],
        [-0.15, -0.1, "#22c55e"],
        [0.25, -0.05, "#3b82f6"],
      ].map(([dx, dy, c], i) => (
        <mesh key={`note${i}`} position={[dx as number, dy as number, 0.04]} rotation={[0, 0, (i - 1.5) * 0.1]}>
          <planeGeometry args={[0.2, 0.2]} />
          <Mat color={c as string} roughness={0.7} />
        </mesh>
      ))}
    </LayoutSignGroup>
  );
}

function WallClockPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <circleGeometry args={[0.25, 24]} />
        <Mat color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <cylinderGeometry args={[0.27, 0.27, 0.04, 24]} />
        <Mat color="#333" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.02, 0.12, 0.005]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.04, 0.06, 0.01]} rotation={[0, 0, -1.2]}>
        <boxGeometry args={[0.015, 0.18, 0.005]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </LayoutSignGroup>
  );
}

function ReturnBinPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.6]} />
        <Mat color="#1a3a6a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.8, 0.28]}>
        <boxGeometry args={[0.5, 0.1, 0.06]} />
        <meshBasicMaterial color="#0a0a1a" />
      </mesh>
      <Text position={[0, 1.1, 0.32]} fontSize={0.05} color="#ffd700" anchorX="center">
        DROP RETURNS HERE
      </Text>
      <Text position={[0, 1.1, -0.32]} rotation={[0, Math.PI, 0]} fontSize={0.05} color="#ffd700" anchorX="center">
        DROP RETURNS HERE
      </Text>
    </LayoutSignGroup>
  );
}

function BargainBinPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <LayoutSignGroup obj={obj}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.7]} />
        <Mat color="#6a4a20" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.35, 0.6]} />
        <Mat color="#3a2a10" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, -0.36]}>
        <boxGeometry args={[0.6, 0.22, 0.02]} />
        <Mat color="#ef4444" roughness={0.5} />
      </mesh>
      <Text position={[0, 0.6, -0.39]} rotation={[0, Math.PI, 0]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
        2 FOR $1
      </Text>
      <Text position={[0, 0.6, -0.34]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
        2 FOR $1
      </Text>
    </LayoutSignGroup>
  );
}

function LampPostPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <group position={[obj.x, obj.y, obj.z]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 3, 8]} />
        <meshBasicMaterial color="#444" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.15]} />
        <meshBasicMaterial color="#555" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[1.5, 12]} />
        <meshBasicMaterial color="#332a15" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function BoxCar({
  obj,
  color,
  cabinColor,
}: {
  obj: ResolvedLayoutObject;
  color: string;
  cabinColor?: string;
}) {
  const cb = cabinColor ?? "#222233";
  return (
    <group position={[obj.x, obj.y, obj.z]} rotation={[0, obj.rotY ?? 0, 0]} scale={1.4}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.95, 0.4, 2.1]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0.7]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.9, 0.12, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, -0.75]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.65, -0.05]}>
        <boxGeometry args={[0.82, 0.3, 1.0]} />
        <meshStandardMaterial color={cb} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.68, 0.5]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.78, 0.28, 0.02]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.4} roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.68, -0.55]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.72, 0.24, 0.02]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.35} roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[0.42, 0.68, -0.05]}>
        <boxGeometry args={[0.02, 0.22, 0.85]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.3} roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[-0.42, 0.68, -0.05]}>
        <boxGeometry args={[0.02, 0.22, 0.85]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.3} roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, 1.06]}>
        <boxGeometry args={[0.8, 0.1, 0.06]} />
        <meshStandardMaterial color="#444444" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.18, -1.06]}>
        <boxGeometry args={[0.8, 0.1, 0.06]} />
        <meshStandardMaterial color="#444444" roughness={0.3} metalness={0.6} />
      </mesh>
      {[
        [0.45, 0.12, -0.6],
        [-0.45, 0.12, -0.6],
        [0.45, 0.12, 0.6],
        [-0.45, 0.12, 0.6],
      ].map(([wx, wy, wz], i) => (
        <group key={i}>
          <mesh position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh position={[wx > 0 ? wx + 0.01 : wx - 0.01, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.12, 8]} />
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CarPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const palette: Record<string, { color: string; cabinColor?: string }> = {
    "car-sedan": { color: "#4466aa", cabinColor: "#223355" },
    "car-van": { color: "#cc4444", cabinColor: "#222233" },
    "car-suv": { color: "#338833", cabinColor: "#1a331a" },
    "car-hatchback": { color: "#ddaa22", cabinColor: "#222233" },
    "car-taxi": { color: "#eecc33", cabinColor: "#222233" },
    "car-sedan2": { color: "#777777", cabinColor: "#333333" },
    "car-police": { color: "#222244", cabinColor: "#111122" },
    "car-delivery": { color: "#aa6633", cabinColor: "#663311" },
  };

  const colors = palette[obj.id] ?? palette["car-sedan"];
  return <BoxCar obj={obj} color={colors.color} cabinColor={colors.cabinColor} />;
}

function TrashCanPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return <KenneyModel model="trashcan" position={[obj.x, obj.y, obj.z]} scale={0.5} />;
}

function GondolaShelfPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const genre = getMetaString(obj, "genre", obj.label);
  const color = getMetaString(obj, "color", "#00006e");
  const backGenre = getMetaString(obj, "backGenre", genre);
  const backColor = getMetaString(obj, "backColor", color);
  return (
    <ShelfUnit
      x={obj.x}
      z={obj.z}
      genre={genre}
      color={color}
      backGenre={backGenre}
      backColor={backColor}
      rotY={obj.rotY ?? 0}
      interaction={obj.interaction}
    />
  );
}

function WallRunShelfPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const isBackWallShelf = obj.id === "wallshelf-back-drama";
  const width =
    typeof obj.meta?.width === "number"
      ? obj.meta.width
      : isBackWallShelf
        ? 6
        : obj.w ?? 6;
  const genre = isBackWallShelf ? "DRAMA" : getMetaString(obj, "genre", obj.label);
  const color = isBackWallShelf ? "#6366f1" : getMetaString(obj, "color", "#6366f1");
  return (
    <WallShelf
      position={[obj.x, obj.y, obj.z]}
      rotation={[0, obj.rotY ?? 0, 0]}
      width={width}
      genre={genre}
      color={color}
      interaction={obj.interaction}
    />
  );
}

function NewReleasesWallPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <NewReleasesWall
      position={[obj.x, obj.y, obj.z]}
      interaction={obj.interaction}
    />
  );
}

function CounterPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  return (
    <Counter
      position={[obj.x, obj.y, obj.z]}
      rotation={[0, obj.rotY ?? 0, 0]}
    />
  );
}

function CrtTvPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const yaw =
    typeof obj.meta?.yaw === "number"
      ? obj.meta.yaw
      : obj.id === "tv-left"
        ? Math.PI / 2 - 0.18
        : -Math.PI / 2 + 0.18;
  const tilt = typeof obj.meta?.tilt === "number" ? obj.meta.tilt : 0.12;
  const scale = typeof obj.meta?.scale === "number" ? obj.meta.scale : obj.id === "tv-left" ? 0.84 : 0.7;
  const pipeDrop = obj.id === "tv-left" ? 0.96 : 1.16;
  return (
    <WallCrtTv
      position={[obj.x, obj.y, obj.z]}
      yaw={yaw}
      tilt={tilt}
      scale={scale}
      pipeDrop={pipeDrop}
    />
  );
}

function PosterPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const title = getMetaString(obj, "title", obj.label);
  return <WallPoster x={obj.x} y={obj.y} z={obj.z} rotY={obj.rotY ?? 0} title={title} />;
}

function renderPrefab(obj: ResolvedLayoutObject): React.ReactNode {
  switch (obj.prefabId) {
    case "shelf/gondola":
      return <GondolaShelfPrefab key={obj.id} obj={obj} />;
    case "shelf/wall-run":
      return <WallRunShelfPrefab key={obj.id} obj={obj} />;
    case "shelf/new-releases-wall":
      return <NewReleasesWallPrefab key={obj.id} obj={obj} />;
    case "fixture/counter":
      return <CounterPrefab key={obj.id} obj={obj} />;
    case "wall/poster":
      return <PosterPrefab key={obj.id} obj={obj} />;
    case "sign/neon":
      return <NeonSignPrefab key={obj.id} obj={obj} />;
    case "sign/plastic-store":
      return <PlasticStoreSign key={obj.id} obj={obj} />;
    case "sign/open":
      return <OpenSignPrefab key={obj.id} obj={obj} />;
    case "sign/store-hours":
      return <StoreHoursPrefab key={obj.id} obj={obj} />;
    case "sign/promo-board":
      return <PromoBoardPrefab key={obj.id} obj={obj} />;
    case "sign/challenge-board":
      return <ChallengeBoardPrefab key={obj.id} obj={obj} />;
    case "prop/bulletin-board":
      return <BulletinBoardPrefab key={obj.id} obj={obj} />;
    case "prop/wall-clock":
      return <WallClockPrefab key={obj.id} obj={obj} />;
    case "prop/return-bin":
      return <ReturnBinPrefab key={obj.id} obj={obj} />;
    case "prop/bargain-bin":
      return <BargainBinPrefab key={obj.id} obj={obj} />;
    case "prop/trash-can":
      return <TrashCanPrefab key={obj.id} obj={obj} />;
    case "prop/crt-tv":
      return <CrtTvPrefab key={obj.id} obj={obj} />;
    case "exterior/lamp-post":
      return <LampPostPrefab key={obj.id} obj={obj} />;
    case "exterior/car":
      return <CarPrefab key={obj.id} obj={obj} />;
    default:
      return null;
  }
}

export function LayoutDrivenPrefabs() {
  return <>{getVisibleLayoutObjects().map((obj) => renderPrefab(obj))}</>;
}
