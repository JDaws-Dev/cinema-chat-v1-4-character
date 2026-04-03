"use client";

import { type Dispatch, type SetStateAction } from "react";
import { formatGameTime } from "@/hooks/useGameClock";
import { type HeldMovie } from "@/hooks/useInventory";
import { type ChallengeState } from "@/hooks/useChallenge";
import { type Overlay } from "@/hooks/useOverlay";
import { MEMBERSHIP_TIERS } from "@/lib/game-state";

interface GameHUDProps {
  hasOverlay: boolean;
  topDown: boolean;
  isMobile: boolean;
  gameTime: number;
  closeCountdownLabel: string;
  heldStackLabel: string;
  totalXP: number;
  currentTier: typeof MEMBERSHIP_TIERS[number];
  tierProgress: number;
  nextTier: typeof MEMBERSHIP_TIERS[number] | null;
  audioMuted: boolean;
  toggleMute: () => void;
  setTopDown: (v: boolean) => void;
  heldMovies: HeldMovie[];
  challenge: ChallengeState | null;
  challengeTimer: number;
  setOverlay: Dispatch<SetStateAction<Overlay>>;
  overlay: Overlay;
  xpPopup: { key: number; text: string } | null;
  tierUpNotification: string | null;
  retroMode: boolean;
  toggleRetroMode: () => void;
}

