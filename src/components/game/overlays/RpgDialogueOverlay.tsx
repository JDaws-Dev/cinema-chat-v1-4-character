"use client";

import { type DialogueTree, type DialogueNode, type DialogueResponse } from "@/lib/npc-dialogues";

interface RpgDialogueOverlayProps {
  rpgDialogue: DialogueTree | null;
  rpgNode: DialogueNode;
  displayedText: string;
  typewriterDone: boolean;
  handleDialogueResponse: (resp: DialogueResponse) => void;
  closeOverlay: () => void;
}

export function RpgDialogueOverlay({
  rpgDialogue, rpgNode, displayedText, typewriterDone,
  handleDialogueResponse, closeOverlay,
}: RpgDialogueOverlayProps) {
  return (
    <div className="g3-rpg-overlay">
      <div className="g3-rpg-box" key={rpgNode.text}>
        {/* Name plate */}
        <div className="g3-rpg-nameplate">
          <span className="g3-rpg-portrait">{rpgNode.portrait || rpgDialogue?.portrait || "?"}</span>
          <span className="g3-rpg-name">{rpgNode.speaker}</span>
        </div>
        {/* Dialogue text — typewriter effect */}
        <p className="g3-rpg-text">{displayedText}{!typewriterDone && <span className="g3-rpg-cursor">|</span>}</p>
        {/* Response choices — only shown after typewriter completes */}
        <div className="g3-rpg-responses">
          {typewriterDone ? (
            rpgNode.responses ? (
              rpgNode.responses.map((resp, i) => (
                <button
                  key={i}
                  className="g3-rpg-choice"
                  onClick={() => handleDialogueResponse(resp)}
                >
                  <span className="g3-rpg-choice-num">{i + 1}</span>
                  <span className="g3-rpg-choice-text">{resp.text}</span>
                </button>
              ))
            ) : (
              <button className="g3-rpg-choice g3-rpg-choice-end" onClick={closeOverlay}>
                <span className="g3-rpg-choice-num">Q</span>
                <span className="g3-rpg-choice-text">End conversation</span>
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
