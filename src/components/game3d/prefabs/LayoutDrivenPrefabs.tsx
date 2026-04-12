"use client";

import React from "react";
import { RoundedBox, Text } from "@react-three/drei";
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
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[width + 0.08, 0.43, 0.012]} />
        <Mat color="#3f2814" roughness={0.78} />
      </mesh>
      <mesh>
        <boxGeometry args={[width, 0.35, 0.03]} />
        <Mat color="#0a1a3a" roughness={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`mount-${obj.id}-${side}`} position={[side * (width / 2 - 0.08), 0, 0.02]}>
          <cylinderGeometry args={[0.016, 0.016, 0.014, 8]} />
          <Mat color="#caa43a" roughness={0.35} metalness={0.55} />
        </mesh>
      ))}
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

function StorefrontMarqueePrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const width = obj.w ?? 8;
  const subtitle = getMetaString(
    obj,
    "subtitle",
    "YOUR NEIGHBORHOOD VIDEO STORE"
  );

  return (
    <LayoutSignGroup obj={obj}>
      <mesh>
        <boxGeometry args={[width, 1.2, 0.2]} />
        <meshBasicMaterial color="#0a0a1a" />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <boxGeometry args={[width + 0.1, 1.25, 0.01]} />
        <meshBasicMaterial color="#b8960a" />
      </mesh>
      <mesh position={[0, 0, 0.115]}>
        <boxGeometry args={[width - 0.1, 1.1, 0.01]} />
        <meshBasicMaterial color="#0a0a1a" />
      </mesh>
      <group position={[-width / 2 + 0.8, 0.05, 0.13]}>
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.4, 0.03]} />
          <meshBasicMaterial color="#ffd700" toneMapped={false} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.4, 0.03]} />
          <meshBasicMaterial color="#1a3a6a" toneMapped={false} />
        </mesh>
        <mesh position={[0.15, 0, 0.016]}>
          <boxGeometry args={[0.32, 0.44, 0.003]} />
          <meshBasicMaterial color="#ffd700" toneMapped={false} />
        </mesh>
        <mesh position={[0.15, 0, 0.019]}>
          <boxGeometry args={[0.28, 0.4, 0.003]} />
          <meshBasicMaterial color="#1a3a6a" toneMapped={false} />
        </mesh>
      </group>
      <Text position={[0.2, 0.1, 0.13]} fontSize={0.5} color="#ffd700" anchorX="center" anchorY="middle">
        {obj.label}
        <meshBasicMaterial color="#ffd700" toneMapped={false} />
      </Text>
      <Text position={[0.2, -0.3, 0.13]} fontSize={0.1} color="#cccccc" anchorX="center" anchorY="middle">
        {subtitle}
        <meshBasicMaterial color="#cccccc" toneMapped={false} />
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
      {/* Lamp bulb glow */}
      <mesh position={[0, 3.0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffe4a0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[1.5, 12]} />
        <meshBasicMaterial color="#332a15" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

type CarKind =
  | "sedan"
  | "van"
  | "suv"
  | "hatchback"
  | "taxi"
  | "police"
  | "delivery";

type CarPaint = {
  kind: CarKind;
  bodyColor: string;
  roofColor: string;
  glassColor: string;
  trimColor: string;
  accentColor: string;
  secondaryColor?: string;
  label?: string;
};

function CarShadow({
  length,
  width,
  opacity = 0.24,
}: {
  length: number;
  width: number;
  opacity?: number;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.015, 0]}
      scale={[length * 0.46, width * 0.68, 1]}
    >
      <circleGeometry args={[1, 20]} />
      <meshBasicMaterial
        color="#06080c"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

function CarGlass({
  position,
  size,
  color,
  rotation,
  opacity = 0.34,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.12}
        metalness={0.04}
        depthWrite={false}
      />
    </mesh>
  );
}

