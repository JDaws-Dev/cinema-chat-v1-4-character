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
import { loadGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, hasProp, type MovieProp, getQuestState, startQuest, completeObjective, completeQuest, isQuestComplete, getAvailableQuests, getActiveQuests, getCompletedQuests, getQuestProgress, getActiveSideQuests, isSideQuestActive, isSideQuestDone } from "@/lib/game-state";
import { VINNY_QUESTS, QUEST_DIALOGUE, type Quest, CUSTOMER_SIDE_QUESTS } from "@/lib/quest-system";
import { playRandomLine, playVinnyLine, playSFX, setSubtitleHandler, setMuted, isMuted, setMusicMuted, isMusicMuted, VINNY_LINES, unlockAudio } from "@/lib/audio";
import { type MovieClue, MOVIE_CLUES } from "@/lib/movie-clues";
import { getRandomConversation, type NPCConversation } from "@/lib/npc-conversations";
import { getRandomDialogue, getRandomQuestDialogue, type DialogueTree, type DialogueNode } from "@/lib/npc-dialogues";
import "./game.css";

const MobileControls = dynamic(() => import("@/components/game3d/MobileControls").then(m => ({ default: m.MobileControls })), { ssr: false });

const Canvas = dynamic(() => import("@react-three/fiber").then(m => ({ default: m.Canvas })), { ssr: false });
const Store = dynamic(() => import("@/components/game3d/Store").then(m => ({ default: m.Store })), { ssr: false });
const FirstPersonControls = dynamic(() => import("@/components/game3d/FirstPerson").then(m => ({ default: m.FirstPersonControls })), { ssr: false });
const InteractionSystem = dynamic(() => import("@/components/game3d/Interaction").then(m => ({ default: m.InteractionSystem })), { ssr: false });

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

type Overlay = "none" | "dialogue" | "shelf" | "film_detail" | "pick" | "quote" | "synopsis" | "challenge_select" | "trophy" | "rpg_dialogue" | "quest_log";

