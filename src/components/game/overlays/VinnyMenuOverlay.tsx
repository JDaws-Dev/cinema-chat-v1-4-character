"use client";

import { type Dispatch, type SetStateAction } from "react";
import { type Overlay } from "@/hooks/useOverlay";

interface HeldMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
}

interface VinnyMenuOverlayProps {
  heldMovies: HeldMovie[];
  shiftActive: boolean;
  setOverlay: Dispatch<SetStateAction<Overlay>>;
  closeOverlay: () => void;
  onTalk: () => void;
  onChat: () => void;
  onCheckout: () => void;
  onChallenge: () => void;
  onReturnShift: () => void;
}

export function VinnyMenuOverlay({
  heldMovies,
  shiftActive,
  closeOverlay,
  onTalk,
  onChat,
  onCheckout,
  onChallenge,
  onReturnShift,
}: VinnyMenuOverlayProps) {
  const hasMovies = heldMovies.length > 0;

  return (
    <div className="g3-overlay g3-overlay-center">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">VINNY — HOW CAN I HELP?</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
      </div>
      <div className="g3-overlay-body g3-challenge-select">
        {hasMovies && !shiftActive && (
          <button
            className="g3-challenge-option"
            onClick={onCheckout}
          >
            <div className="g3-challenge-option-name">Check out</div>
            <div className="g3-challenge-option-desc">
              Rent {heldMovies.length} {heldMovies.length === 1 ? "tape" : "tapes"}
              {heldMovies.length === 1 ? `: ${heldMovies[0].title}` : ""}
            </div>
          </button>
        )}

        <button className="g3-challenge-option" onClick={onChat}>
          <div className="g3-challenge-option-name">Ask for a recommendation</div>
          <div className="g3-challenge-option-desc">
            Type freeform to Vinny — tell him what you&apos;re in the mood for tonight.
          </div>
        </button>

        <button className="g3-challenge-option" onClick={onTalk}>
          <div className="g3-challenge-option-name">Just chat</div>
          <div className="g3-challenge-option-desc">
            Pick from a few things to say. Quick conversation, no pressure.
          </div>
        </button>

        {!shiftActive && (
          <button className="g3-challenge-option" onClick={onChallenge}>
            <div className="g3-challenge-option-name">Start a challenge</div>
            <div className="g3-challenge-option-desc">
              Movie Night, Speed Run, or Vinny&apos;s Mystery. Find specific movies on the clock.
            </div>
          </button>
        )}

        {!hasMovies && !shiftActive && (
          <button className="g3-challenge-option" onClick={onReturnShift}>
            <div className="g3-challenge-option-name">Take a return-tape shift</div>
            <div className="g3-challenge-option-desc">
              Grab 5 returns from Vinny and race the 3-minute clock to put them back where they belong.
            </div>
          </button>
        )}

        <button className="g3-challenge-option" onClick={closeOverlay}>
          <div className="g3-challenge-option-name">Never mind</div>
          <div className="g3-challenge-option-desc">Back away from the counter.</div>
        </button>
      </div>
    </div>
  );
}