function CarLight({
  position,
  size,
  color,
  opacity = 1,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

function CarWheel({
  position,
  radius,
  thickness,
  hubColor,
}: {
  position: [number, number, number];
  radius: number;
  thickness: number;
  hubColor: string;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, thickness, 14]} />
        <Mat color="#181a1f" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0, thickness * 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.56, radius * 0.56, thickness * 1.06, 12]} />
        <Mat color={hubColor} roughness={0.3} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0, thickness * 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.22, radius * 0.22, thickness * 1.12, 10]} />
        <Mat color="#c9d0d8" roughness={0.22} metalness={0.72} />
      </mesh>
    </group>
  );
}

function CarWheelSet({
  wheelBase,
  trackHalf,
  radius,
  thickness,
  hubColor,
}: {
  wheelBase: number;
  trackHalf: number;
  radius: number;
  thickness: number;
  hubColor: string;
}) {
  const wheelPositions: Array<[number, number, number]> = [
    [wheelBase, radius, -trackHalf],
    [-wheelBase, radius, -trackHalf],
    [wheelBase, radius, trackHalf],
    [-wheelBase, radius, trackHalf],
  ];

  return (
    <>
      {wheelPositions.map((position, index) => (
        <CarWheel
          key={`wheel-${index}`}
          position={position}
          radius={radius}
          thickness={thickness}
          hubColor={hubColor}
        />
      ))}
    </>
  );
}

