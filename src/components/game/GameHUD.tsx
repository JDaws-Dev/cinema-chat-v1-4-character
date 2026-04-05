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
  eraLabel: string;
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
  eraLabel,
  gameTime, closeCountdownLabel, heldStackLabel,
  totalXP, currentTier, tierProgress, nextTier,
  audioMuted, toggleMute, setTopDown,
  heldMovies, challenge, challengeTimer,
  setOverlay, overlay,
  xpPopup, tierUpNotification,
}: GameHUDProps) {
  const interactionHint =
    overlay === "rpg_dialogue"
      ? (isMobile ? "Tap a response · Tap X to leave" : "1-4 to respond · Q to leave")
      : hasOverlay
        ? (isMobile ? "Tap X to close" : "Press Q or click X to close")
        : heldMovies.length > 0
          ? `Take your ${heldMovies.length === 1 ? "movie" : `${heldMovies.length} movies`} to Vinny`
          : "";

  let storeMode = "Open floor";
  let objectiveTitle = "Browse the aisles and see what tonight's regulars are after";
  let objectiveSubtitle = "Follow the aisle placards, glowing front counter, and neon signs to stay oriented.";
  let objectiveProgressPercent = nextTier ? Math.min(Math.max(tierProgress, 0), 100) : 100;
  let objectiveProgressLabel = nextTier ? `${Math.round(Math.min(Math.max(tierProgress, 0), 100))}% to ${nextTier.name}` : "Top tier unlocked";

  if (overlay === "rpg_dialogue") {
    storeMode = "Conversation";
    objectiveTitle = "Talk it out and pick a response that moves the night forward";
    objectiveSubtitle = "Clear choices keep the scene readable and make the interaction feel intentional.";
  } else if (hasOverlay) {
    storeMode = "Overlay open";
    objectiveTitle = "Finish this interaction, then step back onto the floor";
    objectiveSubtitle = interactionHint || "Close the panel when you're ready to move again.";
  } else if (challenge) {
    storeMode = "Challenge live";
    if (challenge.type === "vinnys_mystery") {
      objectiveTitle = "Use the clue, signage, and shelf layout to find Vinny's mystery tape";
      objectiveSubtitle = "The best 3D spaces reward landmark-based navigation instead of forcing blind scanning.";
      objectiveProgressPercent = Math.min(100, 35 + mysteryHintWeight(challengeTimer));
      objectiveProgressLabel = "Clue hunt active";
    } else {
      const foundCount = challenge.movies.filter((movie) =>
        heldMovies.some((held) => held.title.toLowerCase() === movie.title.toLowerCase()),
      ).length;
      objectiveTitle =
        challenge.type === "speed_run"
          ? "Move fast, read the room, and clear the run before the clock wins"
          : "Build the perfect movie night stack and bring it back to the counter";
      objectiveSubtitle = `${foundCount}/${challenge.movies.length} target tapes found${challenge.timeLimit ? ` · ${Math.max(0, challenge.timeLimit - challengeTimer)}s left` : ""}`;
      objectiveProgressPercent = challenge.movies.length > 0 ? (foundCount / challenge.movies.length) * 100 : 0;
      objectiveProgressLabel = `${foundCount}/${challenge.movies.length} found`;
    }
  } else if (heldMovies.length > 0) {
    storeMode = "Checkout run";
    objectiveTitle = "Bring your stack to Vinny and lock in tonight's rental";
    objectiveSubtitle = `${heldStackLabel} ready · the front counter is the brightest landmark in the store.`;
    objectiveProgressPercent = (heldMovies.length / 5) * 100;
    objectiveProgressLabel = heldStackLabel;
  }

  const clampedTierProgress = Math.min(Math.max(tierProgress, 0), 100);
  const statusPills = [
    { label: "Time", value: formatGameTime(gameTime) },
    { label: "Close", value: closeCountdownLabel },
    { label: "Stack", value: heldStackLabel },
    { label: "Member", value: `${currentTier.emoji} ${currentTier.name}` },
  ];
  const tierStatus = nextTier
    ? `${totalXP} XP · ${Math.round(clampedTierProgress)}% to ${nextTier.name}`
    : `${totalXP} XP · Max tier`;

  return (
    <>
      {/* HUD top bar */}
      <div className="g3-hud">
        <div className="g3-hud-topline">
          <div className="g3-hud-brand">
            <div className="g3-hud-logo" aria-hidden="true">
              <span className="g3-hud-logo-left" />
              <span className="g3-hud-logo-right" />
            </div>
            <div className="g3-hud-brand-copy">
              <span className="g3-hud-title">FRIDAY NIGHT VIDEO</span>
              <span className="g3-hud-brand-subtitle">Neighborhood video store · {eraLabel}</span>
            </div>
          </div>
          <div className="g3-hud-pills" aria-label="Shift status">
            {statusPills.map((pill) => (
              <span key={pill.label} className="g3-hud-pill">
                <span className="g3-hud-pill-label">{pill.label}</span>
                <span className="g3-hud-pill-value">{pill.value}</span>
              </span>
            ))}
          </div>
          <div className="g3-hud-actions">
            {!hasOverlay && !topDown && heldMovies.length > 0 && (
              <button
                className="g3-hud-button"
                onClick={() => { document.exitPointerLock(); setOverlay("checkout"); }}
                title="View current stack"
              >
                <span className="g3-hud-button-label">Stack</span>
                <span className="g3-hud-button-key">VIEW</span>
              </button>
            )}
            {!hasOverlay && !topDown && (
              <button
                className="g3-hud-button"
                onClick={() => setTopDown(true)}
                title="Toggle top-down view (T)"
              >
                <span className="g3-hud-button-label">Map</span>
                <span className="g3-hud-button-key">T</span>
              </button>
            )}
            <button className="g3-hud-button" onClick={toggleMute} title="Toggle audio">
              <span className="g3-hud-button-label">{audioMuted ? "Muted" : "Audio"}</span>
              <span className="g3-hud-button-key">{audioMuted ? "OFF" : "ON"}</span>
            </button>
          </div>
        </div>
        <div className="g3-hud-mission">
          <div className="g3-hud-mission-copy">
            <span className="g3-hud-mission-label">Now Playing · {storeMode}</span>
            <span className="g3-hud-hint">{objectiveTitle}</span>
            <span className="g3-hud-mission-subtitle">{objectiveSubtitle}</span>
          </div>
          <div className="g3-hud-mission-side">
            <span className="g3-hud-mission-side-primary">{currentTier.emoji} {currentTier.name}</span>
            <span className="g3-hud-mission-side-secondary">{tierStatus}</span>
            <div className="g3-hud-mission-meter-track">
              <div
                className="g3-hud-mission-meter-fill"
                style={{ width: `${Math.min(Math.max(objectiveProgressPercent, 0), 100)}%` }}
              />
            </div>
            <span className="g3-hud-mission-meter-label">{objectiveProgressLabel}</span>
          </div>
        </div>
      </div>

      {/* Floating XP popup */}
      {xpPopup && (
        <div key={xpPopup.key} className="g3-xp-popup">{xpPopup.text}</div>
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

function mysteryHintWeight(challengeTimer: number) {
  return Math.min(55, challengeTimer * 2);
}
