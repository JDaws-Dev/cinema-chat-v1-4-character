"use client";

interface TutorialOverlayProps {
  onDismiss: () => void;
}

export function TutorialOverlay({ onDismiss }: TutorialOverlayProps) {
  return (
    <div className="g3-tutorial-overlay">
      <div className="g3-tutorial-box">
        <h2 className="g3-tutorial-title">WELCOME TO FRIDAY NIGHT VIDEO</h2>
        <ul className="g3-tutorial-tips">
          <li>Walk into the store and browse the shelves</li>
          <li>Pick up movies and bring them to Vinny at the counter</li>
          <li>Talk to customers &mdash; they might need your help</li>
          <li>Have fun &mdash; it&apos;s Friday night!</li>
        </ul>
        <button className="g3-tutorial-btn" onClick={() => { localStorage.setItem('fnv_has_visited', '1'); onDismiss(); }}>
          GOT IT
        </button>
      </div>
    </div>
  );
}
