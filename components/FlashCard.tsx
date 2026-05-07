"use client";

import { useState } from "react";
import type { Phrase } from "@/lib/types";
import type { Quality } from "@/lib/sm2";
import SpeechButton from "./SpeechButton";
import MicButton from "./MicButton";

interface FlashCardProps {
  phrase: Phrase;
  dueCount: number;
  totalCount: number;
  onResult: (id: string, quality: Quality) => void;
  onNext: () => void;
}

type Stage = "practice" | "answered";

const qualityButtons: { quality: Quality; label: string; hint: string; color: string }[] = [
  { quality: 1, label: "No lo supe",  hint: "vuelve hoy",    color: "bg-red-700 hover:bg-red-600" },
  { quality: 3, label: "Difícil",     hint: "+1 día",        color: "bg-orange-600 hover:bg-orange-500" },
  { quality: 4, label: "Bien",        hint: "intervalo ×EF", color: "bg-indigo-600 hover:bg-indigo-500" },
  { quality: 5, label: "Fácil",       hint: "intervalo ×EF+", color: "bg-emerald-600 hover:bg-emerald-500" },
];

export default function FlashCard({ phrase, dueCount, totalCount, onResult, onNext }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [stage, setStage] = useState<Stage>("practice");
  const [spokenCorrect, setSpokenCorrect] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  function handleSpeechResult(correct: boolean, spokenText: string) {
    setSpokenCorrect(correct);
    setTranscript(spokenText);
    setFlipped(true);
    setStage("answered");
    onResult(phrase.id, correct ? 5 : 1);
  }

  function handleQuality(quality: Quality) {
    onResult(phrase.id, quality);
    handleNext();
  }

  function handleReveal() {
    setFlipped(true);
    setStage("answered");
  }

  function handleNext() {
    setFlipped(false);
    setStage("practice");
    setSpokenCorrect(null);
    setTranscript(null);
    onNext();
  }

  const nextReview = phrase.next_review_date;
  const isNew = phrase.repetitions === 0;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto">

      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${totalCount ? ((totalCount - dueCount) / totalCount) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {dueCount} pendiente{dueCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Badge */}
      <div className="flex gap-2 items-center">
        {phrase.category && (
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {phrase.category}
          </span>
        )}
        {isNew && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700">
            Nueva
          </span>
        )}
        {!isNew && (
          <span className="text-xs text-slate-500">
            Rev. #{phrase.repetitions} · próxima: {nextReview}
          </span>
        )}
      </div>

      {/* Card */}
      <div
        className="perspective w-full cursor-pointer"
        style={{ height: 220 }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className={`card-inner ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div className="card-front rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug">{phrase.english}</p>
            <p className="text-xs text-slate-500 mt-4">toca para ver traducción</p>
          </div>
          {/* Back */}
          <div className="card-back rounded-2xl bg-indigo-900 border border-indigo-700 flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug text-indigo-100">{phrase.spanish}</p>
            <p className="text-xs text-indigo-400 mt-4">traducción</p>
          </div>
        </div>
      </div>

      {/* Speech feedback */}
      {transcript && (
        <div className={`w-full rounded-xl px-4 py-2.5 text-sm text-center border ${
          spokenCorrect
            ? "bg-emerald-900/50 border-emerald-700 text-emerald-300"
            : "bg-red-900/50 border-red-700 text-red-300"
        }`}>
          {spokenCorrect ? "✅ ¡Correcto!" : "❌ Incorrecto"}{" "}
          <span className="opacity-75">— dijiste: "{transcript}"</span>
        </div>
      )}

      {/* Action buttons */}
      {stage === "practice" && (
        <div className="flex gap-3 flex-wrap justify-center">
          <SpeechButton text={phrase.english} />
          <MicButton expected={phrase.english} onResult={handleSpeechResult} />
          <button
            onClick={handleReveal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
          >
            Ver traducción
          </button>
        </div>
      )}

      {/* Quality buttons — shown after answering */}
      {stage === "answered" && (
        spokenCorrect !== null ? (
          <div className="w-full flex justify-center">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium"
            >
              Siguiente →
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm text-slate-300 text-center mb-1 font-medium">{phrase.english}</p>
            <div className="grid grid-cols-4 gap-2">
              {qualityButtons.map(({ quality, label, hint, color }) => (
                <button
                  key={quality}
                  onClick={() => handleQuality(quality)}
                  className={`${color} flex flex-col items-center py-2.5 px-1 rounded-xl transition text-xs font-medium`}
                >
                  <span>{label}</span>
                  <span className="opacity-60 text-[10px] mt-0.5">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Stats row */}
      <div className="flex gap-5 text-xs text-slate-500">
        <span>✅ {phrase.correct_count}</span>
        <span>❌ {phrase.incorrect_count}</span>
        <span>⏱ intervalo: {phrase.interval}d</span>
        <span>EF: {phrase.ease_factor.toFixed(1)}</span>
      </div>
    </div>
  );
}