export default function GamePage() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [era, setEra] = useState<string>("early90s");
  const ERA_OPTIONS = [
    { id: "late80s", label: "Late 80s", years: "1987-1989", displayYear: "1989" },
    { id: "early90s", label: "Early 90s", years: "1990-1993", displayYear: "1992" },
    { id: "mid90s", label: "Mid 90s", years: "1994-1996", displayYear: "1995" },
    { id: "late90s", label: "Late 90s", years: "1997-1999", displayYear: "1998" },
    { id: "present", label: "Present Day", years: "2024-2026", displayYear: "2025" },
  ];
  const selectedEra = ERA_OPTIONS.find(e => e.id === era) || ERA_OPTIONS[1];

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
  const [shelfGenre, setShelfGenre] = useState("");
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
  type HeldMovie = { id: number; title: string; posterUrl: string };
  const [heldMovies, setHeldMovies] = useState<HeldMovie[]>([]);
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

  // New Release Race state
  const [raceActive, setRaceActive] = useState(false);
  const [raceMovie, setRaceMovie] = useState<string | null>(null);
  const [raceTimeLeft, setRaceTimeLeft] = useState(0);
  const [raceResult, setRaceResult] = useState<"won" | "lost" | null>(null);

  // Audio state
  const [audioMuted, setAudioMuted] = useState(false);
  const [musicOff, setMusicOff] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const subtitleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // NPC conversation state
  const [npcLine, setNpcLine] = useState<string | null>(null);
  const npcConvoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const npcConvoPlaying = useRef(false);

  // RPG dialogue state
  const [rpgDialogue, setRpgDialogue] = useState<DialogueTree | null>(null);
  const [rpgNode, setRpgNode] = useState<DialogueNode | null>(null);
  const [rpgHistory, setRpgHistory] = useState<{ speaker: string; portrait?: string; text: string }[]>([]);

  // Side quest state (uses existing showQuestNotif for notifications)

  // Quest system state
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const questNotifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load props count on mount + wire subtitle handler + start NPC chatter
  useEffect(() => {
    setPropsCount(getPropsCount());
    setSubtitleHandler((text, duration) => {
      setSubtitle(text);
      if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
      subtitleTimer.current = setTimeout(() => setSubtitle(null), duration);
    });

    // Periodically trigger NPC conversations (every 30-60s)
    const scheduleConvo = () => {
      const delay = 30000 + Math.random() * 30000; // 30-60s
      npcConvoTimer.current = setTimeout(() => {
        if (npcConvoPlaying.current) { scheduleConvo(); return; }
        npcConvoPlaying.current = true;
        const convo = getRandomConversation();
        // Play each line sequentially
        convo.lines.forEach((line, i) => {
          setTimeout(() => {
            setNpcLine(`${line.speaker}: "${line.text}"`);
          }, line.delay);
        });
        // Clear after last line + 3s
        const lastLine = convo.lines[convo.lines.length - 1];
        const totalDuration = lastLine.delay + 3000;
        setTimeout(() => {
          setNpcLine(null);
          npcConvoPlaying.current = false;
        }, totalDuration);
        scheduleConvo();
      }, delay);
    };
    // First conversation after 15s
    npcConvoTimer.current = setTimeout(() => { scheduleConvo(); }, 15000);

    return () => { if (npcConvoTimer.current) clearTimeout(npcConvoTimer.current); };
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

  // New Release Race countdown timer
  useEffect(() => {
    if (!raceActive) return;
    const iv = setInterval(() => {
      setRaceTimeLeft(prev => {
        if (prev <= 1) {
          setRaceActive(false);
          setRaceResult("lost");
          playSFX("challenge_fail");
          playRandomLine("challenge_fail");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [raceActive]);

  useEffect(() => { setStats(loadStats()); }, []);

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handler = () => { unlockAudio(); window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, []);

  // ── Quest System ──────────────────────────────────────
  const showQuestNotif = useCallback((msg: string) => {
    setQuestNotification(msg);
    if (questNotifTimer.current) clearTimeout(questNotifTimer.current);
    questNotifTimer.current = setTimeout(() => setQuestNotification(null), 3000);
  }, []);

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
            completeQuest(quest.id);
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
  }, [showQuestNotif]);

  const trackQuestMoviePickup = useCallback((movieTitle: string, movieGenre: string) => {
    const active = getActiveQuests();
    const genreUpper = movieGenre.toUpperCase();

    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "browse_genre" && obj.target === genreUpper) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Picked ${genreUpper} movie`);
          if (allDone) {
            completeQuest(quest.id);
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
            completeQuest(quest.id);
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
  }, [showQuestNotif]);

  const trackQuestNpcTalk = useCallback((npcName: string) => {
    const active = getActiveQuests();
    for (const quest of active) {
      for (const obj of quest.objectives) {
        if (obj.type === "talk_to_npc" && obj.target === npcName) {
          const allDone = completeObjective(quest.id, obj.id);
          showQuestNotif(`Quest: Talked to ${npcName}`);
          if (allDone) {
            completeQuest(quest.id);
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
  }, [showQuestNotif]);

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
          completeQuest(questId);
          setPropsCount(getPropsCount());
          showQuestNotif(`Side Quest Complete: ${quest.title}! +${quest.reward.xp} XP`);
          playSFX("challenge_complete");
        }
      }
    }
    setRpgHistory(prev => [
      ...prev,
      { speaker: "You", text: resp.text },
      { speaker: resp.next.speaker, portrait: resp.next.portrait, text: resp.next.text },
    ]);
    setRpgNode(resp.next);
  }, [showQuestNotif]);

  // ── Hover callback from 3D interaction system ─────────
  const handleHover = useCallback((label: string | null) => {
    setHoverLabel(label);
  }, []);

  // ── Interaction handler from 3D world ──────────────────
  const handleInteract = useCallback((type: string, data?: string) => {
    if (overlay !== "none") return;

    if (type === "snack" && data) {
      // Pick up candy/snack item — don't exit pointer lock, stay in game
      try {
        const snack = JSON.parse(data);
        setHeldSnacks(prev => {
          if (prev.some(s => s.name === snack.name)) return prev;
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
      // Pick up VHS tape — don't exit pointer lock, stay in game
      try {
        const movie = JSON.parse(data);
        // Don't add duplicates
        setHeldMovies(prev => {
          if (prev.some(m => m.id === movie.id)) return prev;
          return [...prev, { id: movie.id, title: movie.title, posterUrl: movie.posterUrl }];
        });
        setPickupFlash(true);
        setPickupTitle(movie.title);
        setTimeout(() => setPickupFlash(false), 800);
        setTimeout(() => setPickupTitle(null), 1500);
        playSFX("vhs_pickup");
        // Track movie pickup for quest objectives
        trackQuestMoviePickup(movie.title, movie.genre || "");
        // Vinny quip on pickup (30% chance to avoid spam)
        if (Math.random() < 0.3) playRandomLine("pickup");
        // Check if this movie wins the race
        if (raceActive && raceMovie && movie.title.toLowerCase() === raceMovie.toLowerCase()) {
          const elapsed = 15 - raceTimeLeft;
          setRaceActive(false);
          setRaceResult("won");
          recordChallengeCompletion("race", elapsed);
          playSFX("challenge_complete");
          playRandomLine("challenge_complete");
          // Check for lightsaber prop unlock on first race win
          const state = loadGameState();
          const raceCount = state.challengeCompletions["race"] || 0;
          if (raceCount === 1 && !state.unlockedProps.includes("lightsaber")) {
            unlockProp("lightsaber");
            const prop = PROPS.find(p => p.id === "lightsaber");
            if (prop) setRewardProp(prop);
          }
          setPropsCount(getPropsCount());
        }
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
      // RPG dialogue with Charlie
      document.exitPointerLock();
      const tree = getRandomDialogue("charlie");
      setRpgDialogue(tree);
      setRpgNode(tree.opener);
      setRpgHistory([{ speaker: tree.opener.speaker, portrait: tree.opener.portrait, text: tree.opener.text }]);
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
      // If holding movies (no challenge), show the first one's detail
      if (heldMovies.length > 0) {
        playRandomLine("checkout");
        setFilmId(heldMovies[0].id);
        setOverlay("film_detail");
        return;
      }
      // RPG dialogue with Vinny — sometimes quiz, sometimes conversation
      playRandomLine("greetings");
      const roll = Math.random();
      if (roll < 0.5) {
        // RPG-style conversation
        const tree = getRandomDialogue("vinny");
        setRpgDialogue(tree);
        setRpgNode(tree.opener);
        setRpgHistory([{ speaker: tree.opener.speaker, portrait: tree.opener.portrait, text: tree.opener.text }]);
        setOverlay("rpg_dialogue");
      } else if (roll < 0.75) {
        setQuote(pickRandom(QUOTES, q => q.id));
        setQuizAnswer(null);
        setOverlay("quote");
      } else {
        setSynopsis(pickRandom(SYNOPSES, s => s.id));
        setQuizAnswer(null);
        setOverlay("synopsis");
      }
    } else if (type === "customer") {
      // Customer side quest dialogue
      // If a side quest needs "talk to customer" objective, complete it
      const activeSide = getActiveSideQuests();
      for (const q of activeSide) {
        for (const obj of q.objectives) {
          if (obj.type === "talk_to_npc" && obj.target === "customer") {
            const allDone = completeObjective(q.id, obj.id);
            if (allDone) {
              completeQuest(q.id);
              setPropsCount(getPropsCount());
              showQuestNotif(`Side Quest Complete: ${q.title}! +${q.reward.xp} XP`);
              playSFX("challenge_complete");
              return;
            }
          }
        }
      }
      // Offer a new side quest (50% chance) or normal customer dialogue
      const completedIds = getQuestState().completedQuests;
      const questTree = Math.random() < 0.5 ? getRandomQuestDialogue(completedIds) : null;
      if (questTree) {
        setRpgDialogue(questTree);
        setRpgNode(questTree.opener);
        setRpgHistory([{ speaker: questTree.opener.speaker, portrait: questTree.opener.portrait, text: questTree.opener.text }]);
        setOverlay("rpg_dialogue");
      } else {
        const tree = getRandomDialogue("customer");
        setRpgDialogue(tree);
        setRpgNode(tree.opener);
        setRpgHistory([{ speaker: tree.opener.speaker, portrait: tree.opener.portrait, text: tree.opener.text }]);
        setOverlay("rpg_dialogue");
      }
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
              completeQuest(q.id);
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
      const genre = data || "horror";
      setShelfGenre(genre);
      setOverlay("shelf");
      // Track genre visit for quest objectives
      trackQuestGenreVisit(genre);
    } else if (type === "tv") {
      startPuzzle();
    }
  }, [overlay, heldMovies, challenge, mysteryClue, raceActive, raceMovie, raceTimeLeft, trackQuestMoviePickup, trackQuestNpcTalk, trackQuestGenreVisit]);

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

  // ── Start New Release Race ──────────────────────────────
  const startRace = useCallback(() => {
    const shelfMovies = getShelfMovies();
    if (shelfMovies.length === 0) return;
    const movie = shelfMovies[Math.floor(Math.random() * shelfMovies.length)];
    setRaceMovie(movie.title);
    setRaceActive(true);
    setRaceTimeLeft(15);
    setRaceResult(null);
    setHeldMovies([]);
    setOverlay("none");
    playSFX("door_chime");
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

  const closeOverlay = useCallback(() => {
    setOverlay("none");
    setPuzzle(null);
    setQuote(null);
    setSynopsis(null);
    setQuizAnswer(null);
    setRpgDialogue(null);
    setRpgNode(null);
    setRpgHistory([]);
  }, []);

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

  // Screenshot helper — forces a render frame then captures (works with preserveDrawingBuffer: false)
  const takeScreenshot = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    // Get the WebGL context and force a render before reading pixels
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return;
    // Request animation frame to ensure a fresh render, then capture immediately
    requestAnimationFrame(() => {
      const maxW = 1280;
      const scale = Math.min(1, maxW / canvas.width);
      const w = Math.round(canvas.width * scale);
      const h = Math.round(canvas.height * scale);
      // Read pixels directly from WebGL framebuffer
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      // Create offscreen canvas and flip vertically (WebGL is bottom-up)
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = canvas.width;
      srcCanvas.height = canvas.height;
      const srcCtx = srcCanvas.getContext("2d");
      if (!srcCtx) return;
      const imgData = srcCtx.createImageData(canvas.width, canvas.height);
      // Flip rows vertically
      for (let y = 0; y < canvas.height; y++) {
        const srcRow = (canvas.height - 1 - y) * canvas.width * 4;
        const dstRow = y * canvas.width * 4;
        imgData.data.set(pixels.subarray(srcRow, srcRow + canvas.width * 4), dstRow);
      }
      srcCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(srcCanvas, 0, 0, w, h);
      offscreen.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fnv-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    });
  }, []);

  // C to take screenshot, J to open quest log
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "c" || e.key === "C") takeScreenshot();
      if ((e.key === "j" || e.key === "J") && overlay === "none") {
        document.exitPointerLock();
        setOverlay("quest_log");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [takeScreenshot, overlay]);

  // ── Splash ─────────────────────────────────────────────
  if (!started) {
    return (
      <div className="g3-splash">
        <div className="g3-splash-content">
          {/* Blockbuster-style torn ticket logo */}
          <div className="g3-logo">
            <div className="g3-logo-ticket">
              <div className="g3-logo-left" />
              <div className="g3-logo-right" />
            </div>
          </div>
          <h1 className="g3-splash-title">FRIDAY NIGHT<br/>VIDEO</h1>
          <p className="g3-splash-tagline">Your neighborhood video store</p>
          <p className="g3-splash-tagline" style={{ fontSize: "0.8em", opacity: 0.7, marginTop: 8 }}>Browse the shelves. Pick a movie. Chat with Vinny.<br/>It&apos;s Friday night, {selectedEra.displayYear}.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "12px 0", flexWrap: "wrap" }}>
            {ERA_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setEra(opt.id)}
                style={{
                  padding: "6px 12px", fontSize: "0.7em", border: "1px solid #ffd700",
                  background: era === opt.id ? "#ffd700" : "transparent",
                  color: era === opt.id ? "#0a1830" : "#ffd700",
                  borderRadius: 4, cursor: "pointer", fontFamily: "inherit"
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <button className="g3-splash-btn" onClick={() => {
            setStarted(true); setLoading(true);
            // Request fullscreen on mobile only to hide Safari chrome
            if (/Mobi|Android/i.test(navigator.userAgent)) {
              try { document.documentElement.requestFullscreen?.(); } catch {}
            }
          }}>ENTER THE STORE</button>
          <p className="g3-splash-hint">WASD to move &bull; Mouse to look &bull; E to interact &bull; J quests</p>
        </div>
      </div>
    );
  }

  const hasOverlay = overlay !== "none";
  const puzzleBlur = puzzleWon !== null ? 0 : [40, 28, 16, 6, 0][puzzleClue];

  return (
    <div className="g3-container">
      {/* 3D Canvas */}
      <Canvas
        shadows={false}
        gl={{ antialias: !isMobile, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: false }}
        camera={{ fov: 70, near: 0.1, far: 50, position: [0, 1.6, 5] }}
        dpr={isMobile ? 1 : [1, 2]}
        performance={{ min: 0.5 }}
        style={{ background: "#1a2a48" }}
        onCreated={({ gl }) => { gl.setClearColor("#1a2a48"); setTimeout(() => setLoading(false), 500); }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#0a0e18", 25, 50]} />
          <Store isMobile={isMobile} eraYears={selectedEra.years} />
          <FirstPersonControls disabled={hasOverlay} />
          {!hasOverlay && <InteractionSystem onInteract={handleInteract} onHover={handleHover} />}
          <SecurityCameras />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      <div className={`g3-loading-overlay${!loading ? " g3-loaded" : ""}`}>
        <div className="g3-logo">
          <div className="g3-logo-ticket">
            <div className="g3-logo-left" />
            <div className="g3-logo-right" />
          </div>
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffd700", letterSpacing: "0.05em" }}>FRIDAY NIGHT VIDEO</h1>
        <p className="g3-loading-text">Opening the store...</p>
      </div>

      {/* Crosshair */}
      {!hasOverlay && <div className="g3-crosshair" />}

      {/* Hover label near crosshair */}
      {!hasOverlay && hoverLabel && (
        <div className="g3-hover-label"><span className="g3-hover-key">E</span> {hoverLabel}</div>
      )}

      {/* Subtitle display — Vinny's voice lines */}
      {subtitle && (
        <div className="g3-subtitle">{subtitle}</div>
      )}

      {/* NPC conversation chatter — overheard nearby */}
      {npcLine && !hasOverlay && !subtitle && (
        <div className="g3-npc-chatter">{npcLine}</div>
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

      {/* New Release Race HUD */}
      {raceActive && !hasOverlay && (
        <div className="g3-challenge-list" style={{ borderColor: "rgba(239, 68, 68, 0.5)" }}>
          <div className="g3-challenge-header" style={{ color: "#ef4444" }}>NEW RELEASE RACE</div>
          <div className="g3-challenge-item">
            A customer just returned:
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffd700", padding: "4px 0" }}>
            {raceMovie}
          </div>
          <div className="g3-challenge-item">
            Find it before the other customer!
          </div>
          <div className="g3-challenge-timer" style={{ color: raceTimeLeft <= 5 ? "#ef4444" : undefined, fontSize: "1rem", fontWeight: 700 }}>
            {raceTimeLeft}s
          </div>
        </div>
      )}

      {/* New Release Race result overlay */}
      {raceResult && (
        <div className="g3-challenge-complete" onClick={() => setRaceResult(null)}>
          <div className="g3-challenge-complete-card">
            <div className="g3-challenge-complete-icon">{raceResult === "won" ? "🏆" : "😤"}</div>
            <div className="g3-challenge-complete-title">{raceResult === "won" ? "YOU GOT IT!" : "TOO SLOW!"}</div>
            <div className="g3-challenge-complete-time">{raceResult === "won" ? "Snagged it just in time!" : "The other customer grabbed it first."}</div>
            <button className="g3-splash-btn" onClick={() => setRaceResult(null)} style={{ marginTop: 12, padding: "12px 24px", fontSize: "0.9rem" }}>
              {raceResult === "won" ? "NICE!" : "NEXT TIME"}
            </button>
          </div>
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

              {/* New Release Race — unlocks after 7 Movie Night completions */}
              {(() => {
                const raceUnlocked = movieNightCount >= 7;
                return (
                  <button
                    className={`g3-challenge-option ${!raceUnlocked ? "g3-challenge-option-locked" : ""}`}
                    onClick={() => { if (raceUnlocked) startRace(); }}
                    disabled={!raceUnlocked}
                  >
                    <div className="g3-challenge-option-name">New Release Race</div>
                    <div className="g3-challenge-option-desc">
                      {raceUnlocked ? "A customer just returned a hot tape — grab it before someone else!" : ""}
                    </div>
                    {raceUnlocked ? (
                      <div className="g3-challenge-option-stats">Completed {gs.challengeCompletions["race"] || 0} time{(gs.challengeCompletions["race"] || 0) !== 1 ? "s" : ""}</div>
                    ) : (
                      <div className="g3-challenge-option-lock">Complete 7 Movie Nights to unlock</div>
                    )}
                  </button>
                );
              })()}
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

      {/* Held movies inventory HUD */}
      {heldMovies.length > 0 && !hasOverlay && (
        <div className="g3-inventory">
          <div className="g3-inventory-label">MOVIES ({heldMovies.length})</div>
          <div className="g3-inventory-stack">
            {heldMovies.map((movie) => (
              <div key={movie.id} className="g3-inventory-card">
                {movie.posterUrl && (
                  <img src={movie.posterUrl} alt={movie.title} className="g3-inventory-poster" />
                )}
                <div className="g3-inventory-title">{movie.title}</div>
                <button className="g3-inventory-remove" onClick={() => setHeldMovies(prev => prev.filter(m => m.id !== movie.id))}>✕</button>
              </div>
            ))}
          </div>
          <div className="g3-inventory-hint">Take to Vinny to check out</div>
          <button className="g3-inventory-drop" onClick={() => setHeldMovies([])}>DROP ALL</button>
        </div>
      )}

      {/* Held snacks inventory HUD */}
      {heldSnacks.length > 0 && !hasOverlay && (
        <div className="g3-inventory" style={{ bottom: heldMovies.length > 0 ? 180 : 20 }}>
          <div className="g3-inventory-label">SNACKS ({heldSnacks.length})</div>
          <div className="g3-inventory-stack">
            {heldSnacks.map((snack) => (
              <div key={snack.name} className="g3-inventory-card" style={{ background: "rgba(10, 24, 14, 0.9)", borderColor: "rgba(34, 197, 94, 0.4)" }}>
                <div style={{ fontSize: "1.5rem", textAlign: "center", padding: "8px 0" }}>{snack.emoji}</div>
                <div className="g3-inventory-title">{snack.name}</div>
                <button className="g3-inventory-remove" onClick={() => setHeldSnacks(prev => prev.filter(s => s.name !== snack.name))}>✕</button>
              </div>
            ))}
          </div>
          <button className="g3-inventory-drop" onClick={() => setHeldSnacks([])}>DROP ALL</button>
        </div>
      )}

      {/* Mobile touch controls */}
      {!hasOverlay && <MobileControls />}

      {/* HUD */}
      <div className="g3-hud">
        <span className="g3-hud-title">FRIDAY NIGHT VIDEO</span>
        <span className="g3-hud-hint">
          {overlay === "rpg_dialogue" ? "1-4 to respond · Q to leave" :
           hasOverlay ? "Press Q or click ✕ to close" :
           heldMovies.length > 0 ? `Take your ${heldMovies.length === 1 ? "movie" : `${heldMovies.length} movies`} to Vinny!` :
           challenge ? "" :
           "WASD move · E interact · J quests"}
        </span>
        <div className="g3-hud-right">
          <button className="g3-screenshot-btn" onClick={() => { document.exitPointerLock(); setOverlay("quest_log"); }} title="Quest Log (J)">📜</button>
          <div className="g3-props-badge">🏆 {propsCount.unlocked}/{propsCount.total}</div>
          <button className="g3-screenshot-btn" onClick={() => { setMusicOff(m => { const next = !m; setMusicMuted(next); return next; }); }} title="Toggle Music">{musicOff ? "🎵" : "🎶"}</button>
          <button className="g3-screenshot-btn" onClick={() => { setAudioMuted(m => { const next = !m; setMuted(next); return next; }); }} title="Mute All">{audioMuted ? "🔇" : "🔊"}</button>
          <button className="g3-screenshot-btn" onClick={takeScreenshot} title="Screenshot">📷</button>
        </div>
      </div>

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
        <ShelfBrowser genre={shelfGenre} open onClose={closeOverlay} onFilmClick={(id) => { setFilmId(id); setOverlay("film_detail"); }} />
      )}

      {/* Film Detail */}
      {overlay === "film_detail" && (
        <FilmDetailModal filmId={filmId} onClose={closeOverlay} onSelectFilm={(id) => setFilmId(id)} />
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
      {/* Quest notification toast */}
      {questNotification && (
        <div className="g3-quest-notif">{questNotification}</div>
      )}

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
            {/* Dialogue text */}
            <p className="g3-rpg-text">{rpgNode.text}</p>
            {/* Response choices */}
            <div className="g3-rpg-responses">
              {rpgNode.responses ? (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
