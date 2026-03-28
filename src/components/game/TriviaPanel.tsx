"use client";

import { useState } from "react";
import type { TriviaQuestion } from "@/lib/game-data";

interface TriviaPanelProps {
  question: TriviaQuestion;
  onAnswer: (correct: boolean) => void;
  onDone: () => void;
}

export function TriviaPanel({ question, onAnswer, onDone }: TriviaPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handlePick = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    onAnswer(idx === question.correctIndex);
  };

  const correct = selected === question.correctIndex;

  return (
    <div className="dialogue-box dialogue-open">
      <div className="dialogue-top">
        <div className="dialogue-portrait">
          <div style={{ position: "relative", width: 32, height: 48, transform: "scale(1.2)" }}>
            <div className="v-hair" />
            <div className="v-head">
              <div className="v-eyes">
                <div className="v-eye"><div className="v-pupil" /></div>
                <div className="v-eye"><div className="v-pupil" /></div>
              </div>
              <div className="v-stache" />
            </div>
            <div className="v-shirt" />
            <div className="v-vest" />
          </div>
        </div>
        <div className="dialogue-text-area">
          <div className="dialogue-speaker">VINNY</div>
          {!answered ? (
            <div className="dialogue-text">
              Alright, pop quiz. {question.question}
            </div>
          ) : (
            <div className="dialogue-text">
              {correct ? question.vinnyReactCorrect : question.vinnyReactWrong}
              <div style={{ marginTop: "0.75rem" }}>
                <span className={`result-badge ${correct ? "result-great" : "result-bad"}`}>
                  {correct ? "★ Correct! +20 XP" : "✗ Wrong"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="trivia-options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            className={`trivia-option ${
              answered
                ? i === question.correctIndex
                  ? "trivia-correct"
                  : i === selected
                    ? "trivia-wrong"
                    : "trivia-dim"
                : ""
            }`}
            onClick={() => handlePick(i)}
            disabled={answered}
          >
            <span className="trivia-letter">{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <div className="dialogue-input-row">
          <button className="dialogue-send" onClick={onDone} style={{ width: "100%" }}>
            {correct ? "NICE — NEXT" : "ALRIGHT — MOVING ON"}
          </button>
        </div>
      )}
    </div>
  );
}
