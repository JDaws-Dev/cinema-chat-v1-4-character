"use client";

/**
 * Canonical VHS tape state manager for Friday Night Video.
 *
 * This is the single source of truth for every tape's lifecycle:
 *   on_shelf -> held -> checked_out -> (rewound / unrewound) -> returned to on_shelf
 *
 * Persists to localStorage under 'fnv_vhs_state'.
 * Provides a React hook (useVHSState) for component integration.
 */

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ───────────────────────────────────────────────────

export type VHSTapeStatus =
  | "on_shelf"
  | "held"
  | "checked_out"
  | "rewound"
  | "unrewound";

export interface VHSTape {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  slotKey: string; // canonical shelf slot (e.g. "gondola-3:front:7")
  status: VHSTapeStatus;
  rentedAt?: number; // epoch ms, set on checkout
  rewound: boolean;
}

export interface VHSStateSnapshot {
  tapes: Record<string, VHSTape>; // keyed by slotKey
  version: number; // bump on every mutation for change detection
}

// ── Constants ───────────────────────────────────────────────

const STORAGE_KEY = "fnv_vhs_state";
const MAX_HELD = 5;

// ── Persistence helpers ─────────────────────────────────────

function loadState(): VHSStateSnapshot {
  if (typeof window === "undefined") return { tapes: {}, version: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VHSStateSnapshot;
      if (parsed && typeof parsed.version === "number" && parsed.tapes) {
        return parsed;
      }
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { tapes: {}, version: 0 };
}

function saveState(state: VHSStateSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked — fail silently
  }
}

// ── Pure state operations ───────────────────────────────────
// Each returns a new snapshot (immutable updates).

export function pickUpTape(
  state: VHSStateSnapshot,
  slotKey: string,
  movie: { id: number; title: string; posterUrl: string; genre: string }
): VHSStateSnapshot {
  const heldCount = Object.values(state.tapes).filter(
    (t) => t.status === "held"
  ).length;
  if (heldCount >= MAX_HELD) return state; // hands full

  const existing = state.tapes[slotKey];
  if (existing && existing.status !== "on_shelf") return state; // already taken

  const tape: VHSTape = {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    genre: movie.genre,
    slotKey,
    status: "held",
    rewound: false,
  };
  return {
    tapes: { ...state.tapes, [slotKey]: tape },
    version: state.version + 1,
  };
}

export function dropTape(
  state: VHSStateSnapshot,
  slotKey: string
): VHSStateSnapshot {
  const tape = state.tapes[slotKey];
  if (!tape || tape.status !== "held") return state;

  return {
    tapes: {
      ...state.tapes,
      [slotKey]: { ...tape, status: "on_shelf" },
    },
    version: state.version + 1,
  };
}

export function checkoutTapes(state: VHSStateSnapshot): VHSStateSnapshot {
  const now = Date.now();
  let changed = false;
  const nextTapes = { ...state.tapes };

  for (const key of Object.keys(nextTapes)) {
    const tape = nextTapes[key];
    if (tape.status === "held") {
      nextTapes[key] = {
        ...tape,
        status: "checked_out",
        rentedAt: now,
        rewound: false,
      };
      changed = true;
    }
  }

  if (!changed) return state;
  return { tapes: nextTapes, version: state.version + 1 };
}

export function returnTape(
  state: VHSStateSnapshot,
  slotKey: string
): VHSStateSnapshot {
  const tape = state.tapes[slotKey];
  if (!tape || tape.status === "on_shelf" || tape.status === "held")
    return state;

  return {
    tapes: {
      ...state.tapes,
      [slotKey]: {
        ...tape,
        status: "on_shelf",
        rentedAt: undefined,
        rewound: false,
      },
    },
    version: state.version + 1,
  };
}

export function rewindTape(
  state: VHSStateSnapshot,
  slotKey: string
): VHSStateSnapshot {
  const tape = state.tapes[slotKey];
  if (!tape) return state;
  if (tape.status !== "checked_out" && tape.status !== "unrewound") return state;
  if (tape.rewound) return state; // already rewound

  return {
    tapes: {
      ...state.tapes,
      [slotKey]: { ...tape, status: "rewound", rewound: true },
    },
    version: state.version + 1,
  };
}

// ── Query helpers ───────────────────────────────────────────

export function getHeldTapes(state: VHSStateSnapshot): VHSTape[] {
  return Object.values(state.tapes).filter((t) => t.status === "held");
}

export function getCheckedOutTapes(state: VHSStateSnapshot): VHSTape[] {
  return Object.values(state.tapes).filter(
    (t) =>
      t.status === "checked_out" ||
      t.status === "rewound" ||
      t.status === "unrewound"
  );
}

export function getShelfStatus(
  state: VHSStateSnapshot,
  slotKey: string
): VHSTapeStatus | "empty" {
  const tape = state.tapes[slotKey];
  return tape ? tape.status : "empty";
}

export function isSlotEmpty(
  state: VHSStateSnapshot,
  slotKey: string
): boolean {
  const tape = state.tapes[slotKey];
  return !tape || tape.status === "on_shelf";
}

export function getTape(
  state: VHSStateSnapshot,
  slotKey: string
): VHSTape | undefined {
  return state.tapes[slotKey];
}

// ── React hook ──────────────────────────────────────────────

export function useVHSState() {
  const [state, setState] = useState<VHSStateSnapshot>(() => loadState());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state.version]);

  // Listen for cross-tab changes
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as VHSStateSnapshot;
          if (parsed.version > stateRef.current.version) {
            setState(parsed);
          }
        } catch {
          // ignore bad data
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const doPickUp = useCallback(
    (
      slotKey: string,
      movie: { id: number; title: string; posterUrl: string; genre: string }
    ) => {
      setState((prev) => pickUpTape(prev, slotKey, movie));
    },
    []
  );

  const doDrop = useCallback((slotKey: string) => {
    setState((prev) => dropTape(prev, slotKey));
  }, []);

  const doCheckout = useCallback(() => {
    setState((prev) => checkoutTapes(prev));
  }, []);

  const doReturn = useCallback((slotKey: string) => {
    setState((prev) => returnTape(prev, slotKey));
  }, []);

  const doRewind = useCallback((slotKey: string) => {
    setState((prev) => rewindTape(prev, slotKey));
  }, []);

  return {
    state,
    // Mutations
    pickUpTape: doPickUp,
    dropTape: doDrop,
    checkoutTapes: doCheckout,
    returnTape: doReturn,
    rewindTape: doRewind,
    // Queries (bound to current state for convenience)
    heldTapes: getHeldTapes(state),
    checkedOutTapes: getCheckedOutTapes(state),
    getShelfStatus: (slotKey: string) => getShelfStatus(state, slotKey),
    isSlotEmpty: (slotKey: string) => isSlotEmpty(state, slotKey),
    getTape: (slotKey: string) => getTape(state, slotKey),
  };
}
