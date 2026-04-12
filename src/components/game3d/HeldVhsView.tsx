"use client";

import React, { useEffect, useMemo } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Mat } from "./store-materials";

interface HeldMovieView {
  id: number;
  title: string;
  genre: string;
}

const CASE_SIZE: [number, number, number] = [0.24, 0.34, 0.06];
const LABEL_COLORS = ["#1a3a6a", "#7a1f2b", "#1f5b3d", "#6a4b1a"];

function getTapeLabel(title: string): string {
  const compact = title.replace(/[^A-Za-z0-9 ]/g, "").trim().toUpperCase();
  return compact.length > 18 ? compact.slice(0, 18) : compact;
}

export function HeldVhsView({
  movies,
  visible = true,
}: {
  movies: HeldMovieView[];
  visible?: boolean;
}) {
  const { camera } = useThree();
  const anchor = useMemo(() => new THREE.Group(), []);

  useEffect(() => {
    anchor.position.set(0.48, -0.34, -0.82);
    camera.add(anchor);

    return () => {
      camera.remove(anchor);
    };
  }, [anchor, camera]);

  useEffect(() => {
    anchor.traverse((child) => {
      (
        child as THREE.Object3D & {
          raycast?: (
            raycaster: THREE.Raycaster,
            intersects: THREE.Intersection[]
          ) => void;
        }
      ).raycast = () => {};
    });
  }, [anchor, movies.length]);

  useEffect(() => {
    anchor.visible = visible && movies.length > 0;
  }, [anchor, movies.length, visible]);

  useFrame((state) => {
    if (!anchor.visible) return;
    const t = state.clock.elapsedTime;
    anchor.position.set(
      0.48 + Math.sin(t * 1.5) * 0.008,
      -0.34 + Math.sin(t * 2.1) * 0.006,
      -0.82
    );
    anchor.rotation.set(
      -0.12 + Math.sin(t * 1.2) * 0.015,
      -0.3 + Math.sin(t * 1.1) * 0.015,
      -0.06 + Math.sin(t * 1.8) * 0.01
    );
  });

  return createPortal(
    <group>
      {movies.slice(0, 3).map((movie, index) => {
        const x = -index * 0.06;
        const y = -index * 0.015;
        const z = index * 0.035;
        const rotZ = -0.14 + index * 0.08;
        const accent = LABEL_COLORS[index % LABEL_COLORS.length];

        return (
          <group key={movie.id} position={[x, y, z]} rotation={[0.04, 0, rotZ]}>
            <mesh>
              <boxGeometry args={CASE_SIZE} />
              <Mat color="#101216" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.01, CASE_SIZE[2] / 2 + 0.002]}>
              <planeGeometry args={[0.19, 0.28]} />
              <meshBasicMaterial color="#0e1624" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, CASE_SIZE[2] / 2 + 0.001]}>
              <planeGeometry args={[0.18, 0.26]} />
              <meshBasicMaterial color="#f1ead2" toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.11, CASE_SIZE[2] / 2 + 0.003]}>
              <planeGeometry args={[0.18, 0.05]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <Text
              position={[0, -0.108, CASE_SIZE[2] / 2 + 0.006]}
              fontSize={0.022}
              color="#fdf7e3"
              anchorX="center"
              anchorY="middle"
              maxWidth={0.16}
            >
              {getTapeLabel(movie.title)}
            </Text>
            <mesh position={[CASE_SIZE[0] / 2 + 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[CASE_SIZE[2], CASE_SIZE[1] - 0.04]} />
              <meshBasicMaterial color="#d6ceb4" toneMapped={false} />
            </mesh>
            <mesh
              position={[CASE_SIZE[0] / 2 + 0.002, 0.08, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[CASE_SIZE[2], 0.08]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <Text
              position={[0, 0.08, CASE_SIZE[2] / 2 + 0.006]}
              fontSize={0.018}
              color={accent}
              anchorX="center"
              anchorY="middle"
              maxWidth={0.14}
            >
              WHERE TO WATCH
            </Text>
          </group>
        );
      })}

      <mesh position={[0.02, -0.31, 0.02]} rotation={[0.1, 0.2, -0.2]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <Mat color="#d9b38c" roughness={0.9} />
      </mesh>

      {movies.length > 3 && (
        <group position={[-0.18, -0.12, 0.14]}>
          <mesh>
            <boxGeometry args={[0.11, 0.11, 0.03]} />
            <meshBasicMaterial color="#0a1830" toneMapped={false} />
          </mesh>
          <Text
            position={[0, 0, 0.017]}
            fontSize={0.05}
            color="#ffd700"
            anchorX="center"
            anchorY="middle"
          >
            +{movies.length - 3}
          </Text>
        </group>
      )}
    </group>,
    anchor
  );
}
