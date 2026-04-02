"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import type { StoreLayout, LayoutObject, ObjCategory } from "@/lib/store-layout";

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

// ── Editor object (superset of LayoutObject with editor state) ──
export interface EditorObject extends LayoutObject {
  _color: string;
  _height: number;
}

function layoutToEditor(obj: LayoutObject): EditorObject {
  return {
    ...obj,
    w: obj.w ?? 0.5,
    d: obj.d ?? 0.5,
    _color: CAT_COLORS[obj.category] || "#888",
    _height: CAT_HEIGHTS[obj.category] || 1.0,
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
  if (obj.rotY !== undefined && obj.rotY !== 0)
    lo.rotY = Math.round(obj.rotY * 1000) / 1000;
  if (obj.w !== undefined) lo.w = Math.round(obj.w * 100) / 100;
  if (obj.d !== undefined) lo.d = Math.round(obj.d * 100) / 100;
  if (obj.meta && Object.keys(obj.meta).length > 0) lo.meta = obj.meta;
  return lo;
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

  const updateObject = useCallback(
    (id: string, patch: Partial<EditorObject>) => {
      setObjects((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

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
            objects={objects}
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
            Objects ({objects.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {objects.map((obj) => (
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
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 1,
                    background: CAT_COLORS[obj.category],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#ccc" }}>{obj.label}</span>
                <span style={{ color: "#555", marginLeft: "auto" }}>
                  {obj.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
