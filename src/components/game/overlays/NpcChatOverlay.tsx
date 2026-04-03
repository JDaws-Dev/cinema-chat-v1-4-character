"use client";

import type { NpcChatTarget, NpcChatMessage } from "@/hooks/useDialogue";

interface NpcChatOverlayProps {
  npcChatTarget: NpcChatTarget;
  npcChatMessages: NpcChatMessage[];
  npcChatInput: string;
  npcChatLoading: boolean;
  setNpcChatInput: (val: string) => void;
  handleNpcChatSend: () => void;
  closeOverlay: () => void;
}

export function NpcChatOverlay({
  npcChatTarget, npcChatMessages, npcChatInput, npcChatLoading,
  setNpcChatInput, handleNpcChatSend, closeOverlay,
}: NpcChatOverlayProps) {
  return (
    <div className="g3-overlay">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">{npcChatTarget.name.toUpperCase()}</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>{"\u2715"}</button>
      </div>
      <div className="g3-overlay-body" style={{ display: 'flex', flexDirection: 'column', maxHeight: '50vh' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
          {npcChatMessages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'player' ? 'flex-end' : 'flex-start',
              background: m.role === 'player' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${m.role === 'player' ? '#ffd700' : 'rgba(255,255,255,0.15)'}`,
              padding: '8px 12px',
              maxWidth: '80%',
              fontSize: '0.5rem',
              fontFamily: 'var(--font-pixel, monospace)',
              color: '#e0e0e0',
            }}>
              {m.role === 'npc' && <span style={{ color: '#ffd700', display: 'block', marginBottom: 4, fontSize: '0.4rem' }}>{npcChatTarget.name}</span>}
              {m.text}
            </div>
          ))}
          {npcChatLoading && <div style={{ color: '#888', fontSize: '0.4rem', fontFamily: 'var(--font-pixel, monospace)' }}>...</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '2px solid rgba(255,215,0,0.2)' }}>
          <input
            type="text"
            value={npcChatInput}
            onChange={e => setNpcChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNpcChatSend(); }}
            placeholder={`Say something to ${npcChatTarget.name}...`}
            disabled={npcChatLoading}
            autoFocus
            style={{
              flex: 1, padding: '8px 12px', fontSize: '16px',
              fontFamily: 'var(--font-pixel, monospace)',
              background: 'rgba(0,0,0,0.8)', color: '#e0e0e0',
              border: '2px solid rgba(255,215,0,0.3)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleNpcChatSend}
            disabled={npcChatLoading || !npcChatInput.trim()}
            style={{
              padding: '8px 16px', fontSize: '0.5rem',
              fontFamily: 'var(--font-pixel, monospace)',
              background: '#ffd700', color: '#000', border: 'none',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >SEND</button>
        </div>
      </div>
    </div>
  );
}
