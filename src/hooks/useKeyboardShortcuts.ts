import { useEffect } from "react";
import type { Overlay } from "./useOverlay";
import type { DialogueNode } from "@/lib/npc-dialogues";

interface KeyboardShortcutsParams {
  overlay: Overlay;
  closeOverlay: () => void;
  rpgNode: DialogueNode | null;
  handleDialogueResponse: (response: NonNullable<DialogueNode["responses"]>[number]) => void;
  setTopDown: (fn: (prev: boolean) => boolean) => void;
  setOverlay: (o: Overlay) => void;
}

export function useKeyboardShortcuts({
  overlay,
  closeOverlay,
  rpgNode,
  handleDialogueResponse,
  setTopDown,
  setOverlay,
}: KeyboardShortcutsParams) {
  // Q or Backspace to close overlays (ESC exits pointer lock, so don't use it)
  // Number keys 1-4 to select RPG dialogue responses.
  // CRITICAL: skip when an input/textarea is focused — otherwise typing "q" or
  // hitting Backspace to delete a character would close the chat overlay.
  useEffect(() => {
    if (overlay === "none") return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (inEditable) return;
      if (e.key === "q" || e.key === "Q" || e.key === "Backspace") {
        e.preventDefault();
        closeOverlay();
        return;
      }
      // Number keys for RPG dialogue choices
      if (overlay === "rpg_dialogue" && rpgNode?.responses) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= rpgNode.responses.length) {
          e.preventDefault();
          handleDialogueResponse(rpgNode.responses[num - 1]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay, closeOverlay, rpgNode, handleDialogueResponse]);

  // T to toggle top-down view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if ((e.key === "t" || e.key === "T") && overlay === "none") {
        setTopDown(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay, setTopDown]);

  // C key screenshot (hidden power-user feature)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if ((e.key === "c" || e.key === "C") && overlay === "none") {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `friday-night-video-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay]);

  // J quest-log shortcut removed — quest system collapsed into challenges,
  // and challenge HUD is always visible while a challenge is active.
}
