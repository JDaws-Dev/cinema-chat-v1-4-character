"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Security camera system — fixed camera positions throughout the store.
 * Renders from each camera and saves screenshots via a global function.
 *
 * Usage from browser console: window.__securityCams()
 * Usage from Playwright: page.evaluate(() => window.__securityCams())
 *
 * Saves images to /api/debug-cam endpoint which writes to /tmp/
 */

// Camera definitions — position, lookAt target, and label
// Store bounds: x=-10..+10, z=-7..+7, y=0..3.5
// Pizza Palace: x=-16..-10, z=0..7   |  Laundromat: x=10..16, z=0.25..7.75
// Sidewalk: z=7.05..8.55  |  Parking: z=3.5..17.5  |  Street: z=19.5..25.5
// Apartment: x=10..16, y=3.7..6.5, z=1.5..6.5
const CAMERAS = [
  // ── Store interior (all positions safely inside x=-9.5..+9.5, z=-6.5..+6.5) ──
  { name: "overhead",      pos: [0, 3.15, 0],      lookAt: [0, 0, 0],       fov: 96, label: "Overhead (top-down)" },
  { name: "entrance",      pos: [0, 2, 9],         lookAt: [0, 1.5, 0],     fov: 70, label: "From parking lot" },
  { name: "back_wall",     pos: [0, 2, -6],        lookAt: [0, 1.5, 3],     fov: 70, label: "From back wall" },
  { name: "left_wall",     pos: [-9, 2, 0],        lookAt: [5, 1.5, 0],     fov: 70, label: "Left wall looking right" },
  { name: "right_wall",    pos: [9, 2, 0],         lookAt: [-5, 1.5, 0],    fov: 70, label: "Right wall looking left" },
  { name: "counter",       pos: [4, 2, 4],         lookAt: [7, 1.0, 5.5],   fov: 65, label: "Counter area" },
  { name: "ceiling_front", pos: [-4, 3.2, 5],      lookAt: [4, 0, -2],      fov: 85, label: "Ceiling front corner" },
  { name: "ceiling_back",  pos: [4, 3.2, -5],      lookAt: [-4, 0, 3],      fov: 85, label: "Ceiling back corner" },
  // ── Exterior & strip mall (cameras in parking lot z>9, or wide angles from street) ──
  { name: "exterior",      pos: [0, 3, 12],        lookAt: [0, 2, 7],       fov: 75, label: "Exterior wide" },
  { name: "exterior_wide", pos: [0, 10, 22],       lookAt: [0, 2, 5],       fov: 80, label: "Exterior birds-eye" },
  { name: "side_elev",     pos: [18, 2.5, 10],     lookAt: [0, 1.7, 7],     fov: 55, label: "Side elevation" },
  { name: "strip_right",   pos: [18, 3, 12],       lookAt: [13, 2, 7],      fov: 60, label: "Strip mall right side" },
  { name: "strip_left",    pos: [-18, 3, 12],      lookAt: [-13, 2, 7],     fov: 60, label: "Strip mall left side" },
  // ── Apartment exterior (cameras outside building envelope) ──
  { name: "apt_exterior",  pos: [18, 5, 14],       lookAt: [13, 4, 4],      fov: 55, label: "Apartment building from parking" },
  { name: "apt_stairs",    pos: [18, 3, 10],       lookAt: [16.5, 2, 5],    fov: 55, label: "Apartment stairs close-up" },
  { name: "building_front",pos: [13, 6, 14],       lookAt: [13, 4, 4],      fov: 50, label: "Building front — 2 story view" },
  { name: "building_right",pos: [22, 5, 4],        lookAt: [16, 3, 4],      fov: 60, label: "Building right side with stairs" },
  // ── Apartment interior (eye level y=5.1 inside apt bounds) ──
  { name: "apt_interior",  pos: [14.5, 5.1, 6.2],  lookAt: [12, 4.3, 3.5],  fov: 75, label: "Apartment interior from door" },
  { name: "apt_tv",        pos: [13, 5.1, 6.0],    lookAt: [13, 4.2, 1.5],  fov: 60, label: "Apartment TV/VCR area" },
  { name: "apt_kitchen",   pos: [11.5, 5.1, 4.0],  lookAt: [14, 4.3, 3.0],  fov: 65, label: "Apartment kitchen corner" },
  { name: "apt_overhead",  pos: [13, 8.5, 4.0],    lookAt: [13, 3.7, 4.0],  fov: 65, label: "Apartment overhead" },
];

export function SecurityCameras() {
  const { gl, scene } = useThree();
  const camRef = useRef(new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 60));

  useEffect(() => {
    // Expose global function for triggering captures
    (window as unknown as Record<string, unknown>).__securityCams = async (camNames?: string[]) => {
      const cam = camRef.current;
      const width = 960;
      const height = 540;
      const rt = new THREE.WebGLRenderTarget(width, height);
      const results: { name: string; label: string; dataUrl: string }[] = [];

      const toCapture = camNames
        ? CAMERAS.filter(c => camNames.includes(c.name))
        : CAMERAS;

      // Temporarily disable fog for security camera captures
      const savedFog = scene.fog;
      scene.fog = null;

      for (const def of toCapture) {
        cam.fov = def.fov;
        cam.near = 0.1;
        cam.far = 100; // extended range for exterior shots
        cam.aspect = width / height;
        cam.updateProjectionMatrix();
        cam.position.set(def.pos[0], def.pos[1], def.pos[2]);
        cam.lookAt(def.lookAt[0], def.lookAt[1], def.lookAt[2]);
        cam.updateMatrixWorld(true);

        gl.setRenderTarget(rt);
        gl.clear();
        gl.render(scene, cam);
        gl.setRenderTarget(null);

        // Yield to GPU between captures to prevent stale frame reuse
        await new Promise(r => setTimeout(r, 50));

        // Read pixels
        const pixels = new Uint8Array(width * height * 4);
        gl.readRenderTargetPixels(rt, 0, 0, width, height, pixels);

        // Flip vertically and create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
          const srcRow = (height - 1 - y) * width * 4;
          const dstRow = y * width * 4;
          imgData.data.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
        }
        ctx.putImageData(imgData, 0, 0);

        // Add label overlay
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, width, 28);
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`CAM: ${def.name} — ${def.label}`, 8, 18);

        const dataUrl = canvas.toDataURL("image/png");
        results.push({ name: def.name, label: def.label, dataUrl });
      }

      rt.dispose();

      // Restore fog
      scene.fog = savedFog;

      // Save to /tmp via API
      try {
        await fetch("/api/debug-cam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captures: results.map(r => ({ name: r.name, dataUrl: r.dataUrl })) }),
        });
      } catch { /* API might not exist yet */ }

      // Also download as a combined strip for quick review
      console.log(`Captured ${results.length} security camera views. Saving...`);
      for (const r of results) {
        const a = document.createElement("a");
        a.href = r.dataUrl;
        a.download = `cam-${r.name}.png`;
        a.click();
      }

      return results.map(r => r.name);
    };

    return () => {
      delete (window as unknown as Record<string, unknown>).__securityCams;
    };
  }, [gl, scene]);

  return null; // invisible component
}
