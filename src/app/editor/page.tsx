"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ── Store dimensions (from Store.tsx) ──
// Interior: 20x14. Exterior extends to ~z=14 (parking lot) and x=-16..+16 (neighbors)
const ROOM_W = 32; // x: -16 to +16 (includes Pizza Palace + Laundromat)
const ROOM_D = 22; // z: -7 to +15 (includes parking lot + road)

// ── SVG coordinate system ──
// We map store coords to SVG: x maps to svgX, z maps to svgY (inverted so -z is top / back wall)
const SVG_PADDING = 60;
const SCALE = 40; // pixels per store unit
const SVG_W = ROOM_W * SCALE + SVG_PADDING * 2;
const SVG_H = ROOM_D * SCALE + SVG_PADDING * 2;

function storeToSvg(x: number, z: number): { sx: number; sy: number } {
  return {
    sx: (x + ROOM_W / 2) * SCALE + SVG_PADDING,
    sy: (-z + ROOM_D / 2) * SCALE + SVG_PADDING,
  };
}

function svgToStore(sx: number, sy: number): { x: number; z: number } {
  return {
    x: Math.round(((sx - SVG_PADDING) / SCALE - ROOM_W / 2) * 100) / 100,
    z: Math.round((-(sy - SVG_PADDING) / SCALE + ROOM_D / 2) * 100) / 100,
  };
}

// ── Object types ──
type ObjCategory = "shelf" | "counter" | "npc" | "prop" | "wall" | "door" | "exterior";

interface StoreObject {
  id: string;
  label: string;
  category: ObjCategory;
  x: number;
  z: number;
  w: number; // width in store units
  d: number; // depth in store units
  color: string;
  shape: "rect" | "circle";
  genre?: string;
}

