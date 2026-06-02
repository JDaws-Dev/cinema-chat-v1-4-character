"use client";
import { useEffect, useRef, useState } from "react";

type Obj = { name: string; kind: string; x: number; z: number; yaw: number; w: number; d: number };
type Layout = { bounds: { xMin: number; xMax: number; zMin: number; zMax: number }; objects: Obj[]; spawn: { x: number; z: number } };

const INITIAL: Layout = {
  bounds: { xMin: -30, xMax: 30, zMin: -22, zMax: 36 },
  spawn: { x: 3, z: 11 },
  objects: [
    // Gondolas (current saved layout)
    { name: "Gondola_classics", kind: "gondola", x: -6.5, z: 32.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_western", kind: "gondola", x: -3.0, z: 32.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_musical", kind: "gondola", x: 3.0, z: 32.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_adventure", kind: "gondola", x: 6.5, z: 32.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_scifi", kind: "gondola", x: -6.5, z: 29.5, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_fantasy", kind: "gondola", x: -3.0, z: 29.5, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_horror", kind: "gondola", x: 3.0, z: 29.5, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_thriller", kind: "gondola", x: 6.5, z: 29.5, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_action", kind: "gondola", x: -6.5, z: 27.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_comedy", kind: "gondola", x: -3.0, z: 27.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_drama", kind: "gondola", x: 3.0, z: 27.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_romance", kind: "gondola", x: 6.5, z: 27.0, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_kids", kind: "gondola", x: -6.5, z: 24.5, yaw: 180, w: 2.5, d: 1.5 },
    { name: "Gondola_family", kind: "gondola", x: -3.0, z: 24.5, yaw: 180, w: 2.5, d: 1.5 },
    // Counter + door + NPCs
    { name: "CashierIsland", kind: "counter", x: 5.0, z: 21.0, yaw: 0, w: 6.5, d: 1 },
    { name: "EmployeesOnlyDoor", kind: "door", x: -9.0, z: 35.0, yaw: 180, w: 1.1, d: 0.5 },
    { name: "Customer_A", kind: "npc", x: 5.0, z: 20.0, yaw: 0, w: 0.6, d: 0.4 },
    { name: "Customer_B", kind: "npc", x: 4.5, z: 25.0, yaw: 0, w: 0.6, d: 0.4 },
    { name: "Customer_C", kind: "npc", x: -9.0, z: 29.5, yaw: 0, w: 0.6, d: 0.4 },
    { name: "Customer_Kid", kind: "npc", x: -1.0, z: 25.2, yaw: 260, w: 0.6, d: 0.4 },
    // Cars in the parking lot (4.5m long × 1.8m wide; yaw=0 means front bumper toward +Z = the store)
    { name: "Car_Maroon", kind: "car", x: -12.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_Blue", kind: "car", x: -9.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_Cream", kind: "car", x: -6.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_Green", kind: "car", x: 6.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_Silver", kind: "car", x: 9.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_Maroon2", kind: "car", x: 12.0, z: 13.0, yaw: 0, w: 1.8, d: 4.5 },
    { name: "Car_PassBy", kind: "car", x: -2.0, z: 8.0, yaw: 90, w: 1.8, d: 4.5 },
    { name: "Car_Arriving", kind: "car", x: 18.0, z: 6.0, yaw: 250, w: 1.8, d: 4.5 },
    // Strip-mall buildings (moving these moves every child with the matching prefix on apply)
    { name: "PizzaBuilding", kind: "building", x: -21.0, z: 27.0, yaw: 0, w: 12.0, d: 14.0 },
    { name: "FNVBuilding", kind: "building", x: 0.0, z: 27.0, yaw: 0, w: 20.0, d: 14.0 },
    { name: "LaundroBuilding", kind: "building", x: 21.0, z: 27.0, yaw: 0, w: 12.0, d: 14.0 },
    // Floor decal (the "FRIDAY NIGHT VIDEO" welcome mat). w/d are resizable here.
    { name: "FloorDecal", kind: "decal", x: 0.0, z: 21.5, yaw: 0, w: 3.0, d: 1.5 },
  ],
};

const COLORS: Record<string, string> = {
  gondola: "#f5c518",
  counter: "#7a5a30",
  door: "#b03030",
  npc: "#5b8def",
  car: "#9e6dff",
  building: "#3a4a5a",
  decal: "#d49b3a",
};

const CANVAS_W = 900;
const CANVAS_H = 840;

export default function LayoutEditorPage() {
  const [layout, setLayout] = useState<Layout>(INITIAL);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dz: number }>({ dx: 0, dz: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectedNames = Array.from(selectedSet);
  const selected = selectedNames.length === 1 ? selectedNames[0] : null;

  // Undo history. We snapshot a layout BEFORE each mutation. dragMoving avoids one snapshot per pointermove tick.
  const historyRef = useRef<Layout[]>([]);
  const dragStartSnapRef = useRef<Layout | null>(null);
  function snapshot() {
    historyRef.current.push(JSON.parse(JSON.stringify(layout)));
    if (historyRef.current.length > 100) historyRef.current.shift();
  }
  function undo() {
    const prev = historyRef.current.pop();
    if (prev) setLayout(prev);
  }
  // Cmd/Ctrl-Z to undo, Cmd/Ctrl-D to duplicate
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateSelected(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, selectedSet]);

  const { xMin, xMax, zMin, zMax } = layout.bounds;
  const scaleX = CANVAS_W / (xMax - xMin);
  const scaleZ = CANVAS_H / (zMax - zMin);
  const scale = Math.min(scaleX, scaleZ);
  const offsetX = (CANVAS_W - (xMax - xMin) * scale) / 2;
  const offsetY = (CANVAS_H - (zMax - zMin) * scale) / 2;

  const worldToSvg = (x: number, z: number) => ({
    sx: offsetX + (x - xMin) * scale,
    sy: offsetY + (zMax - z) * scale, // flip z so +Z is up on screen (away from spawn)
  });
  const svgToWorld = (sx: number, sy: number) => ({
    x: (sx - offsetX) / scale + xMin,
    z: zMax - (sy - offsetY) / scale,
  });

  function onPointerDown(e: React.PointerEvent, name: string) {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const sp = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const obj = layout.objects.find((o) => o.name === name)!;
    const objSvg = worldToSvg(obj.x, obj.z);
    setDragOffset({ dx: sp.x - objSvg.sx, dz: sp.y - objSvg.sy });
    setDragId(name);
    // Snapshot for undo (single snapshot per drag, not per move tick)
    dragStartSnapRef.current = JSON.parse(JSON.stringify(layout));
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (e.shiftKey) {
        if (next.has(name)) next.delete(name);
        else next.add(name);
      } else if (!prev.has(name)) {
        // Only clear when clicking on an UNSELECTED item without shift.
        // Clicking on an already-selected item preserves the group → multi-drag works.
        next.clear();
        next.add(name);
      }
      return next;
    });
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragId || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const sp = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const w = svgToWorld(sp.x - dragOffset.dx, sp.y - dragOffset.dz);
    // Snap to 0.5m grid
    const sx = Math.round(w.x * 2) / 2;
    const sz = Math.round(w.z * 2) / 2;
    setLayout((prev) => {
      const lead = prev.objects.find((o) => o.name === dragId);
      if (!lead) return prev;
      const dx = sx - lead.x;
      const dz = sz - lead.z;
      // If multi-selected, move the whole group rigidly with the dragged one
      const group = selectedSet.has(dragId) && selectedSet.size > 1 ? selectedSet : new Set([dragId]);
      return {
        ...prev,
        objects: prev.objects.map((o) => (group.has(o.name) ? { ...o, x: o.x + dx, z: o.z + dz } : o)),
      };
    });
  }
  function onPointerUp() {
    if (dragId && dragStartSnapRef.current) {
      historyRef.current.push(dragStartSnapRef.current);
      if (historyRef.current.length > 100) historyRef.current.shift();
      dragStartSnapRef.current = null;
    }
    setDragId(null);
  }

  function duplicateSelected() {
    if (selectedSet.size === 0) return;
    snapshot();
    setLayout((prev) => {
      const newObjs = [...prev.objects];
      const newNames: string[] = [];
      // Find next free suffix per source name
      const existing = new Set(prev.objects.map((o) => o.name));
      for (const o of prev.objects) {
        if (!selectedSet.has(o.name)) continue;
        let i = 2;
        let candidate = `${o.name}_${i}`;
        while (existing.has(candidate)) { i++; candidate = `${o.name}_${i}`; }
        existing.add(candidate);
        newObjs.push({ ...o, name: candidate, x: o.x + 1, z: o.z + 1 });
        newNames.push(candidate);
      }
      // Auto-select the new copies so user can drag the group
      setSelectedSet(new Set(newNames));
      return { ...prev, objects: newObjs };
    });
  }

  function deleteSelected() {
    if (selectedSet.size === 0) return;
    snapshot();
    setLayout((prev) => ({ ...prev, objects: prev.objects.filter((o) => !selectedSet.has(o.name)) }));
    setSelectedSet(new Set());
  }

  function rotateSelected(delta: number) {
    if (selectedSet.size === 0) return;
    snapshot();
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (selectedSet.has(o.name) ? { ...o, yaw: ((o.yaw + delta) % 360 + 360) % 360 } : o)),
    }));
  }

  function setYaw(absolute: number) {
    if (selectedSet.size === 0) return;
    snapshot();
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (selectedSet.has(o.name) ? { ...o, yaw: ((absolute % 360) + 360) % 360 } : o)),
    }));
  }

  function snapYawTo90() {
    if (selectedSet.size === 0) return;
    snapshot();
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (selectedSet.has(o.name) ? { ...o, yaw: Math.round(o.yaw / 90) * 90 % 360 } : o)),
    }));
  }

  function setSize(prop: "w" | "d", value: number) {
    if (selectedSet.size === 0) return;
    snapshot();
    const clamped = Math.max(0.2, Math.min(60, value));
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (selectedSet.has(o.name) ? { ...o, [prop]: clamped } : o)),
    }));
  }

  function align(axis: "x" | "z", mode: "min" | "center" | "max") {
    if (selectedSet.size < 2) return;
    setLayout((prev) => {
      const sel = prev.objects.filter((o) => selectedSet.has(o.name));
      const target =
        mode === "center"
          ? sel.reduce((a, b) => a + b[axis], 0) / sel.length
          : mode === "min"
            ? Math.min(...sel.map((o) => o[axis]))
            : Math.max(...sel.map((o) => o[axis]));
      return {
        ...prev,
        objects: prev.objects.map((o) => (selectedSet.has(o.name) ? { ...o, [axis]: target } : o)),
      };
    });
  }

  function distribute(axis: "x" | "z") {
    if (selectedSet.size < 3) return;
    setLayout((prev) => {
      const sel = prev.objects.filter((o) => selectedSet.has(o.name)).sort((a, b) => a[axis] - b[axis]);
      const first = sel[0][axis];
      const last = sel[sel.length - 1][axis];
      const step = (last - first) / (sel.length - 1);
      const map = new Map<string, number>();
      sel.forEach((o, i) => map.set(o.name, first + i * step));
      return {
        ...prev,
        objects: prev.objects.map((o) => (map.has(o.name) ? { ...o, [axis]: map.get(o.name)! } : o)),
      };
    });
  }

  function selectAllOfKind(kind: string) {
    setSelectedSet(new Set(layout.objects.filter((o) => o.kind === kind).map((o) => o.name)));
  }
  function clearSelection() {
    setSelectedSet(new Set());
  }

  function exportJSON() {
    const out = JSON.stringify(layout.objects.map((o) => ({ name: o.name, x: o.x, z: o.z, yaw: Math.round(o.yaw) })), null, 2);
    navigator.clipboard?.writeText(out).catch(() => {});
    return out;
  }

  function resetToInitial() {
    if (confirm("Reset to current scene layout?")) setLayout(INITIAL);
  }

  // Grid lines (1m intervals)
  const gridLines: React.ReactNode[] = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const a = worldToSvg(x, zMin);
    const b = worldToSvg(x, zMax);
    gridLines.push(
      <line key={`vx${x}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={x === 0 ? "#888" : "#333"} strokeWidth={x === 0 ? 1.2 : 0.5} />
    );
  }
  for (let z = Math.ceil(zMin); z <= Math.floor(zMax); z++) {
    const a = worldToSvg(xMin, z);
    const b = worldToSvg(xMax, z);
    gridLines.push(
      <line key={`hz${z}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#333" strokeWidth={0.5} />
    );
  }

  const exportText = JSON.stringify(layout.objects.map((o) => ({ name: o.name, x: o.x, z: o.z, yaw: Math.round(o.yaw) })), null, 2);

  return (
    <div style={{ background: "#0e0e10", color: "#e8e3d5", minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>FNV Layout Editor</h1>
      <div style={{ opacity: 0.65, fontSize: 13, marginBottom: 16, maxWidth: 720 }}>
        Drag objects to reposition. Click to select, then use rotate buttons. Top of canvas is the back wall (NEW RELEASES); bottom is the storefront. Customer enters at the spawn pin. Grid is 1m, drag snaps to 0.5m. When done, click <em>Copy JSON</em> and paste it back.
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ background: "#1a1a1d", borderRadius: 8, padding: 8, border: "1px solid #2a2a2d" }}>
          <svg
            ref={svgRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ background: "#0a1530", borderRadius: 4 }}
          >
            {/* Static scene reference: parking lot asphalt, street, curb, store interior box */}
            {(() => {
              const lot = worldToSvg(-28, 17);
              const lotBR = worldToSvg(28, -15);
              const street = worldToSvg(-28, -14);
              const streetBR = worldToSvg(28, -22);
              const store = worldToSvg(-10, 35);
              const storeBR = worldToSvg(10, 20);
              return (
                <g>
                  {/* Street */}
                  <rect x={street.sx} y={street.sy} width={streetBR.sx - street.sx} height={streetBR.sy - street.sy} fill="#1a1a1d" opacity={0.85} />
                  <text x={(street.sx + streetBR.sx) / 2} y={(street.sy + streetBR.sy) / 2} textAnchor="middle" fill="#666" fontSize={10}>STREET</text>
                  {/* Parking lot */}
                  <rect x={lot.sx} y={lot.sy} width={lotBR.sx - lot.sx} height={lotBR.sy - lot.sy} fill="#28282b" opacity={0.7} />
                  <text x={(lot.sx + lotBR.sx) / 2} y={lot.sy + 14} textAnchor="middle" fill="#666" fontSize={10}>PARKING LOT</text>
                  {/* Store interior */}
                  <rect x={store.sx} y={store.sy} width={storeBR.sx - store.sx} height={storeBR.sy - store.sy} fill="#1a2540" opacity={0.6} stroke="#ffd700" strokeWidth={1} opacity-stroke={0.5} />
                  <text x={(store.sx + storeBR.sx) / 2} y={store.sy + 14} textAnchor="middle" fill="#ffd700" fontSize={10} opacity={0.55}>STORE INTERIOR</text>
                  {/* Storefront band */}
                  <line x1={storeBR.sx - (storeBR.sx - store.sx)} y1={storeBR.sy} x2={storeBR.sx} y2={storeBR.sy} stroke="#ffd700" strokeWidth={2} strokeDasharray="4 3" />
                </g>
              );
            })()}

            <text x={CANVAS_W / 2} y={offsetY - 8} textAnchor="middle" fill="#ffd700" fontSize={11} opacity={0.6}>
              ← BACK WALL (NEW RELEASES) →
            </text>
            <text x={CANVAS_W / 2} y={CANVAS_H - offsetY + 18} textAnchor="middle" fill="#888" fontSize={11} opacity={0.6}>
              ← STREET →
            </text>

            {gridLines}

            {/* Spawn marker */}
            {(() => {
              const sp = worldToSvg(layout.spawn.x, layout.spawn.z);
              return (
                <g>
                  <circle cx={sp.sx} cy={sp.sy} r={8} fill="#00ff88" opacity={0.85} />
                  <text x={sp.sx + 12} y={sp.sy + 4} fill="#00ff88" fontSize={11}>spawn</text>
                </g>
              );
            })()}

            {/* Objects */}
            {layout.objects.map((o) => {
              const p = worldToSvg(o.x, o.z);
              const w = o.w * scale;
              const d = o.d * scale;
              const fill = COLORS[o.kind] || "#aaa";
              const isSelected = selectedSet.has(o.name);
              const isDrag = dragId === o.name;
              return (
                <g
                  key={o.name}
                  transform={`translate(${p.sx} ${p.sy}) rotate(${o.yaw})`}
                  onPointerDown={(e) => onPointerDown(e, o.name)}
                  style={{ cursor: isDrag ? "grabbing" : "grab" }}
                >
                  <rect
                    x={-w / 2}
                    y={-d / 2}
                    width={w}
                    height={d}
                    fill={fill}
                    opacity={isSelected ? 0.95 : 0.78}
                    stroke={isSelected ? "#fff" : "#000"}
                    strokeWidth={isSelected ? 2 : 0.5}
                  />
                  {/* facing indicator — small notch at +local Z */}
                  <line x1={0} y1={0} x2={0} y2={-d / 2 - 4} stroke="#fff" strokeWidth={1.5} />
                  <text x={0} y={3} textAnchor="middle" fontSize={9} fill="#111" fontWeight={600} transform={`rotate(${-o.yaw})`}>
                    {o.name.replace(/^(Gondola_|Customer_)/, "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#1a1a1d", padding: 12, borderRadius: 6, border: "1px solid #2a2a2d" }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>
              SELECTED ({selectedSet.size})
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, minHeight: 18 }}>
              {selectedSet.size === 0 && "—"}
              {selectedSet.size === 1 && selected}
              {selectedSet.size > 1 && `${selectedSet.size} items`}
            </div>
            {selected && (() => {
              const o = layout.objects.find((x) => x.name === selected)!;
              return (
                <>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>
                    x: {o.x.toFixed(1)}, z: {o.z.toFixed(1)}, yaw: {Math.round(o.yaw)}°
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                    <span style={{ opacity: 0.6 }}>size:</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      W
                      <input
                        type="number"
                        value={o.w}
                        step={0.1}
                        min={0.2}
                        max={60}
                        onChange={(e) => setSize("w", parseFloat(e.target.value) || 0)}
                        style={{ width: 56, background: "#0a0a0c", color: "#e8e3d5", border: "1px solid #2a2a2d", borderRadius: 3, padding: "2px 4px", fontSize: 12 }}
                      />m
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      D
                      <input
                        type="number"
                        value={o.d}
                        step={0.1}
                        min={0.2}
                        max={60}
                        onChange={(e) => setSize("d", parseFloat(e.target.value) || 0)}
                        style={{ width: 56, background: "#0a0a0c", color: "#e8e3d5", border: "1px solid #2a2a2d", borderRadius: 3, padding: "2px 4px", fontSize: 12 }}
                      />m
                    </label>
                  </div>
                </>
              );
            })()}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={() => rotateSelected(-90)} disabled={selectedSet.size === 0} style={btn}>↶ -90°</button>
              <button onClick={() => rotateSelected(-15)} disabled={selectedSet.size === 0} style={btn}>-15°</button>
              <button onClick={() => rotateSelected(15)} disabled={selectedSet.size === 0} style={btn}>+15°</button>
              <button onClick={() => rotateSelected(90)} disabled={selectedSet.size === 0} style={btn}>+90° ↷</button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 10, marginBottom: 4 }}>Set absolute yaw (parallel to walls):</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setYaw(0)} disabled={selectedSet.size === 0} style={btn} title="Face back wall (parallel to storefront)">0° face back</button>
              <button onClick={() => setYaw(90)} disabled={selectedSet.size === 0} style={btn} title="Face right wall">90° face right</button>
              <button onClick={() => setYaw(180)} disabled={selectedSet.size === 0} style={btn} title="Face storefront (parallel to back wall)">180° face front</button>
              <button onClick={() => setYaw(270)} disabled={selectedSet.size === 0} style={btn} title="Face left wall">270° face left</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={snapYawTo90} disabled={selectedSet.size === 0} style={btn} title="Round current yaw to nearest 90°">snap to nearest 90°</button>
            </div>
          </div>

          <div style={{ background: "#1a1a1d", padding: 12, borderRadius: 6, border: "1px solid #2a2a2d" }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              ALIGN & DISTRIBUTE <span style={{ opacity: 0.5, fontWeight: 400 }}>(shift-click for multi-select)</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Align horizontally (same X — vertical line):</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button onClick={() => align("x", "min")} disabled={selectedSet.size < 2} style={btn}>← left</button>
              <button onClick={() => align("x", "center")} disabled={selectedSet.size < 2} style={btn}>↔ center</button>
              <button onClick={() => align("x", "max")} disabled={selectedSet.size < 2} style={btn}>right →</button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Align vertically (same Z — horizontal line):</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button onClick={() => align("z", "min")} disabled={selectedSet.size < 2} style={btn}>↓ storefront</button>
              <button onClick={() => align("z", "center")} disabled={selectedSet.size < 2} style={btn}>↕ center</button>
              <button onClick={() => align("z", "max")} disabled={selectedSet.size < 2} style={btn}>back wall ↑</button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Distribute (even spacing, needs 3+):</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button onClick={() => distribute("x")} disabled={selectedSet.size < 3} style={btn}>⇔ along X</button>
              <button onClick={() => distribute("z")} disabled={selectedSet.size < 3} style={btn}>⇕ along Z</button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Quick select:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => selectAllOfKind("gondola")} style={btn}>all gondolas</button>
              <button onClick={() => selectAllOfKind("car")} style={btn}>all cars</button>
              <button onClick={() => selectAllOfKind("npc")} style={btn}>all NPCs</button>
              <button onClick={() => selectAllOfKind("building")} style={btn}>all buildings</button>
              <button onClick={clearSelection} style={btn}>clear</button>
            </div>
          </div>

          <div style={{ background: "#1a1a1d", padding: 12, borderRadius: 6, border: "1px solid #2a2a2d" }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>EDIT</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={undo} style={btn} title="Cmd/Ctrl-Z">↺ undo</button>
              <button onClick={duplicateSelected} disabled={selectedSet.size === 0} style={btn} title="Cmd/Ctrl-D">⎘ duplicate</button>
              <button onClick={deleteSelected} disabled={selectedSet.size === 0} style={btn} title="Delete">🗑 delete</button>
            </div>
          </div>

          <div style={{ background: "#1a1a1d", padding: 12, borderRadius: 6, border: "1px solid #2a2a2d" }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>LEGEND</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              {Object.entries(COLORS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 12, height: 12, background: v, borderRadius: 2 }} />
                  <span>{k}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, background: "#00ff88", borderRadius: "50%" }} />
                <span>spawn</span>
              </div>
            </div>
          </div>

          <div style={{ background: "#1a1a1d", padding: 12, borderRadius: 6, border: "1px solid #2a2a2d" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>EXPORT</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={resetToInitial} style={btnSecondary}>Reset</button>
                <button onClick={exportJSON} style={btnPrimary}>Copy JSON</button>
              </div>
            </div>
            <textarea
              readOnly
              value={exportText}
              style={{ width: "100%", height: 200, background: "#0a0a0c", color: "#9ed985", border: "1px solid #2a2a2d", borderRadius: 4, padding: 8, fontFamily: "ui-monospace, monospace", fontSize: 11 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  flex: 1,
  background: "#2a2a2d",
  color: "#e8e3d5",
  border: "1px solid #3a3a3d",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 12,
  cursor: "pointer",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#ffd700", color: "#111", fontWeight: 600 };
const btnSecondary: React.CSSProperties = { ...btn, background: "#3a3a3d" };
