"use client";

import { useState, useEffect, useCallback } from "react";
import type { CustomerRequest } from "@/lib/game-data";

interface CustomerRequestProps {
  request: CustomerRequest;
  onPickGenre: (genre: string) => void;
  onDismiss: () => void;
  result: "great" | "ok" | "bad" | null;
}

export function CustomerRequestUI({ request, onPickGenre, onDismiss, result }: CustomerRequestProps) {
  const [phase, setPhase] = useState<"talking" | "browsing" | "result">("talking");

  useEffect(() => {
    if (result) setPhase("result");
  }, [result]);

  const handleStartBrowsing = useCallback(() => {
    setPhase("browsing");
  }, []);

  if (phase === "result" && result) {
    return (
      <div className="dialogue-box dialogue-open">
        <div className="dialogue-top">
          <div className="dialogue-portrait">
            <div className="customer-portrait" />
          </div>
          <div className="dialogue-text-area">
            <div className="dialogue-speaker" style={{ color: "#60a5fa" }}>CUSTOMER</div>
            <div className="dialogue-text">{request.reactions[result]}</div>
            <div style={{ marginTop: "0.75rem" }}>
              <span className={`result-badge result-${result}`}>
                {result === "great" ? "★ Great Pick! +30 XP" : result === "ok" ? "◆ Okay Pick +10 XP" : "✗ Bad Pick"}
              </span>
            </div>
          </div>
        </div>
        <div className="dialogue-input-row">
          <button className="dialogue-send" onClick={onDismiss} style={{ width: "100%" }}>
            NEXT CUSTOMER
          </button>
        </div>
      </div>
    );
  }

  if (phase === "browsing") {
    return (
      <div className="request-hud">
        <div className="request-hud-text">
          📋 {request.hint}
        </div>
        <div className="request-hud-sub">
          Walk to a shelf and press SPACE to pick a film
        </div>
      </div>
    );
  }

  // Talking phase — customer introduces their request
  return (
    <div className="dialogue-box dialogue-open">
      <div className="dialogue-top">
        <div className="dialogue-portrait">
          <div className="customer-portrait" />
        </div>
        <div className="dialogue-text-area">
          <div className="dialogue-speaker" style={{ color: "#60a5fa" }}>CUSTOMER</div>
          <div className="dialogue-text">{request.dialogue}</div>
        </div>
      </div>
      <div className="dialogue-input-row">
        <button className="dialogue-send" onClick={handleStartBrowsing} style={{ width: "100%" }}>
          ON IT — LET ME FIND SOMETHING
        </button>
      </div>
    </div>
  );
}