// ── Initial object data extracted from Store.tsx and FirstPerson.tsx ──
// Positions updated from editor export (2026-03-30)
const INITIAL_OBJECTS: StoreObject[] = [
  // ── INTERIOR ─────────────────────────────────────────────
  // Shelf Row 1 (z = -4)
  { id: "shelf-r1-1", label: "HORROR", category: "shelf", x: -5, z: -4, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "HORROR / CULT", shape: "rect" },
  { id: "shelf-r1-2", label: "SCI-FI", category: "shelf", x: -1.5, z: -4, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "SCI-FI / FOREIGN", shape: "rect" },
  { id: "shelf-r1-3", label: "COMEDY", category: "shelf", x: 1.5, z: -4, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "COMEDY / INDIE", shape: "rect" },
  { id: "shelf-r1-4", label: "DRAMA", category: "shelf", x: 5, z: -4, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "DRAMA / DOCS", shape: "rect" },
  // Shelf Row 2 (z = -1)
  { id: "shelf-r2-1", label: "ACTION", category: "shelf", x: -5, z: -1, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "ACTION / HORROR", shape: "rect" },
  { id: "shelf-r2-2", label: "FAMILY", category: "shelf", x: -1.5, z: -1, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "FAMILY / SCI-FI", shape: "rect" },
  { id: "shelf-r2-3", label: "ROMANCE", category: "shelf", x: 1.5, z: -1, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "ROMANCE / COMEDY", shape: "rect" },
  { id: "shelf-r2-4", label: "WESTERN", category: "shelf", x: 5, z: -1, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "WESTERN / DRAMA", shape: "rect" },
  // Shelf Row 3 (z = 2)
  { id: "shelf-r3-1", label: "THRILLER", category: "shelf", x: -5, z: 2, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "THRILLER / ACTION", shape: "rect" },
  { id: "shelf-r3-2", label: "ANIMATED", category: "shelf", x: -1.5, z: 2, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "ANIMATED / FAMILY", shape: "rect" },
  { id: "shelf-r3-3", label: "DOCS", category: "shelf", x: 1.5, z: 2, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "DOCS / ROMANCE", shape: "rect" },
  { id: "shelf-r3-4", label: "CLASSICS", category: "shelf", x: 5, z: 2, w: 3.2, d: 0.6, color: "#8B5E3C", genre: "CLASSICS / WESTERN", shape: "rect" },
  // New Releases back wall
  { id: "new-releases", label: "NEW RELEASES", category: "shelf", x: 0, z: -6.8, w: 19, d: 0.8, color: "#5a3820", shape: "rect" },
  // Counter
  { id: "counter", label: "COUNTER", category: "counter", x: -6, z: 5.5, w: 6, d: 1.2, color: "#D2B48C", shape: "rect" },
  { id: "candy-rack", label: "Candy", category: "prop", x: -3.6, z: 4.39, w: 1.2, d: 0.8, color: "#e74c3c", shape: "rect" },
  // NPCs
  { id: "vinny", label: "Vinny", category: "npc", x: -6, z: 6.2, w: 0.6, d: 0.6, color: "#3b82f6", shape: "circle" },
  { id: "charlie", label: "Charlie", category: "npc", x: -2, z: 1.5, w: 0.6, d: 0.6, color: "#3b82f6", shape: "circle" },
  { id: "npc-0", label: "Customer 1", category: "npc", x: -3.25, z: -5.5, w: 0.5, d: 0.5, color: "#3498db", shape: "circle" },
  { id: "npc-1", label: "Customer 2", category: "npc", x: 3.25, z: 0.5, w: 0.5, d: 0.5, color: "#e74c3c", shape: "circle" },
  { id: "npc-2", label: "Customer 3", category: "npc", x: -3.25, z: 3.5, w: 0.5, d: 0.5, color: "#27ae60", shape: "circle" },
  { id: "npc-3", label: "Customer 4", category: "npc", x: 3.25, z: -2.5, w: 0.5, d: 0.5, color: "#9b59b6", shape: "circle" },
  { id: "kid", label: "Kid", category: "npc", x: 0, z: 0.5, w: 0.4, d: 0.4, color: "#f0e020", shape: "circle" },
  { id: "tarantino", label: "Tarantino", category: "npc", x: 0, z: -2.5, w: 0.5, d: 0.5, color: "#1a1a1a", shape: "circle" },
  // Props
  { id: "cooler", label: "Cooler", category: "prop", x: -8.63, z: 4.53, w: 0.8, d: 0.6, color: "#aaddee", shape: "rect" },
  { id: "trophy-shelf", label: "Trophy Shelf", category: "prop", x: 9.7, z: -4, w: 0.6, d: 2.5, color: "#ffd700", shape: "rect" },
  { id: "staff-picks", label: "Staff Picks", category: "prop", x: 9.7, z: -0.1, w: 0.4, d: 1.2, color: "#ffd700", shape: "rect" },
  { id: "plant", label: "Plant", category: "prop", x: 9.5, z: -6.5, w: 0.4, d: 0.4, color: "#1a5a1a", shape: "circle" },
  { id: "trash-can", label: "Trash Can", category: "prop", x: -1.5, z: 6, w: 0.35, d: 0.35, color: "#555555", shape: "circle" },
  { id: "recent-returns", label: "Returns Pile", category: "prop", x: -3.88, z: 5.77, w: 1.6, d: 0.4, color: "#ca8a04", shape: "rect" },
  { id: "membership-forms", label: "Forms", category: "prop", x: -5, z: 5.3, w: 0.3, d: 0.3, color: "#f5f5f0", shape: "rect" },
  // Wall features — posters (updated positions)
  { id: "poster-jaws", label: "JAWS", category: "wall", x: -7, z: -6.95, w: 0.8, d: 0.2, color: "#b91c1c", shape: "rect" },
  { id: "poster-alien", label: "ALIEN", category: "wall", x: -9, z: -6.95, w: 0.8, d: 0.2, color: "#1d4ed8", shape: "rect" },
  { id: "poster-blade", label: "BLADE RUNNER", category: "wall", x: 7, z: -6.95, w: 0.8, d: 0.2, color: "#7c3aed", shape: "rect" },
  { id: "poster-raiders", label: "RAIDERS", category: "wall", x: 9, z: -6.95, w: 0.8, d: 0.2, color: "#059669", shape: "rect" },
  { id: "poster-shining", label: "THE SHINING", category: "wall", x: -9.9, z: -2.78, w: 0.2, d: 0.8, color: "#dc2626", shape: "rect" },
  { id: "poster-starwars", label: "STAR WARS", category: "wall", x: -9.96, z: 1.32, w: 0.2, d: 0.8, color: "#f59e0b", shape: "rect" },
  { id: "poster-bttf", label: "BACK TO FUTURE", category: "wall", x: 9.84, z: 2.95, w: 0.2, d: 0.8, color: "#ec4899", shape: "rect" },
  { id: "poster-et", label: "E.T.", category: "wall", x: 9.87, z: 5.19, w: 0.2, d: 0.8, color: "#14b8a6", shape: "rect" },
  // Signs (updated positions)
  { id: "neon-sign", label: "FRIDAY NIGHT VIDEO", category: "wall", x: 0, z: -6.85, w: 5.8, d: 0.15, color: "#ffd700", shape: "rect" },
  { id: "be-kind-sign", label: "BE KIND REWIND", category: "wall", x: -9.88, z: 3.18, w: 0.2, d: 1.5, color: "#ffd700", shape: "rect" },
  { id: "late-fees-sign", label: "LATE FEES", category: "wall", x: -9.9, z: 5.2, w: 0.2, d: 1.0, color: "#ef4444", shape: "rect" },
  { id: "employees-door", label: "EMPLOYEES ONLY", category: "door", x: -9.93, z: -5.19, w: 0.2, d: 0.9, color: "#4a3020", shape: "rect" },
  { id: "rewards-sign", label: "REWARDS MEMBER?", category: "wall", x: -6, z: 6.5, w: 2.0, d: 0.15, color: "#ffd700", shape: "rect" },
  { id: "tv", label: "CRT TV", category: "wall", x: -9.9, z: 0, w: 0.3, d: 1.2, color: "#222222", shape: "rect" },
  { id: "entrance", label: "ENTRANCE", category: "door", x: 0, z: 6.95, w: 2.2, d: 0.2, color: "#a0c0e0", shape: "rect" },
  { id: "return-slot", label: "Video Return", category: "prop", x: -8, z: 7.1, w: 1.5, d: 0.6, color: "#1a3a6a", shape: "rect" },
  { id: "open-sign", label: "OPEN", category: "wall", x: -4, z: 7, w: 1.0, d: 0.15, color: "#ff0040", shape: "rect" },

  // ── EXTERIOR ─────────────────────────────────────────────
  // Pizza Palace (left neighbor, centered x=-13, z=7)
  { id: "pizza-building", label: "PIZZA PALACE", category: "exterior", x: -13, z: 7, w: 6, d: 0.3, color: "#cc3333", shape: "rect" },
  { id: "pizza-door", label: "Pizza Door", category: "exterior", x: -12.5, z: 7.16, w: 1.0, d: 0.2, color: "#4a3020", shape: "rect" },
  { id: "pizza-window", label: "Pizza Window", category: "exterior", x: -14, z: 7.17, w: 2.0, d: 0.2, color: "#553311", shape: "rect" },
  { id: "pizza-slice-sign", label: "Pizza Slice", category: "exterior", x: -14.5, z: 7.2, w: 0.7, d: 0.7, color: "#ff6622", shape: "circle" },

  // Laundromat (right neighbor, centered x=13, z=7)
  { id: "laundro-building", label: "LAUNDROMAT", category: "exterior", x: 13, z: 7, w: 6, d: 0.3, color: "#113355", shape: "rect" },
  { id: "laundro-door", label: "Laundro Door", category: "exterior", x: 13.5, z: 7.16, w: 1.0, d: 0.2, color: "#4a3020", shape: "rect" },
  { id: "laundro-window", label: "Laundro Window", category: "exterior", x: 12, z: 7.17, w: 2.2, d: 0.2, color: "#223344", shape: "rect" },
  { id: "laundro-open", label: "Laundro OPEN", category: "exterior", x: 11.2, z: 7.25, w: 0.7, d: 0.35, color: "#33ff66", shape: "rect" },

  // Sidewalk
  { id: "sidewalk", label: "Sidewalk", category: "exterior", x: 0, z: 7.8, w: 22, d: 1.5, color: "#4a4a4a", shape: "rect" },

  // Parking lot cars
  { id: "car-sedan", label: "Sedan", category: "exterior", x: 5, z: 11, w: 2.0, d: 1.0, color: "#445566", shape: "rect" },
  { id: "car-van", label: "Van", category: "exterior", x: -4, z: 11, w: 2.0, d: 1.0, color: "#664433", shape: "rect" },
  { id: "car-suv", label: "SUV", category: "exterior", x: 1, z: 12.5, w: 2.0, d: 1.0, color: "#336644", shape: "rect" },
  { id: "car-hatchback", label: "Hatchback", category: "exterior", x: -7, z: 12.5, w: 2.0, d: 1.0, color: "#993333", shape: "rect" },
  { id: "car-taxi", label: "Taxi", category: "exterior", x: 8, z: 12.5, w: 2.0, d: 1.0, color: "#ccaa22", shape: "rect" },

  // Parking lot lamp posts
  { id: "lamp-1", label: "Lamp Post", category: "exterior", x: -6, z: 14, w: 0.3, d: 0.3, color: "#cccc88", shape: "circle" },
  { id: "lamp-2", label: "Lamp Post", category: "exterior", x: 0, z: 14, w: 0.3, d: 0.3, color: "#cccc88", shape: "circle" },
  { id: "lamp-3", label: "Lamp Post", category: "exterior", x: 6, z: 14, w: 0.3, d: 0.3, color: "#cccc88", shape: "circle" },

  // Handicap sign
  { id: "handicap-sign", label: "Handicap Sign", category: "exterior", x: -1.5, z: 10.5, w: 0.4, d: 0.4, color: "#2255bb", shape: "rect" },

  // Bike rack
  { id: "bike-rack", label: "Bike Rack", category: "exterior", x: 8, z: 8, w: 0.8, d: 0.5, color: "#888888", shape: "rect" },
];

