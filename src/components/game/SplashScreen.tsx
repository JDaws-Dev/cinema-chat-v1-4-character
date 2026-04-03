"use client";

import { unlockAudio } from "@/lib/audio";

interface SplashScreenProps {
  isMobile: boolean;
  onStart: () => void;
}

export function SplashScreen({ isMobile, onStart }: SplashScreenProps) {
  const handlePlay = () => {
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

  return (
    <div className="g3-splash" style={{ backgroundImage: 'url(/images/fnv-splash.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="g3-splash-content" style={{ background: 'rgba(10, 14, 24, 0.7)', padding: isMobile ? '24px 20px' : '40px 48px', borderRadius: 16, backdropFilter: 'blur(8px)' }}>
        <h1 className="g3-splash-title" style={{ fontSize: isMobile ? '2rem' : '3.2rem' }}>FRIDAY NIGHT<br/>VIDEO</h1>
        <p className="g3-splash-tagline" style={{ marginBottom: 20 }}>It&apos;s Friday night. Pick a movie.</p>
        <button className="g3-splash-btn" onClick={handlePlay}>PLAY FREE</button>
      </div>
    </div>
  );
}
