"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { getActiveNpcCount } from "./NPCManager";

/**
 * DebugOverlay — toggle with backtick key (`)
 * Shows FPS, draw calls, triangles, and active NPC count.
 * Renders as an Html overlay inside the R3F Canvas.
 */
export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const divRef = useRef<HTMLDivElement>(null);
  const gl = useThree((s) => s.gl);

  // Toggle on backtick
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`") setVisible((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useFrame(() => {
    if (!visible) return;
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;
    if (delta >= 500) {
      const fps = Math.round((frameCount.current / delta) * 1000);
      const calls = gl.info.render.calls;
      const triangles = gl.info.render.triangles;
      const npcs = getActiveNpcCount();
      frameCount.current = 0;
      lastTime.current = now;

      if (divRef.current) {
        divRef.current.textContent =
          `FPS: ${fps}\n` +
          `Draw calls: ${calls}\n` +
          `Triangles: ${triangles}\n` +
          `NPCs: ${npcs}`;
      }
    }
  });

  if (!visible) return null;

  return (
    <Html
      fullscreen
      zIndexRange={[9999, 9999]}
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={divRef}
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          fontFamily: "monospace",
          fontSize: 11,
          lineHeight: 1.5,
          color: "#0f0",
          background: "rgba(0,0,0,0.6)",
          padding: "6px 10px",
          borderRadius: 4,
          whiteSpace: "pre",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        FPS: --{"\n"}Draw calls: --{"\n"}Triangles: --{"\n"}NPCs: 0
      </div>
    </Html>
  );
}
