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
  shiftActive: boolean;
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
  heldMovies, shiftActive, challenge, challengeTimer,
  setOverlay, overlay,
  xpPopup, tierUpNotification,
}: GameHUDProps) {
  const interactionHint =
    overlay === "rpg_dialogue"
      ? (isMobile ? "Tap a response · Tap X to leave" : "1-4 to respond · Q to leave")
      : hasOverlay
        ? (isMobile ? "Tap X to close" : "Press Q or click X to close")
        : shiftActive
          ? "Put the return stack back on the right genre shelves"
          : heldMovies.length > 0
          ? `Take your ${heldMovies.length === 1 ? "movie" : `${heldMovies.length} movies`} to Vinny`
          : "";

  let storeMode = "Store floor";
  let objectiveTitle = "Find a tape worth taking to Vinny";
  let objectiveSubtitle = "Use aisle signs and the front counter to stay oriented.";
  let objectiveProgressPercent = nextTier ? Math.min(Math.max(tierProgress, 0), 100) : 100;
  let objectiveProgressLabel = nextTier ? `${Math.round(Math.min(Math.max(tierProgress, 0), 100))}% to ${nextTier.name}` : "Top tier unlocked";

  if (overlay === "rpg_dialogue") {
    storeMode = "Conversation";
    objectiveTitle = "Pick a response";
    objectiveSubtitle = interactionHint;
  } else if (hasOverlay) {
    storeMode = "Overlay open";
    objectiveTitle = "Finish this interaction";
    objectiveSubtitle = interactionHint || "Close the panel when you're ready to move again.";
  } else if (challenge) {
    storeMode = "Challenge live";
    if (challenge.type === "vinnys_mystery") {
      objectiveTitle = "Find Vinny's mystery tape";
      objectiveSubtitle = "Use the clue and aisle signs.";
      objectiveProgressPercent = Math.min(100, 35 + mysteryHintWeight(challengeTimer));
      objectiveProgressLabel = "Clue hunt active";
    } else {
      const foundCount = challenge.movies.filter((movie) =>
        heldMovies.some((held) => held.title.toLowerCase() === movie.title.toLowerCase()),
      ).length;
      objectiveTitle =
        challenge.type === "speed_run"
          ? "Beat the clock"
          : "Build the perfect movie night stack";
      objectiveSubtitle = `${foundCount}/${challenge.movies.length} target tapes found${challenge.timeLimit ? ` · ${Math.max(0, challenge.timeLimit - challengeTimer)}s left` : ""}`;
      objectiveProgressPercent = challenge.movies.length > 0 ? (foundCount / challenge.movies.length) * 100 : 0;
      objectiveProgressLabel = `${foundCount}/${challenge.movies.length} found`;
    }
  } else if (shiftActive) {
    const returned = Math.max(0, 5 - heldMovies.length);
    storeMode = "Return shift";
    objectiveTitle = "Return Vinny's stack before the clock runs out";
    objectiveSubtitle = "Match each tape to its genre shelf.";
    objectiveProgressPercent = (returned / 5) * 100;
    objectiveProgressLabel = `${returned}/5 returned`;
  } else if (heldMovies.length > 0) {
    storeMode = "Checkout run";
    objectiveTitle = "Bring your stack to Vinny";
    objectiveSubtitle = `${heldStackLabel} ready.`;
    objectiveProgressPercent = (heldMovies.length / 5) * 100;
    objectiveProgressLabel = heldStackLabel;
  }

  const clampedTierProgress = Math.min(Math.max(tierProgress, 0), 100);
  // Tier pill removed — tier system was cosmetic-only and gated freeform Vinny chat
  // behind grinding. Hidden from HUD; underlying state still exists for prop math.
  const statusPills = [
    { label: "Time", value: formatGameTime(gameTime) },
    { label: "Close", value: closeCountdownLabel },
    { label: "Stack", value: heldStackLabel },
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
            {!hasOverlay && !topDown && heldMovies.length > 0 && !shiftActive && (
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
          {/* Tier badge + XP-to-next-tier meter removed — tier system was cosmetic
              and inferred a "grind" loop that doesn't fit a one-session game. */}
        </div>
      </div>

      {/* Floating XP popup */}
      {xpPopup && (
        <div key={xpPopup.key} className="g3-xp-popup">{xpPopup.text}</div>
      )}

      {/* Tier-up notification */}
      {/* Tier-up notification removed — tiers no longer surfaced. */}
    </>
  );
}

function mysteryHintWeight(challengeTimer: number) {
  return Math.min(55, challengeTimer * 2);
}
