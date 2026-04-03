"use client";

interface SceneTransitionOverlayProps {
  label: string;
}

export function SceneTransitionOverlay({ label }: SceneTransitionOverlayProps) {
  return (
    <div className="g3-scene-transition">
      <span className="g3-scene-transition-text">{label}</span>
    </div>
  );
}
