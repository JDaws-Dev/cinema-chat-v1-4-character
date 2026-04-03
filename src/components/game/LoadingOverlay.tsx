"use client";

interface LoadingOverlayProps {
  loading: boolean;
}

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  return (
    <div className={`g3-loading-overlay${!loading ? " g3-loaded" : ""}`}>
      <div className="g3-logo">
        <div className="g3-logo-ticket">
          <div className="g3-logo-left" />
          <div className="g3-logo-right" />
        </div>
      </div>
      <h1 style={{ fontSize: "0.8rem", fontWeight: 400, color: "#ffd700", letterSpacing: "0.1em", fontFamily: "var(--font-pixel, monospace)", textShadow: "2px 2px 0 #000" }}>FRIDAY NIGHT VIDEO</h1>
      <p className="g3-loading-text">Opening the store...</p>
    </div>
  );
}
