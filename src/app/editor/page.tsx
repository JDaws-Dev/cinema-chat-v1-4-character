"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { StoreLayout, LayoutObject, ObjCategory } from "@/lib/store-layout";

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

// True top-down: back wall (z=-7) at top, entrance (z=7) and parking at bottom.
// Left wall (-x) on left, right wall (+x) on right.
const Z_MAX = 15;  // top of parking lot area
const Z_MIN = -7;  // back wall
const Z_RANGE = Z_MAX - Z_MIN; // 22

function storeToSvg(x: number, z: number): { sx: number; sy: number } {
  return {
    sx: (x + ROOM_W / 2) * SCALE + SVG_PADDING,
    sy: (z - Z_MIN) * SCALE + SVG_PADDING,
  };
}

function svgToStore(sx: number, sy: number): { x: number; z: number } {
  return {
    x: Math.round(((sx - SVG_PADDING) / SCALE - ROOM_W / 2) * 100) / 100,
    z: Math.round(((sy - SVG_PADDING) / SCALE + Z_MIN) * 100) / 100,
  };
}

// Min clickable size for thin objects (pixels)
const MIN_HIT_SIZE = 20;

// ── Object types for the SVG editor ──
interface StoreObject {
  id: string;
  label: string;
  category: ObjCategory;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  shape: "rect" | "circle";
  genre?: string;
  /** Original y from layout (preserved for save-back) */
  _y?: number;
  /** Original rotY from layout */
  _rotY?: number;
  /** Original meta from layout */
  _meta?: Record<string, unknown>;
}

// ── Color mapping for categories ──
const CATEGORY_COLORS: Record<ObjCategory, string> = {
  shelf: "#8B5E3C",
  counter: "#D2B48C",
  npc: "#3b82f6",
  prop: "#22c55e",
  wall: "#ffd700",
  door: "#a0c0e0",
  exterior: "#ff6b6b",
};

/** Convert a LayoutObject from the API into the editor's StoreObject format */
function layoutToEditor(obj: LayoutObject): StoreObject {
  const isCircle = obj.category === "npc" || obj.id.includes("lamp") || obj.id === "plant" || obj.id === "pizza-slice-sign" || obj.id.includes("hydrant") || obj.id.includes("puddle");
  return {
    id: obj.id,
    label: obj.label,
    category: obj.category,
    x: obj.x,
    z: obj.z,
    w: obj.w ?? 0.5,
    d: obj.d ?? 0.5,
    color: (obj.meta?.color as string) || CATEGORY_COLORS[obj.category] || "#888",
    shape: isCircle ? "circle" : "rect",
    genre: obj.meta ? `${obj.meta.genre || ""}${obj.meta.backGenre ? " / " + obj.meta.backGenre : ""}`.trim() || undefined : undefined,
    _y: obj.y,
    _rotY: obj.rotY,
    _meta: obj.meta,
  };
}

