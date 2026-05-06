"use client";

import { useState, useCallback, useRef } from "react";

export type Overlay =
  | "none"
  | "dialogue"
  | "shelf"
  | "film_detail"
  | "pick"
  | "quote"
  | "synopsis"
  | "challenge_select"
  | "trophy"
  | "rpg_dialogue"
  | "quest_log"
  | "checkout"
  | "npc_chat"
  | "vinny_menu"
  | "watch_at_home";

/**
 * Manages which overlay is currently open and provides a unified close helper.
 *
 * Accepts a mutable ref to an onClose callback so the parent can wire up
 * cleanup logic (clear puzzle, quiz, rpg dialogue state, track NPC relationship, etc.)
 * without causing re-renders or stale closure issues.
 */
export function useOverlay(onCloseRef: React.RefObject<(() => void) | null>) {
  const [overlay, setOverlay] = useState<Overlay>("none");

  const closeOverlay = useCallback(() => {
    onCloseRef.current?.();
    setOverlay("none");
  }, [onCloseRef]);

  const hasOverlay = overlay !== "none";

  return { overlay, setOverlay, closeOverlay, hasOverlay };
}