export function GameHUD({
  hasOverlay, topDown, isMobile,
  gameTime, closeCountdownLabel, heldStackLabel,
  totalXP, currentTier, tierProgress, nextTier,
  audioMuted, toggleMute, setTopDown,
  heldMovies, challenge, challengeTimer,
  setOverlay, overlay,
  xpPopup, tierUpNotification,
  retroMode, toggleRetroMode,
}: GameHUDProps) {
  return (
    <>
      {/* HUD top bar */}
      <div className="g3-hud">
        <span className="g3-hud-title">FRIDAY NIGHT VIDEO</span>
        <span className="g3-hud-hint">
          {overlay === "rpg_dialogue" ? (isMobile ? "Tap a response · Tap ✕ to leave" : "1-4 to respond · Q to leave") :
           hasOverlay ? (isMobile ? "Tap ✕ to close" : "Press Q or click ✕ to close") :
           heldMovies.length > 0 ? `Take your ${heldMovies.length === 1 ? "movie" : `${heldMovies.length} movies`} to Vinny!` :
           challenge ? "" : ""}
        </span>
        <div className="g3-hud-right">
          {!hasOverlay && !topDown && (
            <button
              className="g3-screenshot-btn"
              onClick={() => setTopDown(true)}
              title="Toggle top-down view (T)"
            >
              🗺
            </button>
          )}
          <div className="g3-tier-badge" style={{
            border: `2px solid ${currentTier.color}`,
            color: currentTier.color,
          }}>
            <span style={{ fontSize: '1.1rem' }}>{currentTier.emoji}</span>
            <span className="g3-tier-badge-name">{currentTier.name.toUpperCase()}</span>
            <div className="g3-tier-badge-bar">
              <div className="g3-tier-badge-fill" style={{ width: `${Math.min(tierProgress, 100)}%`, background: currentTier.color }} />
            </div>
            <span className="g3-tier-badge-xp">{totalXP}XP</span>
          </div>
          <button className="g3-screenshot-btn" onClick={toggleMute} title="Mute">{audioMuted ? "🔇" : "🔊"}</button>
          <button
            className="g3-screenshot-btn"
            onClick={toggleRetroMode}
            title="Toggle retro pixelation"
            style={{
              fontSize: "0.45rem",
              fontFamily: "var(--font-pixel, monospace)",
              letterSpacing: "0.05em",
              color: retroMode ? "#ffd700" : "#888",
              textShadow: retroMode ? "0 0 6px rgba(255,215,0,0.5)" : "none",
            }}
          >
            RETRO
          </button>
        </div>
      </div>

      {/* Floating XP popup */}
      {xpPopup && (
        <div key={xpPopup.key} className="g3-xp-popup">{xpPopup.text}</div>
      )}

      {!hasOverlay && !topDown && (
        <div className="g3-status-card">
          <div className="g3-status-row">
            <span className="g3-status-label">TIME</span>
            <span className="g3-status-value">{formatGameTime(gameTime)}</span>
          </div>
          <div className="g3-status-row">
            <span className="g3-status-label">CLOSE</span>
            <span className="g3-status-value">{closeCountdownLabel}</span>
          </div>
          <div className="g3-status-row">
            <span className="g3-status-label">STACK</span>
            <span className="g3-status-value">{heldStackLabel}</span>
          </div>
          <div className="g3-status-row">
            <span className="g3-status-label">XP</span>
            <span className="g3-status-value">{nextTier ? `${totalXP}/${nextTier.minXP}` : `${totalXP} MAX`}</span>
          </div>
          {heldMovies.length > 0 && (
            <button className="g3-status-button" onClick={() => { document.exitPointerLock(); setOverlay("checkout"); }}>
              View Stack
            </button>
          )}
          {challenge && (
            <div className="g3-status-row">
              <span className="g3-status-label">{challenge.timeLimit ? "LEFT" : "ELAPSED"}</span>
              <span className="g3-status-value">
                {challenge.timeLimit ? `${Math.max(0, challenge.timeLimit - challengeTimer)}s` : `${challengeTimer}s`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Challenge indicator — compact top-left */}
      {challenge && !hasOverlay && (
        <div className="g3-challenge-indicator">
          <span className="g3-challenge-indicator-icon">{challenge.type === "vinnys_mystery" ? "🔍" : challenge.type === "speed_run" ? "⚡" : "🎬"}</span>
          <div className="g3-challenge-indicator-info">
            <span className="g3-challenge-indicator-name">
              {challenge.type === "vinnys_mystery" ? "MYSTERY" : challenge.type === "speed_run" ? "SPEED RUN" : "MOVIE NIGHT"}
            </span>
            <span className="g3-challenge-indicator-progress">
              {challenge.type !== "vinnys_mystery" ? `${challenge.movies.filter(cm => heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase())).length}/${challenge.movies.length} found` : "Find the film"}
            </span>
          </div>
          <span className="g3-challenge-indicator-timer" style={{
            color: challenge.timeLimit && challengeTimer > (challenge.timeLimit - 15) ? "#ef4444" : "#ffd700",
          }}>
            {challenge.timeLimit ? `${Math.max(0, challenge.timeLimit - challengeTimer)}s` : `${challengeTimer}s`}
          </span>
        </div>
      )}

      {/* Controls bar — always visible at bottom (desktop only) */}
      {!hasOverlay && !topDown && !isMobile && (
        <div className="g3-controls-bar">
          <span className="g3-key">WASD</span> move
          <span className="g3-sep">|</span>
          <span className="g3-key">Mouse</span> look
          <span className="g3-sep">|</span>
          <span className="g3-key">E</span> interact
          <span className="g3-sep">|</span>
          <span className="g3-key">T</span> map
          <span className="g3-sep">|</span>
          <span className="g3-key">J</span> quests
          <span className="g3-sep">|</span>
          <span className="g3-key">Shift</span> kneel
          <span className="g3-sep">|</span>
          <span className="g3-key">Space</span> jump
        </div>
      )}

      {/* Tier-up notification */}
      {tierUpNotification && (
        <div className="g3-tier-up-notification" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          padding: '20px 40px', borderRadius: 8,
          border: '2px solid #ffd700', background: 'rgba(0, 0, 0, 0.9)',
          color: '#ffd700', fontFamily: 'monospace', fontSize: '1.2rem',
          textAlign: 'center', zIndex: 100,
          animation: 'tierUpScale 0.4s ease-out',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
        }}>
          🎉 MEMBERSHIP UPGRADED: {tierUpNotification}!
        </div>
      )}
    </>
  );
}
