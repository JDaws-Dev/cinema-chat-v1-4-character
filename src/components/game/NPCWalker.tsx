"use client";

import { useState, useEffect, useRef } from "react";

// NPC visual variants
const NPC_VARIANTS = [
  { skin: "#d4a574", shirt: "#e74c3c", hair: "#2a1a0a" },
  { skin: "#c49a6c", shirt: "#3498db", hair: "#4a3020" },
  { skin: "#e8c4a0", shirt: "#2ecc71", hair: "#8b6914" },
  { skin: "#b8875c", shirt: "#9b59b6", hair: "#1a1a1a" },
  { skin: "#d4a574", shirt: "#e67e22", hair: "#5a3a1a" },
];

// Waypoint routes (percentage-based positions)
const ROUTES = [
  // Route 1: door → horror shelf → scifi → door
  [
    { left: 50, top: 92 },
    { left: 14, top: 70 },
    { left: 14, top: 30 },
    { left: 30, top: 30 },
    { left: 30, top: 70 },
    { left: 50, top: 92 },
  ],
  // Route 2: door → drama → action → door
  [
    { left: 50, top: 92 },
    { left: 62, top: 60 },
    { left: 14, top: 60 },
    { left: 14, top: 40 },
    { left: 50, top: 92 },
  ],
  // Route 3: door → new releases → counter → classics → door
  [
    { left: 50, top: 92 },
    { left: 62, top: 55 },
    { left: 45, top: 80 },
    { left: 30, top: 55 },
    { left: 50, top: 92 },
  ],
];

interface NPCProps {
  id: number;
  active: boolean;
}

function NPC({ id, active }: NPCProps) {
  const variant = NPC_VARIANTS[id % NPC_VARIANTS.length];
  const route = ROUTES[id % ROUTES.length];
  const [waypointIdx, setWaypointIdx] = useState(0);
  const [pos, setPos] = useState(route[0]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!active) return;

    setPos(route[0]);
    setWaypointIdx(0);

    timerRef.current = setInterval(() => {
      setWaypointIdx((prev) => {
        const next = (prev + 1) % route.length;
        setPos(route[next]);
        return next;
      });
    }, 3000 + id * 500);

    return () => clearInterval(timerRef.current);
  }, [active, id, route]);

  if (!active) return null;

  return (
    <div
      className="npc"
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="npc-body">
        <div className="npc-head" style={{ background: variant.skin }}>
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "50%",
              transform: "translateX(-50%)",
              width: 16,
              height: 5,
              background: variant.hair,
              borderRadius: "3px 3px 0 0",
            }}
          />
        </div>
        <div className="npc-torso" style={{ background: variant.shirt }} />
        <div className="npc-legs">
          <div className="npc-leg" />
          <div className="npc-leg" />
        </div>
      </div>
    </div>
  );
}

export function NPCWalkers() {
  const [activeNPCs, setActiveNPCs] = useState<number[]>([]);

  useEffect(() => {
    // Stagger NPC spawns
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setActiveNPCs((p) => [...p, 0]), 2000));
    timers.push(setTimeout(() => setActiveNPCs((p) => [...p, 1]), 5000));
    timers.push(setTimeout(() => setActiveNPCs((p) => [...p, 2]), 9000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      {[0, 1, 2].map((id) => (
        <NPC key={id} id={id} active={activeNPCs.includes(id)} />
      ))}
    </>
  );
}