/** Convert editor StoreObject back to LayoutObject for saving */
function editorToLayout(obj: StoreObject): LayoutObject {
  const lo: LayoutObject = {
    id: obj.id,
    label: obj.label,
    category: obj.category,
    x: obj.x,
    y: obj._y ?? 0,
    z: obj.z,
  };
  if (obj._rotY !== undefined && obj._rotY !== 0) lo.rotY = obj._rotY;
  if (obj.w !== undefined) lo.w = obj.w;
  if (obj.d !== undefined) lo.d = obj.d;
  if (obj._meta && Object.keys(obj._meta).length > 0) lo.meta = obj._meta;
  return lo;
}

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
  const [objects, setObjects] = useState<StoreObject[]>([]);
  const [layoutVersion, setLayoutVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ObjCategory | "all">("all");
  const svgRef = useRef<SVGSVGElement>(null);
  const originalObjectsRef = useRef<StoreObject[]>([]);

  // Fetch layout from API on mount
  useEffect(() => {
    fetch("/api/layout")
      .then((r) => r.json())
      .then((layout: StoreLayout) => {
        const editorObjs = layout.objects.map(layoutToEditor);
        setObjects(editorObjs);
        originalObjectsRef.current = editorObjs.map((o) => ({ ...o }));
        setLayoutVersion(layout.version);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load layout:", err);
        setLoading(false);
      });
  }, []);

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

  const saveLayout = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const layout: StoreLayout = {
        version: layoutVersion,
        objects: objects.map(editorToLayout),
      };
      const res = await fetch("/api/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveStatus("saved");
      originalObjectsRef.current = objects.map((o) => ({ ...o }));
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [objects, layoutVersion]);

  const resetPositions = useCallback(() => {
    setObjects(originalObjectsRef.current.map((o) => ({ ...o })));
    setSelectedId(null);
  }, []);

  const filteredObjects =
    filterCategory === "all"
      ? objects
      : objects.filter((o) => o.category === filterCategory);

  const selectedObj = objects.find((o) => o.id === selectedId);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#111118", color: "#ffd700", fontFamily: "monospace", justifyContent: "center", alignItems: "center", fontSize: 18 }}>
        Loading layout from store-layout.ts...
      </div>
    );
  }

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
            {(["all", "shelf", "counter", "npc", "prop", "wall", "door", "exterior"] as const).map((cat) => (
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

            {/* Z-axis labels */}
            {Array.from({ length: ROOM_D + 1 }, (_, i) => {
              const storeZ = Z_MIN + i;
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
              Z axis (back = -7 top, front = +7 bottom)
            </text>

            {/* Wall labels */}
            <text x={SVG_W / 2} y={SVG_PADDING - 22} textAnchor="middle" fill="#ffd700" fontSize={12}>
              BACK WALL z = -7
            </text>
            <text x={SVG_W / 2} y={SVG_PADDING + ROOM_D * SCALE + 20} textAnchor="middle" fill="#ffd700" fontSize={12}>
              PARKING LOT / ENTRANCE z = +7
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
            {/* Helper: draw a zone rect from two store corners (handles any z direction) */}
            {/* Store interior (x: -10..10, z: -7..7) */}
            {(() => { const a = storeToSvg(-10, -7); const b = storeToSvg(10, 7);
              const x = Math.min(a.sx, b.sx); const y = Math.min(a.sy, b.sy);
              return <rect x={x} y={y} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)}
                fill="rgba(20, 24, 48, 0.5)" stroke="#ffd700" strokeWidth={2} strokeDasharray="6 3" />;
            })()}
            {/* Pizza Palace (x: -16..-10, z: 6.7..7.3) */}
            {(() => { const a = storeToSvg(-16, 6.7); const b = storeToSvg(-10, 7.3);
              const x = Math.min(a.sx, b.sx); const y = Math.min(a.sy, b.sy);
              const cx = (a.sx + b.sx) / 2; const ty = Math.min(a.sy, b.sy);
              return <><rect x={x} y={y} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)}
                fill="rgba(204, 51, 51, 0.1)" stroke="#cc3333" strokeWidth={1} strokeDasharray="4 2" />
              <text x={cx} y={ty - 4} textAnchor="middle" fill="#cc3333" fontSize={9} fontWeight="bold">PIZZA PALACE</text></>;
            })()}
            {/* Laundromat (x: 10..16, z: 6.7..7.3) */}
            {(() => { const a = storeToSvg(10, 6.7); const b = storeToSvg(16, 7.3);
              const x = Math.min(a.sx, b.sx); const y = Math.min(a.sy, b.sy);
              const cx = (a.sx + b.sx) / 2; const ty = Math.min(a.sy, b.sy);
              return <><rect x={x} y={y} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)}
                fill="rgba(17, 51, 85, 0.1)" stroke="#3399cc" strokeWidth={1} strokeDasharray="4 2" />
              <text x={cx} y={ty - 4} textAnchor="middle" fill="#3399cc" fontSize={9} fontWeight="bold">LAUNDROMAT</text></>;
            })()}
            {/* Sidewalk (z: 7..8.5) */}
            {(() => { const a = storeToSvg(-16, 7); const b = storeToSvg(16, 8.5);
              const x = Math.min(a.sx, b.sx); const y = Math.min(a.sy, b.sy);
              return <rect x={x} y={y} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)}
                fill="rgba(74, 74, 74, 0.15)" stroke="#555" strokeWidth={0.5} />;
            })()}
            {/* Parking lot (z: 8.5..15) */}
            {(() => { const a = storeToSvg(-14, 8.5); const b = storeToSvg(14, 15);
              const x = Math.min(a.sx, b.sx); const y = Math.min(a.sy, b.sy);
              const cx = (a.sx + b.sx) / 2; const cy = (a.sy + b.sy) / 2;
              return <><rect x={x} y={y} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)}
                fill="rgba(42, 42, 53, 0.2)" stroke="#444" strokeWidth={0.5} strokeDasharray="4 2" />
              <text x={cx} y={cy} textAnchor="middle" fill="#555" fontSize={11}>PARKING LOT</text></>;
            })()}
            {/* Store interior label */}
            {(() => { const c = storeToSvg(0, -6); return (
              <text x={c.sx} y={c.sy} textAnchor="middle" fill="#ffd700" fontSize={10} fontWeight="bold">STORE INTERIOR</text>
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
              // Y-axis rotation in 3D = rotation around center in 2D top-down view
              // Convert radians to degrees, negate because SVG Y is flipped
              const rotDeg = (obj._rotY ?? 0) !== 0 ? -(obj._rotY! * 180 / Math.PI) : 0;
              const rotTransform = rotDeg !== 0 ? `rotate(${rotDeg}, ${sx}, ${sy})` : undefined;

              return (
                <g
                  key={obj.id}
                  onMouseDown={(e) => handleMouseDown(obj.id, e)}
                  onMouseEnter={() => setHoverId(obj.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  transform={rotTransform}
                >
                  {obj.shape === "circle" ? (
                    <>
                      {/* Invisible hit target for small circles */}
                      <circle cx={sx} cy={sy} r={Math.max(pw / 2, MIN_HIT_SIZE / 2)} fill="transparent" />
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
                      {/* Invisible hit target for thin rects */}
                      <rect
                        x={sx - Math.max(pw, MIN_HIT_SIZE) / 2}
                        y={sy - Math.max(ph, MIN_HIT_SIZE) / 2}
                        width={Math.max(pw, MIN_HIT_SIZE)}
                        height={Math.max(ph, MIN_HIT_SIZE)}
                        fill="transparent"
                      />
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
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span>X:</span>
                  <input type="number" step={0.1} value={selectedObj.x}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, x: Math.round(v * 100) / 100 } : o)); }}
                    style={{ width: 60, background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <span>Z:</span>
                  <input type="number" step={0.1} value={selectedObj.z}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, z: Math.round(v * 100) / 100 } : o)); }}
                    style={{ width: 60, background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span>Height (Y):</span>
                <button
                  onClick={() => setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _y: Math.round(((o._y ?? 0) - 0.1) * 100) / 100 } : o))}
                  style={{ width: 24, height: 24, background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                >-</button>
                <span style={{ color: "#0f0", minWidth: 40, textAlign: "center" }}>{selectedObj._y ?? 0}</span>
                <button
                  onClick={() => setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _y: Math.round(((o._y ?? 0) + 0.1) * 100) / 100 } : o))}
                  style={{ width: 24, height: 24, background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                >+</button>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.05}
                value={selectedObj._y ?? 0}
                onChange={(e) => {
                  const y = Math.round(parseFloat(e.target.value) * 100) / 100;
                  setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _y: y } : o));
                }}
                style={{ width: "100%", marginTop: 4, accentColor: "#ffd700" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span>Rotation:</span>
                <button
                  onClick={() => setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _rotY: Math.round(((o._rotY ?? 0) - 0.1) * 100) / 100 } : o))}
                  style={{ width: 24, height: 24, background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                >-</button>
                <input
                  type="number"
                  step={1}
                  value={Math.round((selectedObj._rotY ?? 0) * 180 / Math.PI * 10) / 10}
                  onChange={(e) => {
                    const deg = parseFloat(e.target.value);
                    if (!isNaN(deg)) {
                      const rad = Math.round(deg * Math.PI / 180 * 1000) / 1000;
                      setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _rotY: rad } : o));
                    }
                  }}
                  style={{ width: 55, background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace", textAlign: "center" }}
                />
                <span style={{ color: "#888", fontSize: 11 }}>°</span>
                <button
                  onClick={() => setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _rotY: Math.round(((o._rotY ?? 0) + 0.1) * 100) / 100 } : o))}
                  style={{ width: 24, height: 24, background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                >+</button>
              </div>
              <div style={{ marginTop: 4 }}>
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
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={saveLayout}
            disabled={saveStatus === "saving"}
            style={{
              padding: "10px 12px",
              background: saveStatus === "saved" ? "#166534" : saveStatus === "error" ? "#991b1b" : "#b8960a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: saveStatus === "saving" ? "wait" : "pointer",
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved to store-layout.ts!" : saveStatus === "error" ? "Save Failed" : "Save Layout"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
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
              {copied ? "Copied!" : "Export JSON"}
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
