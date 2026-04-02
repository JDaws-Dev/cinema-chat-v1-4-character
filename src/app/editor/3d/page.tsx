"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
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

// ── Dynamic imports (no SSR for R3F) ──
const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => ({ default: m.Canvas })),
  { ssr: false }
);
const SceneContent = dynamic(() => import("./SceneContent"), { ssr: false });

// ── Category colors ──
const CAT_COLORS: Record<ObjCategory, string> = {
  shelf: "#8B5E3C",
  counter: "#D2B48C",
  npc: "#3b82f6",
  prop: "#22c55e",
  wall: "#ffd700",
  door: "#a0c0e0",
  exterior: "#ff6b6b",
};

// ── Category default heights ──
const CAT_HEIGHTS: Record<ObjCategory, number> = {
  shelf: 1.8,
  counter: 1.0,
  npc: 1.7,
  prop: 0.8,
  wall: 0.3,
  door: 2.2,
  exterior: 2.5,
};

const PREFAB_HEIGHTS: Record<string, number> = {
  "wall/poster": 1.4,
  "sign/neon": 0.4,
  "sign/plastic-store": 0.35,
  "sign/open": 0.45,
  "sign/store-hours": 0.9,
  "sign/promo-board": 0.8,
  "sign/challenge-board": 0.6,
  "prop/bulletin-board": 0.8,
  "prop/wall-clock": 0.5,
  "prop/return-bin": 1.0,
  "prop/bargain-bin": 0.6,
  "prop/trash-can": 0.7,
  "prop/crt-tv": 1.2,
  "exterior/car": 1.0,
  "exterior/lamp-post": 3.2,
};

// ── Editor object (superset of LayoutObject with editor state) ──
export interface EditorObject extends LayoutObject {
  prefab?: string;
  layer?: string;
  hidden?: boolean;
  locked?: boolean;
  interaction?: LayoutInteraction;
  collider?: LayoutCollider;
  _prefabId?: string;
  _color: string;
  _height: number;
}

interface EditorCollider {
  id: string;
  x: number;
  z: number;
  hw: number;
  hd: number;
}

function layoutToEditor(obj: LayoutObject): EditorObject {
  const prefabId = obj.prefab || inferPrefabId(obj);
  const prefab = getPrefabDefinition(prefabId);
  return {
    ...obj,
    prefab: prefabId,
    layer: obj.layer ?? prefab?.defaultLayer ?? obj.category,
    hidden: obj.hidden ?? false,
    locked: obj.locked ?? false,
    interaction: obj.interaction ?? prefab?.defaultInteraction,
    collider: obj.collider ?? prefab?.defaultCollider,
    w: obj.w ?? 0.5,
    d: obj.d ?? 0.5,
    _prefabId: prefabId,
    _color: prefab?.editorColor ?? CAT_COLORS[obj.category] ?? "#888",
    _height:
      (prefabId ? PREFAB_HEIGHTS[prefabId] : undefined) ??
      CAT_HEIGHTS[obj.category] ??
      1.0,
  };
}

function editorToLayout(obj: EditorObject): LayoutObject {
  const lo: LayoutObject = {
    id: obj.id,
    label: obj.label,
    category: obj.category,
    x: Math.round(obj.x * 100) / 100,
    y: Math.round(obj.y * 100) / 100,
    z: Math.round(obj.z * 100) / 100,
  };
  if (obj.prefab) lo.prefab = obj.prefab;
  if (obj.rotY !== undefined && obj.rotY !== 0)
    lo.rotY = Math.round(obj.rotY * 1000) / 1000;
  if (obj.w !== undefined) lo.w = Math.round(obj.w * 100) / 100;
  if (obj.d !== undefined) lo.d = Math.round(obj.d * 100) / 100;
  if (obj.hidden) lo.hidden = true;
  if (obj.locked) lo.locked = true;
  if (obj.layer) lo.layer = obj.layer;
  if (obj.interaction?.type && obj.interaction?.label) lo.interaction = obj.interaction;
  if (obj.collider) lo.collider = obj.collider;
  if (obj.meta && Object.keys(obj.meta).length > 0) lo.meta = obj.meta;
  return lo;
}

