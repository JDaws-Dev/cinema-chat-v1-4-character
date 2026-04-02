"use client";

import { useRef, useEffect } from "react";

export default function DualEditorPage() {
  const leftRef = useRef<HTMLIFrameElement>(null);
  const rightRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for "layout-saved" messages from either iframe and reload the other
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "layout-saved") return;
      // Determine which iframe sent it and reload the other
      if (e.source === leftRef.current?.contentWindow) {
        rightRef.current?.contentWindow?.location.reload();
      } else if (e.source === rightRef.current?.contentWindow) {
        leftRef.current?.contentWindow?.location.reload();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111118" }}>
      <iframe
        ref={leftRef}
        src="/editor"
        style={{ flex: 1, border: "none", borderRight: "2px solid #ffd700" }}
        title="2D Layout Editor"
      />
      <iframe
        ref={rightRef}
        src="/editor/3d"
        style={{ flex: 1, border: "none" }}
        title="3D Layout Editor"
      />
    </div>
  );
}
