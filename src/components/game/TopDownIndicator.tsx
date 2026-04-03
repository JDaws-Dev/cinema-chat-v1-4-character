"use client";

interface TopDownIndicatorProps {
  isMobile: boolean;
  onExit: () => void;
}

export function TopDownIndicator({ isMobile, onExit }: TopDownIndicatorProps) {
  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
      background: 'rgba(10, 14, 24, 0.9)', border: '1px solid #ffd700', borderRadius: 8,
      padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: "'Courier New', monospace", color: '#ffd700', fontSize: '0.85rem',
    }}>
      <span>TOP-DOWN VIEW</span>
      <button onClick={onExit} style={{
        background: '#ffd700', color: '#0a0e18', border: 'none', borderRadius: 4,
        padding: '4px 12px', fontFamily: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem',
      }}>
        {isMobile ? 'EXIT' : 'T to exit'}
      </button>
    </div>
  );
}
