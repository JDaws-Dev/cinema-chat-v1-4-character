"use client";

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ROOM_W, ROOM_D, ROOM_H, WALL_COLOR, FLOOR_COLOR, CEILING_COLOR } from "./store-constants";
import { Mat } from "./store-materials";

// ── Merged static architecture — reduces ~20 draw calls to ~5 ──
export function MergedArchitecture({ topDown }: { topDown: boolean }) {
  const { wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo } = useMemo(() => {
    // ── WALLS (WALL_COLOR) ──
    const walls: THREE.BufferGeometry[] = [];
    // Back wall
    const w0 = new THREE.PlaneGeometry(ROOM_W, ROOM_H); w0.translate(0, ROOM_H / 2, -ROOM_D / 2); walls.push(w0);
    // Front wall panels (around door gap)
    const w1 = new THREE.PlaneGeometry(8, 0.3); w1.translate(-6, 0.15, ROOM_D / 2); walls.push(w1);
    const w2 = new THREE.PlaneGeometry(8, 1.0); w2.translate(-6, 3.0, ROOM_D / 2); walls.push(w2);
    const w3 = new THREE.PlaneGeometry(1, 2.2); w3.translate(-9.5, 1.4, ROOM_D / 2); walls.push(w3);
    const w4 = new THREE.PlaneGeometry(8, 0.3); w4.translate(6, 0.15, ROOM_D / 2); walls.push(w4);
    const w5 = new THREE.PlaneGeometry(8, 1.0); w5.translate(6, 3.0, ROOM_D / 2); walls.push(w5);
    const w6 = new THREE.PlaneGeometry(1, 2.2); w6.translate(9.5, 1.4, ROOM_D / 2); walls.push(w6);
    // Left wall segments (with employee door gap)
    const w7 = new THREE.PlaneGeometry(1.31, ROOM_H); w7.rotateY(Math.PI / 2); w7.translate(-ROOM_W / 2, ROOM_H / 2, -6.345); walls.push(w7);
    const w8 = new THREE.PlaneGeometry(1.0, ROOM_H - 2.35); w8.rotateY(Math.PI / 2); w8.translate(-ROOM_W / 2, (2.35 + ROOM_H) / 2, -5.19); walls.push(w8);
    const w9 = new THREE.PlaneGeometry(11.69, ROOM_H); w9.rotateY(Math.PI / 2); w9.translate(-ROOM_W / 2, ROOM_H / 2, 1.155); walls.push(w9);
    // Right wall
    const w10 = new THREE.PlaneGeometry(ROOM_D, ROOM_H); w10.rotateY(-Math.PI / 2); w10.translate(ROOM_W / 2, ROOM_H / 2, 0); walls.push(w10);
    // Storefront wall panels (WALL_COLOR)
    const w11 = new THREE.BoxGeometry(4, 0.7, 0.15); w11.translate(0, ROOM_H - 0.25, ROOM_D / 2); walls.push(w11);
    const w12 = new THREE.BoxGeometry(8, 0.5, 0.06); w12.translate(-5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w12);
    const w13 = new THREE.BoxGeometry(8, 0.5, 0.06); w13.translate(5.7, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w13);
    const w14 = new THREE.BoxGeometry(1.2, 0.5, 0.06); w14.translate(0, ROOM_H - 0.15, ROOM_D / 2 + 0.01); walls.push(w14);
    // Knee wall below windows
    const w15 = new THREE.BoxGeometry(ROOM_W - 0.1, 0.26, 0.15); w15.translate(0, 0.13, ROOM_D / 2 - 0.01); walls.push(w15);

    const wallGeo = mergeGeometries(walls, false);
    walls.forEach(g => g.dispose());

    // ── FLOOR (main floor plane only — entrance mat is a different color) ──
    const f0 = new THREE.PlaneGeometry(ROOM_W, ROOM_D); f0.rotateX(-Math.PI / 2);
    const floorGeo = f0;

    // ── CEILING (only when not top-down) ──
    let ceilingGeo: THREE.BufferGeometry | null = null;
    if (!topDown) {
      const ceils: THREE.BufferGeometry[] = [];
      // Main ceiling plane
      const c0 = new THREE.PlaneGeometry(ROOM_W + 2, ROOM_D + 2); c0.rotateX(Math.PI / 2); c0.translate(0, ROOM_H, 0); ceils.push(c0);
      // Front soffit
      const c1 = new THREE.BoxGeometry(ROOM_W + 2, 0.35, 1.0); c1.translate(0, ROOM_H - 0.15, ROOM_D / 2 - 0.05); ceils.push(c1);
      // Side soffits
      const c2 = new THREE.BoxGeometry(0.5, 0.35, ROOM_D + 2); c2.translate(-ROOM_W / 2, ROOM_H - 0.15, 0); ceils.push(c2);
      const c3 = new THREE.BoxGeometry(0.5, 0.35, ROOM_D + 2); c3.translate(ROOM_W / 2, ROOM_H - 0.15, 0); ceils.push(c3);
      // Back soffit
      const c4 = new THREE.BoxGeometry(ROOM_W + 2, 0.35, 0.5); c4.translate(0, ROOM_H - 0.15, -ROOM_D / 2 + 0.05); ceils.push(c4);

      ceilingGeo = mergeGeometries(ceils, false);
      ceils.forEach(g => g.dispose());
    }

    // ── YELLOW ACCENT STRIPES ──
    const accents: THREE.BufferGeometry[] = [];
    const a0 = new THREE.BoxGeometry(ROOM_W, 0.06, 0.02); a0.translate(0, 2.8, -ROOM_D / 2 + 0.06); accents.push(a0);
    const a1 = new THREE.BoxGeometry(8, 0.06, 0.02); a1.translate(-6, 2.8, ROOM_D / 2 - 0.02); accents.push(a1);
    const a2 = new THREE.BoxGeometry(8, 0.06, 0.02); a2.translate(6, 2.8, ROOM_D / 2 - 0.02); accents.push(a2);
    const a3 = new THREE.BoxGeometry(ROOM_D, 0.06, 0.02); a3.rotateY(Math.PI / 2); a3.translate(-ROOM_W / 2 + 0.02, 2.8, 0); accents.push(a3);
    const a4 = new THREE.BoxGeometry(ROOM_D, 0.06, 0.02); a4.rotateY(Math.PI / 2); a4.translate(ROOM_W / 2 - 0.02, 2.8, 0); accents.push(a4);

    const accentGeo = mergeGeometries(accents, false);
    accents.forEach(g => g.dispose());

    // ── BASEBOARDS ──
    const bbs: THREE.BufferGeometry[] = [];
    // Back wall baseboard
    const b0 = new THREE.BoxGeometry(ROOM_W, 0.15, 0.05); b0.translate(0, 0.075, -ROOM_D / 2 + 0.025); bbs.push(b0);
    // Left wall baseboard
    const b1 = new THREE.BoxGeometry(ROOM_D, 0.15, 0.05); b1.rotateY(Math.PI / 2); b1.translate(-ROOM_W / 2 + 0.025, 0.075, 0); bbs.push(b1);
    // Right wall baseboard
    const b2 = new THREE.BoxGeometry(ROOM_D, 0.15, 0.05); b2.rotateY(Math.PI / 2); b2.translate(ROOM_W / 2 - 0.025, 0.075, 0); bbs.push(b2);

    const baseboardGeo = mergeGeometries(bbs, false);
    bbs.forEach(g => g.dispose());

    return { wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo };
  }, [topDown]);

  // Dispose merged geometries on unmount
  useEffect(() => {
    return () => {
      wallGeo?.dispose();
      floorGeo?.dispose();
      ceilingGeo?.dispose();
      accentGeo?.dispose();
      baseboardGeo?.dispose();
    };
  }, [wallGeo, floorGeo, ceilingGeo, accentGeo, baseboardGeo]);

  return (
    <>
      {/* Merged walls */}
      {wallGeo && <mesh geometry={wallGeo}><Mat color={WALL_COLOR} roughness={0.85} side={THREE.DoubleSide} /></mesh>}
      {/* Merged floor */}
      {floorGeo && <mesh geometry={floorGeo}><Mat color={FLOOR_COLOR} roughness={0.95} /></mesh>}
      {/* Merged ceiling + soffits */}
      {ceilingGeo && <mesh geometry={ceilingGeo}><Mat color={CEILING_COLOR} roughness={0.9} side={THREE.DoubleSide} /></mesh>}
      {/* Merged yellow accent stripes */}
      {accentGeo && <mesh geometry={accentGeo}><Mat color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} /></mesh>}
      {/* Merged baseboards */}
      {baseboardGeo && <mesh geometry={baseboardGeo}><Mat color="#0a1428" roughness={0.8} /></mesh>}
    </>
  );
}