function PassengerCar({
  obj,
  paint,
}: {
  obj: ResolvedLayoutObject;
  paint: CarPaint;
}) {
  const length = Math.max(obj.w ?? 2.9, 2.4);
  const width = Math.max(obj.d ?? 1.35, 1.15);
  const isSUV = paint.kind === "suv";
  const isHatchback = paint.kind === "hatchback";
  const isTaxi = paint.kind === "taxi";
  const isPolice = paint.kind === "police";

  const wheelRadius = width * (isSUV ? 0.166 : 0.158);
  const wheelThickness = Math.max(width * 0.12, 0.11);
  const wheelBase = length * (isHatchback ? 0.27 : isSUV ? 0.3 : 0.29);
  const trackHalf = width * 0.365;

  const bodyWidth = width * (isSUV ? 0.94 : 0.9);
  const bodyHeight = isSUV ? 0.46 : 0.42;
  const bodyY = wheelRadius + bodyHeight * 0.44 + 0.02;
  const hoodLength = length * (isSUV ? 0.22 : 0.2);
  const hoodHeight = bodyHeight * (isSUV ? 0.6 : 0.52);
  const hoodY = bodyY + bodyHeight * 0.12;
  const hoodTilt = isSUV ? -0.07 : -0.15;
  const rearDeckLength = length * (isHatchback ? 0.16 : isSUV ? 0.2 : 0.22);
  const rearDeckHeight = bodyHeight * (isHatchback ? 0.58 : isSUV ? 0.5 : 0.46);
  const rearDeckY = bodyY + bodyHeight * (isHatchback ? 0.14 : 0.1);
  const rearTilt = isHatchback ? 0.4 : isSUV ? 0.08 : 0.16;

  const greenhouseLength = length * (isHatchback ? 0.54 : isSUV ? 0.52 : 0.48);
  const greenhouseWidth = width * (isSUV ? 0.76 : 0.72);
  const greenhouseX = isHatchback ? -length * 0.02 : isSUV ? -length * 0.01 : length * 0.02;
  const greenhouseFloorY = bodyY + bodyHeight * 0.34;
  const greenhouseFloorHeight = isSUV ? 0.18 : 0.15;
  const roofLength = greenhouseLength * (isHatchback ? 0.86 : isSUV ? 0.88 : 0.76);
  const roofWidth = greenhouseWidth * 0.88;
  const roofHeight = isSUV ? 0.12 : 0.1;
  const roofY = bodyY + bodyHeight * 0.78 + (isSUV ? 0.03 : 0.015);
  const roofTopY = roofY + roofHeight / 2;
  const sideGlassZ = greenhouseWidth / 2 + 0.014;
  const sideWindowY = bodyY + bodyHeight * 0.6;
  const sideWindowHeight = isSUV ? 0.26 : 0.22;
  const frontWindowLength = greenhouseLength * (isSUV ? 0.28 : 0.3);
  const rearWindowLength = isHatchback ? greenhouseLength * 0.34 : isSUV ? greenhouseLength * 0.24 : greenhouseLength * 0.18;
  const frontWindowX = greenhouseX + greenhouseLength * (isSUV ? 0.14 : 0.15);
  const rearWindowX = greenhouseX - greenhouseLength * (isHatchback ? 0.16 : 0.22);
  const windshieldX = greenhouseX + greenhouseLength * 0.38;
  const rearGlassX = greenhouseX - greenhouseLength * (isHatchback ? 0.4 : 0.36);
  const pillarColor = paint.roofColor;
  const sidePanelLength = length * 0.34;
  const sidePanelHeight = bodyHeight * 0.38;
  const sidePanelY = bodyY + bodyHeight * 0.01;
  const sidePanelZ = bodyWidth / 2 + 0.016;
  const fenderWidth = 0.13;
  const fenderHeight = wheelRadius * 0.9;
  const fenderY = wheelRadius + fenderHeight * 0.36;

  const policeDoorColor = paint.secondaryColor ?? "#eef2f5";

  return (
    <group position={[obj.x, obj.y, obj.z]} rotation={[0, obj.rotY ?? 0, 0]}>
      <CarShadow length={length} width={width} />

      <RoundedBox
        args={[length * 0.72, bodyHeight, bodyWidth]}
        radius={0.06}
        smoothness={3}
        position={[0, bodyY, 0]}
      >
        <Mat color={paint.bodyColor} roughness={0.64} />
      </RoundedBox>

      <RoundedBox
        args={[hoodLength, hoodHeight, bodyWidth * 0.92]}
        radius={0.05}
        smoothness={3}
        position={[length * 0.28, hoodY, 0]}
        rotation={[0, 0, hoodTilt]}
      >
        <Mat color={paint.bodyColor} roughness={0.56} />
      </RoundedBox>

      <RoundedBox
        args={[rearDeckLength, rearDeckHeight, bodyWidth * 0.9]}
        radius={0.05}
        smoothness={3}
        position={[-length * 0.29, rearDeckY, 0]}
        rotation={[0, 0, rearTilt]}
      >
        <Mat color={paint.bodyColor} roughness={0.6} />
      </RoundedBox>

      <RoundedBox
        args={[greenhouseLength * 0.86, greenhouseFloorHeight, greenhouseWidth * 0.82]}
        radius={0.05}
        smoothness={3}
        position={[greenhouseX - length * 0.01, greenhouseFloorY, 0]}
      >
        <Mat color="#1d2128" roughness={0.78} />
      </RoundedBox>

      <RoundedBox
        args={[roofLength, roofHeight, roofWidth]}
        radius={0.045}
        smoothness={3}
        position={[greenhouseX, roofY, 0]}
      >
        <Mat color={paint.roofColor} roughness={0.48} />
      </RoundedBox>

      <RoundedBox
        args={[length * 0.78, 0.07, width * 0.22]}
        radius={0.025}
        smoothness={2}
        position={[0, wheelRadius + 0.02, 0]}
      >
        <Mat color="#2a2e35" roughness={0.82} />
      </RoundedBox>

      {([-1, 1] as const).map((side) => (
        <React.Fragment key={`greenhouse-${side}`}>
          <mesh position={[greenhouseX + greenhouseLength * 0.31, bodyY + bodyHeight * 0.57, side * sideGlassZ]} rotation={[0, 0, 0.55]}>
            <boxGeometry args={[0.034, sideWindowHeight * 1.02, 0.026]} />
            <Mat color={pillarColor} roughness={0.4} />
          </mesh>
          <mesh position={[greenhouseX - greenhouseLength * 0.04, bodyY + bodyHeight * 0.59, side * sideGlassZ]}>
            <boxGeometry args={[0.03, sideWindowHeight * 0.94, 0.026]} />
            <Mat color={pillarColor} roughness={0.44} />
          </mesh>
          <mesh position={[greenhouseX - greenhouseLength * (isHatchback ? 0.34 : 0.38), bodyY + bodyHeight * 0.59, side * sideGlassZ]} rotation={[0, 0, isHatchback ? -0.62 : -0.4]}>
            <boxGeometry args={[0.034, sideWindowHeight * (isHatchback ? 1.12 : 0.9), 0.026]} />
            <Mat color={pillarColor} roughness={0.4} />
          </mesh>
          <CarGlass
            position={[frontWindowX, sideWindowY, side * sideGlassZ]}
            size={[frontWindowLength, sideWindowHeight, 0.024]}
            color={paint.glassColor}
            opacity={0.46}
          />
          <CarGlass
            position={[rearWindowX, sideWindowY - (isHatchback ? 0.01 : 0), side * sideGlassZ]}
            size={[rearWindowLength, sideWindowHeight * (isHatchback ? 1.06 : 0.84), 0.024]}
            color={paint.glassColor}
            opacity={0.4}
          />
        </React.Fragment>
      ))}

      {isPolice ? (
        <>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`police-door-${side}`}
              position={[0, sidePanelY, side * sidePanelZ]}
            >
              <boxGeometry args={[sidePanelLength, sidePanelHeight, 0.026]} />
              <meshBasicMaterial color={policeDoorColor} />
            </mesh>
          ))}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`police-door-stripe-${side}`}
              position={[0.03, sidePanelY + sidePanelHeight * 0.05, side * (sidePanelZ + 0.014)]}
            >
              <boxGeometry args={[sidePanelLength * 0.88, 0.04, 0.016]} />
              <meshBasicMaterial color="#10151f" />
            </mesh>
          ))}
          <RoundedBox
            args={[0.36, 0.08, 0.12]}
            radius={0.02}
            smoothness={2}
            position={[0, roofTopY + 0.09, 0]}
          >
            <Mat color="#1b1f28" roughness={0.4} />
          </RoundedBox>
          <CarLight
            position={[-0.09, roofTopY + 0.1, 0]}
            size={[0.14, 0.05, 0.09]}
            color="#2e8fff"
            opacity={0.9}
          />
          <CarLight
            position={[0.09, roofTopY + 0.1, 0]}
            size={[0.14, 0.05, 0.09]}
            color="#ff445a"
            opacity={0.9}
          />
          <group position={[length * 0.45, wheelRadius + 0.14, 0]}>
            <mesh>
              <boxGeometry args={[0.04, 0.16, 0.72]} />
              <Mat color="#c4ccd5" roughness={0.28} metalness={0.65} />
            </mesh>
            <mesh position={[0.08, 0.01, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.62]} />
              <Mat color="#c4ccd5" roughness={0.3} metalness={0.55} />
            </mesh>
          </group>
        </>
      ) : null}

      {isTaxi ? (
        <>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`taxi-stripe-${side}`}
              position={[0.02, sidePanelY - sidePanelHeight * 0.18, side * sidePanelZ]}
            >
              <boxGeometry args={[sidePanelLength * 1.05, 0.08, 0.022]} />
              <meshBasicMaterial color="#121212" />
            </mesh>
          ))}
          <RoundedBox
            args={[0.38, 0.12, 0.18]}
            radius={0.025}
            smoothness={2}
            position={[0, roofTopY + 0.1, 0]}
          >
            <Mat color="#f8ecd0" roughness={0.4} />
          </RoundedBox>
          <Text
            position={[0, roofTopY + 0.11, 0.1]}
            fontSize={0.06}
            color="#111111"
            anchorX="center"
            anchorY="middle"
          >
            TAXI
          </Text>
          <Text
            position={[0, roofTopY + 0.11, -0.1]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.06}
            color="#111111"
            anchorX="center"
            anchorY="middle"
          >
            TAXI
          </Text>
        </>
      ) : null}

      {isSUV ? (
        <>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`roof-rail-${side}`}
              position={[0, roofTopY + 0.03, side * (roofWidth * 0.42)]}
            >
              <boxGeometry args={[roofLength * 0.9, 0.028, 0.032]} />
              <Mat color={paint.trimColor} roughness={0.26} metalness={0.64} />
            </mesh>
          ))}
          {([-0.12, 0.14] as const).map((x, index) => (
            <mesh key={`crossbar-${index}`} position={[x, roofTopY + 0.045, 0]}>
              <boxGeometry args={[0.04, 0.03, roofWidth * 0.9]} />
              <Mat color={paint.trimColor} roughness={0.26} metalness={0.55} />
            </mesh>
          ))}
        </>
      ) : null}

      <CarGlass
        position={[windshieldX, sideWindowY + 0.01, 0]}
        rotation={[0, 0, 0.68]}
        size={[0.03, sideWindowHeight * 1.06, roofWidth * 0.92]}
        color={paint.glassColor}
        opacity={0.32}
      />
      <CarGlass
        position={[rearGlassX, sideWindowY - (isHatchback ? 0.01 : 0.02), 0]}
        rotation={[0, 0, isHatchback ? -0.86 : -0.58]}
        size={[0.03, sideWindowHeight * (isHatchback ? 1.24 : 0.88), roofWidth * (isHatchback ? 0.98 : 0.78)]}
        color={paint.glassColor}
        opacity={0.3}
      />

      {[wheelBase, -wheelBase].map((wx, index) => (
        <React.Fragment key={`fender-${index}`}>
          <RoundedBox
            args={[length * 0.16, fenderHeight, fenderWidth]}
            radius={0.03}
            smoothness={2}
            position={[wx, fenderY, bodyWidth / 2 - 0.02]}
          >
            <Mat color={paint.bodyColor} roughness={0.6} />
          </RoundedBox>
          <RoundedBox
            args={[length * 0.16, fenderHeight, fenderWidth]}
            radius={0.03}
            smoothness={2}
            position={[wx, fenderY, -(bodyWidth / 2 - 0.02)]}
          >
            <Mat color={paint.bodyColor} roughness={0.6} />
          </RoundedBox>
        </React.Fragment>
      ))}

      <CarLight
        position={[length * 0.45, bodyY + 0.03, bodyWidth * 0.28]}
        size={[0.04, 0.09, 0.16]}
        color={paint.accentColor}
      />
      <CarLight
        position={[length * 0.45, bodyY + 0.03, -bodyWidth * 0.28]}
        size={[0.04, 0.09, 0.16]}
        color={paint.accentColor}
      />
      <CarLight
        position={[-length * 0.44, bodyY + 0.03, bodyWidth * 0.28]}
        size={[0.04, 0.12, 0.16]}
        color="#ef4444"
      />
      <CarLight
        position={[-length * 0.44, bodyY + 0.03, -bodyWidth * 0.28]}
        size={[0.04, 0.12, 0.16]}
        color="#ef4444"
      />

      <mesh position={[length * 0.46, bodyY - 0.01, 0]}>
        <boxGeometry args={[0.06, 0.1, width * 0.44]} />
        <Mat color={paint.trimColor} roughness={0.24} metalness={0.68} />
      </mesh>
      <mesh position={[-length * 0.46, bodyY - 0.01, 0]}>
        <boxGeometry args={[0.06, 0.1, width * 0.4]} />
        <Mat color={paint.trimColor} roughness={0.28} metalness={0.58} />
      </mesh>
      <mesh position={[length * 0.47, bodyY + 0.01, 0]}>
        <boxGeometry args={[0.03, 0.08, width * 0.28]} />
        <meshBasicMaterial color="#20242a" />
      </mesh>
      <mesh position={[-length * 0.48, bodyY + 0.02, 0]}>
        <boxGeometry args={[0.03, 0.08, width * 0.24]} />
        <meshBasicMaterial color="#20242a" />
      </mesh>

      <CarWheelSet
        wheelBase={wheelBase}
        trackHalf={trackHalf}
        radius={wheelRadius}
        thickness={wheelThickness}
        hubColor={paint.trimColor}
      />
    </group>
  );
}

