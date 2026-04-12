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
import { EraSelectorOverlay } from "@/components/game/overlays/EraSelectorOverlay";
import { TutorialOverlay } from "@/components/game/overlays/TutorialOverlay";
import { DialogueOverlay as VinnyDialogueOverlay } from "@/components/game/overlays/DialogueOverlay";
import { SceneTransitionOverlay } from "@/components/game/SceneTransitionOverlay";
import { SplashScreen } from "@/components/game/SplashScreen";
import { TopDownIndicator } from "@/components/game/TopDownIndicator";
import { LoadingOverlay } from "@/components/game/LoadingOverlay";
import { NotificationStack } from "@/components/game/NotificationStack";
import { GameHUD } from "@/components/game/GameHUD";
import { ChallengeHUD } from "@/components/game/ChallengeHUD";
import { HeldVHSStack } from "@/components/game/HeldVHSStack";
import {
  markSeen, addCorrectAnswer, addWrongAnswer,
  type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { SecurityCameras } from "@/components/game3d/SecurityCameras";
import { MEMBERSHIP_TIERS, incrementNpcRelationship } from "@/lib/game-state";
import { playRandomLine, playVinnyLine, playSFX, unlockAudio, setCurrentEra } from "@/lib/audio";
import { mobileInput } from "@/components/game3d/MobileControls";
import { setActiveDialogueTarget } from "@/components/game3d/store-characters";
import { useGameClock, type ClosingAnnouncement } from "@/hooks/useGameClock";
import { useAudioUI } from "@/hooks/useAudioUI";
import { useInventory } from "@/hooks/useInventory";
import { useChallenge } from "@/hooks/useChallenge";
import { useOverlay, type Overlay } from "@/hooks/useOverlay";
import { useDialogue } from "@/hooks/useDialogue";
import { usePuzzle } from "@/hooks/usePuzzle";
import { useQuestTracking } from "@/hooks/useQuestTracking";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useInteraction } from "@/hooks/useInteraction";
import { Leva } from "leva";
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
// r3f-perf crashes Turbopack dev server (binary woff font). Use custom DebugOverlay instead.
// const Perf = dynamic(() => import("r3f-perf").then(m => ({ default: m.Perf })), { ssr: false });
const OrbitControls = dynamic(() => import("@react-three/drei").then(m => ({ default: m.OrbitControls })), { ssr: false });


export default function GamePage() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [era, setEra] = useState<string>("early90s");
  const [eraChosen, setEraChosen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [retroMode, setRetroMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const reviewCaptureRequested = useRef(false);

  // F12 toggles debug mode (perf monitor, orbit controls, grid, axes, leva)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autostart") === "1") {
      const requestedEra = params.get("era");
      if (requestedEra && ERA_OPTIONS.some((option) => option.id === requestedEra)) {
        setEra(requestedEra);
      }
      setShowTutorial(false);
      setEraChosen(true);
      setStarted(true);
      setLoading(true);
    }
    if (params.get("debug") === "1") {
      setDebugMode(true);
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

  // ── Interaction handler from 3D world (extracted to useInteraction hook) ──
  const handleInteract = useInteraction({
    overlay, heldMovies, challenge, mysteryClue, mysteryHintsUsed,
    currentTier, totalXP, era,
    setHeldSnacks, setPickupFlash, setPickupTitle, setPendingPickup,
    setFilmId, setOverlay, setMysteryHintsUsed, setMysteryClue,
    setMysteryWrongMsg, setHeldMovies, setPropsCount, setChallengeComplete,
    setChallenge, setRewardProp, setQuote, setSynopsis, setQuizAnswer,
    setRpgDialogue, setRpgNode, setRpgHistory, setNpcChatTarget,
    setShelfBrowse,
    trackQuestNpcTalk, trackQuestGenreVisit, trackQuestMoviePickup,
    handleTierUp, triggerXpPopup, showQuestNotif, startPuzzle,
  });

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const captureCam = params.get("captureCam");
    if (!captureCam || reviewCaptureRequested.current || !started || loading || !eraChosen || inApartment) {
      return;
    }

    let cancelled = false;
    reviewCaptureRequested.current = true;

    const tryCapture = async (attempt = 0) => {
      if (cancelled) return;
      const captureFn = (window as Window & { __securityCams?: (cams?: string[]) => Promise<string[]> }).__securityCams;
      if (typeof captureFn === "function") {
        try {
          await captureFn([captureCam]);
        } catch (err) {
          console.error("Review capture failed:", err);
        }
        return;
      }
      if (attempt < 40) {
        window.setTimeout(() => { void tryCapture(attempt + 1); }, 500);
      }
    };

    void tryCapture();

    return () => {
      cancelled = true;
    };
  }, [started, loading, eraChosen, inApartment]);

  // Keyboard shortcuts (Q/Backspace close, 1-4 dialogue, T top-down, C screenshot, J quest log)
  useKeyboardShortcuts({ overlay, closeOverlay, rpgNode, handleDialogueResponse, setTopDown, setOverlay });

  // ── Splash ─────────────────────────────────────────────
  if (!started) {
    return <SplashScreen isMobile={isMobile} onStart={() => { setStarted(true); setLoading(true); }} />;
  }

  return (
    <div className="g3-container">
      {/* Scene transition overlay */}
      {sceneTransition && (
        <SceneTransitionOverlay label={sceneTransition} />
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
          {debugMode ? <OrbitControls /> : <FirstPersonControls disabled={hasOverlay || topDown} />}
          {topDown && !debugMode && <TopDownCamera />}
          {!hasOverlay && !topDown && !debugMode && <InteractionSystem onInteract={handleInteract} onHover={handleHover} />}
          <SecurityCameras />
          <PostEffects mobile={isMobile} retroMode={retroMode} />
          <DebugOverlay />
          {/* r3f-perf disabled — crashes Turbopack. Use DebugOverlay (backtick key) instead */}
          {debugMode && <>
            <axesHelper args={[10]} />
            <gridHelper args={[40, 40, '#444', '#222']} />
          </>}
        </Suspense>
      </Canvas>
      </div>

      <Leva hidden={!debugMode} />

      {/* Debug mode indicator */}
      {debugMode && (
        <div style={{
          position: 'fixed', top: 12, right: 12, zIndex: 9999,
          background: 'rgba(255, 0, 0, 0.85)', color: '#fff',
          padding: '4px 12px', borderRadius: 4,
          fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
          letterSpacing: 2, pointerEvents: 'none',
        }}>
          DEBUG
        </div>
      )}

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
        <TutorialOverlay onDismiss={() => setShowTutorial(false)} />
      )}

      {!hasOverlay && !topDown && <div className={`g3-crosshair ${hoverLabel ? 'g3-crosshair-active' : ''}`} />}

      {/* Top-down view indicator + exit button */}
      {topDown && (
        <TopDownIndicator isMobile={isMobile} onExit={() => setTopDown(false)} />
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
        eraLabel={selectedEra.displayYear}
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
        <VinnyDialogueOverlay closeOverlay={closeOverlay} />
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
      <NotificationStack notifications={notifications} />

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
