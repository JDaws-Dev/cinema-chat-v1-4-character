"use client";

import { PROPS, hasProp } from "@/lib/game-state";

interface TrophyOverlayProps {
  closeOverlay: () => void;
}

export function TrophyOverlay({ closeOverlay }: TrophyOverlayProps) {
  return (
    <div className="g3-overlay g3-overlay-center">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">YOUR COLLECTION</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
      </div>
      <div className="g3-overlay-body g3-trophy-grid">
        {PROPS.map((prop) => {
          const owned = hasProp(prop.id);
          return (
            <div key={prop.id} className={`g3-trophy-item ${owned ? "g3-trophy-owned" : "g3-trophy-locked"}`}>
              <div className="g3-trophy-emoji">{owned ? prop.emoji : "❓"}</div>
              <div className="g3-trophy-name">{owned ? prop.name : "???"}</div>
              <div className="g3-trophy-movie">{owned ? `From: ${prop.movie}` : "Keep playing to unlock"}</div>
              <div className={`g3-trophy-rarity g3-trophy-rarity-${prop.rarity}`}>{prop.rarity}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
