"use client";

interface HUDProps {
  activeZone: string | null;
  collected?: number;
  totalCollectibles?: number;
  children?: React.ReactNode;
}

const ZONE_DISPLAY: Record<string, string> = {
  horror: "HORROR",
  scifi: "SCI-FI",
  comedy: "COMEDY",
  drama: "DRAMA",
  action: "ACTION",
  classics: "CLASSICS",
  family: "FAMILY",
  new_releases: "NEW RELEASES",
  staff_picks: "STAFF PICKS",
  vinny: "THE COUNTER",
  exit: "EXIT",
};

export function HUD({ activeZone, children }: HUDProps) {
  return (
    <div className="game-hud">
      <div className="hud-title">FNV</div>

      <div className={`hud-zone ${activeZone ? "visible" : ""}`}>
        {activeZone ? ZONE_DISPLAY[activeZone] || activeZone.toUpperCase() : ""}
      </div>

      <div className="hud-stats">
        {children}
      </div>
    </div>
  );
}
