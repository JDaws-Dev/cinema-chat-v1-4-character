"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { setSubtitleHandler, setMuted, setMusicMuted } from "@/lib/audio";

export function useAudioUI() {
  const [audioMuted, setAudioMuted] = useState(false);
  const [musicOff, setMusicOff] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const subtitleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Wire subtitle handler on mount
  useEffect(() => {
    setSubtitleHandler((text, duration) => {
      setSubtitle(text);
      if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
      subtitleTimer.current = setTimeout(() => setSubtitle(null), duration);
    });
  }, []);

  const toggleMute = useCallback(() => {
    setAudioMuted((m) => {
      const next = !m;
      setMuted(next);
      setMusicMuted(next);
      return next;
    });
  }, []);

  return { audioMuted, musicOff, setMusicOff, subtitle, setSubtitle, toggleMute };
}
