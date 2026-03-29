"use client";

/**
 * Debug floor plan view — top-down 2D map of the store layout.
 * Shows all element positions as labeled rectangles.
 * Used for spatial debugging without needing to walk around in 3D.
 * Access at /debug
 */

const ROOM_W = 20;
const ROOM_D = 14;
const SCALE = 30; // pixels per world unit
const PAD = 120; // padding for exterior

// All positioned elements from Store.tsx
const elements = [
  // Walls
  { x: 0, z: 0, w: ROOM_W, d: ROOM_D, label: "STORE", color: "#1a3468", type: "room" },

  // Shelf rows
  { x: -5.5, z: -3, w: 2.8, d: 0.55, label: "HORROR", color: "#dc2626" },
  { x: -2, z: -3, w: 2.8, d: 0.55, label: "SCI-FI", color: "#3b82f6" },
  { x: 1.5, z: -3, w: 2.8, d: 0.55, label: "COMEDY", color: "#f97316" },
  { x: 5, z: -3, w: 2.8, d: 0.55, label: "DRAMA", color: "#6366f1" },
  { x: -5.5, z: 0, w: 2.8, d: 0.55, label: "ACTION", color: "#ef4444" },
  { x: -2, z: 0, w: 2.8, d: 0.55, label: "CLASSICS", color: "#ca8a04" },
  { x: 1.5, z: 0, w: 2.8, d: 0.55, label: "FAMILY", color: "#22c55e" },
  { x: 5, z: 0, w: 2.8, d: 0.55, label: "ROMANCE", color: "#f43f5e" },
  { x: -5.5, z: 3, w: 2.8, d: 0.55, label: "THRILLER", color: "#7c3aed" },
  { x: -2, z: 3, w: 2.8, d: 0.55, label: "ANIMATED", color: "#06b6d4" },
  { x: 1.5, z: 3, w: 2.8, d: 0.55, label: "DOCS", color: "#65a30d" },

  // Counter (left side near entrance, rotated 90°)
  { x: -7, z: 5, w: 1.2, d: 6, label: "COUNTER", color: "#9a7850" },

  // Vinny
  { x: -7, z: 6.5, w: 0.4, d: 0.25, label: "VINNY", color: "#ffd700" },

  // New Releases (back wall)
  { x: 0, z: -6.85, w: 8, d: 0.3, label: "NEW RELEASES", color: "#ec4899" },

  // TV (left wall)
  { x: -8, z: 0, w: 0.3, d: 1.2, label: "TV", color: "#4a8aff" },

  // Wall posters (back wall)
  { x: -7, z: -6.95, w: 1.0, d: 0.04, label: "JAWS", color: "#b91c1c" },
  { x: -9, z: -6.95, w: 1.0, d: 0.04, label: "ALIEN", color: "#1d4ed8" },
  { x: 7, z: -6.95, w: 1.0, d: 0.04, label: "BLADE RUNNER", color: "#7c3aed" },
  { x: 9, z: -6.95, w: 1.0, d: 0.04, label: "RAIDERS", color: "#059669" },

  // Wall posters (side walls)
  { x: -9.95, z: -3, w: 0.04, d: 1.0, label: "SHINING", color: "#dc2626" },
  { x: -9.95, z: 1, w: 0.04, d: 1.0, label: "STAR WARS", color: "#f59e0b" },
  { x: 9.95, z: -2, w: 0.04, d: 1.0, label: "BTTF", color: "#ec4899" },
  { x: 9.95, z: 2, w: 0.04, d: 1.0, label: "E.T.", color: "#14b8a6" },

  // Entrance doors
  { x: -0.55, z: 6.95, w: 1.0, d: 0.1, label: "DOOR L", color: "#a0c0e0" },
  { x: 0.55, z: 6.95, w: 1.0, d: 0.1, label: "DOOR R", color: "#a0c0e0" },

  // Security pillars
  { x: -1.2, z: 6.5, w: 0.15, d: 0.08, label: "PILLAR", color: "#e8e8e0" },
  { x: 1.2, z: 6.5, w: 0.15, d: 0.08, label: "PILLAR", color: "#e8e8e0" },

  // Return window (outside)
  { x: 3, z: 7.1, w: 1.5, d: 0.6, label: "VIDEO RETURN", color: "#2a4a7a" },

  // Challenge board (right wall)
  { x: 9.7, z: -1.5, w: 0.04, d: 1.4, label: "CHALLENGE", color: "#ff3e7a" },

  // Trophy shelf (right wall)
  { x: 9.7, z: -1.5, w: 0.04, d: 2.5, label: "TROPHIES", color: "#ffd700" },

  // Employees only door (left wall)
  { x: -9.94, z: -4, w: 0.04, d: 0.9, label: "EMPLOYEES", color: "#4a3020" },

  // Candy rack
  { x: -5, z: 5, w: 0.8, d: 0.4, label: "CANDY", color: "#ef4444" },

  // Standee
  { x: 3, z: 5, w: 0.6, d: 0.03, label: "STANDEE", color: "#c0a080" },

  // Bulletin board (left wall)
  { x: -9.92, z: 4, w: 0.04, d: 1.2, label: "BULLETIN", color: "#7a5a30" },

  // BE KIND REWIND (left wall)
  { x: -9.88, z: 2, w: 0.04, d: 1.5, label: "BE KIND", color: "#0a1a3a" },

  // Clock (right wall)
  { x: 9.9, z: 4, w: 0.04, d: 0.5, label: "CLOCK", color: "#ffffff" },

  // Neon sign (back wall)
  { x: 0, z: -6.85, w: 6, d: 0.04, label: "FNV SIGN", color: "#ffd700", y: 3.3 },

  // Spawn point
  { x: 0, z: 5, w: 0.3, d: 0.3, label: "SPAWN ★", color: "#00ff00" },

  // NPC positions
  { x: -4, z: -5, w: 0.3, d: 0.3, label: "NPC1", color: "#3498db" },
  { x: 4, z: 1.5, w: 0.3, d: 0.3, label: "NPC2", color: "#e74c3c" },
  { x: -2, z: 1.5, w: 0.3, d: 0.3, label: "CHARLIE", color: "#0a4a8a" },

  // Exterior
  { x: 0, z: 12, w: ROOM_W + 8, d: 14, label: "PARKING LOT", color: "#1a1a20", type: "exterior" },
  { x: 5, z: 12, w: 2, d: 1, label: "CAR", color: "#1a2a4a" },
  { x: -13, z: 7, w: 6, d: 0.1, label: "PIZZA PALACE", color: "#2a2a30" },
  { x: 13, z: 7, w: 6, d: 0.1, label: "LAUNDROMAT", color: "#2a2a30" },

  // Late fees sign
  { x: -9.9, z: 5, w: 0.04, d: 1.0, label: "LATE FEES", color: "#ef4444" },

  // Rewards sign (above counter)
  { x: -7, z: 5, w: 2.5, d: 0.03, label: "REWARDS", color: "#ffd700", y: 2.8 },

  // Floor rug
  { x: 0, z: 4, w: 3, d: 2, label: "RUG", color: "#4a2030", type: "floor" },

  // Welcome mat
  { x: 0, z: 6.5, w: 2, d: 1, label: "MAT", color: "#4a2020", type: "floor" },
];

