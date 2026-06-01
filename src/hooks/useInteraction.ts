import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ShelfBrowseState } from "@/components/game/overlays/ShelfOverlay";
import type { Overlay } from "./useOverlay";
import {
  QUOTES, SYNOPSES,
  getSeen,
  type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";
import { loadGameState, recordChallengeCompletion, getPropsCount, PROPS, unlockProp, completeObjective, completeQuest, getActiveSideQuests, getNpcRelationship, type MovieProp } from "@/lib/game-state";
import { playRandomLine, playVinnyLine, playSFX } from "@/lib/audio";
import { getRandomDialogue, getVinnyTierGreeting, generateTriviaDialogue, getRelationshipGreeting, type DialogueTree, type DialogueNode } from "@/lib/npc-dialogues";
import { PERSONALITIES, getRandomPersonality, type PersonalityType } from "@/lib/npc-personalities";
import { buildCustomerDialogue } from "@/lib/npc-customer-dialogues";
import { buildTonyDialogue, buildEarlDialogue } from "@/lib/npc-strip-mall-dialogues";
import { setActiveDialogueTarget } from "@/components/game3d/store-characters";
import { isNpcHostile } from "@/lib/sentiment";

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface HeldMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  slotKey?: string;
}

interface Challenge {
  movies: { title: string; genre: string }[];
  startTime: number;
  type?: string;
}

interface MysteryClue {
  movieTitle: string;
  hints: string[];
}

interface UseInteractionParams {
  overlay: Overlay;
  heldMovies: HeldMovie[];
  challenge: Challenge | null;
  mysteryClue: MysteryClue | null;
  mysteryHintsUsed: number;
  currentTier: { name: string };
  totalXP: number;
  era: string;
  setHeldSnacks: (fn: (prev: { name: string; emoji: string }[]) => { name: string; emoji: string }[]) => void;
  setPickupFlash: (v: boolean) => void;
  setPickupTitle: (v: string | null) => void;
  setPendingPickup: Dispatch<SetStateAction<{ id: number; title: string; posterUrl: string; slotKey?: string } | null>>;
  setFilmId: (v: number | null) => void;
  setOverlay: (v: Overlay) => void;
  setMysteryHintsUsed: (fn: (h: number) => number) => void;
  setMysteryClue: (v: null) => void;
  setMysteryWrongMsg: (v: string | null) => void;
  setHeldMovies: (v: HeldMovie[]) => void;
  setPropsCount: Dispatch<SetStateAction<{ unlocked: number; total: number }>>;
  setChallengeComplete: Dispatch<SetStateAction<number | null>>;
  setChallenge: (v: null) => void;
  setRewardProp: Dispatch<SetStateAction<MovieProp | null>>;
  setQuote: (v: QuoteChallenge | null) => void;
  setSynopsis: (v: SynopsisChallenge | null) => void;
  setQuizAnswer: (v: number | null) => void;
  setRpgDialogue: (v: DialogueTree | null) => void;
  setRpgNode: (v: DialogueNode | null) => void;
  setRpgHistory: (v: { speaker: string; portrait?: string; text: string }[]) => void;
  setNpcChatTarget: (v: { name: string; personalityType: string; npcManagerId: string } | null) => void;
  setShelfBrowse: (v: ShelfBrowseState | null) => void;
  trackQuestNpcTalk: (npc: string) => void;
  trackQuestGenreVisit: (genre: string) => void;
  trackQuestMoviePickup: (title: string, genre: string) => void;
  handleTierUp: (result: { tierUp: boolean; newTier: string } | null) => void;
  triggerXpPopup: (xp: number) => void;
  showQuestNotif: (msg: string) => void;
  startPuzzle: () => void;
  onEnterBackrooms: () => void;
}

