"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, unknown>,
      onProgress?: (p: number) => void,
    ) => Promise<UnityInstance>;
  }
}

interface UnityInstance {
  SendMessage: (gameObject: string, method: string, value?: string | number) => void;
  Quit: () => Promise<void>;
}

const PLAYER_OBJECT = "Main Camera";

export default function V2Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const unityRef = useRef<UnityInstance | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    return () => {
      document.body.style.margin = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const script = document.createElement("script");
    script.src = "/v2/Build/WebGL.loader.js";
    script.async = true;
    script.onload = async () => {
      if (!window.createUnityInstance) return;
      try {
        const instance = await window.createUnityInstance(
          canvas,
          {
            dataUrl: "/v2/Build/WebGL.data.br",
            frameworkUrl: "/v2/Build/WebGL.framework.js.br",
            codeUrl: "/v2/Build/WebGL.wasm.br",
            streamingAssetsUrl: "/v2/StreamingAssets",
            companyName: "FNV",
            productName: "Friday Night Video v2",
            productVersion: "0.1",
          },
          (p) => setProgress(p),
        );
        unityRef.current = instance;
        setLoaded(true);
      } catch (err) {
        console.error("Unity load failed", err);
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
      unityRef.current?.Quit().catch(() => {});
      unityRef.current = null;
    };
  }, [started]);

  // Joystick state
  const moveTouchId = useRef<number | null>(null);
  const moveOrigin = useRef<{ x: number; y: number } | null>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  function sendMove(nx: number, ny: number) {
    unityRef.current?.SendMessage(PLAYER_OBJECT, "TouchMove", `${nx.toFixed(3)},${ny.toFixed(3)}`);
  }

  function onMoveStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    moveTouchId.current = t.identifier;
    moveOrigin.current = { x: t.clientX, y: t.clientY };
    e.preventDefault();
  }
  function onMoveMove(e: React.TouchEvent) {
    if (moveTouchId.current === null || !moveOrigin.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== moveTouchId.current) continue;
      const dx = t.clientX - moveOrigin.current.x;
      const dy = t.clientY - moveOrigin.current.y;
      const max = 60;
      const cx = Math.max(-max, Math.min(max, dx));
      const cy = Math.max(-max, Math.min(max, dy));
      setStickPos({ x: cx, y: cy });
      // Unity forward = -Y on screen (up); right = +X
      sendMove(cx / max, -cy / max);
      e.preventDefault();
    }
  }
  function onMoveEnd(e: React.TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        moveTouchId.current = null;
        moveOrigin.current = null;
        setStickPos({ x: 0, y: 0 });
        sendMove(0, 0);
        e.preventDefault();
      }
    }
  }

  // Look pad state
  const lookTouchId = useRef<number | null>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  function onLookStart(e: React.TouchEvent) {
    const t = e.changedTouches[0];
    lookTouchId.current = t.identifier;
    lookLast.current = { x: t.clientX, y: t.clientY };
    e.preventDefault();
  }
  function onLookMove(e: React.TouchEvent) {
    if (lookTouchId.current === null || !lookLast.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== lookTouchId.current) continue;
      const dx = t.clientX - lookLast.current.x;
      const dy = t.clientY - lookLast.current.y;
      lookLast.current = { x: t.clientX, y: t.clientY };
      // Send pixel deltas — Unity script multiplies by lookSensitivity.
      // Mouse delta in Unity Input System has y-up; touch dy is y-down — flip.
      unityRef.current?.SendMessage(PLAYER_OBJECT, "TouchLook", `${dx.toFixed(2)},${(-dy).toFixed(2)}`);
      e.preventDefault();
    }
  }
  function onLookEnd(e: React.TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        lookLast.current = null;
        e.preventDefault();
      }
    }
  }

  function onJump() {
    unityRef.current?.SendMessage(PLAYER_OBJECT, "TouchJump");
  }

  function onInteract() {
    unityRef.current?.SendMessage(PLAYER_OBJECT, "TouchInteract");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        id="unity-canvas"
        style={{ width: "100vw", height: "100vh", display: "block", background: "#000" }}
      />

      {!started && (
        <button
          onClick={() => setStarted(true)}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, #1a2b5c 0%, #0a1530 45%, #050a1d 100%)",
            color: "#e8e3d5",
            border: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
            touchAction: "manipulation",
            padding: 0,
          }}
        >
          <div style={{ textAlign: "center", padding: "0 24px" }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.22em",
                color: "#f5c518",
                fontStyle: "italic",
                opacity: 0.85,
                marginBottom: 18,
                fontFamily: "'Didot', 'Bodoni 72', Georgia, serif",
              }}
            >
              NOW SHOWING — V2
            </div>
            <div
              style={{
                fontSize: "clamp(40px, 9vw, 88px)",
                fontWeight: 800,
                letterSpacing: "0.02em",
                lineHeight: 1,
                color: "#ffd700",
                textShadow: "0 2px 0 #1a1208, 0 8px 32px rgba(255,215,0,0.25)",
              }}
            >
              FRIDAY NIGHT
            </div>
            <div
              style={{
                fontSize: "clamp(28px, 6vw, 56px)",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#e8e3d5",
                marginTop: 4,
              }}
            >
              VIDEO
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 13,
                opacity: 0.7,
                letterSpacing: "0.06em",
              }}
            >
              {isTouch ? "TAP TO ENTER" : "CLICK TO ENTER"}
            </div>
            <div
              style={{
                marginTop: 64,
                fontSize: 11,
                opacity: 0.45,
                letterSpacing: "0.1em",
                fontStyle: "italic",
              }}
            >
              please be kind, rewind
            </div>
          </div>
        </button>
      )}

      {started && !loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#ffd700",
            fontFamily: "system-ui, sans-serif",
            background: "#111",
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>FRIDAY NIGHT VIDEO — v2</div>
            <div style={{ width: 240, height: 8, background: "#333", borderRadius: 4 }}>
              <div
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: "100%",
                  background: "#ffd700",
                  borderRadius: 4,
                  transition: "width 120ms linear",
                }}
              />
            </div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>{Math.round(progress * 100)}%</div>
          </div>
        </div>
      )}

      {loaded && isTouch && (
        <>
          {/* Look pad — right half */}
          <div
            onTouchStart={onLookStart}
            onTouchMove={onLookMove}
            onTouchEnd={onLookEnd}
            onTouchCancel={onLookEnd}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50vw",
              height: "100vh",
              touchAction: "none",
            }}
          />
          {/* Joystick — bottom left */}
          <div
            onTouchStart={onMoveStart}
            onTouchMove={onMoveMove}
            onTouchEnd={onMoveEnd}
            onTouchCancel={onMoveEnd}
            style={{
              position: "absolute",
              left: 24,
              bottom: 24,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,215,0,0.5)",
              touchAction: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 56,
                height: 56,
                marginLeft: -28,
                marginTop: -28,
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                borderRadius: "50%",
                background: "rgba(255,215,0,0.8)",
                pointerEvents: "none",
              }}
            />
          </div>
          {/* Interact button — primary action, biggest, bottom right */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
            }}
            style={{
              position: "absolute",
              right: 24,
              bottom: 24,
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "rgba(255,215,0,0.92)",
              color: "#111",
              border: "none",
              fontWeight: 800,
              fontSize: 15,
              fontFamily: "system-ui, sans-serif",
              touchAction: "none",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            GRAB
          </button>
          {/* Jump button — secondary, smaller, to left of interact */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJump();
            }}
            style={{
              position: "absolute",
              right: 130,
              bottom: 30,
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "2px solid rgba(255,255,255,0.4)",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
              touchAction: "none",
              zIndex: 10,
            }}
          >
            JUMP
          </button>
        </>
      )}
    </div>
  );
}
