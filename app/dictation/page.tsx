"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { applySM2, todayISO, type Quality } from "@/lib/sm2";
import { similarity, diffWords } from "@/lib/similarity";
import type { Phrase } from "@/lib/types";

function buildQueue(phrases: Phrase[]): Phrase[] {
  const today = todayISO();
  const due = [...phrases.filter((p) => p.next_review_date <= today)]
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  const upcoming = [...phrases.filter((p) => p.next_review_date > today)]
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  return [...due, ...upcoming];
}

function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

const qualityButtons: { quality: Quality; label: string; color: string }[] = [
  { quality: 1, label: "No lo supe",  color: "bg-red-700 hover:bg-red-600" },
  { quality: 3, label: "Difícil",     color: "bg-orange-600 hover:bg-orange-500" },
  { quality: 4, label: "Bien",        color: "bg-indigo-600 hover:bg-indigo-500" },
  { quality: 5, label: "Fácil",       color: "bg-emerald-600 hover:bg-emerald-500" },
];

type Stage = "listening" | "answered";

export default function DictationPage() {
  const [phrases, setPhrases]   = useState<Phrase[]>([]);
  const [queue, setQueue]       = useState<Phrase[]>([]);
  const [index, setIndex]       = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [typed, setTyped]       = useState("");
  const [stage, setStage]       = useState<Stage>("listening");
  const [score, setScore]       = useState(0);
  const [speed, setSpeed]       = useState(0.85);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadPhrases() {
    const { data } = await supabase
      .from("phrases")
      .select("*")
      .order("created_at", { ascending: false });
    const today = todayISO();
    const list = (data ?? []).map((p: Phrase) => ({
      ...p,
      interval:         p.interval         ?? 1,
      ease_factor:      p.ease_factor       ?? 2.5,
      repetitions:      p.repetitions       ?? 0,
      next_review_date: p.next_review_date  ?? today,
      correct_count:    p.correct_count     ?? 0,
      incorrect_count:  p.incorrect_count   ?? 0,
    }));
    setPhrases(list);
    setQueue(buildQueue(list));
    setDueCount(list.filter((p: Phrase) => p.next_review_date <= today).length);
    setLoading(false);
  }

  useEffect(() => { loadPhrases(); }, []);

  // Auto-play when card changes
  const current = queue[index];
  useEffect(() => {
    if (!current || stage !== "listening") return;
    const t = setTimeout(() => speak(current.english, speed), 400);
    return () => clearTimeout(t);
  }, [current?.id, stage]); // eslint-disable-line

  // Focus input when listening
  useEffect(() => {
    if (stage === "listening") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage, index]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.trim() || !current) return;
    const s = similarity(typed, current.english);
    setScore(s);
    setStage("answered");
  }

  const handleResult = useCallback(async (quality: Quality) => {
    if (!current) return;
    const newState = applySM2(
      { interval: current.interval, ease_factor: current.ease_factor,
        repetitions: current.repetitions, next_review_date: current.next_review_date },
      quality
    );
    const correct = quality >= 3;
    const updates = {
      ...newState,
      correct_count: current.correct_count + (correct ? 1 : 0),
      incorrect_count: current.incorrect_count + (correct ? 0 : 1),
    };
    await supabase.from("phrases").update(updates).eq("id", current.id);
    setPhrases((prev) => prev.map((p) => (p.id === current.id ? { ...p, ...updates } : p)));

    const today = todayISO();
    if (correct && newState.next_review_date > today)
      setDueCount((n) => Math.max(0, n - 1));

    // Next card
    setTyped("");
    setStage("listening");
    setIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) { setQueue(buildQueue(phrases)); return 0; }
      return next;
    });
  }, [current, phrases, queue.length]);

  const diff = stage === "answered" && current ? diffWords(typed, current.english) : [];
  const pct = Math.round(score * 100);
  const isGood = score >= 0.85;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Cargando…</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="text-2xl">🎧</span>
        <h1 className="font-bold text-lg">Modo Dictado</h1>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${phrases.length ? ((phrases.length - dueCount) / phrases.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{dueCount} pendientes</span>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!current ? (
          <p className="text-slate-400">No hay frases.</p>
        ) : (
          <div className="w-full max-w-lg flex flex-col gap-6">

            {/* Card */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-8 flex flex-col items-center gap-4 min-h-36">
              {stage === "listening" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-indigo-900 border-2 border-indigo-600 flex items-center justify-center text-3xl animate-pulse">
                    🎧
                  </div>
                  <p className="text-slate-400 text-sm">Escucha y escribe lo que oyes</p>
                  {current.category && (
                    <span className="text-xs text-indigo-400">{current.category}</span>
                  )}
                </>
              ) : (
                <>
                  {/* Result */}
                  <div className={`text-4xl font-bold ${isGood ? "text-emerald-400" : "text-red-400"}`}>
                    {pct}%
                  </div>
                  <p className="text-slate-300 text-lg font-semibold text-center">{current.english}</p>
                  <p className="text-slate-500 text-sm text-center">{current.spanish}</p>

                  {/* Word diff */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {diff.map((w, i) => (
                      <span
                        key={i}
                        className={`text-sm px-2 py-0.5 rounded ${
                          w.status === "correct"
                            ? "bg-emerald-900/60 text-emerald-300"
                            : "bg-red-900/60 text-red-300 line-through"
                        }`}
                      >
                        {w.word}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Speed controls */}
            {stage === "listening" && (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xs text-slate-500">Velocidad:</span>
                {[["Lenta", 0.6], ["Normal", 0.85], ["Rápida", 1.1]].map(([label, rate]) => (
                  <button
                    key={rate}
                    onClick={() => { setSpeed(rate as number); speak(current.english, rate as number); }}
                    className={`text-xs px-3 py-1 rounded-lg transition ${
                      speed === rate
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => speak(current.english, speed)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                >
                  🔊 Repetir
                </button>
              </div>
            )}

            {/* Input */}
            {stage === "listening" && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Escribe lo que escuchaste…"
                  className="flex-1 rounded-xl bg-slate-700 border border-slate-600 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!typed.trim()}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition font-medium"
                >
                  ✓
                </button>
              </form>
            )}

            {/* Quality buttons */}
            {stage === "answered" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-400 text-center">¿Cómo te fue?</p>
                <div className="grid grid-cols-4 gap-2">
                  {qualityButtons.map(({ quality, label, color }) => (
                    <button
                      key={quality}
                      onClick={() => handleResult(quality)}
                      className={`${color} py-2.5 rounded-xl text-xs font-medium transition`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Replay after answered */}
            {stage === "answered" && (
              <button
                onClick={() => speak(current.english, speed)}
                className="text-sm text-slate-400 hover:text-white transition text-center"
              >
                🔊 Escuchar de nuevo
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
