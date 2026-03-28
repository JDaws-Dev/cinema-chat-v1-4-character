"use client";

import { useState, useEffect } from "react";

const TAPE_COLORS = [
  "#dc2626", "#3b82f6", "#f97316", "#1e40af", "#ef4444",
  "#22c55e", "#ec4899", "#b8960a", "#8b5e3c", "#a855f7",
  "#dc2626", "#3b82f6", "#f97316", "#22c55e", "#ec4899",
  "#ef4444", "#1e40af", "#22c55e", "#a855f7", "#f97316",
];

interface TitleScreenProps {
  onEnter: () => void;
}

export function TitleScreen({ onEnter }: TitleScreenProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="title-screen">
      {/* Storefront building */}
      <div className="storefront">
        {/* Awning */}
        <div className="storefront-awning" />

        {/* Neon sign */}
        <div className="neon-sign">
          <h1>
            FRIDAY NIGHT
            <br />
            VIDEO
          </h1>
          <div className="subtitle">REWIND &bull; RELAX &bull; REPEAT</div>
        </div>

        {/* Store window with VHS display */}
        <div className="storefront-window">
          <div className="window-tapes">
            {TAPE_COLORS.slice(0, 12).map((color, i) => (
              <div
                key={i}
                className="window-tape"
                style={{ background: color }}
              />
            ))}
          </div>
          <div className="window-glow" />
        </div>

        {/* Door */}
        <div className="storefront-door">
          <div className="door-handle" />
          <div className="door-hours">
            <span>OPEN</span>
            <span>7 DAYS</span>
          </div>
        </div>
      </div>

      {/* Enter button */}
      <button
        className={`enter-btn ${mounted ? "enter-btn-visible" : ""}`}
        onClick={onEnter}
      >
        ENTER STORE
      </button>

      {/* Sidewalk */}
      <div className="title-sidewalk" />

      <div className="title-credits">
        A VINNY JOINT &bull; EST. 1987
      </div>
    </div>
  );
}
