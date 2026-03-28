"use client";

import { VinnySprite } from "./VinnySprite";

// Genre zone configs: id, label, position (%), size (%), spine color class
const ZONES = [
  // Shelves — top row (further apart, cleaner grid)
  { id: "horror",   label: "HORROR",     top: 15, left: 7,  w: 11, h: 16, spine: "spine-horror",   accent: "#dc2626" },
  { id: "scifi",    label: "SCI-FI",     top: 15, left: 21, w: 11, h: 16, spine: "spine-scifi",    accent: "#3b82f6" },
  { id: "comedy",   label: "COMEDY",     top: 15, left: 35, w: 11, h: 16, spine: "spine-comedy",   accent: "#f97316" },
  { id: "drama",    label: "DRAMA",      top: 15, left: 49, w: 11, h: 16, spine: "spine-drama",    accent: "#1e40af" },
  // Shelves — bottom row
  { id: "action",   label: "ACTION",     top: 40, left: 7,  w: 11, h: 16, spine: "spine-action",   accent: "#ef4444" },
  { id: "classics", label: "CLASSICS",   top: 40, left: 21, w: 11, h: 16, spine: "spine-classics", accent: "#b8960a" },
  { id: "family",   label: "FAMILY",     top: 40, left: 35, w: 11, h: 16, spine: "spine-family",   accent: "#22c55e" },
  { id: "new_releases", label: "NEW RELEASES", top: 40, left: 49, w: 11, h: 16, spine: "spine-new", accent: "#ec4899" },
  // Staff picks — right wall
  { id: "staff_picks", label: "STAFF PICKS", top: 15, left: 72, w: 16, h: 16, spine: "spine-staff", accent: "#ffd700" },
];

// Wall posters (decorative)
const POSTERS = [
  { top: 1.5, left: 8,  color: "#ef4444", title: "JAWS" },
  { top: 1.5, left: 18, color: "#60a5fa", title: "ALIEN" },
  { top: 1.5, left: 28, color: "#fb923c", title: "E.T." },
  { top: 1.5, left: 55, color: "#c084fc", title: "BLADE RUNNER" },
  { top: 1.5, left: 68, color: "#4ade80", title: "RAIDERS" },
  { top: 1.5, left: 80, color: "#f472b6", title: "BACK TO THE FUTURE" },
];

interface StoreMapProps {
  dimmed: boolean;
  onZoneClick: (zoneId: string) => void;
  onVinnyClick: () => void;
  onDoorClick: () => void;
}

export function StoreMap({ dimmed, onZoneClick, onVinnyClick, onDoorClick }: StoreMapProps) {
  // Generate tape count per shelf (deterministic, varies 6-12)
  const tapeCount = (seed: number) => {
    const s = (seed * 1103515245 + 12345) & 0x7fffffff;
    return 6 + (s % 7);
  };

  return (
    <div className={`store-map ${dimmed ? "store-dimmed" : ""}`}>
      {/* Walls */}
      <div className="wall-top" />
      <div className="wall-bottom" />
      <div className="wall-left" />
      <div className="wall-right" />

      {/* Store sign on top wall — neon style */}
      <div className="store-sign">FRIDAY NIGHT VIDEO</div>

      {/* Wall posters (top wall decorations) */}
      {POSTERS.map((p, i) => (
        <div
          key={i}
          className="wall-poster"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            borderColor: `${p.color}66`,
            boxShadow: `0 0 8px ${p.color}22`,
          }}
        >
          <div
            className="wall-poster-art"
            style={{ background: `linear-gradient(135deg, ${p.color}44, ${p.color}11)` }}
          />
        </div>
      ))}

      {/* Welcome mat at door */}
      <div className="welcome-mat">
        WELCOME
      </div>

      {/* Genre shelf zones */}
      {ZONES.map((zone) => (
        <div key={zone.id}>
          {/* Visual shelf */}
          <div
            className="shelf-unit"
            style={{
              top: `${zone.top}%`,
              left: `${zone.left}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
            }}
          >
            {/* Genre label on shelf */}
            <div className="shelf-genre-label" style={{ color: zone.accent }}>
              {zone.label}
            </div>
            {/* VHS tapes */}
            <div className="shelf-tapes">
              {Array.from(
                { length: tapeCount(zone.id.charCodeAt(0) * 100 + (zone.id.charCodeAt(1) || 0)) },
                (_, i) => (
                  <div
                    key={i}
                    className={`shelf-tape ${zone.spine}`}
                  />
                )
              )}
            </div>
          </div>

          {/* Clickable zone overlay */}
          <div
            className="store-zone"
            style={{
              top: `${zone.top}%`,
              left: `${zone.left}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
            }}
            onClick={() => onZoneClick(zone.id)}
          >
            <div className="zone-label">{zone.label}</div>
          </div>
        </div>
      ))}

      {/* Counter — spans middle-bottom area */}
      <div
        className="counter"
        style={{ top: "68%", left: "18%", width: "38%", height: "14%" }}
      >
        <div className="counter-register" />
        <div className="counter-label">CHECKOUT</div>
        {/* Vinny behind the counter */}
        <VinnySprite />
      </div>

      {/* Counter click zone */}
      <div
        className="store-zone"
        style={{ top: "68%", left: "18%", width: "38%", height: "14%" }}
        onClick={onVinnyClick}
      >
        <div className="zone-label">TALK TO VINNY</div>
      </div>

      {/* Bulletin board — right of counter */}
      <div className="bulletin-board" />

      {/* Open sign in window */}
      <div className="open-sign">OPEN</div>

      {/* "BE KIND, REWIND" sign */}
      <div className="rewind-sign">BE KIND, REWIND</div>

      {/* Door */}
      <div className="store-door" onClick={onDoorClick} />

      {/* Floor details — rug in center */}
      <div className="store-rug" />

      {/* Ceiling lights (decorative) */}
      <div className="ceiling-light" style={{ left: "25%", top: "11%" }} />
      <div className="ceiling-light" style={{ left: "50%", top: "11%" }} />
      <div className="ceiling-light" style={{ left: "75%", top: "11%" }} />
    </div>
  );
}
