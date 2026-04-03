"use client";

import {
  QUOTES, SYNOPSES,
  getSeen,
  type QuoteChallenge, type SynopsisChallenge,
} from "@/lib/friday-night";

function pickRandom<T>(arr: T[], getId: (t: T) => string): T {
  const seen = getSeen();
  const avail = arr.filter(x => !seen.has(getId(x)));
  const pool = avail.length > 0 ? avail : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface QuizOverlayProps {
  mode: "quote" | "synopsis";
  quote: QuoteChallenge | null;
  synopsis: SynopsisChallenge | null;
  quizAnswer: number | null;
  setQuote: (q: QuoteChallenge | null) => void;
  setSynopsis: (s: SynopsisChallenge | null) => void;
  setQuizAnswer: (a: number | null) => void;
  handleQuizAnswer: (idx: number, correct: number, id: string) => void;
  closeOverlay: () => void;
}

export function QuizOverlay({
  mode, quote, synopsis, quizAnswer,
  setQuote, setSynopsis, setQuizAnswer,
  handleQuizAnswer, closeOverlay,
}: QuizOverlayProps) {
  if (mode === "quote" && quote) {
    return (
      <div className="g3-overlay g3-overlay-center">
        <div className="g3-overlay-header">
          <span className="g3-overlay-title">NAME THAT QUOTE</span>
          <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
        </div>
        <div className="g3-overlay-body">
          <div className="fnv-quote-display">&ldquo;{quote.quote}&rdquo;</div>
          <div className="fnv-options">
            {quote.options.map((opt, i) => (
              <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === quote.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                onClick={() => quizAnswer === null && handleQuizAnswer(i, quote.correctIndex, quote.id)} disabled={quizAnswer !== null}>
                <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
              </button>
            ))}
          </div>
          {quizAnswer !== null && (
            <>
              <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                <div className="fnv-vinny-avatar">V</div>
                <div className="fnv-vinny-text"><p>{quizAnswer === quote.correctIndex ? quote.vinnyRight : quote.vinnyWrong}</p></div>
              </div>
              <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setQuote(pickRandom(QUOTES, q => q.id)); setQuizAnswer(null); }}>Next Quote</button>
              <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (mode === "synopsis" && synopsis) {
    return (
      <div className="g3-overlay g3-overlay-center">
        <div className="g3-overlay-header">
          <span className="g3-overlay-title">BACK OF THE BOX</span>
          <button className="g3-overlay-close" onClick={closeOverlay}>✕</button>
        </div>
        <div className="g3-overlay-body">
          <div className="fnv-synopsis-display"><div className="fnv-synopsis-label">📼 TURN THE BOX OVER...</div><p>{synopsis.synopsis}</p></div>
          <div className="fnv-options">
            {synopsis.options.map((opt, i) => (
              <button key={i} className={`fnv-option ${quizAnswer !== null ? (i === synopsis.correctIndex ? "fnv-opt-correct" : i === quizAnswer ? "fnv-opt-wrong" : "fnv-opt-dim") : ""}`}
                onClick={() => quizAnswer === null && handleQuizAnswer(i, synopsis.correctIndex, synopsis.id)} disabled={quizAnswer !== null}>
                <span className="fnv-opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
              </button>
            ))}
          </div>
          {quizAnswer !== null && (
            <>
              <div className="fnv-vinny-greet fnv-vinny-small" style={{ marginTop: 16 }}>
                <div className="fnv-vinny-avatar">V</div>
                <div className="fnv-vinny-text"><p>{quizAnswer === synopsis.correctIndex ? synopsis.vinnyRight : synopsis.vinnyWrong}</p></div>
              </div>
              <button className="vf-btn vf-btn-primary" style={{ marginTop: 12 }} onClick={() => { setSynopsis(pickRandom(SYNOPSES, s => s.id)); setQuizAnswer(null); }}>Next Box</button>
              <button className="vf-btn vf-btn-ghost" onClick={closeOverlay}>Back to Store</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