function buildObjectId(prefabId: string): string {
  return `${prefabId.replace(/[/:]/g, "-")}-${Date.now()}`;
}

function createObjectFromPrefab(
  prefabId: string,
  base?: Partial<EditorObject>
): EditorObject {
  const prefab = getPrefabDefinition(prefabId);
  if (!prefab) {
    throw new Error(`Unknown prefab: ${prefabId}`);
  }

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
    y: base?.y ?? 0,
    z: base?.z ?? 0,
    rotY: base?.rotY ?? 0,
    w: base?.w ?? prefab.defaultWidth,
    d: base?.d ?? prefab.defaultDepth,
    meta: base?.meta ?? {},
    _prefabId: prefab.id,
    _color: prefab.editorColor,
    _height: PREFAB_HEIGHTS[prefab.id] ?? CAT_HEIGHTS[prefab.category] ?? 1.0,
  };
}

// ── Number input component ──
function NumInput({
  label,
  value,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
      }}
    >
      <span style={{ width: 28, color: "#aaa" }}>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.round(v * 100) / 100);
        }}
        style={{
          width: 70,
          background: "#222",
          color: "#0f0",
          border: "1px solid #444",
          borderRadius: 3,
          padding: "3px 5px",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      />
    </label>
  );
}

export default function Editor3DPage() {
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [layoutVersion, setLayoutVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [cameraPos, setCameraPos] = useState<string>("--");
  const [createPrefabId, setCreatePrefabId] = useState("wall/poster");
  const [showColliders, setShowColliders] = useState(true);
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const originalRef = useRef<EditorObject[]>([]);

  // Fetch layout
  useEffect(() => {
    fetch("/api/layout")
      .then((r) => r.json())
      .then((layout: StoreLayout) => {
        const eds = layout.objects.map(layoutToEditor);
        setObjects(eds);
        originalRef.current = eds.map((o) => ({ ...o }));
        setLayoutVersion(layout.version);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load layout:", err);
        setLoading(false);
      });
  }, []);

  // Keyboard shortcuts for transform mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "g" || e.key === "G") setTransformMode("translate");
      if (e.key === "r" || e.key === "R") setTransformMode("rotate");
      if (e.key === "s" || e.key === "S") setTransformMode("scale");
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId]
  );

  const layers = useMemo(
    () =>
      Array.from(
        new Set(objects.map((obj) => obj.layer ?? obj.category))
      ).sort((a, b) => a.localeCompare(b)),
    [objects]
  );

  const visibleObjects = useMemo(
    () =>
      objects.filter(
        (obj) => !hiddenLayers.includes(obj.layer ?? obj.category)
      ),
    [hiddenLayers, objects]
  );

  const previewColliders = useMemo<EditorCollider[]>(
    () =>
      visibleObjects
        .filter(
          (obj) =>
            !obj.hidden &&
            obj.collider?.enabled !== false &&
            Boolean(obj.collider?.width) &&
            Boolean(obj.collider?.depth)
        )
        .map((obj) => ({
          id: obj.id,
          x: obj.x + (obj.collider?.offsetX ?? 0),
          z: obj.z + (obj.collider?.offsetZ ?? 0),
          hw: (obj.collider?.width ?? 0) / 2,
          hd: (obj.collider?.depth ?? 0) / 2,
        })),
    [visibleObjects]
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<EditorObject>) => {
      setObjects((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

  const createObject = useCallback(() => {
    const anchor = selectedId ? objects.find((o) => o.id === selectedId) : null;
    const next = createObjectFromPrefab(
      createPrefabId,
      anchor
        ? {
            x: anchor.x + 0.6,
            y: anchor.y,
            z: anchor.z + 0.6,
            rotY: anchor.rotY,
          }
        : undefined
    );
    setObjects((prev) => [...prev, next]);
    setSelectedId(next.id);
  }, [createPrefabId, objects, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObj) return;
    const duplicate: EditorObject = {
      ...selectedObj,
      id: `${selectedObj.id}-copy-${Date.now()}`,
      x: Math.round((selectedObj.x + 0.5) * 100) / 100,
      z: Math.round((selectedObj.z + 0.5) * 100) / 100,
    };
    setObjects((prev) => [...prev, duplicate]);
    setSelectedId(duplicate.id);
  }, [selectedObj]);

  const handleTransformEnd = useCallback(
    (id: string, pos: [number, number, number], rotY: number) => {
      updateObject(id, {
        x: Math.round(pos[0] * 100) / 100,
        y: Math.round(pos[1] * 100) / 100,
        z: Math.round(pos[2] * 100) / 100,
        rotY: Math.round(rotY * 1000) / 1000,
      });
    },
    [updateObject]
  );

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
      originalRef.current = objects.map((o) => ({ ...o }));
      if (window.parent !== window) window.parent.postMessage({ type: "layout-saved" }, "*");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [objects, layoutVersion]);

  const resetLayout = useCallback(() => {
    setObjects(originalRef.current.map((o) => ({ ...o })));
    setSelectedId(null);
  }, []);

  const toggleLayerVisibility = useCallback((layer: string) => {
    setHiddenLayers((prev) =>
      prev.includes(layer)
        ? prev.filter((entry) => entry !== layer)
        : [...prev, layer]
    );
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#111118",
          color: "#ffd700",
          fontFamily: "monospace",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 18,
        }}
      >
        Loading 3D layout...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#111118",
        color: "#e0e0e0",
        fontFamily: "monospace",
      }}
    >
      {/* ── 3D Canvas ── */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Toolbar */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#ffd700",
              marginRight: 8,
            }}
          >
            3D Layout Editor
          </span>
          {(["translate", "rotate", "scale"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTransformMode(mode)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                border:
                  transformMode === mode
                    ? "1px solid #ffd700"
                    : "1px solid #555",
                borderRadius: 4,
                background:
                  transformMode === mode
                    ? "rgba(255,215,0,0.2)"
                    : "rgba(0,0,0,0.6)",
                color: transformMode === mode ? "#ffd700" : "#aaa",
                cursor: "pointer",
              }}
            >
              {mode[0].toUpperCase() + mode.slice(1)} (
              {mode === "translate" ? "G" : mode === "rotate" ? "R" : "S"})
            </button>
          ))}
          <select
            value={createPrefabId}
            onChange={(e) => setCreatePrefabId(e.target.value)}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #555",
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
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
              padding: "4px 10px",
              fontSize: 11,
              border: "1px solid #22c55e",
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
              color: "#22c55e",
              cursor: "pointer",
            }}
          >
            + Add Prefab
          </button>
          <button
            onClick={duplicateSelected}
            disabled={!selectedObj}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              border: "1px solid #3b82f6",
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
              color: selectedObj ? "#93c5fd" : "#666",
              cursor: selectedObj ? "pointer" : "not-allowed",
            }}
          >
            Duplicate
          </button>
          <button
            onClick={() => setShowColliders((value) => !value)}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              border: showColliders ? "1px solid #f59e0b" : "1px solid #555",
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
              color: showColliders ? "#fbbf24" : "#aaa",
              cursor: "pointer",
            }}
          >
            {showColliders ? "Colliders On" : "Colliders Off"}
          </button>
        </div>

        {/* Camera position */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 10,
            fontSize: 10,
            color: "#666",
            background: "rgba(0,0,0,0.5)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          Camera: {cameraPos}
        </div>

        {/* Help */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 352,
            zIndex: 10,
            fontSize: 10,
            color: "#555",
            background: "rgba(0,0,0,0.5)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          Click=Select | G=Move R=Rotate S=Scale | Esc=Deselect | Scroll=Zoom |
          RMB=Pan
        </div>

        <Canvas
          camera={{ position: [0, 18, 18], fov: 50 }}
          style={{ background: "#0a0a12" }}
        >
          <SceneContent
            objects={visibleObjects}
            colliders={previewColliders}
            showColliders={showColliders}
            selectedId={selectedId}
            transformMode={transformMode}
            onSelect={setSelectedId}
            onTransformEnd={handleTransformEnd}
            onCameraMove={setCameraPos}
          />
        </Canvas>
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
        {/* Selected object */}
        <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
          <h2
            style={{ margin: "0 0 10px", fontSize: 14, color: "#ffd700" }}
          >
            Selected Object
          </h2>
          {selectedObj ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                <strong>{selectedObj.label}</strong>{" "}
                <span style={{ color: "#888", fontSize: 11 }}>
                  ({selectedObj.category})
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>
                id: {selectedObj.id}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedObj.hidden)}
                    onChange={(e) => updateObject(selectedObj.id, { hidden: e.target.checked })}
                  />
                  Hidden
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedObj.locked)}
                    onChange={(e) => updateObject(selectedObj.id, { locked: e.target.checked })}
                  />
                  Locked
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#aaa" }}>
                <span>Prefab</span>
                <select
                  value={selectedObj.prefab ?? ""}
                  onChange={(e) => {
                    const prefabId = e.target.value;
                    const prefab = getPrefabDefinition(prefabId);
                    updateObject(selectedObj.id, {
                      prefab: prefabId || undefined,
                      _prefabId: prefabId || undefined,
                      category: prefab?.category ?? selectedObj.category,
                      layer: prefab?.defaultLayer ?? selectedObj.layer,
                      interaction: selectedObj.interaction ?? prefab?.defaultInteraction,
                      collider: selectedObj.collider ?? prefab?.defaultCollider,
                      _color: prefab?.editorColor ?? CAT_COLORS[selectedObj.category],
                      _height:
                        (prefabId ? PREFAB_HEIGHTS[prefabId] : undefined) ??
                        CAT_HEIGHTS[prefab?.category ?? selectedObj.category] ??
                        selectedObj._height,
                    });
                  }}
                  style={{
                    background: "#222",
                    color: "#ddd",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "4px 6px",
                    fontSize: 12,
                  }}
                >
                  <option value="">None</option>
                  {STORE_PREFABS.map((prefab) => (
                    <option key={prefab.id} value={prefab.id}>
                      {prefab.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#aaa" }}>
                <span>Layer</span>
                <input
                  type="text"
                  value={selectedObj.layer ?? ""}
                  onChange={(e) => updateObject(selectedObj.id, { layer: e.target.value })}
                  style={{
                    background: "#222",
                    color: "#0f0",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "4px 6px",
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                />
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                <NumInput
                  label="X"
                  value={selectedObj.x}
                  onChange={(v) => updateObject(selectedObj.id, { x: v })}
                />
                <NumInput
                  label="Y"
                  value={selectedObj.y}
                  onChange={(v) => updateObject(selectedObj.id, { y: v })}
                />
                <NumInput
                  label="Z"
                  value={selectedObj.z}
                  onChange={(v) => updateObject(selectedObj.id, { z: v })}
                />
                <NumInput
                  label="RotY"
                  value={
                    Math.round(
                      ((selectedObj.rotY ?? 0) * 180) / Math.PI * 10
                    ) / 10
                  }
                  step={5}
                  onChange={(deg) =>
                    updateObject(selectedObj.id, {
                      rotY:
                        Math.round(((deg * Math.PI) / 180) * 1000) / 1000,
                    })
                  }
                />
                <NumInput
                  label="W"
                  value={selectedObj.w ?? 0.5}
                  onChange={(v) => updateObject(selectedObj.id, { w: v })}
                />
                <NumInput
                  label="D"
                  value={selectedObj.d ?? 0.5}
                  onChange={(v) => updateObject(selectedObj.id, { d: v })}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#aaa" }}>
                  <span>Interaction Type</span>
                  <input
                    type="text"
                    value={selectedObj.interaction?.type ?? ""}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        interaction: {
                          type: e.target.value,
                          label: selectedObj.interaction?.label ?? selectedObj.label,
                          data: selectedObj.interaction?.data,
                        },
                      })
                    }
                    style={{
                      background: "#222",
                      color: "#0f0",
                      border: "1px solid #444",
                      borderRadius: 4,
                      padding: "4px 6px",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#aaa" }}>
                  <span>Interaction Label</span>
                  <input
                    type="text"
                    value={selectedObj.interaction?.label ?? ""}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        interaction: {
                          type: selectedObj.interaction?.type ?? "",
                          label: e.target.value,
                          data: selectedObj.interaction?.data,
                        },
                      })
                    }
                    style={{
                      background: "#222",
                      color: "#0f0",
                      border: "1px solid #444",
                      borderRadius: 4,
                      padding: "4px 6px",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  />
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                <NumInput
                  label="CW"
                  value={selectedObj.collider?.width ?? 0}
                  onChange={(v) =>
                    updateObject(selectedObj.id, {
                      collider: {
                        type: "box",
                        enabled: true,
                        width: v,
                        depth: selectedObj.collider?.depth ?? selectedObj.d,
                        offsetX: selectedObj.collider?.offsetX,
                        offsetZ: selectedObj.collider?.offsetZ,
                      },
                    })
                  }
                />
                <NumInput
                  label="CD"
                  value={selectedObj.collider?.depth ?? 0}
                  onChange={(v) =>
                    updateObject(selectedObj.id, {
                      collider: {
                        type: "box",
                        enabled: true,
                        width: selectedObj.collider?.width ?? selectedObj.w,
                        depth: v,
                        offsetX: selectedObj.collider?.offsetX,
                        offsetZ: selectedObj.collider?.offsetZ,
                      },
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#666" }}>
              Click an object to select it
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#aaa" }}>
            Legend
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(Object.entries(CAT_COLORS) as [ObjCategory, string][]).map(
              ([cat, color]) => (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      background: color,
                      borderRadius: 2,
                    }}
                  />
                  {cat}
                </div>
              )
            )}
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid #333" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#aaa" }}>
            Layers
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {layers.map((layer) => {
              const hidden = hiddenLayers.includes(layer);
              return (
                <label
                  key={layer}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: hidden ? "#666" : "#ccc",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => toggleLayerVisibility(layer)}
                  />
                  <span>{layer}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={saveLayout}
            disabled={saveStatus === "saving"}
            style={{
              padding: "10px 12px",
              background:
                saveStatus === "saved"
                  ? "#166534"
                  : saveStatus === "error"
                    ? "#991b1b"
                    : "#b8960a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: saveStatus === "saving" ? "wait" : "pointer",
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved!"
                : saveStatus === "error"
                  ? "Save Failed"
                  : "Save Layout"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={resetLayout}
              style={{
                flex: 1,
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
            <a
              href="/editor"
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                textAlign: "center",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              2D Editor
            </a>
          </div>
        </div>

        {/* Object list */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#aaa" }}>
            Objects ({visibleObjects.length}/{objects.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {visibleObjects.map((obj) => (
              <div
                key={obj.id}
                onClick={() => setSelectedId(obj.id)}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  borderRadius: 3,
                  cursor: "pointer",
                  background:
                    selectedId === obj.id
                      ? "rgba(255,215,0,0.15)"
                      : "transparent",
                  borderLeft:
                    selectedId === obj.id
                      ? "2px solid #ffd700"
                      : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: obj.hidden ? 0.45 : 1,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 1,
                    background: obj._color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#ccc" }}>{obj.label}</span>
                <span style={{ color: "#555", marginLeft: "auto" }}>
                  {obj.prefab ?? obj.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
