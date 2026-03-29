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

  // Shelf rows (updated positions: -5, -1.7, 1.7, 5)
  { x: -5, z: -3, w: 2.8, d: 0.55, label: "HORROR", color: "#dc2626" },
  { x: -1.7, z: -3, w: 2.8, d: 0.55, label: "SCI-FI", color: "#3b82f6" },
  { x: 1.7, z: -3, w: 2.8, d: 0.55, label: "COMEDY", color: "#f97316" },
  { x: 5, z: -3, w: 2.8, d: 0.55, label: "DRAMA", color: "#6366f1" },
  { x: -5, z: 0, w: 2.8, d: 0.55, label: "ACTION", color: "#ef4444" },
  { x: -1.7, z: 0, w: 2.8, d: 0.55, label: "CLASSICS", color: "#ca8a04" },
  { x: 1.7, z: 0, w: 2.8, d: 0.55, label: "FAMILY", color: "#22c55e" },
  { x: 5, z: 0, w: 2.8, d: 0.55, label: "ROMANCE", color: "#f43f5e" },
  { x: -5, z: 3, w: 2.8, d: 0.55, label: "THRILLER", color: "#7c3aed" },
  { x: -1.7, z: 3, w: 2.8, d: 0.55, label: "ANIMATED", color: "#06b6d4" },
  { x: 1.7, z: 3, w: 2.8, d: 0.55, label: "DOCS", color: "#65a30d" },
  { x: 5, z: 3, w: 2.8, d: 0.55, label: "WESTERN", color: "#92400e" },

  // Counter (left side near entrance)
  { x: -6, z: 5.5, w: 6, d: 1.2, label: "COUNTER", color: "#9a7850" },

  // Vinny
  { x: -6, z: 6.2, w: 0.4, d: 0.25, label: "VINNY", color: "#ffd700" },

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

  // Return window (outside, left — behind counter)
  { x: -8, z: 7.1, w: 1.5, d: 0.6, label: "VIDEO RETURN", color: "#2a4a7a" },
  // Return chute (interior, behind counter)
  { x: -8, z: 6.5, w: 1.0, d: 0.5, label: "RETURN CHUTE", color: "#2a2a2a" },
  // Recent returns on counter
  { x: -4, z: 5.2, w: 1.6, d: 0.3, label: "RECENT RETURNS", color: "#ffd700" },

  // Challenge board (right wall, mid-store)
  { x: 9.7, z: 2, w: 0.04, d: 1.4, label: "CHALLENGE", color: "#ff3e7a" },

  // Trophy shelf (right wall, back of store)
  { x: 9.7, z: -4, w: 0.04, d: 2.5, label: "TROPHIES", color: "#ffd700" },

  // Employees only door (left wall)
  { x: -9.94, z: -4, w: 0.04, d: 0.9, label: "EMPLOYEES", color: "#4a3020" },

  // (Candy rack and standee removed)

  // Bulletin board (left wall)
  { x: -9.92, z: 4, w: 0.04, d: 1.2, label: "BULLETIN", color: "#7a5a30" },

  // BE KIND REWIND (left wall)
  { x: -9.88, z: 2, w: 0.04, d: 1.5, label: "BE KIND", color: "#0a1a3a" },

  // Clock (right wall)
  { x: 9.9, z: 4, w: 0.04, d: 0.5, label: "CLOCK", color: "#ffffff" },

  // Neon sign (back wall)
  { x: 0, z: -6.85, w: 6, d: 0.04, label: "FNV SIGN", color: "#ffd700", y: 3.3 },

  // Spawn point
  { x: 0, z: 4, w: 0.3, d: 0.3, label: "SPAWN ★", color: "#00ff00" },

  // NPC positions
  { x: -4, z: -5, w: 0.3, d: 0.3, label: "NPC1", color: "#3498db" },
  { x: 4, z: 1.5, w: 0.3, d: 0.3, label: "NPC2", color: "#e74c3c" },
  { x: -2, z: 1.5, w: 0.3, d: 0.3, label: "CHARLIE", color: "#0a4a8a" },

  // Exterior
  { x: 0, z: 12, w: ROOM_W + 8, d: 14, label: "PARKING LOT", color: "#1a1a20", type: "exterior" },
  { x: 5, z: 12, w: 2, d: 1, label: "CAR (SEDAN)", color: "#1a2a4a" },
  { x: -4, z: 12, w: 2.2, d: 1.1, label: "MINIVAN", color: "#556644" },
  { x: -13, z: 7, w: 6, d: 0.1, label: "PIZZA PALACE", color: "#cc3333" },
  { x: 13, z: 7, w: 6, d: 0.1, label: "LAUNDROMAT", color: "#5599cc" },
  { x: 8, z: 8, w: 0.5, d: 0.5, label: "BIKE", color: "#ee3344" },
  { x: 2, z: 14, w: 1.8, d: 1.2, label: "CART RETURN", color: "#2244aa" },
  { x: -1.5, z: 10.5, w: 0.4, d: 0.4, label: "HANDICAP", color: "#2255bb" },

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
      {/* ── SIDE ELEVATION VIEW ─────────────────────────── */}
      <h2 style={{ fontSize: 14, marginTop: 30, marginBottom: 10 }}>Side Elevation (looking from +X toward -X)</h2>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
        Shows height (Y) vs depth (Z). Front entrance is right, back wall is left.
      </p>
      <SideView />
    </div>
  );
}

