"use client";

export default function DualEditorPage() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#111118" }}>
      <iframe
        src="/editor"
        style={{ flex: 1, border: "none", borderRight: "2px solid #ffd700" }}
        title="2D Layout Editor"
      />
      <iframe
        src="/editor/3d"
        style={{ flex: 1, border: "none" }}
        title="3D Layout Editor"
      />
    </div>
  );
}
