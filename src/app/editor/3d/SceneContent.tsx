"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Text,
  Grid,
} from "@react-three/drei";
import * as THREE from "three";
import { Store } from "@/components/game3d/Store";
import type { EditorObject } from "./page";

interface EditorCollider {
  id: string;
  x: number;
  z: number;
  hw: number;
  hd: number;
}

// ── Scene dimensions ──
const SCENE_W = 32;
const SCENE_D = 22;
const STORE_W = 20;
const STORE_D = 14;
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

function getEditorBoxFootprint(obj: EditorObject): { w: number; d: number } {
  const worldW = obj.w ?? 0.5;
  const worldD = obj.d ?? 0.5;
  const prefabId = obj._prefabId ?? obj.prefab;

  const usesFacingWidth =
    prefabId === "wall/poster" ||
    prefabId === "prop/bulletin-board" ||
    prefabId === "prop/wall-clock" ||
    prefabId === "prop/crt-tv" ||
    prefabId?.startsWith("sign/");

  if (!usesFacingWidth) {
    return { w: worldW, d: worldD };
  }

  return {
    w: Math.max(worldW, worldD),
    d: Math.min(worldW, worldD),
  };
}

function getEditorBoxRotationY(obj: EditorObject): number {
  const prefabId = obj._prefabId ?? obj.prefab;
  if (prefabId === "prop/crt-tv" && typeof obj.meta?.yaw === "number") {
    return obj.meta.yaw;
  }
  return obj.rotY ?? 0;
}

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
  const { w, d } = getEditorBoxFootprint(obj);
  const rotY = getEditorBoxRotationY(obj);
  const h = obj._height ?? CAT_HEIGHTS[obj.category] ?? 1.0;
  const color = obj._color ?? CAT_COLORS[obj.category] ?? "#888";
  const opacity = obj.hidden ? 0.22 : isSelected ? 0.9 : 0.7;
  const outlineColor = obj.locked ? "#ef4444" : "#ffffff";

  return (
    <group
      position={[obj.x, obj.y + h / 2, obj.z]}
      rotation={[0, rotY, 0]}
    >
      {/* Main box */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial
            color={outlineColor}
            linewidth={2}
            depthTest={false}
          />
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

// ── Store guide frame ──
function StoreFrame() {
  return (
    <group>
      <lineSegments position={[0, WALL_H / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(STORE_W, WALL_H, STORE_D)]} />
        <lineBasicMaterial color="#556" />
      </lineSegments>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[STORE_W, STORE_D]} />
        <meshStandardMaterial color="#1a223c" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function StorePreview() {
  const previewRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    preview.traverse((child) => {
      (
        child as THREE.Object3D & {
          raycast?: (
            raycaster: THREE.Raycaster,
            intersects: THREE.Intersection[]
          ) => void;
        }
      ).raycast = () => {};
    });
  }, []);

  return (
    <group ref={previewRef}>
      <Store isMobile={false} maxNpcs={0} topDown={false} />
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

function FocusSelection({
  selectedObj,
  focusToken,
  orbitRef,
}: {
  selectedObj: EditorObject | null;
  focusToken: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!selectedObj || focusToken === 0 || !orbitRef.current) return;
    const controls = orbitRef.current as {
      target: THREE.Vector3;
      update: () => void;
    };
    const nextTarget = new THREE.Vector3(
      selectedObj.x,
      selectedObj.y + (selectedObj._height ?? CAT_HEIGHTS[selectedObj.category] ?? 1) * 0.5,
      selectedObj.z
    );
    const currentOffset = camera.position.clone().sub(controls.target);
    controls.target.copy(nextTarget);
    camera.position.copy(nextTarget.clone().add(currentOffset));
    controls.update();
  }, [camera, focusToken, orbitRef, selectedObj]);

  return null;
}

// ── Transform controls wrapper ──
function SelectedTransform({
  obj,
  mode,
  space,
  rotationSnap,
  orbitRef,
  onTransformEnd,
}: {
  obj: EditorObject;
  mode: "translate" | "rotate" | "scale";
  space: "local" | "world";
  rotationSnap?: number;
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
  const { w, d } = getEditorBoxFootprint(obj);
  const rotY = getEditorBoxRotationY(obj);
  const h = obj._height ?? CAT_HEIGHTS[obj.category] ?? 1.0;

  // Disable orbit controls while dragging transform
  useEffect(() => {
    const ctrl = transformRef.current;
    if (!ctrl || !groupRef.current) return;
    (ctrl as { attach: (object: THREE.Object3D) => void }).attach(groupRef.current);
    const handler = (event: { value: boolean }) => {
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
      (ctrl as { detach: () => void }).detach();
    };
  }, [obj.id, obj.category, h, orbitRef, onTransformEnd]);

  return (
    <TransformControls
      ref={transformRef}
      mode={mode}
      space={space}
      rotationSnap={rotationSnap}
      enabled={!obj.locked}
      size={0.7}
    >
      <group
        ref={groupRef}
        position={[obj.x, obj.y + h / 2, obj.z]}
        rotation={[0, rotY, 0]}
      >
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={obj._color ?? CAT_COLORS[obj.category] ?? "#888"}
            transparent
            opacity={obj.hidden ? 0.3 : 0.9}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial
            color={obj.locked ? "#ef4444" : "#ffffff"}
            linewidth={2}
            depthTest={false}
          />
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
  transformSpace,
  rotationSnap,
  focusToken,
  onSelect,
  onTransformEnd,
  onCameraMove,
}: {
  objects: EditorObject[];
  colliders: EditorCollider[];
  showColliders: boolean;
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  transformSpace: "local" | "world";
  rotationSnap?: number;
  focusToken: number;
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
      <FocusSelection
        selectedObj={selectedObj}
        focusToken={focusToken}
        orbitRef={orbitRef}
      />

      {/* Floor grid */}
      <Grid
        args={[SCENE_W, SCENE_D]}
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
        <planeGeometry args={[SCENE_W + 8, SCENE_D + 8]} />
        <meshStandardMaterial
          color="#141830"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Store guide frame */}
      <StoreFrame />

      {/* Real scene preview */}
      <StorePreview />

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
              depthTest={false}
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
          space={transformSpace}
          rotationSnap={rotationSnap}
          orbitRef={orbitRef}
          onTransformEnd={onTransformEnd}
        />
      )}
    </>
  );
}
