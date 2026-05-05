"use client";

import { useState } from "react";
import type { Phrase } from "@/lib/types";
import SpeechButton from "./SpeechButton";
import MicButton from "./MicButton";

interface FlashCardProps {
  phrase: Phrase;
  onResult: (id: string, correct: boolean) => void;
  onNext: () => void;
}

type Feedback = "correct" | "incorrect" | null;

export default function FlashCard({ phrase, onResult, onNext }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  function handleSpeechResult(correct: boolean, spokenText: string) {
    setFeedback(correct ? "correct" : "incorrect");
    setTranscript(spokenText);
    onResult(phrase.id, correct);
    if (correct) setFlipped(true);
  }

  function handleNext() {
    setFlipped(false);
    setFeedback(null);
    setTranscript(null);
    onNext();
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {phrase.category && (
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
          {phrase.category}
        </span>
      )}

      {/* Card */}
      <div
        className="perspective w-full"
        style={{ height: 240 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`card-inner cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div className="card-front rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug">
              {phrase.english}
            </p>
            <p className="text-xs text-slate-500 mt-4">toca para ver traducción</p>
          </div>

          {/* Back */}
          <div className="card-back rounded-2xl bg-indigo-900 border border-indigo-700 flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug text-indigo-100">
              {phrase.spanish}
            </p>
            <p className="text-xs text-indigo-400 mt-4">traducción</p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`w-full rounded-xl px-5 py-3 text-center font-semibold text-sm ${
            feedback === "correct"
              ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
              : "bg-red-900/60 text-red-300 border border-red-700"
          }`}
        >
          {feedback === "correct" ? "✅ ¡Correcto!" : "❌ Incorrecto"}{" "}
          {transcript && (
            <span className="font-normal opacity-80">— dijiste: "{transcript}"</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <SpeechButton text={phrase.english} />
        {!feedback && (
          <MicButton expected={phrase.english} onResult={handleSpeechResult} />
        )}
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition font-medium text-sm"
        >
          Siguiente →
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm text-slate-500">
        <span>✅ {phrase.correct_count}</span>
        <span>❌ {phrase.incorrect_count}</span>
      </div>
    </div>
  );
}
