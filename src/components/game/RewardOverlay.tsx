"use client";

import { useEffect, useState } from "react";

interface RewardOverlayProps {
  prop: {
    id: string;
    name: string;
    movie: string;
    rarity: "uncommon" | "rare" | "legendary";
    emoji: string;
  };
  onDismiss: () => void;
}

const rarityColors: Record<string, string> = {
  uncommon: "#06b6d4",
  rare: "#a855f7",
  legendary: "#ffd700",
};

export function RewardOverlay({ prop, onDismiss }: RewardOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const borderColor = rarityColors[prop.rarity] ?? "#06b6d4";
  const glowColor =
    prop.rarity === "legendary"
      ? "rgba(255, 215, 0, 0.4)"
      : prop.rarity === "rare"
        ? "rgba(168, 85, 247, 0.4)"
        : "none";

  return (
    <>
      <style>{`
        .reward-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 8, 16, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
        }

        .reward-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2.5rem 3rem;
          border-radius: 1rem;
          background: rgba(15, 18, 30, 0.95);
          border: 2px solid var(--reward-border-color);
          box-shadow: 0 0 32px var(--reward-glow-color, transparent),
                      0 0 64px var(--reward-glow-color, transparent);
          text-align: center;
          max-width: 340px;
          width: 90vw;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
        }

        .reward-card.reward-card--visible {
          opacity: 1;
          transform: scale(1);
        }

        .reward-emoji {
          font-size: 3rem;
          line-height: 1;
        }

        .reward-header {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ffd700;
          margin: 0;
        }

        .reward-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .reward-movie {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
        }

        .reward-rarity {
          display: inline-block;
          padding: 0.2rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #000;
          background: var(--reward-border-color);
        }

        .reward-collection {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          margin: 0;
        }

        .reward-continue {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.25);
          margin-top: 0.5rem;
        }

        @keyframes reward-sparkle {
          0%, 100% { box-shadow: 0 0 32px var(--reward-glow-color, transparent), 0 0 64px var(--reward-glow-color, transparent); }
          50% { box-shadow: 0 0 48px var(--reward-glow-color, transparent), 0 0 96px var(--reward-glow-color, transparent); }
        }

        .reward-card--glow.reward-card--visible {
          animation: reward-sparkle 2s ease-in-out infinite;
          animation-delay: 0.4s;
        }
      `}</style>
      <div className="reward-overlay" onClick={onDismiss}>
        <div
          className={`reward-card${visible ? " reward-card--visible" : ""}${glowColor !== "none" ? " reward-card--glow" : ""}`}
          style={
            {
              "--reward-border-color": borderColor,
              "--reward-glow-color": glowColor,
            } as React.CSSProperties
          }
        >
          <div className="reward-emoji">{prop.emoji}</div>
          <p className="reward-header">Prop Unlocked!</p>
          <p className="reward-name">{prop.name}</p>
          <p className="reward-movie">From: {prop.movie}</p>
          <span className="reward-rarity">{prop.rarity}</span>
          <p className="reward-collection">Added to your collection</p>
          <div className="reward-continue">Click anywhere to continue</div>
        </div>
      </div>
    </>
  );
}
