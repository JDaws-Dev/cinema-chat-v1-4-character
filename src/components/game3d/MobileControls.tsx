"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// Global input state that FirstPersonControls reads each frame
export const mobileInput = {
  moveX: 0, // -1 to 1 (left/right)
  moveZ: 0, // -1 to 1 (forward/backward)
  lookDeltaX: 0, // pixels of camera rotation this frame
  lookDeltaY: 0,
  interact: false,
};

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 48;
const DEAD_ZONE = 8;

export function MobileControls({
  onInteract,
}: {
  onInteract?: () => void;
}) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating joystick state
  const [joystickVisible, setJoystickVisible] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  // Reset look deltas each animation frame so they don't accumulate
  useEffect(() => {
    if (!isTouchDevice) return;
    let raf: number;
    const tick = () => {
      // Deltas are consumed by FirstPersonControls in useFrame, then we zero them
      // We zero after a frame so the useFrame callback has time to read them
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

  // ── Joystick handlers ──────────────────────────────────────
  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== joystickTouchId.current) continue;

        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = JOYSTICK_SIZE / 2;

        if (dist < DEAD_ZONE) {
          mobileInput.moveX = 0;
          mobileInput.moveZ = 0;
          if (knobRef.current) {
            knobRef.current.style.transform = "translate(-50%, -50%)";
          }
          return;
        }

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const normDist = clampedDist / maxDist;

        mobileInput.moveX = (Math.cos(angle) * normDist);
        mobileInput.moveZ = -(Math.sin(angle) * normDist); // flip: screen-up (negative dy) => positive moveZ (forward)

        // Move knob visual
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        if (knobRef.current) {
          knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        }
      }
    },
    []
  );

  const handleJoystickEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          mobileInput.moveX = 0;
          mobileInput.moveZ = 0;
          if (knobRef.current) {
            knobRef.current.style.transform = "translate(-50%, -50%)";
          }
          setJoystickVisible(false);
        }
      }
    },
    []
  );

  // ── Camera look handlers (right side of screen) ──────────────────
  const handleLookStart = useCallback(
    (e: React.TouchEvent) => {
      if (lookTouchId.current !== null) return;
      const touch = e.changedTouches[0];
      // Only handle look on the right portion of the screen
      if (touch.clientX <= window.innerWidth * 0.4) return;
      lookTouchId.current = touch.identifier;
      lastLookPos.current = { x: touch.clientX, y: touch.clientY };
    },
    []
  );

  const handleLookMove = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier !== lookTouchId.current) continue;
        if (!lastLookPos.current) return;

        mobileInput.lookDeltaX += touch.clientX - lastLookPos.current.x;
        mobileInput.lookDeltaY += touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    []
  );

  const handleLookEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId.current) {
          lookTouchId.current = null;
          lastLookPos.current = null;
        }
      }
    },
    []
  );

  // ── Unified touch handler for the full-screen overlay ──────
  const handleScreenTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      const isLeftHalf = touch.clientX < window.innerWidth / 2;

      if (isLeftHalf && joystickTouchId.current === null) {
        // Activate floating joystick at touch position
        joystickTouchId.current = touch.identifier;
        const origin = { x: touch.clientX, y: touch.clientY };
        joystickCenter.current = origin;
        setJoystickOrigin(origin);
        setJoystickVisible(true);
      } else {
        // Treat as camera look
        handleLookStart(e);
      }
    },
    [handleLookStart]
  );

  // ── Interact button ────────────────────────────────────────
  const handleInteract = useCallback(() => {
    mobileInput.interact = true;
    onInteract?.();
  }, [onInteract]);

  if (!isTouchDevice) return null;

  return (
    <>
      {/* Full-screen touch area — left half spawns joystick, right half controls camera */}
      <div
        className="mobile-look-area"
        onTouchStart={handleScreenTouchStart}
        onTouchMove={(e) => {
          handleJoystickMove(e);
          handleLookMove(e);
        }}
        onTouchEnd={(e) => {
          handleJoystickEnd(e);
          handleLookEnd(e);
        }}
        onTouchCancel={(e) => {
          handleJoystickEnd(e);
          handleLookEnd(e);
        }}
      />

      {/* Virtual joystick — floating, appears on left-side touch */}
      {joystickVisible && (
        <div
          ref={joystickRef}
          className="mobile-joystick"
          style={{
            position: 'fixed',
            left: joystickOrigin.x - JOYSTICK_SIZE / 2,
            top: joystickOrigin.y - JOYSTICK_SIZE / 2,
            bottom: 'auto',
          }}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
        >
          <div ref={knobRef} className="mobile-joystick-knob" />
        </div>
      )}

      {/* Interact button — bottom right */}
      <button
        className="mobile-interact-btn"
        onTouchStart={handleInteract}
      >
        Interact
      </button>
    </>
  );
}
