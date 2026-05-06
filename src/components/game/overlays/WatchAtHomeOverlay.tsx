"use client";

import { useEffect, useRef, useState } from "react";
import { playVinnyLine, playSFX } from "@/lib/audio";

interface HeldMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  slotKey?: string;
}

interface WatchAtHomeOverlayProps {
  heldMovies: HeldMovie[];
  onComplete: () => void;
}

const REWIND_KEY = "fnv_last_rewound";

export function WatchAtHomeOverlay({ heldMovies, onComplete }: WatchAtHomeOverlayProps) {
  const [stage, setStage] = useState<"watching" | "afterCredits">("watching");
  const [decision, setDecision] = useState<"rewind" | "skip" | null>(null);
  const fired = useRef(false);

  // Vinny narrates the moment you walk in the door
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    playSFX("door_chime");
    setTimeout(() => {
      playVinnyLine(
        heldMovies.length === 1
          ? `Hope you enjoyed ${heldMovies[0].title}.`
          : "Hope you enjoyed the show.",
        "Vinny"
      );
    }, 600);
    // After 2.5s, advance to "credits rolling, what do you do?" stage
    const t = setTimeout(() => setStage("afterCredits"), 2500);
    return () => clearTimeout(t);
  }, [heldMovies]);

  const handleRewind = () => {
    setDecision("rewind");
    localStorage.setItem(REWIND_KEY, "true");
    playSFX("vhs_pickup");
    playVinnyLine("Thanks for rewinding. Vinny appreciates it.", "Vinny");
    setTimeout(onComplete, 1800);
  };

  const handleSkip = () => {
    setDecision("skip");
    localStorage.setItem(REWIND_KEY, "false");
    playVinnyLine("Aw, come on. Be kind, rewind. Don't be that guy.", "Vinny");
    setTimeout(onComplete, 2200);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% 60%, #1a1a2a 0%, #050510 100%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 32,
        fontFamily: "var(--font-pixel, monospace)",
        color: "#e0e0d8",
      }}
    >
      {/* Living room scene — stylized TV + couch */}
      <div
        style={{
          position: "relative",
          width: 480,
          maxWidth: "90vw",
          aspectRatio: "16 / 10",
          background: "#08080f",
          border: "4px solid #2a2a40",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(80, 60, 200, 0.25)",
        }}
      >
        {/* TV screen */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "55%",
            aspectRatio: "4 / 3",
            background: stage === "watching"
              ? "linear-gradient(180deg, #1a3a6a 0%, #2a5a9a 50%, #1a3a6a 100%)"
              : "#080808",
            border: "6px solid #1a1a1a",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffd700",
            fontSize: "0.75rem",
            textShadow: "0 0 6px #ffd700",
            transition: "background 0.6s",
          }}
        >
          {stage === "watching" ? (
            <span style={{ animation: "fnv-flicker 2.4s infinite" }}>NOW PLAYING</span>
          ) : (
            <span style={{ color: "#5a5a6a" }}>END OF FEATURE</span>
          )}
        </div>
        {/* Couch silhouette */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "32%",
            background: "linear-gradient(180deg, #6a3020 0%, #4a2010 100%)",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        />
        {/* Side lamp */}
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            right: "8%",
            width: 18,
            height: 32,
            background: "radial-gradient(circle at 50% 30%, #ffd28a 0%, #cc9050 60%, transparent 100%)",
            opacity: 0.8,
          }}
        />
      </div>

      {/* Captions */}
      {stage === "watching" && (
        <div style={{ fontSize: "0.7rem", color: "#888", letterSpacing: 1 }}>
          AT HOME · Friday Night
        </div>
      )}

      {stage === "afterCredits" && !decision && (
        <>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ color: "#ffd700", fontSize: "0.95rem", marginBottom: 8 }}>
              The credits roll.
            </div>
            <div style={{ fontSize: "0.65rem", color: "#aaa", lineHeight: 1.6 }}>
              {heldMovies.length === 1
                ? `You watched ${heldMovies[0].title}.`
                : `You watched ${heldMovies.length} ${heldMovies.length === 1 ? "movie" : "movies"} tonight.`}
              <br />
              Time to think about returning the {heldMovies.length === 1 ? "tape" : "tapes"}.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleRewind}
              style={btnPrimary}
            >
              ↺ Be kind, rewind
            </button>
            <button
              onClick={handleSkip}
              style={btnSecondary}
            >
              Just toss it on the counter
            </button>
          </div>
        </>
      )}

      {decision === "rewind" && (
        <div style={{ color: "#ffd700", fontSize: "0.9rem", textAlign: "center" }}>
          ↺ Rewinding... <br />
          <span style={{ fontSize: "0.6rem", color: "#888" }}>Vinny will remember this.</span>
        </div>
      )}
      {decision === "skip" && (
        <div style={{ color: "#cc6644", fontSize: "0.9rem", textAlign: "center" }}>
          You drop the tape on the counter and head home. <br />
          <span style={{ fontSize: "0.6rem", color: "#888" }}>Vinny noticed.</span>
        </div>
      )}

      <style>{`
        @keyframes fnv-flicker {
          0%, 100% { opacity: 0.92; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: "0.7rem",
  fontFamily: "var(--font-pixel, monospace)",
  background: "#ffd700",
  color: "#000",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  letterSpacing: 1,
};

const btnSecondary: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: "0.7rem",
  fontFamily: "var(--font-pixel, monospace)",
  background: "transparent",
  color: "#aaa",
  border: "2px solid #444",
  cursor: "pointer",
  letterSpacing: 1,
};
