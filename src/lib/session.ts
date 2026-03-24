"use client";

const SESSION_KEY = "vinny_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
