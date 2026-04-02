"use client";

import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Text,
  Grid,
} from "@react-three/drei";
import * as THREE from "three";
import type { EditorObject } from "./page";

interface EditorCollider {
  id: string;
  x: number;
  z: number;
  hw: number;
  hd: number;
}

// ── Room dimensions ──
const ROOM_W = 20;
const ROOM_D = 14;
const WALL_H = 4;

// ── Category colors (hex -> THREE.Color) ──
const CAT_COLORS: Record<string, string> = {
  shelf: "#8B5E3C",
  counter: "#D2B48C",
  npc: "#3b82f6",
  prop: "#22c55e",
  wall: "#ffd700",
  door: "#a0c0e0",
  exterior: "#ff6b6b",
};

// ── Category default heights ──
const CAT_HEIGHTS: Record<string, number> = {
  shelf: 1.8,
  counter: 1.0,
  npc: 1.7,
  prop: 0.8,
  wall: 0.3,
  door: 2.2,
  exterior: 2.5,
};

// ── Single store object box ──
function StoreBox({
  obj,
  isSelected,
  onClick,
}: {
  obj: EditorObject;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const w = obj.w ?? 0.5;
  const d = obj.d ?? 0.5;
  const h = obj._height ?? CAT_HEIGHTS[obj.category] ?? 1.0;
  const color = obj._color ?? CAT_COLORS[obj.category] ?? "#888";
  const opacity = obj.hidden ? 0.22 : isSelected ? 0.9 : 0.7;
  const outlineColor = obj.locked ? "#ef4444" : "#ffffff";

  return (
    <group
      position={[obj.x, obj.y + h / 2, obj.z]}
      rotation={[0, obj.rotY ?? 0, 0]}
    >
      {/* Main box */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Wireframe outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color={outlineColor} linewidth={2} />
        </lineSegments>
      )}

      {/* Floating label */}
      <Text
        position={[0, h / 2 + 0.3, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {obj.id}
      </Text>
    </group>
  );
}

// ── Translucent walls ──
function Walls() {
  const wallMat = (
    <meshStandardMaterial
      color="#334"
      transparent
      opacity={0.15}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group>
      {/* Back wall (z = -ROOM_D/2) */}
      <mesh position={[0, WALL_H / 2, -ROOM_D / 2]}>
        <planeGeometry args={[ROOM_W, WALL_H]} />
        {wallMat}
      </mesh>
      {/* Front wall (z = +ROOM_D/2) */}
      <mesh position={[0, WALL_H / 2, ROOM_D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM_W, WALL_H]} />
        {wallMat}
      </mesh>
      {/* Left wall (x = -ROOM_W/2) */}
      <mesh
        position={[-ROOM_W / 2, WALL_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_D, WALL_H]} />
        {wallMat}
      </mesh>
      {/* Right wall (x = +ROOM_W/2) */}
      <mesh
        position={[ROOM_W / 2, WALL_H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_D, WALL_H]} />
        {wallMat}
      </mesh>
    </group>
  );
}

// ── Camera position reporter ──
function CameraReporter({
  onCameraMove,
}: {
  onCameraMove: (pos: string) => void;
}) {
  const { camera } = useThree();
  const lastRef = useRef("");

  useFrame(() => {
    const p = camera.position;
    const s = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
    if (s !== lastRef.current) {
      lastRef.current = s;
      onCameraMove(s);
    }
  });

  return null;
}

// ── Transform controls wrapper ──
function SelectedTransform({
  obj,
  mode,
  orbitRef,
  onTransformEnd,
}: {
  obj: EditorObject;
  mode: "translate" | "rotate" | "scale";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitRef: React.RefObject<any>;
  onTransformEnd: (
    id: string,
    pos: [number, number, number],
    rotY: number
  ) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const w = obj.w ?? 0.5;
  const d = obj.d ?? 0.5;
  const h = obj._height ?? CAT_HEIGHTS[obj.category] ?? 1.0;
  const [dragging, setDragging] = useState(false);

  // Disable orbit controls while dragging transform
  useEffect(() => {
    const ctrl = transformRef.current;
    if (!ctrl) return;
    const handler = (event: { value: boolean }) => {
      setDragging(event.value);
      if (orbitRef.current) {
        (orbitRef.current as { enabled: boolean }).enabled = !event.value;
      }
      if (!event.value && groupRef.current) {
        const p = groupRef.current.position;
        const r = groupRef.current.rotation;
        onTransformEnd(obj.id, [p.x, p.y - h / 2, p.z], r.y);
      }
    };
    (ctrl as any).addEventListener("dragging-changed", handler);
    return () => {
      (ctrl as any).removeEventListener("dragging-changed", handler);
    };
  }, [obj.id, obj.category, h, orbitRef, onTransformEnd, dragging]);

  return (
    <TransformControls
      ref={transformRef}
      object={groupRef.current ?? undefined}
      mode={mode}
      size={0.7}
    >
      <group
        ref={groupRef}
        position={[obj.x, obj.y + h / 2, obj.z]}
        rotation={[0, obj.rotY ?? 0, 0]}
      >
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={obj._color ?? CAT_COLORS[obj.category] ?? "#888"}
            transparent
            opacity={obj.hidden ? 0.3 : 0.9}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color={obj.locked ? "#ef4444" : "#ffffff"} linewidth={2} />
        </lineSegments>
        <Text
          position={[0, h / 2 + 0.3, 0]}
          fontSize={0.25}
          color="#ffd700"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
          fontWeight="bold"
        >
          {obj.id}
        </Text>
      </group>
    </TransformControls>
  );
}

// ── Main scene content (inside Canvas) ──
export default function SceneContent({
  objects,
  colliders,
  showColliders,
  selectedId,
  transformMode,
  onSelect,
  onTransformEnd,
  onCameraMove,
}: {
  objects: EditorObject[];
  colliders: EditorCollider[];
  showColliders: boolean;
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void;
  onTransformEnd: (
    id: string,
    pos: [number, number, number],
    rotY: number
  ) => void;
  onCameraMove: (pos: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitRef = useRef<any>(null);
  const selectedObj = objects.find((o) => o.id === selectedId) ?? null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      {/* Camera controls */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={60}
      />

      {/* Camera reporter */}
      <CameraReporter onCameraMove={onCameraMove} />

      {/* Floor grid */}
      <Grid
        args={[ROOM_W, ROOM_D]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#334"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#556"
        fadeDistance={50}
        position={[0, -0.01, 0]}
      />

      {/* Floor plane (clickable to deselect) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onClick={() => onSelect(null)}
      >
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial
          color="#141830"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Walls */}
      <Walls />

      {/* Objects (skip selected — it's rendered by TransformControls) */}
      {objects
        .filter((o) => o.id !== selectedId)
        .map((obj) => (
          <StoreBox
            key={obj.id}
            obj={obj}
            isSelected={false}
            onClick={() => onSelect(obj.id)}
          />
        ))}

      {showColliders &&
        colliders.map((collider) => (
          <mesh
            key={`collider-${collider.id}`}
            position={[collider.x, 0.5, collider.z]}
          >
            <boxGeometry args={[collider.hw * 2, 1, collider.hd * 2]} />
            <meshStandardMaterial
              color="#f59e0b"
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>
        ))}

      {/* Selected object with transform gizmo */}
      {selectedObj && (
        <SelectedTransform
          key={selectedObj.id}
          obj={selectedObj}
          mode={transformMode}
          orbitRef={orbitRef}
          onTransformEnd={onTransformEnd}
        />
      )}
    </>
  );
}
