"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import {
  PLAYER_START,
  isWalkable,
  getInteraction,
  getZoneName,
  gridToPercent,
  type Direction,
} from "@/lib/store-grid";

interface PlayerSpriteProps {
  onInteract: (type: string, genre?: string) => void;
  onZoneChange: (zone: string | null) => void;
  onMove: (x: number, y: number) => void;
  onDoor: () => void;
  disabled: boolean; // true when a panel is open
}

export function PlayerSprite({ onInteract, onZoneChange, onMove, onDoor, disabled }: PlayerSpriteProps) {
  const [pos, setPos] = useState(PLAYER_START);
  const [dir, setDir] = useState<Direction>("up");
  const [stepping, setStepping] = useState(false);
  const [showPrompt, setShowPrompt] = useState<string | null>(null);
  const moveInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const activeDir = useRef<Direction | null>(null);
  const keysDown = useRef(new Set<string>());
  const posRef = useRef(pos);
  posRef.current = pos;

  const tryMove = useCallback(
    (d: Direction) => {
      if (disabled) return;
      setDir(d);
      const { x, y } = posRef.current;
      const nx = d === "left" ? x - 1 : d === "right" ? x + 1 : x;
      const ny = d === "up" ? y - 1 : d === "down" ? y + 1 : y;
      if (isWalkable(nx, ny)) {
        setPos({ x: nx, y: ny });
        setStepping((s) => !s);
        onMove(nx, ny);
        // Check zone
        const zone = getZoneName(nx, ny);
        onZoneChange(zone);
        // Check interaction
        const inter = getInteraction(nx, ny);
        if (inter.type === "shelf") setShowPrompt("SPACE: Browse");
        else if (inter.type === "counter") setShowPrompt("SPACE: Talk to Vinny");
        else if (inter.type === "door") setShowPrompt("SPACE: Leave");
        else setShowPrompt(null);
      }
    },
    [disabled, onZoneChange]
  );

  const handleInteract = useCallback(() => {
    if (disabled) return;
    const inter = getInteraction(posRef.current.x, posRef.current.y);
    if (inter.type === "door") {
      onDoor();
    } else if (inter.type === "shelf") {
      onInteract("shelf", inter.genre);
    } else if (inter.type === "counter") {
      onInteract("counter");
    }
  }, [disabled, onInteract, onDoor]);

  // Keyboard input
  useEffect(() => {
    const stopMoving = () => {
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
        moveInterval.current = undefined;
      }
      activeDir.current = null;
    };

    const startMoving = (d: Direction) => {
      if (activeDir.current === d) return;
      stopMoving();
      activeDir.current = d;
      tryMove(d);
      moveInterval.current = setInterval(() => {
        if (activeDir.current === d) tryMove(d);
      }, 160);
    };

    const dirMap: Record<string, Direction> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
      W: "up", S: "down", A: "left", D: "right",
    };

    const handleDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      keysDown.current.add(e.key);
      const d = dirMap[e.key];
      if (d) {
        e.preventDefault();
        startMoving(d);
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleInteract();
      }
    };

    const handleUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
      const d = dirMap[e.key];
      if (d && activeDir.current === d) {
        // Check if another dir key still held
        const other = Object.entries(dirMap).find(
          ([key, dir]) => dir !== d && keysDown.current.has(key)
        );
        if (other) startMoving(other[1]);
        else stopMoving();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      stopMoving();
    };
  }, [tryMove, handleInteract]);

  const pct = gridToPercent(pos.x, pos.y);

  return (
    <>
      {/* Player character */}
      <div
        className={`player-sprite player-facing-${dir} ${stepping ? "player-step" : ""}`}
        style={{
          left: `${pct.left}%`,
          top: `${pct.top}%`,
        }}
      >
        <div className="player-body">
          {/* Hair */}
          <div className="p-hair" />
          {/* Head */}
          <div className="p-head">
            <div className="p-eyes">
              <div className="p-eye" />
              <div className="p-eye" />
            </div>
          </div>
          {/* Shirt */}
          <div className="p-shirt" />
          {/* Legs */}
          <div className="p-legs">
            <div className={`p-leg ${stepping ? "p-leg-step" : ""}`} />
            <div className={`p-leg ${stepping ? "" : "p-leg-step"}`} />
          </div>
        </div>

        {/* Interaction prompt */}
        {showPrompt && !disabled && (
          <div className="player-prompt">{showPrompt}</div>
        )}
      </div>

      {/* Mobile D-Pad */}
      <div className="mobile-dpad">
        <button className="dpad-btn dpad-up" onTouchStart={() => tryMove("up")}>▲</button>
        <button className="dpad-btn dpad-left" onTouchStart={() => tryMove("left")}>◀</button>
        <button className="dpad-btn dpad-right" onTouchStart={() => tryMove("right")}>▶</button>
        <button className="dpad-btn dpad-down" onTouchStart={() => tryMove("down")}>▼</button>
        <button className="dpad-btn dpad-action" onTouchStart={handleInteract}>A</button>
      </div>
    </>
  );
}
