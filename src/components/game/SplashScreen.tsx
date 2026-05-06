"use client";

import { useState, useEffect } from "react";
import { unlockAudio } from "@/lib/audio";

interface SplashScreenProps {
  isMobile: boolean;
  onStart: () => void;
}

const EMAIL_KEY = "fnv_user_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SplashScreen({ isMobile, onStart }: SplashScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(EMAIL_KEY) : null;
    if (stored && EMAIL_RE.test(stored)) {
      setSavedEmail(stored);
      setEmail(stored);
    }
  }, []);

  const handlePlay = () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Hey now, that doesn't look like an email.");
      return;
    }
    localStorage.setItem(EMAIL_KEY, trimmed);
    onStart();
    unlockAudio();
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      try {
        const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
        if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); }
        else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      } catch {}
    }
  };

  const handleSwitchAccount = () => {
    setSavedEmail(null);
    setEmail("");
    localStorage.removeItem(EMAIL_KEY);
  };

  return (
    <div className="g3-splash" style={{ backgroundImage: 'url(/images/fnv-splash.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div
        className="g3-splash-content"
        style={{
          background: 'rgba(10, 14, 24, 0.78)',
          padding: isMobile ? '24px 20px' : '40px 48px',
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
          maxWidth: 440,
          width: '92vw',
        }}
      >
        <h1 className="g3-splash-title" style={{ fontSize: isMobile ? '2rem' : '3.2rem' }}>FRIDAY NIGHT<br/>VIDEO</h1>
        <p className="g3-splash-tagline" style={{ marginBottom: 18 }}>It&apos;s Friday night. Pick a movie.</p>

        {savedEmail ? (
          <>
            <div style={{ color: '#ddd', fontSize: '0.7rem', marginBottom: 14, fontFamily: 'var(--font-pixel, monospace)' }}>
              Welcome back, <span style={{ color: '#ffd700' }}>{savedEmail}</span>
            </div>
            <button className="g3-splash-btn" onClick={handlePlay}>ENTER THE STORE</button>
            <button
              onClick={handleSwitchAccount}
              style={{
                marginTop: 12,
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '0.55rem',
                fontFamily: 'var(--font-pixel, monospace)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <label
              htmlFor="fnv-email"
              style={{
                display: 'block',
                color: '#aaa',
                fontSize: '0.6rem',
                marginBottom: 6,
                fontFamily: 'var(--font-pixel, monospace)',
                letterSpacing: 1,
              }}
            >
              MEMBERSHIP EMAIL
            </label>
            <input
              id="fnv-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePlay(); }}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                fontFamily: 'var(--font-pixel, monospace)',
                background: 'rgba(0, 0, 0, 0.7)',
                border: error ? '2px solid #cc2222' : '2px solid rgba(255, 215, 0, 0.4)',
                color: '#e0e0e0',
                outline: 'none',
                borderRadius: 4,
                marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ color: '#cc6644', fontSize: '0.55rem', marginBottom: 10, fontFamily: 'var(--font-pixel, monospace)' }}>
                {error}
              </div>
            )}
            <button className="g3-splash-btn" onClick={handlePlay}>PLAY FREE</button>
            <div style={{ marginTop: 14, color: '#666', fontSize: '0.5rem', fontFamily: 'var(--font-pixel, monospace)', lineHeight: 1.6 }}>
              Just for save state. We won&apos;t spam you.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