function VanCar({
  obj,
  paint,
}: {
  obj: ResolvedLayoutObject;
  paint: CarPaint;
}) {
  const length = Math.max(obj.w ?? 2.9, 2.5);
  const width = Math.max(obj.d ?? 1.35, 1.18);
  const isDelivery = paint.kind === "delivery";

  const wheelRadius = width * 0.158;
  const wheelThickness = Math.max(width * 0.12, 0.11);
  const wheelBase = length * 0.3;
  const trackHalf = width * 0.365;

  const baseHeight = isDelivery ? 0.46 : 0.42;
  const baseWidth = width * 0.94;
  const baseY = wheelRadius + baseHeight * 0.44 + 0.02;
  const hoodLength = length * 0.18;
  const hoodHeight = baseHeight * 0.48;
  const hoodY = baseY + baseHeight * 0.1;
  const cabLength = length * 0.28;
  const shellWidth = width * (isDelivery ? 0.82 : 0.78);
  const shellHeight = isDelivery ? 0.5 : 0.38;
  const shellX = isDelivery ? -length * 0.04 : -length * 0.02;
  const shellY = baseY + baseHeight * 0.55;
  const roofHeight = isDelivery ? 0.12 : 0.1;
  const roofLength = length * (isDelivery ? 0.56 : 0.52);
  const roofWidth = shellWidth * 0.9;
  const roofY = shellY + shellHeight * 0.42;
  const roofTopY = roofY + roofHeight / 2;
  const glassZ = shellWidth / 2 + 0.014;
  const sideWindowHeight = isDelivery ? 0.24 : 0.22;
  const frontWindowX = shellX + length * 0.16;
  const rearWindowX = shellX - length * (isDelivery ? 0.1 : 0.16);
  const sidePanelZ = baseWidth / 2 + 0.014;
  const cargoPanelColor = paint.secondaryColor ?? "#e7dbc5";
  const pillarColor = paint.roofColor;
  const fenderWidth = 0.14;
  const fenderHeight = wheelRadius * 0.92;
  const fenderY = wheelRadius + fenderHeight * 0.36;

  return (
    <group position={[obj.x, obj.y, obj.z]} rotation={[0, obj.rotY ?? 0, 0]}>
      <CarShadow length={length} width={width} opacity={0.27} />

      <RoundedBox
        args={[length * 0.78, baseHeight, baseWidth]}
        radius={0.06}
        smoothness={3}
        position={[0, baseY, 0]}
      >
        <Mat color={paint.bodyColor} roughness={0.66} />
      </RoundedBox>

      <RoundedBox
        args={[hoodLength, hoodHeight, baseWidth * 0.9]}
        radius={0.05}
        smoothness={3}
        position={[length * 0.3, hoodY, 0]}
        rotation={[0, 0, -0.14]}
      >
        <Mat color={paint.bodyColor} roughness={0.58} />
      </RoundedBox>

      <RoundedBox
        args={[roofLength * 0.92, 0.16, shellWidth * 0.82]}
        radius={0.05}
        smoothness={3}
        position={[shellX + length * 0.02, baseY + baseHeight * 0.34, 0]}
      >
        <Mat color="#1d2128" roughness={0.78} />
      </RoundedBox>

      <RoundedBox
        args={[roofLength, shellHeight, shellWidth]}
        radius={0.05}
        smoothness={3}
        position={[shellX, shellY, 0]}
      >
        <Mat color={isDelivery ? paint.bodyColor : paint.roofColor} roughness={0.58} />
      </RoundedBox>

      <RoundedBox
        args={[roofLength * (isDelivery ? 0.9 : 0.84), roofHeight, roofWidth]}
        radius={0.04}
        smoothness={2}
        position={[shellX + (isDelivery ? -length * 0.02 : 0), roofY, 0]}
      >
        <Mat color={paint.roofColor} roughness={0.48} />
      </RoundedBox>

      <RoundedBox
        args={[length * 0.78, 0.07, width * 0.22]}
        radius={0.025}
        smoothness={2}
        position={[0, wheelRadius + 0.02, 0]}
      >
        <Mat color="#2a2e35" roughness={0.82} />
      </RoundedBox>

      <CarGlass
        position={[frontWindowX, baseY + baseHeight * 0.58, 0]}
        rotation={[0, 0, 0.7]}
        size={[0.03, sideWindowHeight * 1.08, roofWidth * 0.84]}
        color={paint.glassColor}
        opacity={0.32}
      />
      {([-1, 1] as const).map((side) => (
        <React.Fragment key={`van-window-${side}`}>
          <mesh position={[shellX + length * 0.21, baseY + baseHeight * 0.57, side * glassZ]} rotation={[0, 0, 0.56]}>
            <boxGeometry args={[0.034, sideWindowHeight * 1.02, 0.026]} />
            <Mat color={pillarColor} roughness={0.4} />
          </mesh>
          <mesh position={[shellX - length * 0.03, baseY + baseHeight * 0.59, side * glassZ]}>
            <boxGeometry args={[0.03, sideWindowHeight * 0.94, 0.026]} />
            <Mat color={pillarColor} roughness={0.44} />
          </mesh>
          <CarGlass
            position={[shellX + length * 0.11, baseY + baseHeight * 0.56, side * glassZ]}
            size={[cabLength * 0.74, sideWindowHeight, 0.024]}
            color={paint.glassColor}
            opacity={0.44}
          />
          {!isDelivery ? (
            <CarGlass
              position={[rearWindowX, baseY + baseHeight * 0.56, side * glassZ]}
              size={[length * 0.18, sideWindowHeight * 0.84, 0.024]}
              color={paint.glassColor}
              opacity={0.36}
            />
          ) : null}
        </React.Fragment>
      ))}

      {[wheelBase, -wheelBase].map((wx, index) => (
        <React.Fragment key={`van-fender-${index}`}>
          <RoundedBox
            args={[length * 0.16, fenderHeight, fenderWidth]}
            radius={0.03}
            smoothness={2}
            position={[wx, fenderY, baseWidth / 2 - 0.02]}
          >
            <Mat color={paint.bodyColor} roughness={0.62} />
          </RoundedBox>
          <RoundedBox
            args={[length * 0.16, fenderHeight, fenderWidth]}
            radius={0.03}
            smoothness={2}
            position={[wx, fenderY, -(baseWidth / 2 - 0.02)]}
          >
            <Mat color={paint.bodyColor} roughness={0.62} />
          </RoundedBox>
        </React.Fragment>
      ))}

      {([-1, 1] as const).map((side) => (
        <mesh
          key={`van-lower-trim-${side}`}
          position={[0, baseY - baseHeight * 0.18, side * sidePanelZ]}
        >
          <boxGeometry args={[length * 0.62, 0.05, 0.022]} />
          <meshBasicMaterial color={paint.trimColor} />
        </mesh>
      ))}

      {isDelivery ? (
        <>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`delivery-panel-${side}`}
              position={[shellX - length * 0.04, baseY + baseHeight * 0.12, side * (baseWidth / 2 + 0.013)]}
            >
              <boxGeometry args={[length * 0.42, baseHeight * 0.36, 0.022]} />
              <meshBasicMaterial color={cargoPanelColor} />
            </mesh>
          ))}
          {([-1, 1] as const).map((side) => (
            <Text
              key={`delivery-label-${side}`}
              position={[shellX - length * 0.04, baseY + baseHeight * 0.12, side * (baseWidth / 2 + 0.03)]}
              rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
              fontSize={0.08}
              color="#42210f"
              anchorX="center"
              anchorY="middle"
            >
              {paint.label ?? "VIDEO EXPRESS"}
            </Text>
          ))}
          <mesh position={[-length * 0.42, roofY - 0.02, 0]}>
            <boxGeometry args={[0.03, shellHeight * 0.8, shellWidth * 0.82]} />
            <meshBasicMaterial color="#a47446" />
          </mesh>
        </>
      ) : (
        <mesh position={[shellX - length * 0.02, roofTopY + 0.03, 0]}>
          <boxGeometry args={[roofLength * 0.66, 0.028, roofWidth * 0.94]} />
          <Mat color={paint.trimColor} roughness={0.32} metalness={0.56} />
        </mesh>
      )}

      <CarLight
        position={[length * 0.45, baseY + 0.03, baseWidth * 0.28]}
        size={[0.04, 0.1, 0.14]}
        color={paint.accentColor}
      />
      <CarLight
        position={[length * 0.45, baseY + 0.03, -baseWidth * 0.28]}
        size={[0.04, 0.1, 0.14]}
        color={paint.accentColor}
      />
      <CarLight
        position={[-length * 0.44, baseY + 0.03, baseWidth * 0.29]}
        size={[0.04, 0.12, 0.16]}
        color="#ef4444"
      />
      <CarLight
        position={[-length * 0.44, baseY + 0.03, -baseWidth * 0.29]}
        size={[0.04, 0.12, 0.16]}
        color="#ef4444"
      />

      <mesh position={[length * 0.46, baseY - 0.01, 0]}>
        <boxGeometry args={[0.06, 0.1, width * 0.48]} />
        <Mat color={paint.trimColor} roughness={0.26} metalness={0.66} />
      </mesh>
      <mesh position={[-length * 0.46, baseY - 0.01, 0]}>
        <boxGeometry args={[0.06, 0.1, width * 0.48]} />
        <Mat color={paint.trimColor} roughness={0.3} metalness={0.54} />
      </mesh>
      <mesh position={[length * 0.47, baseY + 0.01, 0]}>
        <boxGeometry args={[0.03, 0.08, width * 0.28]} />
        <meshBasicMaterial color="#20242a" />
      </mesh>
      <mesh position={[-length * 0.48, baseY + 0.02, 0]}>
        <boxGeometry args={[0.03, 0.08, width * 0.24]} />
        <meshBasicMaterial color="#20242a" />
      </mesh>

      <CarWheelSet
        wheelBase={wheelBase}
        trackHalf={trackHalf}
        radius={wheelRadius}
        thickness={wheelThickness}
        hubColor={paint.trimColor}
      />
    </group>
  );
}

