"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mobileInput } from "./MobileControls";

interface InteractionProps {
  onInteract: (type: string, data?: string) => void;
  onHover?: (label: string | null) => void;
}

// Raycaster for detecting what the player is looking at
export function InteractionSystem({ onInteract, onHover }: InteractionProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const prevLabel = useRef<string | null>(null);

  useFrame(() => {
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    let found = false;
    for (const hit of intersects) {
      if (hit.distance > 4) continue; // only interact with nearby objects
      const obj = hit.object;
      const name = obj.userData?.interactType || findParentData(obj);
      if (name) {
        setHoverLabel(obj.userData?.label || findParentLabel(obj) || name);
        found = true;
        break;
      }
    }
    if (!found) setHoverLabel(null);

    // Notify parent of hover changes
    const currentLabel = found ? hoverLabel : null;
    if (currentLabel !== prevLabel.current) {
      prevLabel.current = currentLabel;
      onHover?.(currentLabel);
    }

    // Check mobile interact button
    if (mobileInput.interact) {
      mobileInput.interact = false;
      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      for (const hit of hits) {
        if (hit.distance > 4) continue;
        const obj = hit.object;
        const type = obj.userData?.interactType || findParentData(obj);
        const data = obj.userData?.interactData || findParentInteractData(obj);
        if (type) {
          onInteract(type, data);
          break;
        }
      }
    }
  });

  // Only interact when pointer is locked (not the click that locks it)
  const handleClick = useCallback(() => {
    if (document.pointerLockElement === null) return; // ignore click that locks pointer

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      if (hit.distance > 4) continue;
      const obj = hit.object;
      const type = obj.userData?.interactType || findParentData(obj);
      const data = obj.userData?.interactData || findParentInteractData(obj);
      if (type) {
        onInteract(type, data);
        break;
      }
    }
  }, [camera, scene, onInteract]);

  // Attach click to canvas element (fires when pointer is locked)
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, [gl, handleClick]);

  return (
    <>
      {/* HUD label rendered as HTML overlay — handled by parent component */}
      {/* We communicate via a global for the parent to read */}
      {hoverLabel && (
        <group>
          {/* Store hover state for parent to read */}
        </group>
      )}
    </>
  );
}

// Walk up the parent chain to find userData
function findParentData(obj: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = obj;
  while (current) {
    if (current.userData?.interactType) return current.userData.interactType;
    current = current.parent;
  }
  return null;
}

function findParentLabel(obj: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = obj;
  while (current) {
    if (current.userData?.label) return current.userData.label;
    current = current.parent;
  }
  return null;
}

function findParentInteractData(obj: THREE.Object3D): string | undefined {
  let current: THREE.Object3D | null = obj;
  while (current) {
    if (current.userData?.interactData) return current.userData.interactData;
    current = current.parent;
  }
  return undefined;
}
