"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { DialogueBox } from "@/components/game3d/DialogueOverlay";
import { ShelfBrowser } from "@/components/game/ShelfBrowser";
import { FilmDetailModal } from "@/components/FilmDetailModal";
import { RewardOverlay } from "@/components/game/RewardOverlay";
import { CheckoutOverlay } from "@/components/game/overlays/CheckoutOverlay";
import { QuestLogOverlay } from "@/components/game/overlays/QuestLogOverlay";
import { PuzzleOverlay } from "@/components/game/overlays/PuzzleOverlay";
import { NpcChatOverlay } from "@/components/game/overlays/NpcChatOverlay";
import {
  SCENARIOS, QUOTES, SYNOPSES,
  getSeen, markSeen, addCorrectAnswer, addWrongAnswer,
  type Scenario, type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { fetchSearch, fetchTrending } from "@/lib/api";
import { SecurityCameras } from "@/components/game3d/SecurityCameras";
import { loadGameState, saveGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, hasProp, type MovieProp, completeObjective, completeQuest, isQuestComplete, getQuestProgress, getActiveSideQuests, isSideQuestActive, isSideQuestDone, MEMBERSHIP_TIERS, getTotalXP, addXP, getMembershipTier, getNpcRelationship, incrementNpcRelationship } from "@/lib/game-state";
import { VINNY_QUESTS, QUEST_DIALOGUE, type Quest, CUSTOMER_SIDE_QUESTS } from "@/lib/quest-system";
import { playRandomLine, playVinnyLine, playSFX, setSubtitleHandler, VINNY_LINES, unlockAudio, setCurrentEra } from "@/lib/audio";
import { getRandomDialogue, getRandomQuestDialogue, getVinnyTierGreeting, generateTriviaDialogue, getRelationshipGreeting, type DialogueTree, type DialogueNode } from "@/lib/npc-dialogues";
import { PERSONALITIES, getPersonalityGreeting, getRandomPersonality, type PersonalityType } from "@/lib/npc-personalities";
import { buildCustomerDialogue } from "@/lib/npc-customer-dialogues";
import { mobileInput } from "@/components/game3d/MobileControls";
import { setActiveDialogueTarget } from "@/components/game3d/store-characters";
import { isNpcHostile } from "@/lib/sentiment";
import { type EraId } from "@/lib/curated-movie-catalog";
import { useGameClock, formatGameTime, type ClosingAnnouncement } from "@/hooks/useGameClock";
import { useAudioUI } from "@/hooks/useAudioUI";
import { useInventory, type HeldMovie, type HeldSnack } from "@/hooks/useInventory";
import { useChallenge, type ChallengeMovie, type ChallengeType } from "@/hooks/useChallenge";
import { useOverlay, type Overlay } from "@/hooks/useOverlay";
import { useDialogue } from "@/hooks/useDialogue";
import { usePuzzle } from "@/hooks/usePuzzle";
import { useQuestTracking } from "@/hooks/useQuestTracking";
import "./game.css";

const MobileControls = dynamic(() => import("@/components/game3d/MobileControls").then(m => ({ default: m.MobileControls })), { ssr: false });
const TopDownCamera = dynamic(() => import("@/components/game3d/TopDownCamera").then(m => ({ default: m.TopDownCamera })), { ssr: false });

const Canvas = dynamic(() => import("@react-three/fiber").then(m => ({ default: m.Canvas })), { ssr: false });
const Store = dynamic(() => import("@/components/game3d/Store").then(m => ({ default: m.Store })), { ssr: false });
const FirstPersonControls = dynamic(() => import("@/components/game3d/FirstPerson").then(m => ({ default: m.FirstPersonControls })), { ssr: false });
const InteractionSystem = dynamic(() => import("@/components/game3d/Interaction").then(m => ({ default: m.InteractionSystem })), { ssr: false });
const PostEffects = dynamic(() => import("@/components/game3d/PostEffects").then(m => ({ default: m.PostEffects })), { ssr: false });

const GENRE_IDS: Record<string, string> = { horror: "27", scifi: "878", comedy: "35", drama: "18", action: "28", classics: "36", family: "10751", new: "trending" };

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function GamePage() {
  type ShelfBrowseState = { genre: string; shelfId?: string; count?: number; label?: string };
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [era, setEra] = useState<string>("early90s");
  const [eraChosen, setEraChosen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const ERA_OPTIONS = [
    { id: "late80s", label: "Late 80s", years: "1987-1989", displayYear: "1989" },
    { id: "early90s", label: "Early 90s", years: "1990-1993", displayYear: "1992" },
    { id: "mid90s", label: "Mid 90s", years: "1994-1996", displayYear: "1995" },
    { id: "late90s", label: "Late 90s", years: "1997-1999", displayYear: "1998" },
    { id: "present", label: "Present Day", years: "2024-2026", displayYear: "2025" },
  ];
  const selectedEra = ERA_OPTIONS.find(e => e.id === era) || ERA_OPTIONS[1];

  // Sync era to audio conversation system
  useEffect(() => {
    setCurrentEra(era);
  }, [era]);

  useEffect(() => {
    const mobile = 'ontouchstart' in window || window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      // Minimize Safari address bar
      setTimeout(() => window.scrollTo(0, 1), 100);
      // Lock orientation if supported
      try { (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.("landscape").catch(() => {}); } catch {}
    }
  }, []);
  const [topDown, setTopDown] = useState(false);
  const [shelfBrowse, setShelfBrowse] = useState<ShelfBrowseState | null>(null);
  const [filmId, setFilmId] = useState<number | null>(null);

  // Quote/Synopsis state
  const [quote, setQuote] = useState<QuoteChallenge | null>(null);
  const [synopsis, setSynopsis] = useState<SynopsisChallenge | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const [hintText, setHintText] = useState<string | null>(null);

  // VHS pickup inventory (movies, snacks, pickup flash)
  const {
    heldMovies, setHeldMovies,
    heldSnacks, setHeldSnacks,
    pendingPickup, setPendingPickup,
    spawnedMissingSlotKeys,
    recentReturns, setRecentReturns,
    pickupFlash, setPickupFlash,
    pickupTitle, setPickupTitle,
    removeHeldMovie,
  } = useInventory({ eraYears: selectedEra.years });
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  // Movie Night Challenge state (extracted to useChallenge hook)
  const {
    challenge, setChallenge,
    challengeComplete, setChallengeComplete,
    challengeTimer,
    propsCount, setPropsCount,
    rewardProp, setRewardProp,
    mysteryClue, setMysteryClue,
    mysteryHintsUsed, setMysteryHintsUsed,
    mysteryWrongMsg, setMysteryWrongMsg,
    startChallenge, startMystery,
  } = useChallenge(setHeldMovies, setHeldSnacks);

  // Audio UI (mute, subtitle, music toggle)
  const { audioMuted, musicOff, setMusicOff, subtitle, setSubtitle, toggleMute } = useAudioUI();

  // ── Overlay hook (manages overlay state + close) ──────
  const overlayCloseRef = useRef<(() => void) | null>(null);
  const { overlay, setOverlay, closeOverlay, hasOverlay } = useOverlay(overlayCloseRef);

  // Vinny's Five puzzle (extracted to usePuzzle hook)
  const {
    puzzle, setPuzzle,
    puzzleClue,
    puzzleGuess,
    puzzleResults,
    puzzleWon,
    puzzleBackdropReady,
    puzzleBlur,
    inputRef,
    startPuzzle,
    handlePuzzleSearch,
    submitPuzzleGuess,
    skipPuzzleClue,
  } = usePuzzle(setOverlay);

  const getHudPosterSrc = useCallback((posterUrl: string) => {
    if (!posterUrl) return "";
    return posterUrl.startsWith("https://image.tmdb.org/")
      ? `/api/image-proxy?url=${encodeURIComponent(posterUrl.replace('/w342/', '/w92/'))}`
      : posterUrl;
  }, []);

  // Quest tracking system (notifications, XP, tier, quest objectives)
  const {
    notifications, addNotification,
    showQuestNotif,
    totalXP, setTotalXP, currentTier, setCurrentTier, tierUpNotification,
    xpPopup, triggerXpPopup,
    refreshTierState, handleTierUp,
    trackQuestGenreVisit, trackQuestMoviePickup, trackQuestNpcTalk,
  } = useQuestTracking({ setPropsCount, setRewardProp });

  const resumePointerLock = useCallback(() => {
    if (isMobile || topDown) return;
    requestAnimationFrame(() => {
      const canvas = document.querySelector("canvas");
      if (canvas instanceof HTMLCanvasElement && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    });
  }, [isMobile, topDown]);

  // Side quest state (uses existing showQuestNotif for notifications)

  // Game clock (extracted to useGameClock hook)
  const { gameTime, isClosingSoon, minutesUntilClose, closeCountdownLabel, maxNpcs } = useGameClock({
    started,
    loading,
    overlay,
    onClosingAnnouncement: useCallback((announcement: ClosingAnnouncement, closed: boolean) => {
      playVinnyLine(announcement.line);
      if (closed) setOverlay("checkout");
    }, []),
  });

  // Challenge timer is now handled by useChallenge hook

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handler = () => { unlockAudio(); window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, []);

  // ── Dialogue hook (RPG dialogue + NPC freeform chat) ──
  const {
    rpgDialogue, setRpgDialogue,
    rpgNode, setRpgNode,
    rpgHistory, setRpgHistory,
    displayedText, typewriterDone,
    handleDialogueResponse,
    npcChatTarget, setNpcChatTarget,
    npcChatMessages, setNpcChatMessages,
    npcChatInput, setNpcChatInput,
    npcChatLoading,
    handleNpcChatSend,
  } = useDialogue({
    handleTierUp,
    era,
    totalXP,
    setTotalXP,
    setCurrentTier,
    showQuestNotif,
    setPropsCount,
    setOverlay,
    triggerXpPopup,
  });

  // Wire up the overlay close callback (needs rpgDialogue from useDialogue)
  overlayCloseRef.current = () => {
    // Track NPC relationship when ending a dialogue
    if (overlay === "rpg_dialogue" && rpgDialogue) {
      const npcType = rpgDialogue.npc?.toLowerCase() || "customer";
      incrementNpcRelationship(npcType);
    }
    // Clear mouth animation signal when dialogue closes
    setActiveDialogueTarget(null);
    setPuzzle(null);
    setQuote(null);
    setSynopsis(null);
    setQuizAnswer(null);
    setRpgDialogue(null);
    setRpgNode(null);
    setRpgHistory([]);
    setFilmId(null);
    setPendingPickup(null);
    setShelfBrowse(null);
  };

  // ── Hover callback from 3D interaction system ─────────
  const handleHover = useCallback((label: string | null) => {
    setHoverLabel(label);
  }, []);

  // ── Movie Night Score Calculation (moved to CheckoutOverlay) ──

  // ── Interaction handler from 3D world ──────────────────
  const handleInteract = useCallback((type: string, data?: string) => {
    if (overlay !== "none") return;

    if (type === "snack" && data) {
      // Pick up candy/snack item — don't exit pointer lock, stay in game
      try {
        const snack = JSON.parse(data);
        setHeldSnacks(prev => {
          if (prev.some(s => s.name === snack.name)) return prev;
          if (prev.length >= 5) return prev; // Max 5 snacks
          return [...prev, { name: snack.name, emoji: snack.emoji }];
        });
        setPickupFlash(true);
        setPickupTitle(`${snack.emoji} ${snack.name}`);
        setTimeout(() => setPickupFlash(false), 800);
        setTimeout(() => setPickupTitle(null), 1500);
      } catch { /* ignore parse errors */ }
      return;
    }

    if (type === "vhs" && data) {
      // Pick up VHS tape — show back-of-box detail modal
      try {
        const movie = JSON.parse(data);
        setPendingPickup(movie);
        document.exitPointerLock();
        setFilmId(movie.id);
        setOverlay("film_detail");
      } catch { /* ignore parse errors */ }
      return;
    }

    if (type === "charlie") {
      // During challenges, Charlie gives gameplay hints (stays in-game)
      if (challenge) {
        const unfound = challenge.movies.filter(cm =>
          !heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase())
        );
        if (unfound.length > 0) {
          const movie = unfound[0];
          playVinnyLine(`Try the ${movie.genre} section for ${movie.title}.`, "Charlie");
        } else {
          playVinnyLine("Looks like you found them all! Go see Vinny.", "Charlie");
        }
        return;
      }
      if (mysteryClue) {
        if (mysteryHintsUsed < mysteryClue.hints.length) {
          playVinnyLine(mysteryClue.hints[mysteryHintsUsed], "Charlie");
          setMysteryHintsUsed(h => h + 1);
        } else {
          playVinnyLine("I've told you everything I know about that one!", "Charlie");
        }
        return;
      }
      // Track Charlie talk for quest objectives
      trackQuestNpcTalk("charlie");
      // RPG dialogue with Charlie — 30% chance of trivia quiz
      document.exitPointerLock();
      const tree = Math.random() < 0.3 ? generateTriviaDialogue() : getRandomDialogue("charlie");
      // Apply relationship-aware greeting for Charlie
      const charlieRelLevel = getNpcRelationship("charlie");
      const charlieRelGreeting = getRelationshipGreeting("charlie", charlieRelLevel);
      if (charlieRelGreeting) {
        const enhancedOpener: DialogueNode = { ...tree.opener, text: `${charlieRelGreeting} ${tree.opener.text}` };
        setRpgDialogue(tree);
        setRpgNode(enhancedOpener);
        setRpgHistory([{ speaker: enhancedOpener.speaker, portrait: enhancedOpener.portrait, text: enhancedOpener.text }]);
      } else {
        setRpgDialogue(tree);
        setRpgNode(tree.opener);
        setRpgHistory([{ speaker: tree.opener.speaker, portrait: tree.opener.portrait, text: tree.opener.text }]);
      }
      setActiveDialogueTarget("charlie");
      setOverlay("rpg_dialogue");
      return;
    }

    // Exit pointer lock when opening overlay
    document.exitPointerLock();

    if (type === "vinny") {
      // If in a mystery and have a held movie, check it
      if (mysteryClue && heldMovies.length > 0) {
        const match = heldMovies.some(m =>
          m.title.toLowerCase().includes(mysteryClue.movieTitle.toLowerCase()) ||
          mysteryClue.movieTitle.toLowerCase().includes(m.title.toLowerCase())
        );
        if (match) {
          // Correct! Clear mystery and reward
          setMysteryClue(null);
          setMysteryWrongMsg(null);
          setHeldMovies([]);
          recordChallengeCompletion("vinnys_mystery", 0);
          const state = loadGameState();
          setPropsCount(getPropsCount());
          setChallengeComplete(0); // 0 signals mystery win (no timer)
          playRandomLine("challenge_complete");
          document.exitPointerLock();
          return;
        } else {
          // Wrong movie
          setMysteryWrongMsg("That's not it... keep looking!");
          setTimeout(() => setMysteryWrongMsg(null), 2500);
          return;
        }
      }
      // If in a challenge and have all movies, complete it
      if (challenge && heldMovies.length > 0) {
        const found = challenge.movies.filter(cm =>
          heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase())
        );
        if (found.length === challenge.movies.length) {
          const elapsed = Math.round((Date.now() - challenge.startTime) / 1000);
          setChallengeComplete(elapsed);
          setChallenge(null);
          setHeldMovies([]);
          // Record completion and check for prop unlocks
          const cType = challenge.type || "movie_night";
          recordChallengeCompletion(cType, elapsed);
          const state = loadGameState();
          const count = state.challengeCompletions["movie_night"] || 0;
          // Check which props should be unlocked based on completion count
          const milestones: Record<number, string> = { 1: "nike_mags", 2: "gizmo", 3: "golden_ticket", 4: "neuralyzer", 5: "proton_pack", 7: "amber_cane", 8: "briefcase", 10: "hoverboard", 15: "one_ring", 20: "wilson" };
          const propId = milestones[count];
          if (propId && !state.unlockedProps.includes(propId)) {
            unlockProp(propId);
            const prop = PROPS.find(p => p.id === propId);
            if (prop) setRewardProp(prop);
          }
          // Check speed run props
          if (elapsed <= 60 && !state.unlockedProps.includes("red_pill")) {
            unlockProp("red_pill");
            const prop = PROPS.find(p => p.id === "red_pill");
            if (prop) setRewardProp(prop);
          }
          setPropsCount(getPropsCount());
          playSFX("challenge_complete");
          playRandomLine("challenge_complete");
          document.exitPointerLock();
          return;
        }
      }
      // If holding movies (no challenge), offer checkout or show film detail
      if (heldMovies.length > 0) {
        playRandomLine("checkout");
        // Go straight to checkout
        playSFX("cash_register");
        setOverlay("checkout");
        return;
      }
      // RPG dialogue with Vinny — sometimes quiz or conversation
      playRandomLine("greetings");
      const roll = Math.random();
      if (roll < 0.5) {
        // RPG-style conversation with tier-aware greeting
        const tree = getRandomDialogue("vinny");
        const tierGreeting = getVinnyTierGreeting(currentTier.name);
        const openerWithTier = { ...tree.opener, text: tierGreeting + " " + tree.opener.text };
        setRpgDialogue(tree);
        setRpgNode(openerWithTier);
        setRpgHistory([{ speaker: openerWithTier.speaker, portrait: openerWithTier.portrait, text: openerWithTier.text }]);
        setActiveDialogueTarget("vinny");
        setOverlay("rpg_dialogue");
      } else if (roll < 0.8) {
        setQuote(pickRandom(QUOTES, q => q.id));
        setQuizAnswer(null);
        setOverlay("quote");
      } else {
        setSynopsis(pickRandom(SYNOPSES, s => s.id));
        setQuizAnswer(null);
        setOverlay("synopsis");
      }
    } else if (type === "customer") {
      // Parse customer data — may be JSON from dynamic NPCs or plain string from legacy
      let personalityType: PersonalityType | undefined;
      let npcManagerId: string | undefined;
      let npcName: string | undefined;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          personalityType = parsed.personalityType;
          npcManagerId = parsed.npcManagerId;
        } catch {
          personalityType = data as PersonalityType;
        }
      }

      // Check if NPC is hostile (rapport below -50)
      if (npcManagerId && isNpcHostile(npcManagerId)) {
        playVinnyLine("...", npcName || "Customer");
        setSubtitleHandler((text: string) => { /* already handled */ });
        // Show a brief subtitle that the NPC won't talk
        const refusalNode: DialogueNode = {
          speaker: npcName || "Customer",
          portrait: "?",
          text: "I don't really feel like talking to you.",
        };
        const refusalTree: DialogueTree = { id: `refusal_${Date.now()}`, npc: npcName || "Customer", portrait: "?", opener: refusalNode };
        setRpgDialogue(refusalTree);
        setRpgNode(refusalNode);
        setRpgHistory([{ speaker: refusalNode.speaker, portrait: refusalNode.portrait, text: refusalNode.text }]);
        setActiveDialogueTarget("customer");
        setOverlay("rpg_dialogue");
        return;
      }

      // Customer side quest dialogue
      const activeSide = getActiveSideQuests();
      for (const q of activeSide) {
        for (const obj of q.objectives) {
          if (obj.type === "talk_to_npc" && obj.target === "customer") {
            const allDone = completeObjective(q.id, obj.id);
            if (allDone) {
              const tierResult = completeQuest(q.id);
              handleTierUp(tierResult);
              triggerXpPopup(q.reward.xp);
              setPropsCount(getPropsCount());
              showQuestNotif(`Side Quest Complete: ${q.title}! +${q.reward.xp} XP`);
              playSFX("challenge_complete");
              return;
            }
          }
        }
      }

      const personality = (personalityType && PERSONALITIES[personalityType]) || getRandomPersonality();
      const relLevel = getNpcRelationship(npcManagerId || "customer");
      npcName = personality.name;
      const canFreeChat = totalXP >= 500; // Gold membership unlocks freeform chat

      // Build rich personality-driven dialogue tree
      const personalityTree = buildCustomerDialogue(personality, npcName, relLevel, canFreeChat, era);

      // Store NPC chat target info for freeform chat (if unlocked)
      setNpcChatTarget({
        name: npcName,
        personalityType: personality.type,
        npcManagerId: npcManagerId || `anon-${Date.now()}`,
      });

      setRpgDialogue(personalityTree);
      setRpgNode(personalityTree.opener);
      setRpgHistory([{ speaker: personalityTree.opener.speaker, portrait: personalityTree.opener.portrait, text: personalityTree.opener.text }]);
      setActiveDialogueTarget("customer");
      setOverlay("rpg_dialogue");
    } else if (type === "pizza_clerk") {
      // Tony — Pizza Palace clerk, warm and friendly
      const tonyFollowPizza: DialogueNode = {
        speaker: "Tony",
        portrait: "pizza",
        text: "Friday nights are the busiest — everybody swings by after picking out a movie. Pepperoni outsells everything two to one. Can't beat the classics, right?",
      };
      const tonyFollowVinny: DialogueNode = {
        speaker: "Tony",
        portrait: "pizza",
        text: "Vinny? Oh yeah, great guy. We've been neighbors since this strip mall opened. He sends his customers over here all the time — and I send mine over there. It works out!",
      };
      const tonyFollowBrowse: DialogueNode = {
        speaker: "Tony",
        portrait: "pizza",
        text: "No worries! Take your time. The smell alone usually brings people back. Have a good one!",
      };
      const tonyOpener: DialogueNode = {
        speaker: "Tony",
        portrait: "pizza",
        text: "Hey! Welcome to Pizza Palace. Best pepperoni in town. What can I get ya?",
        responses: [
          { text: "What's good tonight?", next: tonyFollowPizza },
          { text: "Do you know Vinny next door?", next: tonyFollowVinny },
          { text: "Just browsing, thanks.", next: tonyFollowBrowse },
        ],
      };
      const tonyTree: DialogueTree = { id: `tony_${Date.now()}`, npc: "Tony", portrait: "pizza", opener: tonyOpener };
      setRpgDialogue(tonyTree);
      setRpgNode(tonyOpener);
      setRpgHistory([{ speaker: tonyOpener.speaker, portrait: tonyOpener.portrait, text: tonyOpener.text }]);
      setActiveDialogueTarget("pizza_clerk");
      setOverlay("rpg_dialogue");
    } else if (type === "laundro_clerk") {
      // Earl — Laundromat clerk, laid-back and philosophical
      const earlFollowWork: DialogueNode = {
        speaker: "Earl",
        portrait: "laundro",
        text: "Going on twelve years now. Started as a summer gig — never left. There's something about the rhythm of this place. Washers humming, dryers spinning... it's peaceful, you know?",
      };
      const earlFollowStories: DialogueNode = {
        speaker: "Earl",
        portrait: "laundro",
        text: "Oh, I've seen it all. A kid once tried to ride the spin cycle. Somebody left a whole birthday cake in a dryer. Friday nights though — that's when the real characters show up. Everyone's got somewhere to be, but they stop here first.",
      };
      const earlFollowNice: DialogueNode = {
        speaker: "Earl",
        portrait: "laundro",
        text: "Appreciate that. It's not much, but it's honest. People come in stressed, leave a little lighter. That's the whole trick — just give folks a place to breathe for a minute.",
      };
      const earlOpener: DialogueNode = {
        speaker: "Earl",
        portrait: "laundro",
        text: "Hey there. Washer's free if you need one. Otherwise, pull up a chair — nobody's in a rush around here.",
        responses: [
          { text: "How long have you worked here?", next: earlFollowWork },
          { text: "Any good stories?", next: earlFollowStories },
          { text: "Nice place.", next: earlFollowNice },
        ],
      };
      const earlTree: DialogueTree = { id: `earl_${Date.now()}`, npc: "Earl", portrait: "laundro", opener: earlOpener };
      setRpgDialogue(earlTree);
      setRpgNode(earlOpener);
      setRpgHistory([{ speaker: earlOpener.speaker, portrait: earlOpener.portrait, text: earlOpener.text }]);
      setActiveDialogueTarget("laundro_clerk");
      setOverlay("rpg_dialogue");
    } else if (type === "return_slot") {
      // Complete "return_run" side quest objective if active
      const activeSide = getActiveSideQuests();
      let handledQuest = false;
      for (const q of activeSide) {
        for (const obj of q.objectives) {
          if (obj.type === "visit_section" && obj.target === "RETURN_SLOT") {
            const allDone = completeObjective(q.id, obj.id);
            showQuestNotif("Tape returned!");
            if (allDone) {
              const tierResult = completeQuest(q.id);
              handleTierUp(tierResult);
              triggerXpPopup(q.reward.xp);
              setPropsCount(getPropsCount());
              showQuestNotif(`Side Quest Complete: ${q.title}! +${q.reward.xp} XP`);
              playSFX("challenge_complete");
            }
            handledQuest = true;
          }
        }
      }
      if (!handledQuest) {
        playVinnyLine("The video return slot. Drop your tapes here when you're done!", "Vinny");
      }
      return;
    } else if (type === "challenge") {
      // Open challenge selection overlay
      if (challenge) return; // already running
      setOverlay("challenge_select");
      return;
    } else if (type === "trophy") {
      setOverlay("trophy");
    } else if (type === "shelf") {
      let browseState: ShelfBrowseState = { genre: "horror" };
      if (data) {
        try {
          const parsed = JSON.parse(data) as ShelfBrowseState;
          browseState = {
            genre: parsed.genre || "horror",
            shelfId: parsed.shelfId,
            count: parsed.count,
            label: parsed.label,
          };
        } catch {
          browseState = { genre: data };
        }
      }
      setShelfBrowse(browseState);
      setOverlay("shelf");
      // Track genre visit for quest objectives
      trackQuestGenreVisit(browseState.genre);
    } else if (type === "tv") {
      startPuzzle();
    }
  }, [overlay, heldMovies, challenge, mysteryClue, trackQuestMoviePickup, trackQuestNpcTalk, trackQuestGenreVisit]);

  // startChallenge is now provided by useChallenge hook

  // startMystery is now provided by useChallenge hook

  // ── Quiz answer ────────────────────────────────────────
  const handleQuizAnswer = useCallback((idx: number, correct: number, id: string) => {
    setQuizAnswer(idx);
    markSeen(id);
    if (idx === correct) addCorrectAnswer(); else addWrongAnswer();
  }, []);

  // Rent a movie from the film detail modal (back-of-box view)
  const handleRentMovie = useCallback((movie: { id: number; title: string; posterUrl: string; genre: string }) => {
    if (heldMovies.length >= 5) {
      addNotification("Your stack is full. Put one back before grabbing another.");
      setOverlay("checkout");
      return;
    }
    const slotKey = pendingPickup?.id === movie.id ? pendingPickup.slotKey : undefined;
    // Add to held stack (no duplicates, max 5 movies)
    setHeldMovies(prev => {
      if (prev.some(m => m.id === movie.id)) return prev;
      return [...prev, { id: movie.id, title: movie.title, posterUrl: movie.posterUrl, genre: movie.genre, slotKey }];
    });
    if (slotKey) {
      setRecentReturns((prev) => prev.filter((entry) => entry.slotKey !== slotKey));
    }
    setPendingPickup(null);
    setPickupFlash(true);
    setPickupTitle(movie.title);
    setTimeout(() => setPickupFlash(false), 800);
    setTimeout(() => setPickupTitle(null), 1500);
    playSFX("vhs_pickup");
    trackQuestMoviePickup(movie.title, movie.genre);
    if (Math.random() < 0.3) playRandomLine("pickup");
    // Close modal and resume
    setOverlay("none");
    setFilmId(null);
    resumePointerLock();
  }, [addNotification, heldMovies.length, pendingPickup, resumePointerLock, trackQuestMoviePickup]);

  const nextTier = currentTier === MEMBERSHIP_TIERS[MEMBERSHIP_TIERS.length - 1]
    ? null
    : MEMBERSHIP_TIERS[MEMBERSHIP_TIERS.indexOf(currentTier) + 1] ?? null;
  const tierProgress = nextTier
    ? ((totalXP - currentTier.minXP) / (nextTier.minXP - currentTier.minXP)) * 100
    : 100;
  const heldStackLabel = `${heldMovies.length}/5 tapes`;
  const heldViewOffsets = [
    { x: 0, y: 0, rotation: 8 },
    { x: 26, y: 12, rotation: 13 },
    { x: 50, y: 24, rotation: 17 },
    { x: 72, y: 38, rotation: 20 },
    { x: 90, y: 52, rotation: 24 },
  ];

  // Q or Backspace to close overlays (ESC exits pointer lock, so don't use it)
  // Number keys 1-4 to select RPG dialogue responses
  useEffect(() => {
    if (overlay === "none") return;
    const handler = (e: KeyboardEvent) => {
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
  }, [overlay]);

  // (Screenshot feature removed)

  // J to open quest log
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if ((e.key === "j" || e.key === "J") && overlay === "none") {
        document.exitPointerLock();
        setOverlay("quest_log");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay]);

  // ── Splash ─────────────────────────────────────────────
  if (!started) {
    return (
      <div className="g3-splash" style={{ backgroundImage: 'url(/images/fnv-splash.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="g3-splash-content" style={{ background: 'rgba(10, 14, 24, 0.7)', padding: isMobile ? '24px 20px' : '40px 48px', borderRadius: 16, backdropFilter: 'blur(8px)' }}>
          <h1 className="g3-splash-title" style={{ fontSize: isMobile ? '2rem' : '3.2rem' }}>FRIDAY NIGHT<br/>VIDEO</h1>
          <p className="g3-splash-tagline" style={{ marginBottom: 20 }}>It&apos;s Friday night. Pick a movie.</p>
          <button className="g3-splash-btn" onClick={() => {
            setStarted(true); setLoading(true);
            unlockAudio();
            if (/Mobi|Android/i.test(navigator.userAgent)) {
              try {
                const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
                if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); }
                else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
              } catch {}
            }
          }}>PLAY FREE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="g3-container">
      {/* 3D Canvas */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={() => { if (isMobile && hoverLabel && !hasOverlay) { mobileInput.interact = true; } }}>
      <Canvas
        shadows={false}
        gl={{ antialias: !isMobile, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true }}
        camera={{ fov: 70, near: 0.1, far: 50 }}
        dpr={isMobile ? 1 : [1, 2]}
        performance={{ min: 0.5 }}
        style={{ background: "#1a2a48", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        onCreated={({ gl }) => { gl.setClearColor("#1a2a48"); setTimeout(() => setLoading(false), 500); }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#0a0e18", 25, 50]} />
          <Store
            isMobile={isMobile}
            eraYears={selectedEra.years}
            heldMovieIds={heldMovies.map((movie) => movie.id)}
            heldMovieSlotKeys={[
              ...spawnedMissingSlotKeys,
              ...heldMovies.flatMap((movie) => movie.slotKey ? [movie.slotKey] : []),
            ]}
            recentReturnMovies={recentReturns}
            maxNpcs={maxNpcs}
            topDown={topDown}
          />
          <FirstPersonControls disabled={hasOverlay || topDown} />
          {topDown && <TopDownCamera />}
          {!hasOverlay && !topDown && <InteractionSystem onInteract={handleInteract} onHover={handleHover} />}
          <SecurityCameras />
          <PostEffects mobile={isMobile} />
        </Suspense>
      </Canvas>
      </div>

      {/* Loading overlay */}
      <div className={`g3-loading-overlay${!loading ? " g3-loaded" : ""}`}>
        <div className="g3-logo">
          <div className="g3-logo-ticket">
            <div className="g3-logo-left" />
            <div className="g3-logo-right" />
          </div>
        </div>
        <h1 style={{ fontSize: "0.8rem", fontWeight: 400, color: "#ffd700", letterSpacing: "0.1em", fontFamily: "var(--font-pixel, monospace)", textShadow: "2px 2px 0 #000" }}>FRIDAY NIGHT VIDEO</h1>
        <p className="g3-loading-text">Opening the store...</p>
      </div>

      {/* Crosshair */}
      {/* Era selector — shows after loading, before gameplay */}
      {!loading && !eraChosen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
            <h2 style={{ color: '#ffd700', fontFamily: 'var(--font-pixel, monospace)', fontSize: '0.8rem', marginBottom: 12, letterSpacing: '0.1em', textShadow: '2px 2px 0 #000' }}>CHOOSE YOUR ERA</h2>
            <p style={{ color: '#888', fontSize: '0.45rem', marginBottom: 20, fontFamily: 'var(--font-pixel, monospace)' }}>What year is it tonight?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ERA_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => { setEra(opt.id); if (!localStorage.getItem('fnv_has_visited')) { setShowTutorial(true); } else { const xp = getTotalXP(); const tier = getMembershipTier(); addNotification(`WELCOME BACK — ${tier.name} Member | ${xp} XP`); } setEraChosen(true); }}
                  style={{
                    padding: '12px 16px', fontSize: '0.5rem', fontFamily: 'var(--font-pixel, monospace)',
                    border: '3px solid #ffd700', background: 'transparent', color: '#ffd700',
                    borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.6)', transition: 'all 0.1s steps(2)',
                  }}>
                  <strong>{opt.label}</strong> <span style={{ opacity: 0.5, fontSize: '0.4rem' }}>({opt.years})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding tutorial — first visit only */}
      {showTutorial && (
        <div className="g3-tutorial-overlay">
          <div className="g3-tutorial-box">
            <h2 className="g3-tutorial-title">WELCOME TO FRIDAY NIGHT VIDEO</h2>
            <ul className="g3-tutorial-tips">
              <li>Walk into the store and browse the shelves</li>
              <li>Pick up movies and bring them to Vinny at the counter</li>
              <li>Talk to customers &mdash; they might need your help</li>
              <li>Have fun &mdash; it&apos;s Friday night!</li>
            </ul>
            <button className="g3-tutorial-btn" onClick={() => { localStorage.setItem('fnv_has_visited', '1'); setShowTutorial(false); }}>
              GOT IT
            </button>
          </div>
        </div>
      )}

      {!hasOverlay && !topDown && <div className={`g3-crosshair ${hoverLabel ? 'g3-crosshair-active' : ''}`} />}

      {/* Top-down view indicator + exit button */}
      {topDown && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          background: 'rgba(10, 14, 24, 0.9)', border: '1px solid #ffd700', borderRadius: 8,
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
          fontFamily: "'Courier New', monospace", color: '#ffd700', fontSize: '0.85rem',
        }}>
          <span>TOP-DOWN VIEW</span>
          <button onClick={() => setTopDown(false)} style={{
            background: '#ffd700', color: '#0a0e18', border: 'none', borderRadius: 4,
            padding: '4px 12px', fontFamily: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem',
          }}>
            {isMobile ? 'EXIT' : 'T to exit'}
          </button>
        </div>
      )}

      {/* Top-down toggle button (always visible when no overlay) */}
      {/* Hover label near crosshair */}
      {!hasOverlay && hoverLabel && (
        <div className="g3-hover-label">{isMobile ? <span className="g3-hover-tap">TAP</span> : <span className="g3-hover-key">E</span>} {hoverLabel?.replace(/^\[E\] /, '').replace(/^\[F\] /, '')}</div>
      )}

      {/* Subtitle display — Vinny's voice lines */}
      {subtitle && (
        <div className="g3-subtitle">{subtitle}</div>
      )}

      {/* Pickup flash + title toast */}
      {pickupFlash && <div className="g3-pickup-flash" />}
      {pickupTitle && (
        <div className="g3-pickup-toast">
          <span className="g3-pickup-toast-icon">📼</span> {pickupTitle}
        </div>
      )}

      {/* Movie Night Challenge — shopping list HUD */}
      {challenge && !hasOverlay && (
        <div className="g3-challenge-list">
          <div className="g3-challenge-header">MOVIE NIGHT LIST</div>
          {challenge.movies.map((cm, i) => {
            const found = heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase());
            const hintShown = challenge.hintsUsed.has(i);
            return (
              <div key={i} className={`g3-challenge-item ${found ? "g3-challenge-found" : ""}`}>
                <span>{found ? "✓" : "○"} {cm.title}</span>
                {!found && hintShown && (
                  <span className="g3-challenge-hint">Look in: {cm.genre}</span>
                )}
                {!found && !hintShown && (
                  <button className="g3-challenge-hint-btn" onClick={() => {
                    setChallenge(prev => {
                      if (!prev) return prev;
                      const hints = new Set(prev.hintsUsed);
                      hints.add(i);
                      return { ...prev, hintsUsed: hints };
                    });
                  }}>?</button>
                )}
              </div>
            );
          })}
          <div className="g3-challenge-timer" style={challenge.timeLimit && challengeTimer > (challenge.timeLimit - 15) ? { color: "#ef4444" } : undefined}>
            {challenge.timeLimit ? `${Math.max(0, challenge.timeLimit - challengeTimer)}s left` : `${challengeTimer}s`}
          </div>
        </div>
      )}

      {/* Vinny's Mystery HUD */}
      {mysteryClue && !hasOverlay && (
        <div className="g3-challenge-list">
          <div className="g3-challenge-header">VINNY&apos;S MYSTERY</div>
          <div className="g3-mystery-clue">&ldquo;{mysteryClue.clue}&rdquo;</div>
          {mysteryClue.hints.slice(0, mysteryHintsUsed).map((hint, i) => (
            <div key={i} className="g3-challenge-hint">{hint}</div>
          ))}
          {mysteryHintsUsed < mysteryClue.hints.length && (
            <button className="g3-challenge-hint-btn" style={{ marginTop: 6, width: "auto", borderRadius: 4, padding: "3px 10px" }} onClick={() => setMysteryHintsUsed(h => h + 1)}>
              ? Hint ({mysteryHintsUsed}/{mysteryClue.hints.length})
            </button>
          )}
          {mysteryWrongMsg && (
            <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 8, fontWeight: 600 }}>{mysteryWrongMsg}</div>
          )}
        </div>
      )}

      {/* Challenge complete overlay */}
      {challengeComplete !== null && (
        <div className="g3-challenge-complete" onClick={() => setChallengeComplete(null)}>
          <div className="g3-challenge-complete-card">
            <div className="g3-challenge-complete-icon">{challengeComplete === -1 ? "⏰" : challengeComplete === 0 ? "🔍" : "🎬"}</div>
            <div className="g3-challenge-complete-title">{challengeComplete === -1 ? "TIME'S UP!" : challengeComplete === 0 ? "MYSTERY SOLVED!" : "MOVIE NIGHT READY!"}</div>
            <div className="g3-challenge-complete-time">{challengeComplete === -1 ? "Better luck next time!" : challengeComplete === 0 ? "Vinny's impressed — you nailed it!" : `Found all movies in ${challengeComplete}s`}</div>
            <button className="g3-splash-btn" onClick={() => setChallengeComplete(null)} style={{ marginTop: 12, padding: "12px 24px", fontSize: "0.9rem" }}>
              {challengeComplete === -1 ? "TRY AGAIN" : "NICE!"}
            </button>
          </div>
        </div>
      )}

      {/* Challenge Selection Overlay */}
      {overlay === "challenge_select" && (() => {
        const gs = loadGameState();
        const movieNightCount = gs.challengeCompletions["movie_night"] || 0;
        const speedRunUnlocked = movieNightCount >= 3;
        const vinnyPickUnlocked = movieNightCount >= 5;
        return (
          <div className="g3-overlay g3-overlay-center">
            <div className="g3-overlay-header">
              <span className="g3-overlay-title">CHOOSE YOUR CHALLENGE</span>
              <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
            </div>
            <div className="g3-overlay-body g3-challenge-select">
              {/* Movie Night — always unlocked */}
              <button className="g3-challenge-option" onClick={() => { startChallenge("movie_night"); setOverlay("none"); }}>
                <div className="g3-challenge-option-name">Movie Night</div>
                <div className="g3-challenge-option-desc">Find 3 movies from the shelves</div>
                <div className="g3-challenge-option-stats">Completed {movieNightCount} time{movieNightCount !== 1 ? "s" : ""}</div>
              </button>

              {/* Speed Run — unlocks after 3 Movie Night completions */}
              <button
                className={`g3-challenge-option ${!speedRunUnlocked ? "g3-challenge-option-locked" : ""}`}
                onClick={() => { if (speedRunUnlocked) { startChallenge("speed_run"); setOverlay("none"); } }}
                disabled={!speedRunUnlocked}
              >
                <div className="g3-challenge-option-name">Speed Run</div>
                <div className="g3-challenge-option-desc">Find 3 movies in under 60 seconds!</div>
                {speedRunUnlocked ? (
                  <div className="g3-challenge-option-stats">Completed {gs.challengeCompletions["speed_run"] || 0} time{(gs.challengeCompletions["speed_run"] || 0) !== 1 ? "s" : ""}</div>
                ) : (
                  <div className="g3-challenge-option-lock">Complete 3 Movie Nights to unlock</div>
                )}
              </button>

              {/* Vinny's Mystery — unlocks after 5 Movie Night completions */}
              <button
                className={`g3-challenge-option ${!vinnyPickUnlocked ? "g3-challenge-option-locked" : ""}`}
                onClick={() => { if (vinnyPickUnlocked) { startMystery(); setOverlay("none"); } }}
                disabled={!vinnyPickUnlocked}
              >
                <div className="g3-challenge-option-name">Vinny&apos;s Mystery</div>
                <div className="g3-challenge-option-desc">Vinny gives you a cryptic clue — find the movie on the shelves!</div>
                {vinnyPickUnlocked ? (
                  <div className="g3-challenge-option-stats">Completed {gs.challengeCompletions["vinnys_mystery"] || 0} time{(gs.challengeCompletions["vinnys_mystery"] || 0) !== 1 ? "s" : ""}</div>
                ) : (
                  <div className="g3-challenge-option-lock">Complete 5 Movie Nights to unlock</div>
                )}
              </button>

            </div>
          </div>
        );
      })()}

      {/* Trophy Collection Overlay */}
      {overlay === "trophy" && (
        <div className="g3-overlay g3-overlay-center">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">YOUR COLLECTION</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body g3-trophy-grid">
            {PROPS.map((prop) => {
              const owned = hasProp(prop.id);
              return (
                <div key={prop.id} className={`g3-trophy-item ${owned ? "g3-trophy-owned" : "g3-trophy-locked"}`}>
                  <div className="g3-trophy-emoji">{owned ? prop.emoji : "❓"}</div>
                  <div className="g3-trophy-name">{owned ? prop.name : "???"}</div>
                  <div className="g3-trophy-movie">{owned ? `From: ${prop.movie}` : "Keep playing to unlock"}</div>
                  <div className={`g3-trophy-rarity g3-trophy-rarity-${prop.rarity}`}>{prop.rarity}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward prop unlock overlay */}
      {rewardProp && (
        <RewardOverlay prop={rewardProp} onDismiss={() => setRewardProp(null)} />
      )}

      {!hasOverlay && !topDown && heldMovies.length > 0 && (
        <div className="g3-held-viewmodel" aria-hidden="true">
          {[...heldMovies].slice(-5).reverse().map((movie, index) => (
            <div
              key={`held-vhs-${movie.slotKey ?? movie.id}-${index}`}
              className="g3-held-vhs"
              style={{
                transform: `translate(${heldViewOffsets[index]?.x ?? 0}px, ${heldViewOffsets[index]?.y ?? 0}px) rotate(${heldViewOffsets[index]?.rotation ?? 8}deg)`,
                zIndex: 20 - index,
              }}
            >
              {movie.posterUrl ? (
                <img
                  src={getHudPosterSrc(movie.posterUrl)}
                  alt=""
                  className="g3-held-vhs-poster"
                />
              ) : (
                <div className="g3-held-vhs-fallback">{movie.title}</div>
              )}
              <div className="g3-held-vhs-spine" />
            </div>
          ))}
          {heldMovies.length > 5 && (
            <div className="g3-held-vhs-count">+{heldMovies.length - 5}</div>
          )}
        </div>
      )}

      {/* Mobile touch controls */}
      {!hasOverlay && <MobileControls hoverLabel={hoverLabel} />}

      {/* Mobile quest log button */}
      {isMobile && !hasOverlay && (
        <button
          className="g3-mobile-quest-btn"
          onClick={() => { document.exitPointerLock(); setOverlay("quest_log"); }}
          aria-label="Quest Log"
        >
          📜
        </button>
      )}

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

      {/* ── OVERLAYS ────────────────────────────────────────── */}

      {/* Talk to Vinny (AI Chat) */}
      {overlay === "dialogue" && (
        <div className="g3-overlay">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">VINNY</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <DialogueBox onClose={closeOverlay} />
          </div>
        </div>
      )}

      {/* Shelf Browser */}
      {overlay === "shelf" && (
        <ShelfBrowser
          genre={shelfBrowse?.genre || ""}
          shelfId={shelfBrowse?.shelfId}
          shelfCount={shelfBrowse?.count}
          label={shelfBrowse?.label}
          eraId={era as EraId}
          open
          onClose={closeOverlay}
          onFilmClick={(id) => { setPendingPickup(null); setFilmId(id); setOverlay("film_detail"); }}
        />
      )}

      {/* Film Detail (VHS back-of-box) */}
      {overlay === "film_detail" && (
        <FilmDetailModal filmId={filmId} onClose={closeOverlay} onSelectFilm={(id) => setFilmId(id)} onRent={handleRentMovie} />
      )}

      {/* Vinny's Five (Puzzle) */}
      {overlay === "pick" && puzzle && (
        <PuzzleOverlay
          puzzle={puzzle} puzzleClue={puzzleClue} puzzleGuess={puzzleGuess}
          puzzleResults={puzzleResults} puzzleWon={puzzleWon}
          puzzleBackdropReady={puzzleBackdropReady} puzzleBlur={puzzleBlur}
          inputRef={inputRef}
          startPuzzle={startPuzzle} handlePuzzleSearch={handlePuzzleSearch}
          submitPuzzleGuess={submitPuzzleGuess} skipPuzzleClue={skipPuzzleClue}
          closeOverlay={closeOverlay}
        />
      )}

      {/* Quote */}
      {overlay === "quote" && quote && (
        <div className="g3-overlay g3-overlay-center">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">NAME THAT QUOTE</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <div className="fnv-quote-display">&ldquo;{quote.quote}&rdquo;</div>
            <div className="fnv-options">
              {quote.options.map((opt, i) => (
                <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === quote.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                  onClick={() => quizAnswer === null && handleQuizAnswer(i, quote.correctIndex, quote.id)} disabled={quizAnswer !== null}>
                  <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <>
                <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                  <div className="fnv-vinny-avatar">V</div>
                  <div className="fnv-vinny-text"><p>{quizAnswer === quote.correctIndex ? quote.vinnyRight : quote.vinnyWrong}</p></div>
                </div>
                <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setQuote(pickRandom(QUOTES, q => q.id)); setQuizAnswer(null); }}>Next Quote</button>
                <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Synopsis */}
      {overlay === "synopsis" && synopsis && (
        <div className="g3-overlay g3-overlay-center">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">BACK OF THE BOX</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body">
            <div className="fnv-synopsis-display"><div className="fnv-synopsis-label">📼 TURN THE BOX OVER...</div><p>{synopsis.synopsis}</p></div>
            <div className="fnv-options">
              {synopsis.options.map((opt, i) => (
                <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === synopsis.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                  onClick={() => quizAnswer === null && handleQuizAnswer(i, synopsis.correctIndex, synopsis.id)} disabled={quizAnswer !== null}>
                  <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <>
                <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                  <div className="fnv-vinny-avatar">V</div>
                  <div className="fnv-vinny-text"><p>{quizAnswer === synopsis.correctIndex ? synopsis.vinnyRight : synopsis.vinnyWrong}</p></div>
                </div>
                <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setSynopsis(pickRandom(SYNOPSES, s => s.id)); setQuizAnswer(null); }}>Next Box</button>
                <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Quest notification toast — stacked */}
      <div className="g3-quest-notif-stack" style={{ position: 'fixed', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 9999, pointerEvents: 'none' }}>
        {notifications.map((n) => (
          <div key={n.id} className="g3-quest-notif" style={{ position: 'relative', animation: 'g3-notif-in 0.3s ease-out' }}>{n.text}</div>
        ))}
      </div>

      {/* Checkout Overlay */}
      {/* NPC Freeform Chat */}
      {overlay === "npc_chat" && npcChatTarget && (
        <NpcChatOverlay
          npcChatTarget={npcChatTarget}
          npcChatMessages={npcChatMessages}
          npcChatInput={npcChatInput}
          npcChatLoading={npcChatLoading}
          setNpcChatInput={setNpcChatInput}
          handleNpcChatSend={handleNpcChatSend}
          closeOverlay={closeOverlay}
        />
      )}

      {overlay === "checkout" && (
        <CheckoutOverlay
          heldMovies={heldMovies}
          heldSnacks={heldSnacks}
          removeHeldMovie={removeHeldMovie}
          setHeldMovies={setHeldMovies}
          setHeldSnacks={setHeldSnacks}
          setOverlay={setOverlay}
        />
      )}

      {/* Quest Log Overlay */}
      {overlay === "quest_log" && (
        <QuestLogOverlay closeOverlay={closeOverlay} showQuestNotif={showQuestNotif} />
      )}

      {/* RPG-style NPC Dialogue — classic bottom text box */}
      {overlay === "rpg_dialogue" && rpgNode && (
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
      )}
    </div>
  );
}
