"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { FilmDetailModal } from "@/components/FilmDetailModal";
import { RewardOverlay } from "@/components/game/RewardOverlay";
import { CheckoutOverlay } from "@/components/game/overlays/CheckoutOverlay";
import { QuestLogOverlay } from "@/components/game/overlays/QuestLogOverlay";
import { PuzzleOverlay } from "@/components/game/overlays/PuzzleOverlay";
import { NpcChatOverlay } from "@/components/game/overlays/NpcChatOverlay";
import { ChallengeSelectOverlay } from "@/components/game/overlays/ChallengeSelectOverlay";
import { TrophyOverlay } from "@/components/game/overlays/TrophyOverlay";
import { QuizOverlay } from "@/components/game/overlays/QuizOverlay";
import { ShelfOverlay, type ShelfBrowseState } from "@/components/game/overlays/ShelfOverlay";
import { RpgDialogueOverlay } from "@/components/game/overlays/RpgDialogueOverlay";
import { DialogueBox } from "@/components/game3d/DialogueOverlay";
import { EraSelectorOverlay } from "@/components/game/overlays/EraSelectorOverlay";
import { TutorialOverlay } from "@/components/game/overlays/TutorialOverlay";
import { DialogueOverlay as VinnyDialogueOverlay } from "@/components/game/overlays/DialogueOverlay";
import { SplashScreen } from "@/components/game/SplashScreen";
import { TopDownIndicator } from "@/components/game/TopDownIndicator";
import { LoadingOverlay } from "@/components/game/LoadingOverlay";
import { NotificationStack } from "@/components/game/NotificationStack";
import { GameHUD } from "@/components/game/GameHUD";
import { ChallengeHUD } from "@/components/game/ChallengeHUD";
import { HeldVHSStack } from "@/components/game/HeldVHSStack";
import {
  QUOTES, SYNOPSES,
  getSeen, markSeen, addCorrectAnswer, addWrongAnswer,
  type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { SecurityCameras } from "@/components/game3d/SecurityCameras";
import { loadGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, completeObjective, completeQuest, getActiveSideQuests, MEMBERSHIP_TIERS, getTotalXP, getMembershipTier, getNpcRelationship, incrementNpcRelationship } from "@/lib/game-state";
import { playRandomLine, playVinnyLine, playSFX, setSubtitleHandler, unlockAudio, setCurrentEra } from "@/lib/audio";
import { getRandomDialogue, getVinnyTierGreeting, generateTriviaDialogue, getRelationshipGreeting, type DialogueTree, type DialogueNode } from "@/lib/npc-dialogues";
import { PERSONALITIES, getRandomPersonality, type PersonalityType } from "@/lib/npc-personalities";
import { buildCustomerDialogue } from "@/lib/npc-customer-dialogues";
import { buildTonyDialogue, buildEarlDialogue } from "@/lib/npc-strip-mall-dialogues";
import { mobileInput } from "@/components/game3d/MobileControls";
import { setActiveDialogueTarget } from "@/components/game3d/store-characters";
import { isNpcHostile } from "@/lib/sentiment";
import { useGameClock, type ClosingAnnouncement } from "@/hooks/useGameClock";
import { useAudioUI } from "@/hooks/useAudioUI";
import { useInventory } from "@/hooks/useInventory";
import { useChallenge } from "@/hooks/useChallenge";
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
const Apartment = dynamic(() => import("@/components/game3d/Apartment").then(m => ({ default: m.Apartment })), { ssr: false });
const DebugOverlay = dynamic(() => import("@/components/game3d/DebugOverlay").then(m => ({ default: m.DebugOverlay })), { ssr: false });

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function GamePage() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [era, setEra] = useState<string>("early90s");
  const [eraChosen, setEraChosen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [retroMode, setRetroMode] = useState(false);

  // Load retro mode preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fnv_retro_mode");
      if (saved === "true") setRetroMode(true);
    } catch {}
  }, []);

  const toggleRetroMode = useCallback(() => {
    setRetroMode(prev => {
      const next = !prev;
      try { localStorage.setItem("fnv_retro_mode", String(next)); } catch {}
      return next;
    });
  }, []);

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
  const [inApartment, setInApartment] = useState(false);
  const [sceneTransition, setSceneTransition] = useState<string | null>(null);
  const [topDown, setTopDown] = useState(false);
  const [shelfBrowse, setShelfBrowse] = useState<ShelfBrowseState | null>(null);
  const [filmId, setFilmId] = useState<number | null>(null);

  // Quote/Synopsis state
  const [quote, setQuote] = useState<QuoteChallenge | null>(null);
  const [synopsis, setSynopsis] = useState<SynopsisChallenge | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

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
  const { audioMuted, subtitle, toggleMute } = useAudioUI();

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

  // ── Scene transitions (store <-> apartment) ──────────────
  const handleLeaveStore = useCallback(() => {
    setSceneTransition("HEADING HOME...");
    setTimeout(() => {
      setInApartment(true);
      setSceneTransition(null);
    }, 1500);
  }, []);

  const handleLeaveApartment = useCallback(() => {
    setSceneTransition("HEADING TO THE STORE...");
    setTimeout(() => {
      setInApartment(false);
      setSceneTransition(null);
    }, 1500);
  }, []);

  // Side quest state (uses existing showQuestNotif for notifications)

  // Game clock (extracted to useGameClock hook)
  const { gameTime, closeCountdownLabel, maxNpcs } = useGameClock({
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
    npcChatMessages,
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

  // C key screenshot (no HUD indicator — hidden power-user feature)
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
    return <SplashScreen isMobile={isMobile} onStart={() => { setStarted(true); setLoading(true); }} />;
  }

  return (
    <div className="g3-container">
      {/* Scene transition overlay */}
      {sceneTransition && (
        <div className="g3-scene-transition">
          <span className="g3-scene-transition-text">{sceneTransition}</span>
        </div>
      )}

      {/* Apartment scene */}
      {inApartment && !sceneTransition && (
        <>
          <Canvas
            shadows={false}
            gl={{ antialias: !isMobile, failIfMajorPerformanceCaveat: false }}
            camera={{ fov: 70, near: 0.1, far: 50, position: [0, 1.6, 2] }}
            dpr={isMobile ? 1 : [1, 2]}
            style={{ background: "#1a1a2e", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          >
            <Suspense fallback={null}>
              <Apartment />
            </Suspense>
          </Canvas>
          <div className="g3-apartment-overlay">
            <button className="g3-apartment-leave-btn" onClick={handleLeaveApartment}>
              BACK TO THE STORE
            </button>
          </div>
        </>
      )}

      {/* 3D Store Canvas + HUD (hidden when in apartment) */}
      {!inApartment && <>
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
          <fogExp2 attach="fog" args={["#0a0e18", 0.02]} />
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
          <PostEffects mobile={isMobile} retroMode={retroMode} />
          <DebugOverlay />
        </Suspense>
      </Canvas>
      </div>

      <LoadingOverlay loading={loading} />

      {/* Era selector — shows after loading, before gameplay */}
      {!loading && !eraChosen && (
        <EraSelectorOverlay
          eraOptions={ERA_OPTIONS}
          onSelectEra={(id) => { setEra(id); setEraChosen(true); }}
          addNotification={addNotification}
          setShowTutorial={setShowTutorial}
        />
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

      <ChallengeHUD
        hasOverlay={hasOverlay} challenge={challenge} challengeTimer={challengeTimer}
        heldMovies={heldMovies} setChallenge={setChallenge}
        mysteryClue={mysteryClue} mysteryHintsUsed={mysteryHintsUsed}
        setMysteryHintsUsed={setMysteryHintsUsed} mysteryWrongMsg={mysteryWrongMsg}
        challengeComplete={challengeComplete} setChallengeComplete={setChallengeComplete}
      />

      {/* Challenge Selection Overlay */}
      {overlay === "challenge_select" && (
        <ChallengeSelectOverlay
          startChallenge={startChallenge}
          startMystery={startMystery}
          setOverlay={setOverlay}
          closeOverlay={closeOverlay}
        />
      )}

      {/* Trophy Collection Overlay */}
      {overlay === "trophy" && (
        <TrophyOverlay closeOverlay={closeOverlay} />
      )}

      {/* Reward prop unlock overlay */}
      {rewardProp && (
        <RewardOverlay prop={rewardProp} onDismiss={() => setRewardProp(null)} />
      )}

      {!hasOverlay && !topDown && heldMovies.length > 0 && (
        <HeldVHSStack heldMovies={heldMovies} />
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

      <GameHUD
        hasOverlay={hasOverlay} topDown={topDown} isMobile={isMobile}
        gameTime={gameTime} closeCountdownLabel={closeCountdownLabel} heldStackLabel={heldStackLabel}
        totalXP={totalXP} currentTier={currentTier} tierProgress={tierProgress} nextTier={nextTier}
        audioMuted={audioMuted} toggleMute={toggleMute} setTopDown={setTopDown}
        heldMovies={heldMovies} challenge={challenge} challengeTimer={challengeTimer}
        setOverlay={setOverlay} overlay={overlay}
        xpPopup={xpPopup} tierUpNotification={tierUpNotification}
        retroMode={retroMode} toggleRetroMode={toggleRetroMode}
      />

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
        <ShelfOverlay
          shelfBrowse={shelfBrowse}
          era={era}
          closeOverlay={closeOverlay}
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
        <QuizOverlay mode="quote" quote={quote} synopsis={null} quizAnswer={quizAnswer}
          setQuote={setQuote} setSynopsis={setSynopsis} setQuizAnswer={setQuizAnswer}
          handleQuizAnswer={handleQuizAnswer} closeOverlay={closeOverlay} />
      )}

      {/* Synopsis */}
      {overlay === "synopsis" && synopsis && (
        <QuizOverlay mode="synopsis" quote={null} synopsis={synopsis} quizAnswer={quizAnswer}
          setQuote={setQuote} setSynopsis={setSynopsis} setQuizAnswer={setQuizAnswer}
          handleQuizAnswer={handleQuizAnswer} closeOverlay={closeOverlay} />
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
          onLeaveStore={handleLeaveStore}
        />
      )}

      {/* Quest Log Overlay */}
      {overlay === "quest_log" && (
        <QuestLogOverlay closeOverlay={closeOverlay} showQuestNotif={showQuestNotif} />
      )}

      {/* RPG-style NPC Dialogue — classic bottom text box */}
      {overlay === "rpg_dialogue" && rpgNode && (
        <RpgDialogueOverlay
          rpgDialogue={rpgDialogue} rpgNode={rpgNode}
          displayedText={displayedText} typewriterDone={typewriterDone}
          handleDialogueResponse={handleDialogueResponse as never} closeOverlay={closeOverlay}
        />
      )}
      </>}
    </div>
  );
}