// Side elevation elements: { z, y, w (along z), h (height), label, color }
const sideElements = [
  // Room outline
  { z: 0, y: 1.75, w: ROOM_D, h: 3.5, label: "STORE", color: "#1a3468", type: "room" },
  // Floor
  { z: 0, y: 0, w: ROOM_D, h: 0.05, label: "FLOOR", color: "#2a3050" },
  // Ceiling
  { z: 0, y: 3.5, w: ROOM_D, h: 0.1, label: "CEILING", color: "#e8e4d8" },

  // Shelves (3 rows at z=-3, 0, 3) — each 1.5 tall from floor
  { z: -3, y: 0.75, w: 0.55, h: 1.5, label: "SHELF ROW 1", color: "#5a3820" },
  { z: 0, y: 0.75, w: 0.55, h: 1.5, label: "SHELF ROW 2", color: "#5a3820" },
  { z: 3, y: 0.75, w: 0.55, h: 1.5, label: "SHELF ROW 3", color: "#5a3820" },

  // Genre signs on top of shelves
  { z: -3, y: 1.62, w: 0.04, h: 0.2, label: "SIGN", color: "#ffd700" },
  { z: 0, y: 1.62, w: 0.04, h: 0.2, label: "SIGN", color: "#ffd700" },
  { z: 3, y: 1.62, w: 0.04, h: 0.2, label: "SIGN", color: "#ffd700" },

  // New Releases wall (back, z=-6.85)
  { z: -6.85, y: 1.0, w: 0.3, h: 2.0, label: "NEW RELEASES", color: "#ec4899" },
  { z: -6.85, y: 2.6, w: 0.06, h: 0.5, label: "NR SIGN", color: "#ffd700" },

  // Neon sign (back wall, high)
  { z: -6.85, y: 3.3, w: 0.04, h: 0.4, label: "FNV NEON", color: "#ffd700" },

  // Counter (z=5, height ~1.0)
  { z: 5, y: 0.5, w: 1.2, h: 1.0, label: "COUNTER", color: "#9a7850" },

  // Vinny (z=6.5)
  { z: 6.5, y: 0.85, w: 0.25, h: 1.7, label: "VINNY", color: "#ffd700" },

  // Entrance doors (z=6.95)
  { z: 6.95, y: 1.4, w: 0.1, h: 2.8, label: "DOORS", color: "#a0c0e0" },

  // Aisle signs (hanging from ceiling)
  { z: -3, y: 2.8, w: 0.03, h: 0.3, label: "AISLE", color: "#ffd700" },
  { z: 0, y: 2.8, w: 0.03, h: 0.3, label: "AISLE", color: "#ffd700" },
  { z: 3, y: 2.8, w: 0.03, h: 0.3, label: "AISLE", color: "#ffd700" },

  // Fluorescent fixtures (ceiling-mounted)
  { z: -1.5, y: 3.46, w: 0.3, h: 0.06, label: "LIGHT", color: "#fff4d0" },
  { z: 2, y: 3.46, w: 0.3, h: 0.06, label: "LIGHT", color: "#fff4d0" },
  { z: 0, y: 3.46, w: 0.3, h: 0.06, label: "LIGHT", color: "#f0f4e8" },

  // TV (left wall, y=2.5)
  { z: 0, y: 2.5, w: 0.4, h: 0.9, label: "TV", color: "#4a8aff" },

  // Wall posters (y=1.8-2.0)
  { z: -3, y: 2.0, w: 0.04, h: 1.4, label: "POSTER", color: "#dc2626" },
  { z: 1, y: 2.0, w: 0.04, h: 1.4, label: "POSTER", color: "#f59e0b" },

  // Awning (exterior, above entrance)
  { z: 7.3, y: 3.55, w: 1.2, h: 0.06, label: "AWNING", color: "#1a3a8a" },

  // Player spawn
  { z: 5, y: 1.6, w: 0.2, h: 0.2, label: "SPAWN ★", color: "#00ff00" },

  // Security pillars
  { z: 6.5, y: 0.75, w: 0.08, h: 1.5, label: "PILLAR", color: "#e8e8e0" },

  // Return window (outside)
  { z: 7.1, y: 0.5, w: 0.6, h: 1.0, label: "RETURN", color: "#2a4a7a" },
];