export function useInteraction(params: UseInteractionParams) {
  const {
    overlay, heldMovies, challenge, mysteryClue, mysteryHintsUsed,
    currentTier, totalXP, era,
    setHeldSnacks, setPickupFlash, setPickupTitle, setPendingPickup,
    setFilmId, setOverlay, setMysteryHintsUsed, setMysteryClue,
    setMysteryWrongMsg, setHeldMovies, setPropsCount, setChallengeComplete,
    setChallenge, setRewardProp, setQuote, setSynopsis, setQuizAnswer,
    setRpgDialogue, setRpgNode, setRpgHistory, setNpcChatTarget,
    setShelfBrowse,
    trackQuestNpcTalk, trackQuestGenreVisit,
    handleTierUp, triggerXpPopup, showQuestNotif, startPuzzle,
    onEnterBackrooms,
  } = params;

  const handleInteract = useCallback((type: string, data?: string) => {
    if (overlay !== "none") return;

    if (type === "employees_door") {
      playSFX("door_open");
      onEnterBackrooms();
      return;
    }

    if (type === "snack" && data) {
      try {
        const snack = JSON.parse(data);
        setHeldSnacks(prev => {
          if (prev.some(s => s.name === snack.name)) return prev;
          if (prev.length >= 5) return prev;
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
      trackQuestNpcTalk("charlie");
      document.exitPointerLock();
      const tree = Math.random() < 0.3 ? generateTriviaDialogue() : getRandomDialogue("charlie");
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
      if (mysteryClue && heldMovies.length > 0) {
        const match = heldMovies.some(m =>
          m.title.toLowerCase().includes(mysteryClue.movieTitle.toLowerCase()) ||
          mysteryClue.movieTitle.toLowerCase().includes(m.title.toLowerCase())
        );
        if (match) {
          setMysteryClue(null);
          setMysteryWrongMsg(null);
          setHeldMovies([]);
          recordChallengeCompletion("vinnys_mystery", 0);
          const state = loadGameState();
          setPropsCount(getPropsCount());
          setChallengeComplete(0);
          playRandomLine("challenge_complete");
          document.exitPointerLock();
          return;
        } else {
          setMysteryWrongMsg("That's not it... keep looking!");
          setTimeout(() => setMysteryWrongMsg(null), 2500);
          return;
        }
      }
      if (challenge && heldMovies.length > 0) {
        const found = challenge.movies.filter(cm =>
          heldMovies.some(m => m.title.toLowerCase() === cm.title.toLowerCase())
        );
        if (found.length === challenge.movies.length) {
          const elapsed = Math.round((Date.now() - challenge.startTime) / 1000);
          setChallengeComplete(elapsed);
          setChallenge(null);
          setHeldMovies([]);
          const cType = challenge.type || "movie_night";
          recordChallengeCompletion(cType, elapsed);
          const state = loadGameState();
          const count = state.challengeCompletions["movie_night"] || 0;
          const milestones: Record<number, string> = { 1: "nike_mags", 2: "gizmo", 3: "golden_ticket", 4: "neuralyzer", 5: "proton_pack", 7: "amber_cane", 8: "briefcase", 10: "hoverboard", 15: "one_ring", 20: "wilson" };
          const propId = milestones[count];
          if (propId && !state.unlockedProps.includes(propId)) {
            unlockProp(propId);
            const prop = PROPS.find(p => p.id === propId);
            if (prop) setRewardProp(prop);
          }
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
      // Open the Vinny menu — lets the player choose checkout, chat, challenge,
      // freeform recommendation, or quest log instead of being force-routed to
      // checkout whenever they happen to be holding a tape.
      // Rewind callback: if last visit ended without rewinding, Vinny calls it out.
      const lastRewound = typeof window !== "undefined" ? localStorage.getItem("fnv_last_rewound") : null;
      if (lastRewound === "false") {
        playVinnyLine("Hey, you didn't rewind last time. C'mon. Be kind.", "Vinny");
        localStorage.setItem("fnv_last_rewound", "acknowledged");
      } else {
        playRandomLine("greetings");
      }
      setOverlay("vinny_menu");
    } else if (type === "customer") {
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

      if (npcManagerId && isNpcHostile(npcManagerId)) {
        playVinnyLine("...", npcName || "Customer");
        // Removed: setSubtitleHandler no-op override. It clobbered the global
        // subtitle callback set by useAudioUI and silenced subtitles for the
        // rest of the session after a single hostile-customer interaction.
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
      // Freeform chat unlocked from minute one — was gated behind 500 XP, but
      // freeform chat is the killer feature; gating it behind grinding hurt MVP.
      const canFreeChat = true;

      const personalityTree = buildCustomerDialogue(personality, npcName, relLevel, canFreeChat, era);

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
      const tonyTree = buildTonyDialogue();
      setRpgDialogue(tonyTree);
      setRpgNode(tonyTree.opener);
      setRpgHistory([{ speaker: tonyTree.opener.speaker, portrait: tonyTree.opener.portrait, text: tonyTree.opener.text }]);
      setActiveDialogueTarget("pizza_clerk");
      setOverlay("rpg_dialogue");
    } else if (type === "laundro_clerk") {
      const earlTree = buildEarlDialogue();
      setRpgDialogue(earlTree);
      setRpgNode(earlTree.opener);
      setRpgHistory([{ speaker: earlTree.opener.speaker, portrait: earlTree.opener.portrait, text: earlTree.opener.text }]);
      setActiveDialogueTarget("laundro_clerk");
      setOverlay("rpg_dialogue");
    } else if (type === "return_slot") {
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
      if (challenge) return;
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

      // Drop-where-they-belong: if the player is holding any tape whose genre
      // matches THIS shelf, return those tapes to their original slots and skip
      // the browse overlay. Tapes that don't belong stay in hand.
      const shelfGenreKey = (browseState.genre || "").toLowerCase();
      const matching = heldMovies.filter(
        (m) => (m.genre || "").toLowerCase() === shelfGenreKey,
      );
      if (matching.length > 0) {
        const remaining = heldMovies.filter(
          (m) => !matching.some((mm) => mm.id === m.id),
        );
        setHeldMovies(remaining);
        playSFX("vhs_pickup");
        const label = (browseState.label || browseState.genre || "shelf").toUpperCase();
        const titles = matching.map((m) => m.title).join(", ");
        // Reuse the quest-notif channel — it surfaces a transient toast.
        showQuestNotif(`Put ${matching.length === 1 ? "back" : `${matching.length} tapes back`} on ${label}: ${titles}`);
        return;
      }
      // Hint when player has tapes but none belong to this shelf.
      if (heldMovies.length > 0) {
        const label = (browseState.label || browseState.genre || "this shelf").toUpperCase();
        showQuestNotif(`Those tapes don't belong on ${label}.`);
      }

      setShelfBrowse(browseState);
      setOverlay("shelf");
      trackQuestGenreVisit(browseState.genre);
    } else if (type === "tv") {
      startPuzzle();
    } else if (type === "apartment_door") {
      // Teleport player from stair landing INTO apartment interior
      const tp = (window as unknown as Record<string, unknown>).__teleportPlayer as
        ((x: number, y: number, z: number, lx?: number, lz?: number) => void) | undefined;
      if (tp) {
        playSFX("door_chime");
        tp(14.5, 3.7 + 1.6, 5.5, 13, 4.3); // inside apt near door, facing center
      }
    } else if (type === "apartment_exit") {
      // Teleport player from apartment back to stair landing
      const tp = (window as unknown as Record<string, unknown>).__teleportPlayer as
        ((x: number, y: number, z: number, lx?: number, lz?: number) => void) | undefined;
      if (tp) {
        playSFX("door_chime");
        tp(16.8, 3.7 + 1.6, 0.8, 16.8, 6); // on landing, facing down stairs
      }
    }
  }, [overlay, heldMovies, challenge, mysteryClue, mysteryHintsUsed, currentTier, totalXP, era,
      setHeldSnacks, setPickupFlash, setPickupTitle, setPendingPickup, setFilmId, setOverlay,
      setMysteryHintsUsed, setMysteryClue, setMysteryWrongMsg, setHeldMovies, setPropsCount,
      setChallengeComplete, setChallenge, setRewardProp, setQuote, setSynopsis, setQuizAnswer,
      setRpgDialogue, setRpgNode, setRpgHistory, setNpcChatTarget, setShelfBrowse,
      trackQuestNpcTalk, trackQuestGenreVisit, handleTierUp, triggerXpPopup, showQuestNotif, startPuzzle,
      onEnterBackrooms]);

  return handleInteract;
}
