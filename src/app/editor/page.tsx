"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  StoreLayout,
  LayoutObject,
  ObjCategory,
  LayoutCollider,
  LayoutInteraction,
} from "@/lib/store-layout";
import {
  STORE_PREFABS,
  inferPrefabId,
  getPrefabDefinition,
} from "@/lib/store-prefabs";

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
  prefab?: string;
  layer?: string;
  hidden?: boolean;
  locked?: boolean;
  interaction?: LayoutInteraction;
  collider?: LayoutCollider;
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
  const prefabId = obj.prefab || inferPrefabId(obj);
  const prefab = getPrefabDefinition(prefabId);
  const isCircle = prefabId === "exterior/lamp-post" || obj.category === "npc" || obj.id === "plant" || obj.id === "pizza-slice-sign" || obj.id.includes("hydrant") || obj.id.includes("puddle");
  return {
    id: obj.id,
    label: obj.label,
    category: obj.category,
    prefab: prefabId,
    layer: obj.layer ?? prefab?.defaultLayer ?? obj.category,
    hidden: obj.hidden ?? false,
    locked: obj.locked ?? false,
    interaction: obj.interaction ?? prefab?.defaultInteraction,
    collider: obj.collider ?? prefab?.defaultCollider,
    x: obj.x,
    z: obj.z,
    w: obj.w ?? 0.5,
    d: obj.d ?? 0.5,
    color: (obj.meta?.color as string) || prefab?.editorColor || CATEGORY_COLORS[obj.category] || "#888",
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
  if (obj.prefab) lo.prefab = obj.prefab;
  if (obj._rotY !== undefined && obj._rotY !== 0) lo.rotY = obj._rotY;
  if (obj.w !== undefined) lo.w = obj.w;
  if (obj.d !== undefined) lo.d = obj.d;
  if (obj.hidden) lo.hidden = true;
  if (obj.locked) lo.locked = true;
  if (obj.layer) lo.layer = obj.layer;
  if (obj.interaction?.type && obj.interaction?.label) lo.interaction = obj.interaction;
  if (obj.collider) lo.collider = obj.collider;
  if (obj._meta && Object.keys(obj._meta).length > 0) lo.meta = obj._meta;
  return lo;
}

function buildObjectId(prefabId: string): string {
  return `${prefabId.replace(/[/:]/g, "-")}-${Date.now()}`;
}

