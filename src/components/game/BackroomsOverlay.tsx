"use client";
import { useEffect, useRef } from "react";

interface BackroomsOverlayProps {
  onExit: () => void;
}

// Fullscreen embed of /backrooms (the Unity WebGL build) shown when the player
// goes through the Employees Only door. Listens for a postMessage from the
// Unity scene so the player can walk out through an exit door inside.
export function BackroomsOverlay({ onExit }: BackroomsOverlayProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.data !== "object" || e.data === null) return;
      if (e.data.type === "backrooms-exit") onExit();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onExit]);

  // Allow Esc to bail in case the in-world exit door fails
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <div className="g3-backrooms-overlay">
      <iframe
        ref={iframeRef}
        src="/backrooms?embedded=1"
        title="The Backrooms"
        allow="fullscreen; autoplay"
        className="g3-backrooms-frame"
      />
      <button className="g3-backrooms-exit" onClick={onExit} title="Leave (Esc)">
        ← BACK TO STORE
      </button>
    </div>
  );
}
