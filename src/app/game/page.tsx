"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { DialogueBox } from "@/components/game3d/DialogueOverlay";
import { ShelfBrowser } from "@/components/game/ShelfBrowser";
import { FilmDetailModal } from "@/components/FilmDetailModal";
import { RewardOverlay } from "@/components/game/RewardOverlay";
import {
  SCENARIOS, QUOTES, SYNOPSES,
  getSeen, markSeen, addCorrectAnswer, addWrongAnswer,
  type Scenario, type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { fetchSearch, fetchTrending } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { getShelfMovies } from "@/components/game3d/Store";
import { SecurityCameras } from "@/components/game3d/SecurityCameras";
import { loadGameState, saveGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, hasProp, type MovieProp, getQuestState, startQuest, completeObjective, completeQuest, isQuestComplete, getAvailableQuests, getActiveQuests, getCompletedQuests, getQuestProgress, getActiveSideQuests, isSideQuestActive, isSideQuestDone, MEMBERSHIP_TIERS, getTotalXP, addXP, getMembershipTier, getNpcRelationship, incrementNpcRelationship } from "@/lib/game-state";
import { VINNY_QUESTS, QUEST_DIALOGUE, type Quest, CUSTOMER_SIDE_QUESTS } from "@/lib/quest-system";
import { playRandomLine, playVinnyLine, playSFX, setSubtitleHandler, setMuted, isMuted, setMusicMuted, isMusicMuted, VINNY_LINES, unlockAudio, setCurrentEra, playNpcLine } from "@/lib/audio";
import { type MovieClue, MOVIE_CLUES } from "@/lib/movie-clues";
import { getRandomDialogue, getRandomQuestDialogue, getVinnyTierGreeting, generateTriviaDialogue, getRelationshipGreeting, type DialogueTree, type DialogueNode } from "@/lib/npc-dialogues";
import { PERSONALITIES, getPersonalityGreeting, getRandomPersonality, type PersonalityType } from "@/lib/npc-personalities";
import { buildCustomerDialogue } from "@/lib/npc-customer-dialogues";
import { mobileInput } from "@/components/game3d/MobileControls";
import { analyzeSentiment, getXPDelta, updateNpcRapport, isNpcHostile } from "@/lib/sentiment";
import { getCuratedShelfPosterData, getEraIdFromYears, type EraId } from "@/lib/curated-movie-catalog";
import { STORE_LAYOUT } from "@/lib/store-layout";
import "./game.css";

const MobileControls = dynamic(() => import("@/components/game3d/MobileControls").then(m => ({ default: m.MobileControls })), { ssr: false });
const TopDownCamera = dynamic(() => import("@/components/game3d/TopDownCamera").then(m => ({ default: m.TopDownCamera })), { ssr: false });

const Canvas = dynamic(() => import("@react-three/fiber").then(m => ({ default: m.Canvas })), { ssr: false });
const Store = dynamic(() => import("@/components/game3d/Store").then(m => ({ default: m.Store })), { ssr: false });
const FirstPersonControls = dynamic(() => import("@/components/game3d/FirstPerson").then(m => ({ default: m.FirstPersonControls })), { ssr: false });
const InteractionSystem = dynamic(() => import("@/components/game3d/Interaction").then(m => ({ default: m.InteractionSystem })), { ssr: false });
const PostEffects = dynamic(() => import("@/components/game3d/PostEffects").then(m => ({ default: m.PostEffects })), { ssr: false });

const GENRE_IDS: Record<string, string> = { horror: "27", scifi: "878", comedy: "35", drama: "18", action: "28", classics: "36", family: "10751", new: "trending" };
const STATS_KEY = "vnv_stats";
function loadStats(): Record<string, number> { try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; } }
function saveStats(s: Record<string, number>) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatGameTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

type Overlay = "none" | "dialogue" | "shelf" | "film_detail" | "pick" | "quote" | "synopsis" | "challenge_select" | "trophy" | "rpg_dialogue" | "quest_log" | "checkout" | "npc_chat";

