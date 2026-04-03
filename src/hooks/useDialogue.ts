"use client";

import { useState, useCallback, useEffect } from "react";
import { addXP, getMembershipTier, getQuestState, startQuest, completeObjective, completeQuest, getPropsCount, MEMBERSHIP_TIERS } from "@/lib/game-state";
import { playSFX, playNpcLine } from "@/lib/audio";
import { analyzeSentiment, getXPDelta, updateNpcRapport } from "@/lib/sentiment";
import { CUSTOMER_SIDE_QUESTS } from "@/lib/quest-system";
import type { DialogueTree, DialogueNode } from "@/lib/npc-dialogues";
import type { Overlay } from "./useOverlay";

export interface NpcChatTarget {
  name: string;
  personalityType: string;
  npcManagerId: string;
}

export interface NpcChatMessage {
  role: "player" | "npc";
  text: string;
}

export interface DialogueConfig {
  /** Called when XP / tier changes (addXP result) */
  handleTierUp: (result: { tierUp: boolean; newTier: string } | null) => void;
  /** Current era id for NPC chat API */
  era: string;
  /** Current player XP for NPC chat API */
  totalXP: number;
  /** Setter for totalXP state in parent */
  setTotalXP: React.Dispatch<React.SetStateAction<number>>;
  /** Setter for currentTier state in parent */
  setCurrentTier: React.Dispatch<React.SetStateAction<(typeof MEMBERSHIP_TIERS)[number]>>;
  /** Show a quest notification */
  showQuestNotif: (msg: string) => void;
  /** Setter for propsCount from useChallenge */
  setPropsCount: React.Dispatch<React.SetStateAction<{ unlocked: number; total: number }>>;
  /** Set the overlay (from useOverlay) */
  setOverlay: (o: Overlay) => void;
  /** Show floating XP popup */
  triggerXpPopup: (amount: number) => void;
}