function SideView() {
  const sideScale = 50; // bigger scale for elevation detail
  const sidePad = 60;
  const canvasW = (ROOM_D + 8) * sideScale + sidePad * 2;
  const canvasH = 5 * sideScale + sidePad * 2; // 0 to 5 units height

  function toScreen(wz: number, wy: number) {
    return {
      x: sidePad + (wz + ROOM_D / 2 + 2) * sideScale, // z mapped to x, with offset for exterior
      y: sidePad + (5 - wy) * sideScale, // y mapped to screen y (inverted)
    };
  }

  return (
    <div style={{ position: "relative", width: canvasW, height: canvasH, background: "#0a0a0a", border: "1px solid #333", overflow: "hidden" }}>
      {/* Ground line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: toScreen(0, 0).y, height: 1, background: "#444" }} />

      {/* Height markers */}
      {[0, 1, 2, 3, 4].map(h => (
        <div key={`h${h}`} style={{ position: "absolute", left: 5, top: toScreen(0, h).y - 5, fontSize: 9, color: "#555" }}>{h}m</div>
      ))}

      {/* Elements */}
      {sideElements.map((el, i) => {
        const pos = toScreen(el.z, el.y + el.h / 2);
        const w = el.w * sideScale;
        const h = el.h * sideScale;
        const isRoom = el.type === "room";

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x - w / 2,
              top: pos.y - h / 2,
              width: Math.max(w, 2),
              height: Math.max(h, 2),
              background: isRoom ? "transparent" : `${el.color}66`,
              border: isRoom ? `2px solid ${el.color}` : `1px solid ${el.color}`,
              borderRadius: 2,
              zIndex: isRoom ? 0 : 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`${el.label} @ z=${el.z}, y=${el.y}, size ${el.w}x${el.h}`}
          >
            <span style={{ fontSize: Math.min(8, w / el.label.length * 1.5), color: "#fff", textShadow: "0 0 3px #000", whiteSpace: "nowrap", fontWeight: 700 }}>
              {el.label}
            </span>
          </div>
        );
      })}

      {/* Labels */}
      <div style={{ position: "absolute", right: 20, top: 10, fontSize: 10, color: "#666" }}>
        <div>← BACK WALL &nbsp;&nbsp; ENTRANCE →</div>
        <div style={{ marginTop: 4 }}>↑ UP &nbsp;&nbsp; DOWN ↓</div>
      </div>
    </div>
  );
}
