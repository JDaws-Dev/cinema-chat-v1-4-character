"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  getPropsCount, PROPS, completeObjective, completeQuest,
  getActiveQuests, getTotalXP, getMembershipTier, MEMBERSHIP_TIERS,
  type MovieProp,
} from "@/lib/game-state";

interface UseQuestTrackingParams {
  setPropsCount: React.Dispatch<React.SetStateAction<{ unlocked: number; total: number }>>;
  setRewardProp: React.Dispatch<React.SetStateAction<MovieProp | null>>;
}

export function useQuestTracking({ setPropsCount, setRewardProp }: UseQuestTrackingParams) {
  // ── Notification stacking system ─────────────────────
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  const addNotification = useCallback((text: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev.slice(-2), { id, text }]); // max 3
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  // ── Quest notification (delegates to stacked notifications) ──
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const questNotifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showQuestNotif = useCallback((msg: string) => {
    addNotification(msg);
  }, [addNotification]);

  // ── Membership tier state ────────────────────────────
  const [totalXP, setTotalXP] = useState(0);
  const [currentTier, setCurrentTier] = useState(MEMBERSHIP_TIERS[0]);
  const [tierUpNotification, setTierUpNotification] = useState<string | null>(null);
  const tierUpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── XP popup state ───────────────────────────────────
  const [xpPopup, setXpPopup] = useState<{ text: string; key: number } | null>(null);
  const xpPopupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const triggerXpPopup = useCallback((amount: number) => {
    if (amount === 0) return;
    const sign = amount > 0 ? "+" : "";
    setXpPopup({ text: `${sign}${amount} XP`, key: Date.now() });
    if (xpPopupTimer.current) clearTimeout(xpPopupTimer.current);
    xpPopupTimer.current = setTimeout(() => setXpPopup(null), 1600);
  }, []);

  const refreshTierState = useCallback(() => {
    setTotalXP(getTotalXP());
    setCurrentTier(getMembershipTier());
  }, []);

  const handleTierUp = useCallback((result: { tierUp: boolean; newTier: string } | null) => {
    refreshTierState();
    if (result?.tierUp) {
      setTierUpNotification(result.newTier);
      if (tierUpTimer.current) clearTimeout(tierUpTimer.current);
      tierUpTimer.current = setTimeout(() => setTierUpNotification(null), 4000);
    }
  }, [refreshTierState]);

  // ── Load tier on mount ───────────────────────────────
  useEffect(() => {
    setTotalXP(getTotalXP());
    setCurrentTier(getMembershipTier());
  }, []);

  // ── Quest completion helper (shared by all track* callbacks) ──
  const completeQuestAndNotify = useCallback((questId: string, questTitle: string, reward: { xp: number; propId?: string }) => {
    const tierResult = completeQuest(questId);
    handleTierUp(tierResult);
    triggerXpPopup(reward.xp);
    setPropsCount(getPropsCount());
    showQuestNotif(`Quest Complete: ${questTitle}!`);
    if (reward.propId) {
      const prop = PROPS.find(p => p.id === reward.propId);
      if (prop) setRewardProp(prop);
    }
  }, [handleTierUp, triggerXpPopup, setPropsCount, setRewardProp, showQuestNotif]);

  // ── Track genre section visits ───────────────────────
  const trackQuestGenreVisit = useCallback((genre: string) => {
    const active = getActiveQuests();
    const genreUpper = genre.toUpperCase().replace(/_/g, " ").replace("SCIFI", "SCI-FI").replace("NEW RELEASES", "DOCS").replace("STAFF PICKS", "CLASSICS");
    const GENRE_MAP: Record<string, string> = {
      "HORROR": "HORROR", "SCIFI": "SCI-FI", "COMEDY": "COMEDY", "DRAMA": "DRAMA",
      "ACTION": "ACTION", "CLASSICS": "CLASSICS", "FAMILY": "FAMILY", "NEW RELEASES": "DOCS",
      "NEW_RELEASES": "DOCS", "STAFF PICKS": "CLASSICS", "STAFF_PICKS": "CLASSICS",
      "ROMANCE": "ROMANCE", "WESTERN": "WESTERN", "THRILLER": "THRILLER",
      "ANIMATED": "ANIMATED", "DOCS": "DOCS", "SCI-FI": "SCI-FI",
    };
    const mappedGenre = GENRE_MAP[genreUpper] || genreUpper;

    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "visit_section" && obj.target === mappedGenre) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Visited ${mappedGenre} section`);
          if (allDone) {
            completeQuestAndNotify(quest.id, quest.title, quest.reward);
          }
        }
      }
    }
  }, [showQuestNotif, completeQuestAndNotify]);

  // ── Track movie pickups ──────────────────────────────
  const trackQuestMoviePickup = useCallback((movieTitle: string, movieGenre: string) => {
    const active = getActiveQuests();
    const genreUpper = movieGenre.toUpperCase();

    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "browse_genre" && obj.target === genreUpper) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Picked ${genreUpper} movie`);
          if (allDone) {
            completeQuestAndNotify(quest.id, quest.title, quest.reward);
          }
        }
        if (obj.type === "find_movie" && obj.target && movieTitle.toLowerCase().includes(obj.target.toLowerCase())) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Found ${movieTitle}!`);
          if (allDone) {
            completeQuestAndNotify(quest.id, quest.title, quest.reward);
          }
        }
      }
    }
  }, [showQuestNotif, completeQuestAndNotify]);

  // ── Track NPC conversations ──────────────────────────
  const trackQuestNpcTalk = useCallback((npcName: string) => {
    const active = getActiveQuests();
    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "talk_to_npc" && obj.target === npcName) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Talked to ${npcName}`);
          if (allDone) {
            completeQuestAndNotify(quest.id, quest.title, quest.reward);
          }
        }
      }
    }
  }, [showQuestNotif, completeQuestAndNotify]);

  return {
    // Notification state
    notifications,
    addNotification,
    // Quest notification
    showQuestNotif,
    // Tier state
    totalXP,
    setTotalXP,
    currentTier,
    setCurrentTier,
    tierUpNotification,
    // XP popup
    xpPopup,
    triggerXpPopup,
    // Tier callbacks
    refreshTierState,
    handleTierUp,
    // Quest tracking callbacks
    trackQuestGenreVisit,
    trackQuestMoviePickup,
    trackQuestNpcTalk,
  };
}