export function useDialogue(config: DialogueConfig) {
  const {
    handleTierUp,
    era,
    totalXP,
    setTotalXP,
    setCurrentTier,
    showQuestNotif,
    setPropsCount,
    setOverlay,
    triggerXpPopup,
  } = config;

  // RPG dialogue state
  const [rpgDialogue, setRpgDialogue] = useState<DialogueTree | null>(null);
  const [rpgNode, setRpgNode] = useState<DialogueNode | null>(null);
  const [rpgHistory, setRpgHistory] = useState<{ speaker: string; portrait?: string; text: string }[]>([]);

  // NPC freeform chat state
  const [npcChatTarget, setNpcChatTarget] = useState<NpcChatTarget | null>(null);
  const [npcChatMessages, setNpcChatMessages] = useState<NpcChatMessage[]>([]);
  const [npcChatInput, setNpcChatInput] = useState("");
  const [npcChatLoading, setNpcChatLoading] = useState(false);

  // Typewriter effect for RPG dialogue
  const [displayedText, setDisplayedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);

  // Show full text immediately when rpgNode changes
  useEffect(() => {
    if (!rpgNode) {
      setDisplayedText("");
      setTypewriterDone(false);
      return;
    }
    setDisplayedText(rpgNode.text);
    setTypewriterDone(true);
  }, [rpgNode]);

  // Play ElevenLabs voice when an NPC speaks in RPG dialogue
  useEffect(() => {
    if (!rpgNode || rpgNode.speaker === "You") return;
    const personalityType = npcChatTarget?.personalityType;
    if (!personalityType) return;
    const npcName = rpgDialogue?.npc || rpgNode.speaker;
    playNpcLine(npcName, rpgNode.text, personalityType);
  }, [rpgNode, npcChatTarget?.personalityType, rpgDialogue?.npc]);

  // Handle RPG dialogue response selection (quest triggers + node navigation)
  const handleDialogueResponse = useCallback(
    (resp: { text: string; next: DialogueNode; questStart?: string; questComplete?: string }) => {
      if (resp.questStart) {
        const questId = resp.questStart;
        const state = getQuestState();
        if (!state.activeQuests.includes(questId) && !state.completedQuests.includes(questId)) {
          startQuest(questId);
          const quest = CUSTOMER_SIDE_QUESTS.find((q) => q.id === questId);
          if (quest) {
            showQuestNotif(`New Side Quest: ${quest.title}`);
            playSFX("challenge_start");
          }
        }
      }
      if (resp.questComplete) {
        const questId = resp.questComplete;
        // Handle Charlie trivia correct answer - award 25 XP directly
        if (questId === "trivia_correct") {
          const result = addXP(25);
          setTotalXP(result.newTotal);
          setCurrentTier(getMembershipTier(result.newTotal));
          handleTierUp(result.tierUp ? { tierUp: true, newTier: result.newTier } : null);
          showQuestNotif("Trivia correct! +25 XP");
          playSFX("challenge_complete");
        } else {
          const quest = CUSTOMER_SIDE_QUESTS.find((q) => q.id === questId);
          if (quest) {
            const state = getQuestState();
            if (!state.completedQuests.includes(questId)) {
              if (!state.activeQuests.includes(questId)) {
                startQuest(questId);
              }
              for (const obj of quest.objectives) {
                completeObjective(questId, obj.id);
              }
              const tierResult = completeQuest(questId);
              handleTierUp(tierResult);
              setPropsCount(getPropsCount());
              showQuestNotif(`Side Quest Complete: ${quest.title}! +${quest.reward.xp} XP`);
              playSFX("challenge_complete");
            }
          }
        }
      }
      // Intercept freeform chat sentinel
      if (resp.next.text === "__OPEN_FREEFORM_CHAT__" && npcChatTarget) {
        setNpcChatMessages([{ role: "npc", text: `Hey! What's on your mind?` }]);
        setNpcChatInput("");
        setOverlay("npc_chat");
        return;
      }

      setRpgHistory((prev) => [
        ...prev,
        { speaker: "You", text: resp.text },
        { speaker: resp.next.speaker, portrait: resp.next.portrait, text: resp.next.text },
      ]);
      setRpgNode(resp.next);
    },
    [showQuestNotif, handleTierUp, npcChatTarget, setTotalXP, setCurrentTier, setPropsCount, setOverlay]
  );

  // NPC freeform chat send
  const handleNpcChatSend = useCallback(async () => {
    if (!npcChatInput.trim() || !npcChatTarget || npcChatLoading) return;
    const text = npcChatInput.trim();
    setNpcChatInput("");
    setNpcChatMessages((prev) => [...prev, { role: "player", text }]);
    setNpcChatLoading(true);

    // Sentiment scoring (client-side, instant)
    const { tone } = analyzeSentiment(text);
    const xpDelta = getXPDelta(tone);
    if (xpDelta !== 0) {
      const result = addXP(xpDelta);
      setTotalXP(result.newTotal);
      setCurrentTier(getMembershipTier(result.newTotal));
      if (result.tierUp) handleTierUp({ tierUp: true, newTier: result.newTier });
    }
    updateNpcRapport(npcChatTarget.npcManagerId, xpDelta);

    try {
      const res = await fetch("/api/npc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcName: npcChatTarget.name,
          personalityType: npcChatTarget.personalityType,
          eraId: era,
          playerMessage: text,
          history: npcChatMessages.slice(-6),
          playerXP: totalXP,
        }),
      });
      const data = await res.json();

      // Also apply LLM sentiment if different from keyword
      if (data.sentiment && data.sentiment !== "neutral" && data.source === "llm") {
        const llmXp = getXPDelta(data.sentiment);
        if (llmXp !== 0 && tone === "neutral") {
          const result2 = addXP(llmXp);
          setTotalXP(result2.newTotal);
          setCurrentTier(getMembershipTier(result2.newTotal));
          updateNpcRapport(npcChatTarget.npcManagerId, llmXp);
        }
      }

      setNpcChatMessages((prev) => [...prev, { role: "npc", text: data.reply }]);
    } catch {
      setNpcChatMessages((prev) => [...prev, { role: "npc", text: "Sorry, I spaced out. What?" }]);
    } finally {
      setNpcChatLoading(false);
    }
  }, [npcChatInput, npcChatTarget, npcChatLoading, npcChatMessages, era, totalXP, handleTierUp, setTotalXP, setCurrentTier]);

  return {
    // RPG dialogue
    rpgDialogue,
    setRpgDialogue,
    rpgNode,
    setRpgNode,
    rpgHistory,
    setRpgHistory,
    displayedText,
    typewriterDone,
    handleDialogueResponse,

    // NPC freeform chat
    npcChatTarget,
    setNpcChatTarget,
    npcChatMessages,
    setNpcChatMessages,
    npcChatInput,
    setNpcChatInput,
    npcChatLoading,
    handleNpcChatSend,
  };
}