function CarPrefab({ obj }: { obj: ResolvedLayoutObject }) {
  const palette: Record<string, CarPaint> = {
    "car-sedan": {
      kind: "sedan",
      bodyColor: "#4e73bf",
      roofColor: "#2a3f6a",
      glassColor: "#516783",
      trimColor: "#bcc5cf",
      accentColor: "#fff0b5",
    },
    "car-van": {
      kind: "van",
      bodyColor: "#bf554d",
      roofColor: "#873330",
      glassColor: "#4f6277",
      trimColor: "#d5d7db",
      accentColor: "#ffe6a8",
    },
    "car-suv": {
      kind: "suv",
      bodyColor: "#4d8c57",
      roofColor: "#2c5b35",
      glassColor: "#506772",
      trimColor: "#d7dee4",
      accentColor: "#fff0bc",
    },
    "car-hatchback": {
      kind: "hatchback",
      bodyColor: "#d39a2d",
      roofColor: "#8e5e16",
      glassColor: "#5d6f82",
      trimColor: "#e6dac0",
      accentColor: "#ffe8a6",
    },
    "car-taxi": {
      kind: "taxi",
      bodyColor: "#efc82d",
      roofColor: "#a88515",
      glassColor: "#596a7a",
      trimColor: "#1d1d1f",
      accentColor: "#fff3c7",
    },
    "car-sedan2": {
      kind: "sedan",
      bodyColor: "#7b858f",
      roofColor: "#4a515b",
      glassColor: "#56616f",
      trimColor: "#ced6de",
      accentColor: "#f6edd5",
    },
    "car-police": {
      kind: "police",
      bodyColor: "#121829",
      roofColor: "#0d1422",
      glassColor: "#506175",
      trimColor: "#d2d8df",
      accentColor: "#eef4ff",
      secondaryColor: "#f3f5f7",
    },
    "car-delivery": {
      kind: "delivery",
      bodyColor: "#a46530",
      roofColor: "#5f3417",
      glassColor: "#556472",
      trimColor: "#e5d8c7",
      accentColor: "#ffefb2",
      secondaryColor: "#f1dfb3",
      label: "VIDEO EXPRESS",
    },
  };

  const paint = palette[obj.id] ?? palette["car-sedan"];

  switch (paint.kind) {
    case "van":
    case "delivery":
      return <VanCar obj={obj} paint={paint} />;
    default:
      return <PassengerCar obj={obj} paint={paint} />;
  }
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
      shelfId={obj.id}
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
      shelfId={obj.id}
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
      shelfId={obj.id}
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
    case "sign/storefront-marquee":
      return <StorefrontMarqueePrefab key={obj.id} obj={obj} />;
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
