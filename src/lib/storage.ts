"use client";

/**
 * Local storage fallback for message history and preferences.
 * This works without Convex — swap in Convex when deployment is ready.
 */

const MESSAGES_KEY = "vinny_messages";
const PREFS_KEY = "vinny_preferences";
const SESSION_KEY = "vinny_session_id";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface StoredPreference {
  key: string;
  value: string;
  source: string;
  learnedAt: number;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessage(msg: StoredMessage): void {
  if (typeof window === "undefined") return;
  const messages = getMessages();
  messages.push(msg);
  // Keep last 100 messages
  const trimmed = messages.slice(-100);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed));
}

export function getPreferences(): StoredPreference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setPreference(pref: StoredPreference): void {
  if (typeof window === "undefined") return;
  const prefs = getPreferences();
  const idx = prefs.findIndex((p) => p.key === pref.key);
  if (idx >= 0) {
    prefs[idx] = pref;
  } else {
    prefs.push(pref);
  }
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MESSAGES_KEY);
}
