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
const CAMERAS = [
  // Store interior
  { name: "overhead",     pos: [0, 3.15, 0],     lookAt: [0, 0, 0],       fov: 96, label: "Overhead (top-down)" },
  { name: "entrance",     pos: [0, 2, 9],        lookAt: [0, 1.5, 0],     fov: 70, label: "From parking lot" },
  { name: "back_wall",    pos: [0, 2, -6],       lookAt: [0, 1.5, 3],     fov: 70, label: "From back wall" },
  { name: "left_wall",    pos: [-10.6, 2, 0.2],  lookAt: [5, 1.5, 0],     fov: 66, label: "Left wall looking right" },
  { name: "right_wall",   pos: [9, 2, 0],        lookAt: [-5, 1.5, 0],    fov: 70, label: "Right wall looking left" },
  { name: "counter",      pos: [-3, 2, 4],       lookAt: [-6, 1.2, 5.5],  fov: 60, label: "Counter area" },
  { name: "ceiling_front",pos: [0, 3.4, 5],      lookAt: [0, 0, -3],      fov: 80, label: "Ceiling front corner" },
  { name: "ceiling_back", pos: [0, 3.4, -5],     lookAt: [0, 0, 3],       fov: 80, label: "Ceiling back corner" },
  // Exterior & strip mall
  { name: "exterior",     pos: [0, 4, 14],       lookAt: [0, 2, 7],       fov: 70, label: "Exterior wide" },
  { name: "exterior_wide",pos: [0, 8, 20],       lookAt: [0, 3, 5],       fov: 80, label: "Exterior birds-eye" },
  { name: "side_elev",    pos: [15.5, 2.15, -0.35], lookAt: [0, 1.7, -0.4], fov: 44, label: "Side elevation" },
  { name: "strip_right",  pos: [20, 3, 6],       lookAt: [13, 4, 6],      fov: 60, label: "Strip mall right side" },
  { name: "strip_left",   pos: [-20, 3, 6],      lookAt: [-13, 2, 6],     fov: 60, label: "Strip mall left side" },
  // Apartment — exterior views (pulled back to see full building)
  { name: "apt_exterior", pos: [20, 5, 12],      lookAt: [13, 3.5, 5.75], fov: 55, label: "Apartment exterior (full building)" },
  { name: "apt_stairs",   pos: [18, 2, 9],       lookAt: [16, 3.5, 5],    fov: 55, label: "Apartment stairs from parking" },
  { name: "building_front",pos: [13, 4, 16],     lookAt: [13, 3.5, 5.75], fov: 50, label: "Building front from street" },
  { name: "building_right",pos: [22, 4, 5.75],   lookAt: [16, 3, 5.75],   fov: 50, label: "Building right side" },
  // Apartment — interior views
  { name: "apt_interior", pos: [11.5, 5.6, 7],   lookAt: [13, 5.2, 4],    fov: 75, label: "Apartment interior wide" },
  { name: "apt_tv",       pos: [14, 5.6, 7],     lookAt: [13, 5.2, 3.5],  fov: 60, label: "Apartment TV area" },
  { name: "apt_kitchen",  pos: [11.5, 5.6, 5],   lookAt: [15, 5.2, 4],    fov: 60, label: "Apartment kitchen" },
  { name: "apt_overhead", pos: [13, 8, 5.75],    lookAt: [13, 4, 5.75],   fov: 70, label: "Apartment overhead" },
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

      for (const def of toCapture) {
        cam.fov = def.fov;
        cam.aspect = width / height;
        cam.updateProjectionMatrix();
        cam.position.set(def.pos[0], def.pos[1], def.pos[2]);
        cam.lookAt(def.lookAt[0], def.lookAt[1], def.lookAt[2]);

        gl.setRenderTarget(rt);
        gl.render(scene, cam);
        gl.setRenderTarget(null);

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
