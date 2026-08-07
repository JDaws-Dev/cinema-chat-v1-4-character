"use client";

// Procedural surface textures, drawn to canvas at runtime.
//
// Why generated instead of image files: every surface in the store was a flat
// color with a roughness value, which is why it read as untextured boxes no
// matter what the lights did. Real texture maps fix that — but shipping image
// assets means more fetches on a page that already streams ~200 posters. These
// are a few hundred KB of canvas ops that run once, cache forever, and cost
// nothing at load.
//
// All of them tile seamlessly (edges are drawn to wrap) so they can repeat
// across a 20m floor without a visible seam.

import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

/** Deterministic PRNG so the same surface looks identical across reloads. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null; // SSR guard
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  return { c, g };
}

function finish(
  key: string,
  c: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
): THREE.Texture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/**
 * Commercial cut-pile carpet — the dark patterned stuff every rental chain had.
 * Base navy with lighter flecks and a faint repeating diamond, so the floor
 * reads as fibre instead of a painted plane.
 */
export function getCarpetTexture(repeat = 24): THREE.Texture | null {
  const key = `carpet:${repeat}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const made = makeCanvas(256);
  if (!made) return null;
  const { c, g } = made;
  const rand = mulberry32(1989);

  g.fillStyle = "#2a2f4a";
  g.fillRect(0, 0, 256, 256);

  // Fibre speckle — thousands of 1-2px flecks in a few related hues.
  const flecks = ["#343a58", "#232840", "#3d4463", "#1e2338"];
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = flecks[(rand() * flecks.length) | 0];
    const x = rand() * 256;
    const y = rand() * 256;
    g.fillRect(x, y, 1 + (rand() > 0.85 ? 1 : 0), 1);
  }

  // Large-scale tonal mottling instead of a lattice.
  //
  // The first attempt used a diamond lattice, pushed hard so it would survive
  // the viewing distance. It survived — as an obvious grid that read like vinyl
  // tile, not carpet. The distinguishing feature of broadloom carpet at a
  // distance isn't line work at all, it's soft irregular patches of shade where
  // the pile lies differently. So: overlapping soft radial blobs, drawn nine
  // times in a 3×3 offset pass so blobs that fall off one edge come back on the
  // other and the tile still wraps seamlessly.
  const blobs: { x: number; y: number; r: number; light: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    blobs.push({ x: rand() * 256, y: rand() * 256, r: 26 + rand() * 52, light: rand() > 0.5 });
  }
  for (const b of blobs) {
    for (const ox of [-256, 0, 256]) {
      for (const oy of [-256, 0, 256]) {
        const grad = g.createRadialGradient(b.x + ox, b.y + oy, 0, b.x + ox, b.y + oy, b.r);
        const tint = b.light ? "120,132,175" : "18,22,38";
        grad.addColorStop(0, `rgba(${tint},0.16)`);
        grad.addColorStop(1, `rgba(${tint},0)`);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(b.x + ox, b.y + oy, b.r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  return finish(key, c, repeat, repeat);
}

/**
 * Acoustic ceiling tile — off-white fissured board on a 2ft grid. The seam is
 * drawn at the tile edge so repeating produces a real grid, which means the
 * separate transparent grid meshes in Store.tsx become redundant.
 */
export function getCeilingTileTexture(repeat = 10): THREE.Texture | null {
  const key = `ceiling:${repeat}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const made = makeCanvas(256);
  if (!made) return null;
  const { c, g } = made;
  const rand = mulberry32(4242);

  g.fillStyle = "#d8d3c4";
  g.fillRect(0, 0, 256, 256);

  // Fissures — short irregular strokes, the classic mineral-fibre look.
  g.strokeStyle = "rgba(150,144,130,0.5)";
  g.lineWidth = 1;
  for (let i = 0; i < 260; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rand() - 0.5) * 26, y + (rand() - 0.5) * 10);
    g.stroke();
  }
  // Pinholes.
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = "rgba(140,134,120,0.35)";
    g.fillRect(rand() * 256, rand() * 256, 1, 1);
  }
  // Grid seam at the tile boundary.
  g.strokeStyle = "rgba(90,86,78,0.55)";
  g.lineWidth = 3;
  g.strokeRect(0, 0, 256, 256);
  return finish(key, c, repeat, repeat);
}

/**
 * Shelf board wood — warm laminate with directional grain and darkened edges,
 * so gondola boards stop reading as solid brown slabs.
 */
export function getWoodTexture(repeatX = 4, repeatY = 1): THREE.Texture | null {
  const key = `wood:${repeatX}:${repeatY}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const made = makeCanvas(256);
  if (!made) return null;
  const { c, g } = made;
  const rand = mulberry32(777);

  g.fillStyle = "#7a5a30";
  g.fillRect(0, 0, 256, 256);

  // Grain: long horizontal strokes of varying darkness and thickness.
  for (let i = 0; i < 190; i++) {
    const y = rand() * 256;
    const dark = rand() > 0.5;
    g.strokeStyle = dark
      ? `rgba(78,54,26,${0.10 + rand() * 0.28})`
      : `rgba(156,120,70,${0.06 + rand() * 0.20})`;
    g.lineWidth = 1 + rand() * 2.2;
    g.beginPath();
    g.moveTo(0, y);
    // Gentle waver, returning to the same y at both edges so it tiles.
    for (let x = 0; x <= 256; x += 32) {
      const wobble = x === 0 || x === 256 ? 0 : (rand() - 0.5) * 3;
      g.lineTo(x, y + wobble);
    }
    g.stroke();
  }
  // Edge wear along the board lip.
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "rgba(40,26,12,0.30)");
  grad.addColorStop(0.12, "rgba(40,26,12,0)");
  grad.addColorStop(0.88, "rgba(40,26,12,0)");
  grad.addColorStop(1, "rgba(40,26,12,0.30)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return finish(key, c, repeatX, repeatY);
}

/**
 * Painted drywall — near-flat with just enough roller stipple and a slow value
 * drift to catch the falloff from the zone lights instead of banding.
 */
export function getWallTexture(repeat = 6): THREE.Texture | null {
  const key = `wall:${repeat}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const made = makeCanvas(256);
  if (!made) return null;
  const { c, g } = made;
  const rand = mulberry32(31337);

  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  // Stipple only — kept greyscale and near-white so it multiplies against
  // whatever color the wall material already uses rather than tinting it.
  for (let i = 0; i < 7000; i++) {
    const v = 232 + ((rand() * 24) | 0);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(rand() * 256, rand() * 256, 1, 1);
  }
  return finish(key, c, repeat, repeat);
}

/** Release every generated texture (hot-reload / unmount hygiene). */
export function disposeProceduralTextures() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