function createObjectFromPrefab(prefabId: string, base?: Partial<StoreObject>): StoreObject {
  const prefab = getPrefabDefinition(prefabId);
  if (!prefab) {
    throw new Error(`Unknown prefab: ${prefabId}`);
  }

  const isCircle = prefabId === "exterior/lamp-post";

  return {
    id: buildObjectId(prefabId),
    label: prefab.label,
    category: prefab.category,
    prefab: prefab.id,
    layer: prefab.defaultLayer,
    hidden: false,
    locked: false,
    interaction: prefab.defaultInteraction,
    collider: prefab.defaultCollider,
    x: base?.x ?? 0,
    z: base?.z ?? 0,
    w: base?.w ?? prefab.defaultWidth,
    d: base?.d ?? prefab.defaultDepth,
    color: prefab.editorColor,
    shape: isCircle ? "circle" : "rect",
    _y: base?._y ?? 0,
    _rotY: base?._rotY ?? 0,
    _meta: base?._meta ?? {},
  };
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ObjCategory | "all">("all");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [createPrefabId, setCreatePrefabId] = useState("wall/poster");
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [lockedLayers, setLockedLayers] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const originalObjectsRef = useRef<StoreObject[]>([]);
  const undoStack = useRef<StoreObject[][]>([]);
  const redoStack = useRef<StoreObject[][]>([]);
  const dragSelectionOffsets = useRef<{ id: string; dx: number; dz: number }[]>([]);

  // Push current state to undo stack (call before making changes)
  const pushUndo = useCallback(() => {
    undoStack.current.push(objects.map((o) => ({ ...o })));
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
  }, [objects]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push(objects.map((o) => ({ ...o })));
    setObjects(undoStack.current.pop()!);
  }, [objects]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push(objects.map((o) => ({ ...o })));
    setObjects(redoStack.current.pop()!);
  }, [objects]);

  // Keyboard shortcuts: undo/redo, arrow nudge, delete, duplicate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      // Undo: Ctrl+Z
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
      // Redo: Ctrl+Shift+Z
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo(); return; }
      if (selectedIds.length === 0) return;
      const nudge = e.shiftKey ? 0.5 : 0.1;
      const selection = new Set(selectedIds);
      // Arrow nudge
      if (e.key === "ArrowLeft") { e.preventDefault(); pushUndo(); setObjects(prev => prev.map(o => selection.has(o.id) ? { ...o, x: Math.round((o.x - nudge) * 100) / 100 } : o)); }
      if (e.key === "ArrowRight") { e.preventDefault(); pushUndo(); setObjects(prev => prev.map(o => selection.has(o.id) ? { ...o, x: Math.round((o.x + nudge) * 100) / 100 } : o)); }
      if (e.key === "ArrowUp") { e.preventDefault(); pushUndo(); setObjects(prev => prev.map(o => selection.has(o.id) ? { ...o, z: Math.round((o.z - nudge) * 100) / 100 } : o)); }
      if (e.key === "ArrowDown") { e.preventDefault(); pushUndo(); setObjects(prev => prev.map(o => selection.has(o.id) ? { ...o, z: Math.round((o.z + nudge) * 100) / 100 } : o)); }
      // Delete
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); pushUndo(); setObjects(prev => prev.filter(o => !selection.has(o.id))); setSelectedId(null); setSelectedIds([]); }
      // Duplicate: Ctrl+D
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        pushUndo();
        const selectedObjects = objects.filter((o) => selection.has(o.id));
        if (selectedObjects.length === 0) return;
        const duplicates = selectedObjects.map((obj, index) => ({
          ...obj,
          id: `${obj.id}-copy-${Date.now()}-${index}`,
          x: obj.x + 0.5,
          z: obj.z + 0.5,
        }));
        setObjects(prev => [...prev, ...duplicates]);
        setSelectedId(duplicates[duplicates.length - 1]?.id ?? null);
        setSelectedIds(duplicates.map((obj) => obj.id));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, objects, undo, redo, pushUndo]);

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
      const obj = objects.find((item) => item.id === id);
      const layer = obj?.layer ?? obj?.category ?? "";
      const isToggleSelection = e.shiftKey || e.metaKey || e.ctrlKey;
      if (isToggleSelection) {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
        );
        setSelectedId(id);
        return;
      }
      if (obj?.locked || lockedLayers.includes(layer)) {
        setSelectedId(id);
        setSelectedIds([id]);
        return;
      }
      const nextSelection = selectedIds.includes(id) ? selectedIds : [id];
      pushUndo();
      setDragId(id);
      setSelectedId(id);
      setSelectedIds(nextSelection);
      const anchor = objects.find((item) => item.id === id);
      if (anchor) {
        dragSelectionOffsets.current = objects
          .filter((item) => nextSelection.includes(item.id))
          .map((item) => ({
            id: item.id,
            dx: item.x - anchor.x,
            dz: item.z - anchor.z,
          }));
      }
    },
    [lockedLayers, objects, pushUndo, selectedIds]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragId) return;
      const { sx, sy } = getSvgPoint(e);
      let store = svgToStore(sx, sy);
      if (snapToGrid) {
        store.x = Math.round(store.x * 2) / 2; // snap to 0.5
        store.z = Math.round(store.z * 2) / 2;
      }
      const offsetMap = new Map(
        dragSelectionOffsets.current.map((entry) => [entry.id, entry] as const)
      );
      setObjects((prev) =>
        prev.map((o) => {
          const offset = offsetMap.get(o.id);
          if (!offset) return o;
          const nextX = store.x + offset.dx;
          const nextZ = store.z + offset.dz;
          return {
            ...o,
            x: snapToGrid ? Math.round(nextX * 2) / 2 : Math.round(nextX * 100) / 100,
            z: snapToGrid ? Math.round(nextZ * 2) / 2 : Math.round(nextZ * 100) / 100,
          };
        })
      );
    },
    [dragId, getSvgPoint, snapToGrid]
  );

  const handleMouseUp = useCallback(() => {
    setDragId(null);
    dragSelectionOffsets.current = [];
  }, []);

  const createObject = useCallback(() => {
    pushUndo();
    const anchor = selectedId ? objects.find((obj) => obj.id === selectedId) : null;
    const next = createObjectFromPrefab(createPrefabId, anchor ? {
      x: anchor.x + 0.6,
      z: anchor.z + 0.6,
      _y: anchor._y,
      _rotY: anchor._rotY,
    } : undefined);
    setObjects((prev) => [...prev, next]);
    setSelectedId(next.id);
    setSelectedIds([next.id]);
  }, [createPrefabId, objects, pushUndo, selectedId]);

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
      // Notify parent (dual editor) that layout was saved
      if (window.parent !== window) window.parent.postMessage({ type: "layout-saved" }, "*");
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
    setSelectedIds([]);
  }, []);

  const alignSelection = useCallback((mode: "left" | "center-x" | "right" | "top" | "center-z" | "bottom") => {
    if (selectedIds.length < 2) return;
    pushUndo();
    const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
    if (selectedObjects.length < 2) return;
    const minX = Math.min(...selectedObjects.map((obj) => obj.x));
    const maxX = Math.max(...selectedObjects.map((obj) => obj.x));
    const minZ = Math.min(...selectedObjects.map((obj) => obj.z));
    const maxZ = Math.max(...selectedObjects.map((obj) => obj.z));
    const centerX = Math.round(((minX + maxX) / 2) * 100) / 100;
    const centerZ = Math.round(((minZ + maxZ) / 2) * 100) / 100;
    setObjects((prev) =>
      prev.map((obj) => {
        if (!selectedIds.includes(obj.id)) return obj;
        if (mode === "left") return { ...obj, x: minX };
        if (mode === "center-x") return { ...obj, x: centerX };
        if (mode === "right") return { ...obj, x: maxX };
        if (mode === "top") return { ...obj, z: minZ };
        if (mode === "center-z") return { ...obj, z: centerZ };
        return { ...obj, z: maxZ };
      })
    );
  }, [objects, pushUndo, selectedIds]);

  const distributeSelection = useCallback((axis: "x" | "z") => {
    if (selectedIds.length < 3) return;
    pushUndo();
    const selectedObjects = objects
      .filter((obj) => selectedIds.includes(obj.id))
      .slice()
      .sort((a, b) => axis === "x" ? a.x - b.x : a.z - b.z);
    if (selectedObjects.length < 3) return;
    const first = axis === "x" ? selectedObjects[0].x : selectedObjects[0].z;
    const last = axis === "x"
      ? selectedObjects[selectedObjects.length - 1].x
      : selectedObjects[selectedObjects.length - 1].z;
    const step = (last - first) / (selectedObjects.length - 1);
    const targetMap = new Map(
      selectedObjects.map((obj, index) => [
        obj.id,
        Math.round((first + step * index) * 100) / 100,
      ] as const)
    );
    setObjects((prev) =>
      prev.map((obj) => {
        const value = targetMap.get(obj.id);
        if (value === undefined) return obj;
        return axis === "x" ? { ...obj, x: value } : { ...obj, z: value };
      })
    );
  }, [objects, pushUndo, selectedIds]);

  const filteredObjects =
    filterCategory === "all"
      ? objects
      : objects.filter((o) => o.category === filterCategory);
  const layers = Array.from(new Set(objects.map((obj) => obj.layer ?? obj.category))).sort((a, b) => a.localeCompare(b));
  const visibleObjects = filteredObjects.filter((obj) => !hiddenLayers.includes(obj.layer ?? obj.category));

  const selectedObj = objects.find((o) => o.id === selectedId) ?? null;
  const multiSelected = selectedIds.length > 1;

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
            {ROOM_W}x{ROOM_D} | Drag objects | Shift/Cmd click multi-select | Arrows nudge | Ctrl+Z undo
          </span>
          <button onClick={undo} style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #555", borderRadius: 4, background: "#1a1a24", color: "#ccc", cursor: "pointer" }}>↩ Undo</button>
          <button onClick={redo} style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #555", borderRadius: 4, background: "#1a1a24", color: "#ccc", cursor: "pointer" }}>↪ Redo</button>
          <button onClick={() => setSnapToGrid(s => !s)} style={{ padding: "4px 8px", fontSize: 11, border: snapToGrid ? "1px solid #ffd700" : "1px solid #555", borderRadius: 4, background: snapToGrid ? "#2a2a3a" : "#1a1a24", color: snapToGrid ? "#ffd700" : "#888", cursor: "pointer" }}>{snapToGrid ? "⊞ Snap ON" : "⊞ Snap OFF"}</button>
          <select
            value={createPrefabId}
            onChange={(e) => setCreatePrefabId(e.target.value)}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #555",
              borderRadius: 4,
              background: "#111118",
              color: "#ddd",
            }}
          >
            {STORE_PREFABS.map((prefab) => (
              <option key={prefab.id} value={prefab.id}>
                {prefab.label}
              </option>
            ))}
          </select>
          <button
            onClick={createObject}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #22c55e",
              borderRadius: 4,
              background: "#1a1a24",
              color: "#22c55e",
              cursor: "pointer",
            }}
          >
            + Add Prefab
          </button>
          <button
            onClick={() => alignSelection("left")}
            disabled={selectedIds.length < 2}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #f59e0b",
              borderRadius: 4,
              background: "#1a1a24",
              color: selectedIds.length >= 2 ? "#fbbf24" : "#666",
              cursor: selectedIds.length >= 2 ? "pointer" : "not-allowed",
            }}
          >
            Align X
          </button>
          <button
            onClick={() => alignSelection("top")}
            disabled={selectedIds.length < 2}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #f59e0b",
              borderRadius: 4,
              background: "#1a1a24",
              color: selectedIds.length >= 2 ? "#fbbf24" : "#666",
              cursor: selectedIds.length >= 2 ? "pointer" : "not-allowed",
            }}
          >
            Align Z
          </button>
          <button
            onClick={() => distributeSelection("x")}
            disabled={selectedIds.length < 3}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #14b8a6",
              borderRadius: 4,
              background: "#1a1a24",
              color: selectedIds.length >= 3 ? "#5eead4" : "#666",
              cursor: selectedIds.length >= 3 ? "pointer" : "not-allowed",
            }}
          >
            Dist X
          </button>
          <button
            onClick={() => distributeSelection("z")}
            disabled={selectedIds.length < 3}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #14b8a6",
              borderRadius: 4,
              background: "#1a1a24",
              color: selectedIds.length >= 3 ? "#5eead4" : "#666",
              cursor: selectedIds.length >= 3 ? "pointer" : "not-allowed",
            }}
          >
            Dist Z
          </button>
          <a href="/editor/3d" style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #3b82f6", borderRadius: 4, background: "#1a1a24", color: "#3b82f6", textDecoration: "none" }}>3D Editor →</a>
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
            <rect
              x={0}
              y={0}
              width={SVG_W}
              height={SVG_H}
              fill="#0d0d14"
              onMouseDown={() => {
                setSelectedId(null);
                setSelectedIds([]);
              }}
            />

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
            {visibleObjects.map((obj) => {
              const { sx, sy } = storeToSvg(obj.x, obj.z);
              const pw = obj.w * SCALE;
              const ph = obj.d * SCALE;
              const isHovered = hoverId === obj.id;
              const isSelected = selectedIds.includes(obj.id);
              const isDragging = dragId === obj.id;
              const layerLocked = lockedLayers.includes(obj.layer ?? obj.category);
              const opacity = obj.hidden ? 0.25 : isDragging ? 0.9 : isHovered ? 0.85 : 0.7;
              const strokeColor = obj.locked || layerLocked ? "#ef4444" : isSelected ? "#ffd700" : isHovered ? "#fff" : "transparent";
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
                  style={{ cursor: obj.locked || layerLocked ? "not-allowed" : isDragging ? "grabbing" : "grab" }}
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
          {multiSelected ? (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <strong>{selectedIds.length} objects selected</strong>
              </div>
              <div style={{ color: "#888", fontSize: 11 }}>
                Use the toolbar to align or distribute the selection.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => alignSelection("center-x")}
                  style={{ padding: "6px 8px", background: "#2a2a3a", color: "#ffd700", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}
                >
                  Center X
                </button>
                <button
                  onClick={() => alignSelection("center-z")}
                  style={{ padding: "6px 8px", background: "#2a2a3a", color: "#ffd700", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}
                >
                  Center Z
                </button>
                <button
                  onClick={() => alignSelection("left")}
                  style={{ padding: "6px 8px", background: "#2a2a3a", color: "#fbbf24", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}
                >
                  Align Left
                </button>
                <button
                  onClick={() => alignSelection("top")}
                  style={{ padding: "6px 8px", background: "#2a2a3a", color: "#fbbf24", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}
                >
                  Align Top
                </button>
              </div>
            </div>
          ) : selectedObj ? (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <strong>{selectedObj.label}</strong>{" "}
                <span style={{ color: "#888" }}>({selectedObj.category})</span>
              </div>
              <div style={{ color: "#666", fontSize: 11 }}>id: {selectedObj.id}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedObj.hidden)}
                    onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, hidden: e.target.checked } : o))}
                  />
                  Hidden
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedObj.locked)}
                    onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, locked: e.target.checked } : o))}
                  />
                  Locked
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                <label style={{ fontSize: 11, color: "#aaa" }}>Prefab</label>
                <select
                  value={selectedObj.prefab ?? ""}
                  onChange={(e) => {
                    const prefabId = e.target.value;
                    const prefab = getPrefabDefinition(prefabId);
                    setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? {
                      ...o,
                      prefab: prefabId,
                      category: prefab?.category ?? o.category,
                      color: prefab?.editorColor ?? o.color,
                      layer: prefab?.defaultLayer ?? o.layer,
                      interaction: o.interaction ?? prefab?.defaultInteraction,
                      collider: o.collider ?? prefab?.defaultCollider,
                    } : o));
                  }}
                  style={{ background: "#222", color: "#ddd", border: "1px solid #444", borderRadius: 4, padding: "4px 6px", fontSize: 12 }}
                >
                  <option value="">None</option>
                  {STORE_PREFABS.map((prefab) => (
                    <option key={prefab.id} value={prefab.id}>
                      {prefab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                <label style={{ fontSize: 11, color: "#aaa" }}>Layer</label>
                <input
                  type="text"
                  value={selectedObj.layer ?? ""}
                  onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? { ...o, layer: e.target.value } : o))}
                  style={{ background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 4, padding: "4px 6px", fontSize: 12, fontFamily: "monospace" }}
                />
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
              {/* Quick rotation: ±5° and ±45° */}
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {[-45, -5, 5, 45].map(deg => (
                  <button key={deg} onClick={() => { pushUndo(); const rad = Math.round(((selectedObj._rotY ?? 0) + deg * Math.PI / 180) * 1000) / 1000; setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, _rotY: rad } : o)); }}
                    style={{ flex: 1, padding: "3px 0", fontSize: 10, background: "#333", color: "#ccc", border: "1px solid #555", borderRadius: 3, cursor: "pointer" }}
                  >{deg > 0 ? `+${deg}°` : `${deg}°`}</button>
                ))}
              </div>
              {/* Editable size */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11 }}>W:</span>
                <input type="number" step={0.1} value={selectedObj.w}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) { pushUndo(); setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, w: Math.round(v * 100) / 100 } : o)); }}}
                  style={{ width: 50, background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                />
                <span style={{ fontSize: 11 }}>D:</span>
                <input type="number" step={0.1} value={selectedObj.d}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) { pushUndo(); setObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, d: Math.round(v * 100) / 100 } : o)); }}}
                  style={{ width: 50, background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", display: "block" }}>Interaction Type</label>
                  <input
                    type="text"
                    value={selectedObj.interaction?.type ?? ""}
                    onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? {
                      ...o,
                      interaction: {
                        type: e.target.value,
                        label: o.interaction?.label ?? o.label,
                        data: o.interaction?.data,
                      },
                    } : o))}
                    style={{ width: "100%", background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", display: "block" }}>Interaction Label</label>
                  <input
                    type="text"
                    value={selectedObj.interaction?.label ?? ""}
                    onChange={(e) => setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? {
                      ...o,
                      interaction: {
                        type: o.interaction?.type ?? "",
                        label: e.target.value,
                        data: o.interaction?.data,
                      },
                    } : o))}
                    style={{ width: "100%", background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", display: "block" }}>Collider Width</label>
                  <input
                    type="number"
                    step={0.1}
                    value={selectedObj.collider?.width ?? 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? {
                        ...o,
                        collider: {
                          type: "box",
                          enabled: true,
                          width: Number.isFinite(value) ? value : 0,
                          depth: o.collider?.depth ?? o.d,
                          offsetX: o.collider?.offsetX,
                          offsetZ: o.collider?.offsetZ,
                        },
                      } : o));
                    }}
                    style={{ width: "100%", background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", display: "block" }}>Collider Depth</label>
                  <input
                    type="number"
                    step={0.1}
                    value={selectedObj.collider?.depth ?? 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setObjects((prev) => prev.map((o) => o.id === selectedObj.id ? {
                        ...o,
                        collider: {
                          type: "box",
                          enabled: true,
                          width: o.collider?.width ?? o.w,
                          depth: Number.isFinite(value) ? value : 0,
                          offsetX: o.collider?.offsetX,
                          offsetZ: o.collider?.offsetZ,
                        },
                      } : o));
                    }}
                    style={{ width: "100%", background: "#222", color: "#0f0", border: "1px solid #444", borderRadius: 3, padding: "2px 4px", fontSize: 12, fontFamily: "monospace" }}
                  />
                </div>
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

        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#aaa" }}>Layers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {layers.map((layer) => {
              const hidden = hiddenLayers.includes(layer);
              const locked = lockedLayers.includes(layer);
              return (
                <div key={layer} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 6, alignItems: "center", fontSize: 11 }}>
                  <span style={{ color: hidden ? "#666" : "#ccc" }}>{layer}</span>
                  <button
                    onClick={() => setHiddenLayers((prev) => hidden ? prev.filter((entry) => entry !== layer) : [...prev, layer])}
                    style={{ padding: "3px 6px", background: "#222", color: hidden ? "#666" : "#93c5fd", border: "1px solid #444", borderRadius: 3, cursor: "pointer", fontSize: 10 }}
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    onClick={() => setLockedLayers((prev) => locked ? prev.filter((entry) => entry !== layer) : [...prev, layer])}
                    style={{ padding: "3px 6px", background: "#222", color: locked ? "#fca5a5" : "#ccc", border: "1px solid #444", borderRadius: 3, cursor: "pointer", fontSize: 10 }}
                  >
                    {locked ? "Unlock" : "Lock"}
                  </button>
                </div>
              );
            })}
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