// ── Category colors for legend ──
const CATEGORY_META: Record<ObjCategory, { label: string; color: string }> = {
  shelf: { label: "Shelves", color: "#8B5E3C" },
  counter: { label: "Counter", color: "#D2B48C" },
  npc: { label: "NPCs", color: "#3b82f6" },
  prop: { label: "Props", color: "#22c55e" },
  wall: { label: "Wall Features", color: "#ffd700" },
  door: { label: "Doors", color: "#a0c0e0" },
  exterior: { label: "Exterior", color: "#ff6b6b" },
};

export default function EditorPage() {
  const [objects, setObjects] = useState<StoreObject[]>(() =>
    INITIAL_OBJECTS.map((o) => ({ ...o }))
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ObjCategory | "all">("all");
  const svgRef = useRef<SVGSVGElement>(null);

  // Track SVG client rect for accurate mouse position
  const getSvgPoint = useCallback(
    (e: React.MouseEvent | MouseEvent): { sx: number; sy: number } => {
      if (!svgRef.current) return { sx: 0, sy: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = SVG_W / rect.width;
      const scaleY = SVG_H / rect.height;
      return {
        sx: (e.clientX - rect.left) * scaleX,
        sy: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragId(id);
      setSelectedId(id);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragId) return;
      const { sx, sy } = getSvgPoint(e);
      const store = svgToStore(sx, sy);
      setObjects((prev) =>
        prev.map((o) => (o.id === dragId ? { ...o, x: store.x, z: store.z } : o))
      );
    },
    [dragId, getSvgPoint]
  );

  const handleMouseUp = useCallback(() => {
    setDragId(null);
  }, []);

  // Global mouse up to handle drag release outside SVG
  useEffect(() => {
    const up = () => setDragId(null);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const exportPositions = useCallback(() => {
    const data: Record<string, { x: number; z: number; label: string; category: string }> = {};
    for (const o of objects) {
      data[o.id] = { x: o.x, z: o.z, label: o.label, category: o.category };
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [objects]);

  const resetPositions = useCallback(() => {
    setObjects(INITIAL_OBJECTS.map((o) => ({ ...o })));
    setSelectedId(null);
  }, []);

  const filteredObjects =
    filterCategory === "all"
      ? objects
      : objects.filter((o) => o.category === filterCategory);

  const selectedObj = objects.find((o) => o.id === selectedId);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111118", color: "#e0e0e0", fontFamily: "monospace" }}>
      {/* ── Main SVG Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 20px",
            background: "#1a1a24",
            borderBottom: "1px solid #333",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18, color: "#ffd700" }}>
            Friday Night Video -- Store Layout Editor
          </h1>
          <span style={{ fontSize: 12, color: "#888" }}>
            {ROOM_W}x{ROOM_D} units | Click + drag objects | Coordinates shown in real-time
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {(["all", "shelf", "counter", "npc", "prop", "wall", "door"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  border: filterCategory === cat ? "1px solid #ffd700" : "1px solid #444",
                  borderRadius: 4,
                  background: filterCategory === cat ? "#2a2a3a" : "#1a1a24",
                  color: filterCategory === cat ? "#ffd700" : "#999",
                  cursor: "pointer",
                }}
              >
                {cat === "all" ? "ALL" : CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ maxWidth: "100%", maxHeight: "100%", cursor: dragId ? "grabbing" : "default" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Background */}
            <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="#0d0d14" />

            {/* Store floor */}
            <rect
              x={SVG_PADDING}
              y={SVG_PADDING}
              width={ROOM_W * SCALE}
              height={ROOM_D * SCALE}
              fill="#141830"
              stroke="#334"
              strokeWidth={2}
            />

            {/* Grid lines */}
            {Array.from({ length: ROOM_W + 1 }, (_, i) => {
              const px = SVG_PADDING + i * SCALE;
              return (
                <line
                  key={`vg-${i}`}
                  x1={px}
                  y1={SVG_PADDING}
                  x2={px}
                  y2={SVG_PADDING + ROOM_D * SCALE}
                  stroke={i === ROOM_W / 2 ? "#445" : "#1e1e2a"}
                  strokeWidth={i === ROOM_W / 2 ? 1.5 : 0.5}
                />
              );
            })}
            {Array.from({ length: ROOM_D + 1 }, (_, i) => {
              const py = SVG_PADDING + i * SCALE;
              return (
                <line
                  key={`hg-${i}`}
                  x1={SVG_PADDING}
                  y1={py}
                  x2={SVG_PADDING + ROOM_W * SCALE}
                  y2={py}
                  stroke={i === ROOM_D / 2 ? "#445" : "#1e1e2a"}
                  strokeWidth={i === ROOM_D / 2 ? 1.5 : 0.5}
                />
              );
            })}

            {/* X-axis labels (store x coords) */}
            {Array.from({ length: ROOM_W + 1 }, (_, i) => {
              const storeX = i - ROOM_W / 2;
              const px = SVG_PADDING + i * SCALE;
              return (
                <text
                  key={`xl-${i}`}
                  x={px}
                  y={SVG_PADDING - 8}
                  textAnchor="middle"
                  fill="#666"
                  fontSize={10}
                >
                  {storeX}
                </text>
              );
            })}

            {/* Z-axis labels (store z coords, remember inverted) */}
            {Array.from({ length: ROOM_D + 1 }, (_, i) => {
              const storeZ = ROOM_D / 2 - i;
              const py = SVG_PADDING + i * SCALE;
              return (
                <text
                  key={`zl-${i}`}
                  x={SVG_PADDING - 12}
                  y={py + 4}
                  textAnchor="end"
                  fill="#666"
                  fontSize={10}
                >
                  {storeZ}
                </text>
              );
            })}

            {/* Axis labels */}
            <text x={SVG_W / 2} y={16} textAnchor="middle" fill="#888" fontSize={12} fontWeight="bold">
              X axis (left = -16, right = +16)
            </text>
            <text
              x={14}
              y={SVG_H / 2}
              textAnchor="middle"
              fill="#888"
              fontSize={12}
              fontWeight="bold"
              transform={`rotate(-90, 14, ${SVG_H / 2})`}
            >
              Z axis (back = -7, front = +15)
            </text>

            {/* Wall labels */}
            <text x={SVG_W / 2} y={SVG_PADDING + ROOM_D * SCALE + 20} textAnchor="middle" fill="#ffd700" fontSize={12}>
              FRONT WALL (Entrance) z = +7
            </text>
            <text x={SVG_W / 2} y={SVG_PADDING - 22} textAnchor="middle" fill="#ffd700" fontSize={12}>
              BACK WALL z = -7
            </text>
            <text
              x={SVG_PADDING - 30}
              y={SVG_H / 2}
              textAnchor="middle"
              fill="#ffd700"
              fontSize={11}
              transform={`rotate(-90, ${SVG_PADDING - 30}, ${SVG_H / 2})`}
            >
              LEFT WALL x = -10
            </text>
            <text
              x={SVG_PADDING + ROOM_W * SCALE + 30}
              y={SVG_H / 2}
              textAnchor="middle"
              fill="#ffd700"
              fontSize={11}
              transform={`rotate(90, ${SVG_PADDING + ROOM_W * SCALE + 30}, ${SVG_H / 2})`}
            >
              RIGHT WALL x = +10
            </text>

            {/* ── Zone overlays ────────────────────────── */}
            {/* Store interior (x: -10..10, z: -7..7) */}
            {(() => { const tl = storeToSvg(-10, 7); const br = storeToSvg(10, -7); return (
              <rect x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
                fill="rgba(20, 24, 48, 0.5)" stroke="#ffd700" strokeWidth={2} strokeDasharray="6 3" />
            ); })()}
            {/* Pizza Palace (x: -16..-10, z: 6.8..7.2) */}
            {(() => { const tl = storeToSvg(-16, 7.3); const br = storeToSvg(-10, 6.7); return (
              <><rect x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
                fill="rgba(204, 51, 51, 0.1)" stroke="#cc3333" strokeWidth={1} strokeDasharray="4 2" />
              <text x={(tl.sx + br.sx) / 2} y={tl.sy - 4} textAnchor="middle" fill="#cc3333" fontSize={9} fontWeight="bold">PIZZA PALACE</text></>
            ); })()}
            {/* Laundromat (x: 10..16, z: 6.8..7.2) */}
            {(() => { const tl = storeToSvg(10, 7.3); const br = storeToSvg(16, 6.7); return (
              <><rect x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
                fill="rgba(17, 51, 85, 0.1)" stroke="#3399cc" strokeWidth={1} strokeDasharray="4 2" />
              <text x={(tl.sx + br.sx) / 2} y={tl.sy - 4} textAnchor="middle" fill="#3399cc" fontSize={9} fontWeight="bold">LAUNDROMAT</text></>
            ); })()}
            {/* Sidewalk (z: 7..8.5) */}
            {(() => { const tl = storeToSvg(-16, 8.5); const br = storeToSvg(16, 7); return (
              <rect x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
                fill="rgba(74, 74, 74, 0.15)" stroke="#555" strokeWidth={0.5} />
            ); })()}
            {/* Parking lot (z: 8.5..15) */}
            {(() => { const tl = storeToSvg(-14, 15); const br = storeToSvg(14, 8.5); return (
              <><rect x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
                fill="rgba(42, 42, 53, 0.2)" stroke="#444" strokeWidth={0.5} strokeDasharray="4 2" />
              <text x={(tl.sx + br.sx) / 2} y={(tl.sy + br.sy) / 2} textAnchor="middle" fill="#555" fontSize={11}>PARKING LOT</text></>
            ); })()}
            {/* Store interior label */}
            {(() => { const c = storeToSvg(0, 7); return (
              <text x={c.sx} y={c.sy - 8} textAnchor="middle" fill="#ffd700" fontSize={10} fontWeight="bold">STORE INTERIOR</text>
            ); })()}

            {/* Store objects */}
            {filteredObjects.map((obj) => {
              const { sx, sy } = storeToSvg(obj.x, obj.z);
              const pw = obj.w * SCALE;
              const ph = obj.d * SCALE;
              const isHovered = hoverId === obj.id;
              const isSelected = selectedId === obj.id;
              const isDragging = dragId === obj.id;
              const opacity = isDragging ? 0.9 : isHovered ? 0.85 : 0.7;
              const strokeColor = isSelected ? "#ffd700" : isHovered ? "#fff" : "transparent";

              return (
                <g
                  key={obj.id}
                  onMouseDown={(e) => handleMouseDown(obj.id, e)}
                  onMouseEnter={() => setHoverId(obj.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                >
                  {obj.shape === "circle" ? (
                    <>
                      <circle
                        cx={sx}
                        cy={sy}
                        r={pw / 2}
                        fill={obj.color}
                        opacity={opacity}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2 : 1.5}
                      />
                      <text
                        x={sx}
                        y={sy - pw / 2 - 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={9}
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {obj.label}
                      </text>
                    </>
                  ) : (
                    <>
                      <rect
                        x={sx - pw / 2}
                        y={sy - ph / 2}
                        width={pw}
                        height={ph}
                        rx={3}
                        fill={obj.color}
                        opacity={opacity}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2 : 1.5}
                      />
                      <text
                        x={sx}
                        y={sy + 3}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={pw > 60 ? 10 : 8}
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {obj.label}
                      </text>
                    </>
                  )}

                  {/* Coordinate tooltip on hover/drag */}
                  {(isHovered || isDragging) && (
                    <text
                      x={sx}
                      y={obj.shape === "circle" ? sy + pw / 2 + 12 : sy + ph / 2 + 12}
                      textAnchor="middle"
                      fill="#0f0"
                      fontSize={10}
                      pointerEvents="none"
                    >
                      [{obj.x}, {obj.z}]
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div
        style={{
          width: 340,
          background: "#1a1a24",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Selected object detail */}
        <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 14, color: "#ffd700" }}>Selected Object</h2>
          {selectedObj ? (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <strong>{selectedObj.label}</strong>{" "}
                <span style={{ color: "#888" }}>({selectedObj.category})</span>
              </div>
              <div>
                Position: <span style={{ color: "#0f0" }}>x={selectedObj.x}, z={selectedObj.z}</span>
              </div>
              <div>
                Size: {selectedObj.w} x {selectedObj.d}
              </div>
              {selectedObj.genre && (
                <div>
                  Genre: <span style={{ color: "#f97316" }}>{selectedObj.genre}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#666" }}>Click an object to select it</div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#aaa" }}>Legend</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CATEGORY_META).map(([cat, meta]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: meta.color,
                    borderRadius: cat === "npc" ? "50%" : 2,
                  }}
                />
                {meta.label}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", gap: 8 }}>
          <button
            onClick={exportPositions}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: copied ? "#166534" : "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {copied ? "Copied!" : "Export Positions"}
          </button>
          <button
            onClick={resetPositions}
            style={{
              padding: "8px 12px",
              background: "#333",
              color: "#ccc",
              border: "1px solid #555",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Reset
          </button>
        </div>

        {/* All positions JSON */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 12, color: "#aaa" }}>All Positions (JSON)</h3>
          <pre
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: 1.5,
              color: "#8f8",
              background: "#0d0d14",
              padding: 10,
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {JSON.stringify(
              Object.fromEntries(
                objects.map((o) => [
                  o.id,
                  { x: o.x, z: o.z, label: o.label, category: o.category },
                ])
              ),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
