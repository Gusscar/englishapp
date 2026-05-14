"use client";

import { useState, useEffect } from "react";
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
  onContextSave: (id: string, context: string) => Promise<void>;
}

type Stage = "practice" | "answered";

const qualityButtons: { quality: Quality; label: string; hint: string; color: string; icon: string }[] = [
  { quality: 1, label: "No lo supe",  hint: "vuelve hoy",    color: "bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300",     icon: "✗"  },
  { quality: 3, label: "Difícil",     hint: "+1 día",        color: "bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300", icon: "~"  },
  { quality: 4, label: "Bien",        hint: "×intervalo",    color: "bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300", icon: "✓"  },
  { quality: 5, label: "Fácil",       hint: "×intervalo+",   color: "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300", icon: "★" },
];

export default function FlashCard({ phrase, dueCount, totalCount, onResult, onNext, onContextSave }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [stage, setStage] = useState<Stage>("practice");
  const [spokenCorrect, setSpokenCorrect] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState(false);
  const [editTip, setEditTip] = useState("");
  const [editExamples, setEditExamples] = useState<string[]>([]);
  const [savingContext, setSavingContext] = useState(false);

  useEffect(() => {
    setFlipped(false);
    setStage("practice");
    setSpokenCorrect(null);
    setTranscript(null);
    setEditingContext(false);
  }, [phrase.id]);

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

  function handleRetry() {
    setFlipped(false);
    setStage("practice");
    setSpokenCorrect(null);
    setTranscript(null);
  }

  function handleNext() {
    setFlipped(false);
    setStage("practice");
    setSpokenCorrect(null);
    setTranscript(null);
    onNext();
  }

  const isNew = phrase.repetitions === 0;
  const progressPct = totalCount ? ((totalCount - dueCount) / totalCount) * 100 : 0;

  let parsedContext: { tip: string; examples: string[] } | null = null;
  try {
    if (phrase.context) parsedContext = JSON.parse(phrase.context);
  } catch { /* ignore */ }

  function handleEditContext() {
    if (!parsedContext) return;
    setEditTip(parsedContext.tip);
    setEditExamples([...parsedContext.examples]);
    setEditingContext(true);
  }

  async function handleSaveContext() {
    setSavingContext(true);
    const newContext = JSON.stringify({ tip: editTip, examples: editExamples.filter(e => e.trim()) });
    await onContextSave(phrase.id, newContext);
    setSavingContext(false);
    setEditingContext(false);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">

      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">
          {dueCount} pendiente{dueCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Badge row */}
      <div className="flex gap-2 items-center self-start">
        {phrase.category && (
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            {phrase.category}
          </span>
        )}
        {isNew ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-violet-900/50 text-violet-300 border border-violet-700/50 font-semibold">
            Nueva
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Rep. #{phrase.repetitions} · próx: {phrase.next_review_date}
          </span>
        )}
      </div>

      {/* Flip Card */}
      <div
        className="perspective w-full cursor-pointer"
        style={{ height: 240 }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className={`card-inner ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div className="card-front rounded-3xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/60 shadow-xl flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug tracking-tight">{phrase.english}</p>
            {!flipped && (
              <p className="text-xs text-slate-500 mt-5 flex items-center gap-1.5">
                <span className="opacity-60">toca para ver</span>
              </p>
            )}
          </div>
          {/* Back */}
          <div className="card-back rounded-3xl bg-gradient-to-br from-indigo-900 to-indigo-900/80 border border-indigo-700/60 shadow-xl flex flex-col items-center justify-center p-8 select-none">
            <p className="text-2xl font-semibold text-center leading-snug text-indigo-100 tracking-tight">{phrase.spanish}</p>
            <p className="text-xs text-indigo-400/70 mt-5 font-medium">{phrase.english}</p>
          </div>
        </div>
      </div>

      {/* User notes */}
      {flipped && phrase.notes && (
        <div className="w-full rounded-2xl bg-slate-800/60 border border-slate-700/50 px-4 py-3 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tu ejemplo</p>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{phrase.notes}</p>
        </div>
      )}

      {/* AI Context */}
      {flipped && parsedContext && (
        <div className="w-full rounded-2xl bg-amber-950/30 border border-amber-800/30 px-4 py-3 flex flex-col gap-2.5">
          {!editingContext ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">Como lo usan los nativos</p>
                <button
                  onClick={handleEditContext}
                  className="text-xs text-slate-500 hover:text-slate-300 transition px-2 py-0.5 rounded-lg hover:bg-slate-700/50"
                >
                  Editar
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{parsedContext.tip}</p>
              {parsedContext.examples?.length > 0 && (
                <div className="flex flex-col gap-2 mt-0.5">
                  {parsedContext.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-400 whitespace-pre-line border-l-2 border-amber-700/50 pl-3 leading-relaxed font-mono"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">Editando contexto</p>
              <div>
                <p className="text-xs text-slate-400 mb-1">Consejo</p>
                <textarea
                  value={editTip}
                  onChange={(e) => setEditTip(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-slate-700/80 border border-slate-600/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-600/50 resize-none"
                />
              </div>
              {editExamples.map((ex, i) => (
                <div key={i}>
                  <p className="text-xs text-slate-400 mb-1">Ejemplo {i + 1}</p>
                  <textarea
                    value={ex}
                    onChange={(e) => {
                      const next = [...editExamples];
                      next[i] = e.target.value;
                      setEditExamples(next);
                    }}
                    rows={3}
                    className="w-full rounded-xl bg-slate-700/80 border border-slate-600/60 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-600/50 resize-none"
                  />
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingContext(false)}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600/80 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContext}
                  disabled={savingContext}
                  className="text-xs px-3 py-2 rounded-xl bg-amber-700/80 hover:bg-amber-600/80 disabled:opacity-60 transition font-medium"
                >
                  {savingContext ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speech feedback */}
      {transcript && (
        <div className={`w-full rounded-2xl px-4 py-3 text-sm border ${
          spokenCorrect
            ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-300"
            : "bg-red-900/30 border-red-700/50 text-red-300"
        }`}>
          <span className="font-semibold">{spokenCorrect ? "Correcto" : "Incorrecto"}</span>
          <span className="opacity-70 ml-2 text-xs">dijiste: "{transcript}"</span>
        </div>
      )}

      {/* Action buttons */}
      {stage === "practice" && (
        <div className="flex gap-3 flex-wrap justify-center w-full">
          <SpeechButton text={phrase.english} />
          <MicButton expected={phrase.english} onResult={handleSpeechResult} />
          <button
            onClick={handleReveal}
            className="flex-1 min-w-[120px] px-5 py-3 rounded-2xl bg-slate-700/80 hover:bg-slate-600/80 active:scale-95 transition-all text-sm font-semibold border border-slate-600/40"
          >
            Ver traduccion
          </button>
        </div>
      )}

      {/* Quality buttons */}
      {stage === "answered" && (
        spokenCorrect !== null ? (
          <div className="w-full flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-700/80 hover:bg-slate-600/80 active:scale-95 transition-all text-sm font-semibold border border-slate-600/40"
            >
              Repetir
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm font-semibold shadow-lg shadow-indigo-900/40"
            >
              Siguiente
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <p className="text-sm text-slate-400 text-center font-medium">{phrase.english}</p>
            <div className="grid grid-cols-2 gap-2">
              {qualityButtons.map(({ quality, label, hint, color }) => (
                <button
                  key={quality}
                  onClick={() => handleQuality(quality)}
                  className={`${color} flex flex-col items-center py-3.5 px-2 rounded-2xl active:scale-95 transition-all text-sm font-semibold`}
                >
                  <span>{label}</span>
                  <span className="opacity-50 text-[11px] mt-0.5 font-normal">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-slate-600 pt-1">
        <span className="text-emerald-700">{phrase.correct_count} correctas</span>
        <span className="text-red-800">{phrase.incorrect_count} errores</span>
        <span>intervalo {phrase.interval}d</span>
        <span>EF {phrase.ease_factor.toFixed(1)}</span>
      </div>
    </div>
  );
}