export default function GamePage() {
  type ShelfBrowseState = { genre: string; shelfId?: string; count?: number; label?: string };
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [era, setEra] = useState<string>("early90s");
  const [eraChosen, setEraChosen] = useState(false);
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
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [topDown, setTopDown] = useState(false);
  const [shelfBrowse, setShelfBrowse] = useState<ShelfBrowseState | null>(null);
  const [filmId, setFilmId] = useState<number | null>(null);

  // Vinny's Five state
  const [puzzle, setPuzzle] = useState<{ clues: string[]; movieId: number; backdrop: string | null; poster: string | null; answer: Record<string, unknown> } | null>(null);
  const [puzzleClue, setPuzzleClue] = useState(0);
  const [puzzleGuess, setPuzzleGuess] = useState("");
  const [puzzleResults, setPuzzleResults] = useState<SearchResult[]>([]);
  const [puzzleWon, setPuzzleWon] = useState<boolean | null>(null);
  const [puzzleBackdropReady, setPuzzleBackdropReady] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quote/Synopsis state
  const [quote, setQuote] = useState<QuoteChallenge | null>(null);
  const [synopsis, setSynopsis] = useState<SynopsisChallenge | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [hintText, setHintText] = useState<string | null>(null);

  // VHS pickup inventory (multiple films)
  type HeldMovie = { id: number; title: string; posterUrl: string; genre: string; slotKey?: string };
  const [heldMovies, setHeldMovies] = useState<HeldMovie[]>([]);
  const [pendingPickup, setPendingPickup] = useState<{ id: number; title: string; posterUrl: string; slotKey?: string } | null>(null);
  const [spawnedMissingSlotKeys, setSpawnedMissingSlotKeys] = useState<string[]>([]);
  const [recentReturns, setRecentReturns] = useState<HeldMovie[]>([]);
  // Snack inventory (separate from movies)
  type HeldSnack = { name: string; emoji: string };
  const [heldSnacks, setHeldSnacks] = useState<HeldSnack[]>([]);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [pickupFlash, setPickupFlash] = useState(false);
  const [pickupTitle, setPickupTitle] = useState<string | null>(null);

  // Movie Night Challenge state
  type ChallengeMovie = { title: string; genre: string };
  type ChallengeType = "movie_night" | "speed_run" | "vinnys_mystery";
  const [challenge, setChallenge] = useState<{ movies: ChallengeMovie[]; startTime: number; hintsUsed: Set<number>; type: ChallengeType; timeLimit?: number } | null>(null);
  const [challengeComplete, setChallengeComplete] = useState<number | null>(null); // elapsed seconds
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [propsCount, setPropsCount] = useState({ unlocked: 0, total: 15 });
  const [rewardProp, setRewardProp] = useState<MovieProp | null>(null);

  // Vinny's Mystery state
  const [mysteryClue, setMysteryClue] = useState<MovieClue | null>(null);
  const [mysteryHintsUsed, setMysteryHintsUsed] = useState(0);
  const [mysteryWrongMsg, setMysteryWrongMsg] = useState<string | null>(null);

  // Audio state
  const [audioMuted, setAudioMuted] = useState(false);
  const [musicOff, setMusicOff] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const subtitleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // RPG dialogue state
  const [rpgDialogue, setRpgDialogue] = useState<DialogueTree | null>(null);
  const [rpgNode, setRpgNode] = useState<DialogueNode | null>(null);
  const [rpgHistory, setRpgHistory] = useState<{ speaker: string; portrait?: string; text: string }[]>([]);

  // NPC freeform chat state
  const [npcChatTarget, setNpcChatTarget] = useState<{ name: string; personalityType: string; npcManagerId: string } | null>(null);
  const [npcChatMessages, setNpcChatMessages] = useState<{ role: 'player' | 'npc'; text: string }[]>([]);
  const [npcChatInput, setNpcChatInput] = useState('');
  const [npcChatLoading, setNpcChatLoading] = useState(false);

  // Typewriter effect for RPG dialogue
  const [displayedText, setDisplayedText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);

  const getHudPosterSrc = useCallback((posterUrl: string) => {
    if (!posterUrl) return "";
    return posterUrl.startsWith("https://image.tmdb.org/")
      ? `/api/image-proxy?url=${encodeURIComponent(posterUrl.replace('/w342/', '/w92/'))}`
      : posterUrl;
  }, []);

  useEffect(() => {
    if (!rpgNode) { setDisplayedText(''); setTypewriterDone(false); return; }
    // Show full text immediately — no typewriter delay
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

  // Notification stacking system
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([]);
  const addNotification = useCallback((text: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev.slice(-2), { id, text }]); // max 3
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const resumePointerLock = useCallback(() => {
    if (isMobile || topDown) return;
    requestAnimationFrame(() => {
      const canvas = document.querySelector("canvas");
      if (canvas instanceof HTMLCanvasElement && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    });
  }, [isMobile, topDown]);

  const removeHeldMovie = useCallback((movieId: number) => {
    setHeldMovies((prev) => {
      const removeIndex = prev.findIndex((movie) => movie.id === movieId);
      if (removeIndex === -1) return prev;
      const [removed] = prev.slice(removeIndex, removeIndex + 1);
      if (removed?.slotKey && spawnedMissingSlotKeys.includes(removed.slotKey)) {
        setRecentReturns((existing) => existing.some((movie) => movie.slotKey === removed.slotKey) ? existing : [removed, ...existing].slice(0, 8));
      }
      return prev.filter((_, index) => index !== removeIndex);
    });
  }, [spawnedMissingSlotKeys]);

  useEffect(() => {
    const eraId = getEraIdFromYears(selectedEra.years);
    const gondolaCandidates = STORE_LAYOUT.objects.flatMap((obj) => {
      if (obj.prefab !== "shelf/gondola") return [];
      const frontGenre = typeof obj.meta?.genre === "string" ? obj.meta.genre : null;
      const backGenre = typeof obj.meta?.backGenre === "string" ? obj.meta.backGenre : null;
      const frontMovies = frontGenre
        ? getCuratedShelfPosterData(frontGenre, eraId, `${obj.id}:front`, 18).map((movie, index) => ({
            id: movie.id,
            title: movie.title,
            posterUrl: movie.url,
            genre: frontGenre,
            slotKey: `${obj.id}:front:${index}`,
          }))
        : [];
      const backMovies = backGenre
        ? getCuratedShelfPosterData(backGenre, eraId, `${obj.id}:back`, 18).map((movie, index) => ({
            id: movie.id,
            title: movie.title,
            posterUrl: movie.url,
            genre: backGenre,
            slotKey: `${obj.id}:back:${index}`,
          }))
        : [];
      return [...frontMovies, ...backMovies];
    }).filter((movie) => movie.posterUrl);

    const shuffled = [...gondolaCandidates].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 8);
    setSpawnedMissingSlotKeys(picked.flatMap((movie) => movie.slotKey ? [movie.slotKey] : []));
    setRecentReturns(picked.slice(0, 4));
  }, [selectedEra.years]);

  // Side quest state (uses existing showQuestNotif for notifications)

  // Quest system state
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const questNotifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Membership tier state
  const [totalXP, setTotalXP] = useState(0);
  const [currentTier, setCurrentTier] = useState(MEMBERSHIP_TIERS[0]);
  const [tierUpNotification, setTierUpNotification] = useState<string | null>(null);
  const tierUpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Game clock state — 7:30 PM = 19.5 hours, closes at 11 PM = 23
  const [gameTime, setGameTime] = useState(19.5);
  const gameClockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingAnnouncedRef = useRef<Set<string>>(new Set());

  // Load props count + tier on mount + wire subtitle handler + start NPC chatter
  useEffect(() => {
    setPropsCount(getPropsCount());
    setTotalXP(getTotalXP());
    setCurrentTier(getMembershipTier());
    setSubtitleHandler((text, duration) => {
      setSubtitle(text);
      if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
      subtitleTimer.current = setTimeout(() => setSubtitle(null), duration);
    });
  }, []);

  // Update challenge timer every second + check speed run timeout
  useEffect(() => {
    if (!challenge) { setChallengeTimer(0); return; }
    const iv = setInterval(() => {
      const elapsed = Math.round((Date.now() - challenge.startTime) / 1000);
      setChallengeTimer(elapsed);
      // Speed run timeout
      if (challenge.timeLimit && elapsed >= challenge.timeLimit) {
        setChallenge(null);
        setHeldMovies([]);
        setChallengeComplete(-1); // -1 signals timeout/failure
        playSFX("challenge_fail");
        playRandomLine("challenge_fail");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [challenge]);

  useEffect(() => { setStats(loadStats()); }, []);

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handler = () => { unlockAudio(); window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, []);

  // ── Game Clock — starts ticking after splash + loading ─────
  useEffect(() => {
    if (!started || loading) return;
    gameClockRef.current = setInterval(() => {
      setGameTime(prev => {
        const next = prev + (3.5 / (15 * 60)); // 3.5 game hours per 15 real minutes
        if (next >= 23) return 23; // cap at 11 PM
        return next;
      });
    }, 1000);
    return () => { if (gameClockRef.current) clearInterval(gameClockRef.current); };
  }, [started, loading]);

  // ── Vinny closing time announcements ─────────────────────
  useEffect(() => {
    if (gameTime >= 23) {
      if (!closingAnnouncedRef.current.has("closed") && overlay === "none") {
        closingAnnouncedRef.current.add("closed");
        playVinnyLine("That's it, folks! We're closed! Time to check out!");
        setOverlay("checkout");
      }
      return;
    }
    const announcements: { threshold: number; key: string; line: string }[] = [
      { threshold: 21, key: "9pm", line: "We close in two hours, folks! Make your selections!" },
      { threshold: 22, key: "10pm", line: "One hour to close! If you haven't picked a movie yet, now's the time!" },
      { threshold: 22.5, key: "1030pm", line: "Half hour to close! Last call for rentals!" },
      { threshold: 22.75, key: "1045pm", line: "Fifteen minutes! I'm starting to shut down the registers!" },
    ];
    for (const a of announcements) {
      if (gameTime >= a.threshold && !closingAnnouncedRef.current.has(a.key)) {
        closingAnnouncedRef.current.add(a.key);
        playVinnyLine(a.line);
        break; // one announcement per tick
      }
    }
  }, [gameTime, overlay]);

  // ── NPC count based on closing time ──────────────────────
  const maxNpcs = gameTime >= 22.75 ? 0 : gameTime >= 22.5 ? 2 : gameTime >= 22 ? 3 : 5;

  // ── Quest System ──────────────────────────────────────
  const showQuestNotif = useCallback((msg: string) => {
    addNotification(msg);
  }, [addNotification]);

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
            const tierResult = completeQuest(quest.id);
            handleTierUp(tierResult);
            setPropsCount(getPropsCount());
            showQuestNotif(`Quest Complete: ${quest.title}!`);
            if (quest.reward.propId) {
              const prop = PROPS.find(p => p.id === quest.reward.propId);
              if (prop) setRewardProp(prop);
            }
          }
        }
      }
    }
  }, [showQuestNotif, handleTierUp]);

  const trackQuestMoviePickup = useCallback((movieTitle: string, movieGenre: string) => {
    const active = getActiveQuests();
    const genreUpper = movieGenre.toUpperCase();

    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "browse_genre" && obj.target === genreUpper) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Picked ${genreUpper} movie`);
          if (allDone) {
            const tierResult = completeQuest(quest.id);
            handleTierUp(tierResult);
            setPropsCount(getPropsCount());
            showQuestNotif(`Quest Complete: ${quest.title}!`);
            if (quest.reward.propId) {
              const prop = PROPS.find(p => p.id === quest.reward.propId);
              if (prop) setRewardProp(prop);
            }
          }
        }
        if (obj.type === "find_movie" && obj.target && movieTitle.toLowerCase().includes(obj.target.toLowerCase())) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Found ${movieTitle}!`);
          if (allDone) {
            const tierResult = completeQuest(quest.id);
            handleTierUp(tierResult);
            setPropsCount(getPropsCount());
            showQuestNotif(`Quest Complete: ${quest.title}!`);
            if (quest.reward.propId) {
              const prop = PROPS.find(p => p.id === quest.reward.propId);
              if (prop) setRewardProp(prop);
            }
          }
        }
      }
    }
  }, [showQuestNotif, handleTierUp]);

  const trackQuestNpcTalk = useCallback((npcName: string) => {
    const active = getActiveQuests();
    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "talk_to_npc" && obj.target === npcName) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Talked to ${npcName}`);
          if (allDone) {
            const tierResult = completeQuest(quest.id);
            handleTierUp(tierResult);
            setPropsCount(getPropsCount());
            showQuestNotif(`Quest Complete: ${quest.title}!`);
            if (quest.reward.propId) {
              const prop = PROPS.find(p => p.id === quest.reward.propId);
              if (prop) setRewardProp(prop);
            }
          }
        }
      }
    }
  }, [showQuestNotif, handleTierUp]);

  // Handle RPG dialogue response selection (quest triggers + node navigation)
  const handleDialogueResponse = useCallback((resp: { text: string; next: DialogueNode; questStart?: string; questComplete?: string }) => {
    if (resp.questStart) {
      const questId = resp.questStart;
      const state = getQuestState();
      if (!state.activeQuests.includes(questId) && !state.completedQuests.includes(questId)) {
        startQuest(questId);
        const quest = CUSTOMER_SIDE_QUESTS.find(q => q.id === questId);
        if (quest) {
          showQuestNotif(`New Side Quest: ${quest.title}`);
          playSFX("challenge_start");
        }
      }
    }
    if (resp.questComplete) {
      const questId = resp.questComplete;
      // Handle Charlie trivia correct answer — award 25 XP directly
      if (questId === "trivia_correct") {
        const result = addXP(25);
        setTotalXP(result.newTotal);
        setCurrentTier(getMembershipTier(result.newTotal));
        handleTierUp(result.tierUp ? { tierUp: true, newTier: result.newTier } : null);
        showQuestNotif("Trivia correct! +25 XP");
        playSFX("challenge_complete");
      } else {
        const quest = CUSTOMER_SIDE_QUESTS.find(q => q.id === questId);
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
      setNpcChatMessages([{ role: 'npc', text: `Hey! What's on your mind?` }]);
      setNpcChatInput('');
      setOverlay("npc_chat");
      return;
    }

    setRpgHistory(prev => [
      ...prev,
      { speaker: "You", text: resp.text },
      { speaker: resp.next.speaker, portrait: resp.next.portrait, text: resp.next.text },
    ]);
    setRpgNode(resp.next);
  }, [showQuestNotif, handleTierUp, npcChatTarget]);

  // ── Hover callback from 3D interaction system ─────────
  const handleHover = useCallback((label: string | null) => {
    setHoverLabel(label);
  }, []);

  // ── NPC freeform chat send ────────────────────────────
  const handleNpcChatSend = useCallback(async () => {
    if (!npcChatInput.trim() || !npcChatTarget || npcChatLoading) return;
    const text = npcChatInput.trim();
    setNpcChatInput('');
    setNpcChatMessages(prev => [...prev, { role: 'player', text }]);
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
      const res = await fetch('/api/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (data.sentiment && data.sentiment !== 'neutral' && data.source === 'llm') {
        const llmXp = getXPDelta(data.sentiment);
        if (llmXp !== 0 && tone === 'neutral') {
          const result2 = addXP(llmXp);
          setTotalXP(result2.newTotal);
          setCurrentTier(getMembershipTier(result2.newTotal));
          updateNpcRapport(npcChatTarget.npcManagerId, llmXp);
        }
      }

      setNpcChatMessages(prev => [...prev, { role: 'npc', text: data.reply }]);
    } catch {
      setNpcChatMessages(prev => [...prev, { role: 'npc', text: "Sorry, I spaced out. What?" }]);
    } finally {
      setNpcChatLoading(false);
    }
  }, [npcChatInput, npcChatTarget, npcChatLoading, npcChatMessages, era, totalXP, handleTierUp]);

  // ── Movie Night Score Calculation ──────────────────────
  type ScoreItem = { label: string; points: number };
  function calculateMovieNightScore(movies: HeldMovie[], snacks: HeldSnack[]): { score: number; breakdown: ScoreItem[] } {
    let score = 0;
    const breakdown: ScoreItem[] = [];

    // Base: movies
    if (movies.length === 1) { score += 50; breakdown.push({ label: "Quick Night", points: 50 }); }
    if (movies.length === 2) { score += 120; breakdown.push({ label: "Double Feature", points: 120 }); }
    if (movies.length >= 3) { score += 200; breakdown.push({ label: "Marathon!", points: 200 }); }

    // Genre variety
    const genres = new Set(movies.map(m => m.genre).filter(Boolean));
    if (genres.size === movies.length && movies.length > 1) {
      score += 50; breakdown.push({ label: "Genre Variety", points: 50 });
    }

    // Snack bonus
    if (snacks.length > 0) {
      const snackPts = snacks.length * 25;
      score += snackPts; breakdown.push({ label: `${snacks.length} Snack(s)`, points: snackPts });
    }

    // Big feast
    if (snacks.length >= 3) {
      score += 50; breakdown.push({ label: "Feast Mode!", points: 50 });
    }

    // Snack pairing bonuses
    const snackNames = snacks.map(s => s.name.toLowerCase());
    const movieGenres = movies.map(m => m.genre.toLowerCase());
    const candyNames = ["m&ms", "skittles", "junior mints", "twizzlers", "gummy bears", "milk duds", "nerds", "hot tamales", "swedish fish", "reese's pieces", "raisinets", "sour patch kids", "red vines", "butterfinger", "cookie"];
    const sodaNames = ["soda"];
    const hasPopcorn = snackNames.some(s => s.includes("popcorn"));
    const hasCandy = snackNames.some(s => candyNames.some(c => s.includes(c)));
    const hasSoda = snackNames.some(s => sodaNames.some(c => s.includes(c)));

    if (movieGenres.includes("horror") && hasPopcorn) {
      score += 30; breakdown.push({ label: "Scream & Munch", points: 30 });
    }
    if (movieGenres.includes("comedy") && hasCandy) {
      score += 20; breakdown.push({ label: "Sugar Rush", points: 20 });
    }
    if (movieGenres.includes("action") && hasSoda) {
      score += 25; breakdown.push({ label: "Adrenaline Fuel", points: 25 });
    }

    return { score, breakdown };
  }

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

  // ── Start a challenge (movie_night or speed_run) ──────
  const startChallenge = useCallback((challengeType: ChallengeType = "movie_night") => {
    if (challenge) return;
    const shelfMovies = getShelfMovies();
    if (shelfMovies.length < 3) return;
    const shuffled = [...shelfMovies].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const usedGenres = new Set<string>();
    const picks: ChallengeMovie[] = [];
    for (const m of shuffled) {
      if (picks.length >= 3) break;
      if (seen.has(m.title.toLowerCase()) || usedGenres.has(m.genre)) continue;
      seen.add(m.title.toLowerCase());
      usedGenres.add(m.genre);
      picks.push({ title: m.title, genre: m.genre });
    }
    for (const m of shuffled) {
      if (picks.length >= 3) break;
      if (seen.has(m.title.toLowerCase())) continue;
      seen.add(m.title.toLowerCase());
      picks.push({ title: m.title, genre: m.genre });
    }
    if (picks.length < 3) return;
    setHeldMovies([]);
    setHeldSnacks([]);
    playSFX("challenge_start");
    playRandomLine("challenge_start");
    setChallenge({
      movies: picks,
      startTime: Date.now(),
      hintsUsed: new Set(),
      type: challengeType,
      timeLimit: challengeType === "speed_run" ? 60 : undefined,
    });
    setOverlay("none");
  }, [challenge]);

  // ── Start Vinny's Mystery ──────────────────────────────
  const startMystery = useCallback(() => {
    const shelfMovies = getShelfMovies();
    const available = MOVIE_CLUES.filter(c =>
      shelfMovies.some(m => m.title.toLowerCase().includes(c.movieTitle.toLowerCase()))
    );
    if (available.length === 0) return;
    const clue = available[Math.floor(Math.random() * available.length)];
    setMysteryClue(clue);
    setMysteryHintsUsed(0);
    setMysteryWrongMsg(null);
    setHeldMovies([]);
    setOverlay("none");
    playRandomLine("challenge_start");
  }, []);

  // ── Puzzle (Vinny's Five) ──────────────────────────────
  const startPuzzle = useCallback(async () => {
    setOverlay("pick");
    setPuzzleClue(0); setPuzzleGuess(""); setPuzzleResults([]); setPuzzleWon(null); setPuzzleBackdropReady(false);
    try {
      const res = await fetch("/api/puzzle?mode=random");
      const data = await res.json();
      if (data.puzzle) {
        setPuzzle(data.puzzle);
        if (data.puzzle.backdrop) {
          const img = new Image();
          img.onload = () => setPuzzleBackdropReady(true);
          img.onerror = () => setPuzzleBackdropReady(true);
          img.src = data.puzzle.backdrop;
        } else setPuzzleBackdropReady(true);
        setTimeout(() => inputRef.current?.focus(), 500);
      }
    } catch { setOverlay("none"); }
  }, []);

  const handlePuzzleSearch = useCallback((q: string) => {
    setPuzzleGuess(q);
    clearTimeout(searchTimer.current);
    if (q.length < 2) { setPuzzleResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        setPuzzleResults((data.results || []).slice(0, 5).map((r: Record<string, unknown>) => ({
          id: r.id as number, title: r.title as string, year: r.year as number | null, posterUrl: r.posterUrl as string | null, overview: "", voteAverage: 0, genre: "",
        })));
      } catch {}
    }, 300);
  }, []);

  const submitPuzzleGuess = useCallback((title: string, id: number) => {
    if (!puzzle) return;
    setPuzzleGuess(""); setPuzzleResults([]);
    if (id === puzzle.movieId) {
      setPuzzleWon(true);
      const s = loadStats(); s.played = (s.played || 0) + 1; s.won = (s.won || 0) + 1; saveStats(s); setStats(s);
    } else {
      if (puzzleClue < 4) setPuzzleClue(c => c + 1);
      else { setPuzzleWon(false); const s = loadStats(); s.played = (s.played || 0) + 1; saveStats(s); setStats(s); }
    }
  }, [puzzle, puzzleClue]);

  const skipPuzzleClue = useCallback(() => {
    if (puzzleClue < 4) setPuzzleClue(c => c + 1);
    else { setPuzzleWon(false); const s = loadStats(); s.played = (s.played || 0) + 1; saveStats(s); setStats(s); }
  }, [puzzleClue]);

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

  const closeOverlay = useCallback(() => {
    // Track NPC relationship when ending a dialogue
    if (overlay === "rpg_dialogue" && rpgDialogue) {
      const npcType = rpgDialogue.npc?.toLowerCase() || "customer";
      incrementNpcRelationship(npcType);
    }
    setOverlay("none");
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
  }, [overlay, rpgDialogue]);

  const minutesUntilClose = Math.max(0, Math.round((23 - gameTime) * 60));
  const closeHours = Math.floor(minutesUntilClose / 60);
  const closeMinutes = minutesUntilClose % 60;
  const closeCountdownLabel = gameTime >= 23
    ? "Closed for the night"
    : closeHours > 0
      ? `${closeHours}h ${closeMinutes.toString().padStart(2, "0")}m to close`
      : `${closeMinutes}m to close`;
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

  // C to take screenshot
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

  const hasOverlay = overlay !== "none";
  const puzzleBlur = puzzleWon !== null ? 0 : [40, 28, 16, 6, 0][puzzleClue];

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
                <button key={opt.id} onClick={() => { setEra(opt.id); setEraChosen(true); }}
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
              <button className="g3-challenge-option" onClick={() => { startChallenge("movie_night"); }}>
                <div className="g3-challenge-option-name">Movie Night</div>
                <div className="g3-challenge-option-desc">Find 3 movies from the shelves</div>
                <div className="g3-challenge-option-stats">Completed {movieNightCount} time{movieNightCount !== 1 ? "s" : ""}</div>
              </button>

              {/* Speed Run — unlocks after 3 Movie Night completions */}
              <button
                className={`g3-challenge-option ${!speedRunUnlocked ? "g3-challenge-option-locked" : ""}`}
                onClick={() => { if (speedRunUnlocked) startChallenge("speed_run"); }}
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
                onClick={() => { if (vinnyPickUnlocked) startMystery(); }}
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
          <button className="g3-screenshot-btn" onClick={() => { setAudioMuted(m => { const next = !m; setMuted(next); setMusicMuted(next); return next; }); }} title="Mute">{audioMuted ? "🔇" : "🔊"}</button>
        </div>
      </div>

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
          <span className="g3-key">C</span> screenshot
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
        <div className="g3-puzzle-overlay">
          {puzzle.backdrop && puzzleBackdropReady && (
            <div className="vf-backdrop" style={{ backgroundImage: `url(${puzzle.backdrop})`, filter: `blur(${puzzleBlur}px) brightness(0.6)` }} />
          )}
          <div className="vf-scrim" />
          <div className="g3-puzzle-content">
            <div className="g3-puzzle-top">
              <button className="vf-back" onClick={closeOverlay}>✕ Close</button>
              <div className="vf-star-track">
                {[5,4,3,2,1].map(s => <span key={s} className={`vf-star ${puzzleWon === null && s <= 5 - puzzleClue ? "vf-star-lit" : ""} ${puzzleWon && s <= 5 - puzzleClue ? "vf-star-won" : ""}`}>★</span>)}
              </div>
              <span className="vf-clue-num">{puzzleWon === null ? `${puzzleClue + 1}/5` : ""}</span>
            </div>

            {puzzleWon === null ? (
              <>
                <div className="vf-clue-stack">
                  <div className="vf-clue-item vf-clue-vinny">
                    <div className="vf-v-badge">V</div>
                    <p className="vf-clue-poetic">&ldquo;{puzzle.clues[0]}&rdquo;</p>
                  </div>
                  {puzzleClue >= 1 && <div className="vf-clue-item vf-clue-fact-item"><span className="vf-clue-tag">GENRE</span><span className="vf-clue-val">{puzzle.clues[1]}</span></div>}
                  {puzzleClue >= 2 && <div className="vf-clue-item vf-clue-fact-item"><span className="vf-clue-tag">STARRING</span><span className="vf-clue-val">{puzzle.clues[2]}</span></div>}
                  {puzzleClue >= 3 && <div className="vf-clue-item vf-clue-tagline"><span className="vf-clue-tag">TAGLINE</span><p className="vf-clue-tagline-text">&ldquo;{puzzle.clues[3]}&rdquo;</p></div>}
                  {puzzleClue >= 4 && puzzle.poster && <div className="vf-clue-item vf-clue-poster-reveal"><img src={puzzle.poster} alt="" className="vf-poster-big" /></div>}
                </div>
                <div className="vf-input-bottom">
                  <div className="vf-input-wrap">
                    <input ref={inputRef} type="text" className="vf-input" placeholder="Type a movie title..." value={puzzleGuess} onChange={e => handlePuzzleSearch(e.target.value)} autoComplete="off" />
                    <button className="vf-skip" onClick={skipPuzzleClue}>{puzzleClue < 4 ? "Skip →" : "Give up"}</button>
                  </div>
                  {puzzleResults.length > 0 && (
                    <div className="vf-results">
                      {puzzleResults.map(r => (
                        <button key={r.id} className="vf-result" onClick={() => submitPuzzleGuess(r.title, r.id)}>
                          {r.posterUrl && <img src={r.posterUrl} alt="" className="vf-result-poster" />}
                          <span className="vf-result-title">{r.title}</span>
                          {r.year && <span className="vf-result-year">({r.year})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="vf-reveal">
                <div className="vf-reveal-card">
                  {puzzle.poster && <img src={puzzle.poster} className="vf-reveal-poster" alt="" />}
                  <div className="vf-reveal-info">
                    <h2 className="vf-reveal-title">{puzzle.answer.title as string}</h2>
                    <p className="vf-reveal-meta">{puzzle.answer.year as number} &bull; {puzzle.answer.director as string}</p>
                  </div>
                </div>
                <div className={`vf-score-banner ${puzzleWon ? "vf-score-win" : "vf-score-lose"}`}>
                  {puzzleWon ? `⭐ Got it on Clue ${puzzleClue + 1}!` : `Missed it — ${puzzle.answer.title as string}`}
                </div>
                <div className="g3-puzzle-actions">
                  <button className="vf-btn vf-btn-primary" onClick={startPuzzle}>Another Round</button>
                  <button className="vf-btn vf-btn-secondary" onClick={closeOverlay}>Back to Store</button>
                </div>
              </div>
            )}
          </div>
        </div>
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
        <div className="g3-overlay">
          <div className="g3-overlay-header">
            <span className="g3-overlay-title">{npcChatTarget.name.toUpperCase()}</span>
            <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
          </div>
          <div className="g3-overlay-body" style={{ display: 'flex', flexDirection: 'column', maxHeight: '50vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
              {npcChatMessages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'player' ? 'flex-end' : 'flex-start',
                  background: m.role === 'player' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${m.role === 'player' ? '#ffd700' : 'rgba(255,255,255,0.15)'}`,
                  padding: '8px 12px',
                  maxWidth: '80%',
                  fontSize: '0.5rem',
                  fontFamily: 'var(--font-pixel, monospace)',
                  color: '#e0e0e0',
                }}>
                  {m.role === 'npc' && <span style={{ color: '#ffd700', display: 'block', marginBottom: 4, fontSize: '0.4rem' }}>{npcChatTarget.name}</span>}
                  {m.text}
                </div>
              ))}
              {npcChatLoading && <div style={{ color: '#888', fontSize: '0.4rem', fontFamily: 'var(--font-pixel, monospace)' }}>...</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '2px solid rgba(255,215,0,0.2)' }}>
              <input
                type="text"
                value={npcChatInput}
                onChange={e => setNpcChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNpcChatSend(); }}
                placeholder={`Say something to ${npcChatTarget.name}...`}
                disabled={npcChatLoading}
                autoFocus
                style={{
                  flex: 1, padding: '8px 12px', fontSize: '16px',
                  fontFamily: 'var(--font-pixel, monospace)',
                  background: 'rgba(0,0,0,0.8)', color: '#e0e0e0',
                  border: '2px solid rgba(255,215,0,0.3)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleNpcChatSend}
                disabled={npcChatLoading || !npcChatInput.trim()}
                style={{
                  padding: '8px 16px', fontSize: '0.5rem',
                  fontFamily: 'var(--font-pixel, monospace)',
                  background: '#ffd700', color: '#000', border: 'none',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >SEND</button>
            </div>
          </div>
        </div>
      )}

      {overlay === "checkout" && (() => {
        const { score: movieNightScore, breakdown: scoreBreakdown } = calculateMovieNightScore(heldMovies, heldSnacks);
        const prevHigh = parseInt(localStorage.getItem("fnv_high_score") || "0");
        const isNewHigh = movieNightScore > prevHigh;
        if (isNewHigh) localStorage.setItem("fnv_high_score", String(movieNightScore));
        return (
          <div className="g3-overlay g3-overlay-center g3-checkout-overlay">
            <div className="g3-receipt">
              <div className="g3-receipt-header">
                <pre>FRIDAY NIGHT VIDEO</pre>
                <pre>YOUR NEIGHBORHOOD VIDEO STORE</pre>
                <pre>================================</pre>
              </div>
              <div className="g3-receipt-items">
                {heldMovies.map((movie, i) => (
                  <div key={i} className="g3-receipt-item">
                    <span>🎬 {movie.title}</span>
                    <span className="g3-receipt-item-actions">
                      <span>$2.99</span>
                      <button className="g3-receipt-remove" onClick={() => removeHeldMovie(movie.id)}>PUT BACK</button>
                    </span>
                  </div>
                ))}
                {heldSnacks.map((snack, i) => (
                  <div key={i} className="g3-receipt-item">
                    <span>{snack.emoji} {snack.name}</span>
                    <span>$1.50</span>
                  </div>
                ))}
              </div>
              <pre>================================</pre>
              <div className="g3-receipt-total">
                <span>TOTAL</span>
                <span>${(heldMovies.length * 2.99 + heldSnacks.length * 1.50).toFixed(2)}</span>
              </div>
              <pre>================================</pre>
              <div className="g3-receipt-score">
                <div className="g3-receipt-score-label">MOVIE NIGHT SCORE</div>
                <div className="g3-score-big">{movieNightScore}</div>
                {isNewHigh && <div className="g3-score-newhigh">NEW HIGH SCORE!</div>}
                <div className="g3-score-breakdown">
                  {scoreBreakdown.map((item, i) => (
                    <div key={i}>{item.label}: +{item.points}</div>
                  ))}
                </div>
                <div className="g3-score-xp">+{Math.floor(movieNightScore / 10)} XP</div>
              </div>
              <pre>================================</pre>
              <pre>HAVE A GREAT FRIDAY NIGHT!</pre>
              <pre>BE KIND, REWIND</pre>
              <div className="g3-receipt-buttons">
                <button className="g3-receipt-btn g3-receipt-btn-primary" onClick={() => {
                  const state = loadGameState();
                  state.totalMoviesFound += heldMovies.length;
                  saveGameState(state);
                  setOverlay("none");
                  setHeldMovies([]);
                  setHeldSnacks([]);
                }}>
                  LEAVE THE STORE
                </button>
                <button className="g3-receipt-btn g3-receipt-btn-secondary" onClick={() => setOverlay("none")}>
                  KEEP BROWSING
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quest Log Overlay */}
      {overlay === "quest_log" && (() => {
        const available = getAvailableQuests();
        const active = getActiveQuests();
        const completed = getCompletedQuests();
        const qs = getQuestState();
        return (
          <div className="g3-overlay g3-overlay-center">
            <div className="g3-overlay-header">
              <span className="g3-overlay-title">QUEST LOG</span>
              <button className="g3-overlay-close" onClick={closeOverlay}>&#10005;</button>
            </div>
            <div className="g3-overlay-body g3-quest-log">
              {/* Active Quests */}
              {active.length > 0 && (
                <div className="g3-quest-section">
                  <div className="g3-quest-section-title">ACTIVE QUESTS</div>
                  {active.map(quest => {
                    const progress = qs.questProgress[quest.id] || {};
                    const doneCount = quest.objectives.filter(o => progress[o.id]).length;
                    return (
                      <div key={quest.id} className="g3-quest-card g3-quest-active">
                        <div className="g3-quest-card-header">
                          <span className="g3-quest-title">{quest.title}</span>
                          <span className="g3-quest-progress">{doneCount}/{quest.objectives.length}</span>
                        </div>
                        <p className="g3-quest-desc">{quest.description}</p>
                        <div className="g3-quest-objectives">
                          {quest.objectives.map(obj => (
                            <div key={obj.id} className={`g3-quest-obj ${progress[obj.id] ? "g3-quest-obj-done" : ""}`}>
                              <span className="g3-quest-obj-check">{progress[obj.id] ? "\u2713" : "\u25CB"}</span>
                              <span>{obj.description}</span>
                            </div>
                          ))}
                        </div>
                        <div className="g3-quest-reward">
                          Reward: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Available Quests */}
              {available.length > 0 && (
                <div className="g3-quest-section">
                  <div className="g3-quest-section-title">AVAILABLE QUESTS</div>
                  {available.map(quest => (
                    <div key={quest.id} className="g3-quest-card g3-quest-available">
                      <div className="g3-quest-card-header">
                        <span className="g3-quest-title">{quest.title}</span>
                        <span className="g3-quest-giver">From: {quest.giverNpc === "vinny" ? "Vinny" : quest.giverNpc === "charlie" ? "Charlie" : "Customer"}</span>
                      </div>
                      <p className="g3-quest-desc">{quest.description}</p>
                      <div className="g3-quest-reward">
                        Reward: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                      </div>
                      <button className="g3-quest-accept" onClick={() => {
                        startQuest(quest.id);
                        showQuestNotif(`Quest Started: ${quest.title}`);
                        closeOverlay();
                      }}>ACCEPT QUEST</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Quests */}
              {completed.length > 0 && (
                <div className="g3-quest-section">
                  <div className="g3-quest-section-title">COMPLETED</div>
                  {completed.map(quest => (
                    <div key={quest.id} className="g3-quest-card g3-quest-completed">
                      <div className="g3-quest-card-header">
                        <span className="g3-quest-title">{quest.title}</span>
                        <span className="g3-quest-check-done">\u2713</span>
                      </div>
                      <p className="g3-quest-desc">{quest.description}</p>
                      <div className="g3-quest-reward">
                        Earned: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {active.length === 0 && available.length === 0 && completed.length === 0 && (
                <div className="g3-quest-empty">No quests yet. Talk to Vinny to get started!</div>
              )}
            </div>
          </div>
        );
      })()}

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
