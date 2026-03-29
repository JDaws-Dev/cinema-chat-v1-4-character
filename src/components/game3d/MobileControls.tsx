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
const LOOK_SENSITIVITY = 2.5; // multiplier for look stick output

export function MobileControls({
  onInteract,
}: {
  onInteract?: () => void;
}) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

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

  // Zero out look deltas each frame (consumed by FirstPersonControls)
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

  // ── Generic stick handler factory ─────────────────────────
  const handleStickStart = useCallback(
    (
      e: React.TouchEvent,
      touchIdRef: React.MutableRefObject<number | null>,
      centerRef: React.MutableRefObject<{ x: number; y: number }>,
      stickElement: HTMLDivElement | null,
    ) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      if (stickElement) {
        const rect = stickElement.getBoundingClientRect();
        centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    },
    []
  );

  const handleStickMove = useCallback(
    (
      e: React.TouchEvent,
      touchIdRef: React.MutableRefObject<number | null>,
      centerRef: React.MutableRefObject<{ x: number; y: number }>,
      knobRef: React.RefObject<HTMLDivElement | null>,
      applyInput: (nx: number, ny: number) => void,
    ) => {
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
        const nx = Math.cos(angle) * normDist;
        const ny = Math.sin(angle) * normDist;

        applyInput(nx, ny);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        if (knobRef.current) {
          knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        }
      }
    },
    []
  );

  const handleStickEnd = useCallback(
    (
      e: React.TouchEvent,
      touchIdRef: React.MutableRefObject<number | null>,
      knobRef: React.RefObject<HTMLDivElement | null>,
      applyInput: (nx: number, ny: number) => void,
    ) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          applyInput(0, 0);
          if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
        }
      }
    },
    []
  );

  // ── Input appliers ────────────────────────────────────────
  const applyMove = useCallback((nx: number, ny: number) => {
    mobileInput.moveX = nx;
    mobileInput.moveZ = -ny; // screen-up = forward = positive moveZ
  }, []);

  const applyLook = useCallback((nx: number, ny: number) => {
    mobileInput.lookDeltaX = nx * LOOK_SENSITIVITY;
    mobileInput.lookDeltaY = ny * LOOK_SENSITIVITY;
  }, []);

  // ── Interact button ────────────────────────────────────────
  const handleInteract = useCallback(() => {
    mobileInput.interact = true;
    onInteract?.();
  }, [onInteract]);

  if (!isTouchDevice) return null;

  return (
    <>
      {/* Left thumbstick — movement (bottom-left) */}
      <div
        className="mobile-joystick"
        style={{ position: 'fixed', bottom: 32, left: 32 }}
        onTouchStart={(e) => handleStickStart(e, leftTouchId, leftCenter, e.currentTarget)}
        onTouchMove={(e) => handleStickMove(e, leftTouchId, leftCenter, leftKnobRef, applyMove)}
        onTouchEnd={(e) => handleStickEnd(e, leftTouchId, leftKnobRef, applyMove)}
        onTouchCancel={(e) => handleStickEnd(e, leftTouchId, leftKnobRef, applyMove)}
      >
        <div ref={leftKnobRef} className="mobile-joystick-knob" />
      </div>

      {/* Right thumbstick — camera look (bottom-right) */}
      <div
        className="mobile-joystick mobile-joystick-right"
        style={{ position: 'fixed', bottom: 32, right: 32, left: 'auto' }}
        onTouchStart={(e) => handleStickStart(e, rightTouchId, rightCenter, e.currentTarget)}
        onTouchMove={(e) => handleStickMove(e, rightTouchId, rightCenter, rightKnobRef, applyLook)}
        onTouchEnd={(e) => handleStickEnd(e, rightTouchId, rightKnobRef, applyLook)}
        onTouchCancel={(e) => handleStickEnd(e, rightTouchId, rightKnobRef, applyLook)}
      >
        <div ref={rightKnobRef} className="mobile-joystick-knob" />
      </div>

      {/* Interact button — center bottom */}
      <button
        className="mobile-interact-btn"
        style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', right: 'auto' }}
        onTouchStart={handleInteract}
      >
        Interact
      </button>
    </>
  );
}
