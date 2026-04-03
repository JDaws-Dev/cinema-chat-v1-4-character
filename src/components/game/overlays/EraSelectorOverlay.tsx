"use client";

import { getTotalXP, getMembershipTier } from "@/lib/game-state";

export interface EraOption {
  id: string;
  label: string;
  years: string;
  displayYear: string;
}

interface EraSelectorOverlayProps {
  eraOptions: EraOption[];
  onSelectEra: (eraId: string) => void;
  addNotification: (text: string) => void;
  setShowTutorial: (show: boolean) => void;
}

export function EraSelectorOverlay({ eraOptions, onSelectEra, addNotification, setShowTutorial }: EraSelectorOverlayProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
        <h2 style={{ color: '#ffd700', fontFamily: 'var(--font-pixel, monospace)', fontSize: '0.8rem', marginBottom: 12, letterSpacing: '0.1em', textShadow: '2px 2px 0 #000' }}>CHOOSE YOUR ERA</h2>
        <p style={{ color: '#888', fontSize: '0.45rem', marginBottom: 20, fontFamily: 'var(--font-pixel, monospace)' }}>What year is it tonight?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eraOptions.map(opt => (
            <button key={opt.id} onClick={() => {
              onSelectEra(opt.id);
              if (!localStorage.getItem('fnv_has_visited')) {
                setShowTutorial(true);
              } else {
                const xp = getTotalXP();
                const tier = getMembershipTier();
                addNotification(`WELCOME BACK — ${tier.name} Member | ${xp} XP`);
              }
            }}
              style={{
                padding: '12px 16px', fontSize: '0.5rem', fontFamily: 'var(--font-pixel, monospace)',
                border: '3px solid #ffd700', background: 'transparent', color: '#ffd700',
                borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                boxShadow: '4px 4px 0 rgba(0,0,0,0.6)', transition: 'all 0.1s steps(2)',
              }}>
              <strong>{opt.label}</strong> <span style={{ opacity: 0.5, fontSize: '0.4rem' }}>({opt.years})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
