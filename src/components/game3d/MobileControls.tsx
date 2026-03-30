"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// Global input state that FirstPersonControls reads each frame
export const mobileInput = {
  moveX: 0, // -1 to 1 (left/right)
  moveZ: 0, // -1 to 1 (forward/backward)
  lookDeltaX: 0, // camera rotation delta this frame
  lookDeltaY: 0,
  interact: false,
};

const STICK_SIZE = 120;
const KNOB_SIZE = 48;
const DEAD_ZONE = 8;
const LOOK_SENSITIVITY = 2.5;

export function MobileControls({
  onInteract,
  hoverLabel,
}: {
  onInteract?: () => void;
  hoverLabel?: string | null;
}) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Dynamic stick positions — appear where you touch
  const [leftPos, setLeftPos] = useState<{ x: number; y: number } | null>(null);
  const [rightPos, setRightPos] = useState<{ x: number; y: number } | null>(null);

  // Left stick (movement)
  const leftKnobRef = useRef<HTMLDivElement>(null);
  const leftTouchId = useRef<number | null>(null);
  const leftCenter = useRef({ x: 0, y: 0 });

  // Right stick (look)
  const rightKnobRef = useRef<HTMLDivElement>(null);
  const rightTouchId = useRef<number | null>(null);
  const rightCenter = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  // Zero out look deltas each frame
  useEffect(() => {
    if (!isTouchDevice) return;
    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(() => {
        mobileInput.lookDeltaX = 0;
        mobileInput.lookDeltaY = 0;
        mobileInput.interact = false;
        raf = requestAnimationFrame(tick);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isTouchDevice]);

  const handleZoneStart = useCallback(
    (e: React.TouchEvent, side: "left" | "right") => {
      const touch = e.changedTouches[0];
      const touchIdRef = side === "left" ? leftTouchId : rightTouchId;
      const centerRef = side === "left" ? leftCenter : rightCenter;
      const setPos = side === "left" ? setLeftPos : setRightPos;

      if (touchIdRef.current !== null) return;
      touchIdRef.current = touch.identifier;
      centerRef.current = { x: touch.clientX, y: touch.clientY };
      setPos({ x: touch.clientX, y: touch.clientY });
    },
    []
  );

  const handleZoneMove = useCallback(
    (e: React.TouchEvent, side: "left" | "right") => {
      const touchIdRef = side === "left" ? leftTouchId : rightTouchId;
      const centerRef = side === "left" ? leftCenter : rightCenter;
      const knobRef = side === "left" ? leftKnobRef : rightKnobRef;
      const applyInput = side === "left"
        ? (nx: number, ny: number) => { mobileInput.moveX = nx; mobileInput.moveZ = -ny; }
        : (nx: number, ny: number) => { mobileInput.lookDeltaX = nx * LOOK_SENSITIVITY; mobileInput.lookDeltaY = ny * LOOK_SENSITIVITY; };

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== touchIdRef.current) continue;

        const dx = touch.clientX - centerRef.current.x;
        const dy = touch.clientY - centerRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = STICK_SIZE / 2;

        if (dist < DEAD_ZONE) {
          applyInput(0, 0);
          if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
          return;
        }

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const normDist = clampedDist / maxDist;
        applyInput(Math.cos(angle) * normDist, Math.sin(angle) * normDist);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        if (knobRef.current) {
          knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        }
      }
    },
    []
  );

  const handleZoneEnd = useCallback(
    (e: React.TouchEvent, side: "left" | "right") => {
      const touchIdRef = side === "left" ? leftTouchId : rightTouchId;
      const knobRef = side === "left" ? leftKnobRef : rightKnobRef;
      const setPos = side === "left" ? setLeftPos : setRightPos;
      const applyInput = side === "left"
        ? () => { mobileInput.moveX = 0; mobileInput.moveZ = 0; }
        : () => { mobileInput.lookDeltaX = 0; mobileInput.lookDeltaY = 0; };

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          applyInput();
          if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
          setPos(null); // hide the stick
        }
      }
    },
    []
  );

  const handleInteract = useCallback(() => {
    mobileInput.interact = true;
    onInteract?.();
  }, [onInteract]);

  if (!isTouchDevice) return null;

  return (
    <>
      {/* Left touch zone — left half of screen */}
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '40%', height: '100%', zIndex: 10, touchAction: 'none' }}
        onTouchStart={(e) => handleZoneStart(e, "left")}
        onTouchMove={(e) => handleZoneMove(e, "left")}
        onTouchEnd={(e) => handleZoneEnd(e, "left")}
        onTouchCancel={(e) => handleZoneEnd(e, "left")}
      />

      {/* Right touch zone — right half of screen */}
      <div
        style={{ position: 'fixed', top: 0, right: 0, width: '40%', height: '100%', zIndex: 10, touchAction: 'none' }}
        onTouchStart={(e) => handleZoneStart(e, "right")}
        onTouchMove={(e) => handleZoneMove(e, "right")}
        onTouchEnd={(e) => handleZoneEnd(e, "right")}
        onTouchCancel={(e) => handleZoneEnd(e, "right")}
      />

      {/* Dynamic left stick — appears at touch point */}
      {leftPos && (
        <div
          className="mobile-joystick"
          style={{ position: 'fixed', left: leftPos.x - STICK_SIZE / 2, top: leftPos.y - STICK_SIZE / 2, pointerEvents: 'none' }}
        >
          <div ref={leftKnobRef} className="mobile-joystick-knob" />
        </div>
      )}

      {/* Dynamic right stick — appears at touch point */}
      {rightPos && (
        <div
          className="mobile-joystick mobile-joystick-right"
          style={{ position: 'fixed', left: rightPos.x - STICK_SIZE / 2, top: rightPos.y - STICK_SIZE / 2, pointerEvents: 'none' }}
        >
          <div ref={rightKnobRef} className="mobile-joystick-knob" />
        </div>
      )}

      {/* Interact button — center bottom, only visible when something is interactable */}
      <button
        className="mobile-interact-btn"
        style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 11,
          padding: '14px 28px',
          fontSize: '1rem',
          fontWeight: 'bold',
          fontFamily: "'Courier New', monospace",
          background: 'rgba(255, 215, 0, 0.9)',
          color: '#0a1830',
          border: '2px solid #ffd700',
          borderRadius: 8,
          display: hoverLabel ? 'block' : 'none',
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
        onTouchStart={handleInteract}
      >
        TAP: {hoverLabel?.replace(/^\[E\] /, '').replace(/^\[F\] /, '') || 'Interact'}
      </button>
    </>
  );
}