export default function DebugPage() {
  const centerX = PAD + (ROOM_W / 2) * SCALE;
  const centerZ = PAD + (ROOM_D / 2 + 6) * SCALE; // offset for exterior

  const canvasW = ROOM_W * SCALE + PAD * 2 + 200;
  const canvasH = (ROOM_D + 14) * SCALE + PAD * 2;

  function worldToScreen(wx: number, wz: number) {
    return {
      x: centerX + wx * SCALE,
      y: centerZ - wz * SCALE, // flip Z for screen coords (z+ is toward viewer in 3D, up on screen)
    };
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh", padding: 20, color: "#fff", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 16, marginBottom: 10 }}>Friday Night Video — Debug Floor Plan</h1>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
        Top-down view. +Z = toward entrance (bottom). -Z = back wall (top). Scale: 1 unit = {SCALE}px
      </p>
      <div style={{ position: "relative", width: canvasW, height: canvasH, background: "#0a0a0a", border: "1px solid #333", overflow: "hidden" }}>
        {/* Grid lines */}
        {Array.from({ length: Math.ceil(canvasW / SCALE) }).map((_, i) => (
          <div key={`vg${i}`} style={{ position: "absolute", left: (i * SCALE) + PAD % SCALE, top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.03)" }} />
        ))}
        {Array.from({ length: Math.ceil(canvasH / SCALE) }).map((_, i) => (
          <div key={`hg${i}`} style={{ position: "absolute", top: (i * SCALE) + PAD % SCALE, left: 0, height: 1, width: "100%", background: "rgba(255,255,255,0.03)" }} />
        ))}

        {/* Elements */}
        {elements.map((el, i) => {
          const pos = worldToScreen(el.x, el.z);
          const w = el.w * SCALE;
          const h = el.d * SCALE;
          const isRoom = el.type === "room";
          const isFloor = el.type === "floor";
          const isExterior = el.type === "exterior";

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x - w / 2,
                top: pos.y - h / 2,
                width: Math.max(w, 2),
                height: Math.max(h, 2),
                background: isRoom ? "transparent" : isExterior ? "rgba(26,26,32,0.3)" : isFloor ? `${el.color}33` : `${el.color}88`,
                border: isRoom ? `2px solid ${el.color}` : isFloor ? `1px dashed ${el.color}44` : `1px solid ${el.color}`,
                borderRadius: 2,
                zIndex: isRoom ? 0 : isExterior ? 0 : isFloor ? 1 : 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
              }}
              title={`${el.label} @ (${el.x}, ${el.z}) size ${el.w}x${el.d}`}
            >
              <span style={{
                fontSize: Math.min(9, w / el.label.length * 1.5),
                color: "#fff",
                textShadow: "0 0 3px #000, 0 0 6px #000",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}>
                {el.label}
              </span>
            </div>
          );
        })}

        {/* Compass */}
        <div style={{ position: "absolute", right: 20, top: 20, fontSize: 10, color: "#666", textAlign: "center" }}>
          <div>-Z (BACK WALL)</div>
          <div style={{ margin: "4px 0" }}>↑</div>
          <div>← -X &nbsp;&nbsp; +X →</div>
          <div style={{ margin: "4px 0" }}>↓</div>
          <div>+Z (ENTRANCE)</div>
        </div>

        {/* Legend */}
        <div style={{ position: "absolute", right: 20, bottom: 20, fontSize: 9, color: "#888" }}>
          <div>★ = Spawn point</div>
          <div>Hover for coordinates</div>
        </div>
      </div>
    </div>
  );
}
