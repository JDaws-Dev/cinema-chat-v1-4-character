"use client";

import { DialogueBox } from "@/components/game3d/DialogueOverlay";

interface DialogueOverlayProps {
  closeOverlay: () => void;
}

export function DialogueOverlay({ closeOverlay }: DialogueOverlayProps) {
  return (
    <div className="g3-overlay">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">VINNY</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
      </div>
      <div className="g3-overlay-body">
        <DialogueBox onClose={closeOverlay} />
      </div>
    </div>
  );
}
