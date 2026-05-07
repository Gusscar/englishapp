"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { applySM2, todayISO, type Quality } from "@/lib/sm2";
import { similarity, diffWords, normalize } from "@/lib/similarity";
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

function scoreToQuality(score: number): Quality {
  if (score >= 0.9) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.5) return 3;
  return 1;
}

function buildHint(text: string): string {
  return normalize(text)
    .split(" ")
    .map((w) => w[0] + "_".repeat(Math.max(0, w.length - 1)))
    .join("  ");
}

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
  const [showHint, setShowHint] = useState(false);
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

  const current = queue[index];

  // Auto-play when card changes
  useEffect(() => {
    if (!current || stage !== "listening") return;
    const t = setTimeout(() => speak(current.english, speed), 400);
    return () => clearTimeout(t);
  }, [current?.id, stage]); // eslint-disable-line

  // Focus input
  useEffect(() => {
    if (stage === "listening") setTimeout(() => inputRef.current?.focus(), 120);
  }, [stage, index]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.trim() || !current) return;
    setScore(similarity(typed, current.english));
    setStage("answered");
  }

  const handleNext = useCallback(async () => {
    if (!current) return;
    const quality = scoreToQuality(score);
    const newState = applySM2(
      { interval: current.interval, ease_factor: current.ease_factor,
        repetitions: current.repetitions, next_review_date: current.next_review_date },
      quality
    );
    const correct = quality >= 3;
    const updates = {
      ...newState,
      correct_count:   current.correct_count   + (correct ? 1 : 0),
      incorrect_count: current.incorrect_count + (correct ? 0 : 1),
    };
    await supabase.from("phrases").update(updates).eq("id", current.id);
    setPhrases((prev) => prev.map((p) => (p.id === current.id ? { ...p, ...updates } : p)));

    const today = todayISO();
    if (correct && newState.next_review_date > today)
      setDueCount((n) => Math.max(0, n - 1));

    setTyped("");
    setShowHint(false);
    setStage("listening");
    setIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) { setQueue(buildQueue(phrases)); return 0; }
      return next;
    });
  }, [current, score, phrases, queue.length]);

  const diff = stage === "answered" && current ? diffWords(typed, current.english) : [];
  const pct  = Math.round(score * 100);
  const isGood = score >= 0.75;

  // Score ring color
  const ringColor = score >= 0.9
    ? "text-emerald-400"
    : score >= 0.75
    ? "text-indigo-400"
    : score >= 0.5
    ? "text-orange-400"
    : "text-red-400";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Cargando…</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎧</span>
          <h1 className="font-bold text-lg">Escuchar y escribir</h1>
        </div>
        <span className="text-xs text-slate-400">{dueCount} pendientes</span>
      </header>

      {/* Progress bar */}
      <div className="px-5">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-lg mx-auto">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${phrases.length ? ((phrases.length - dueCount) / phrases.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {!current ? (
          <p className="text-slate-400">No hay frases.</p>
        ) : (
          <div className="w-full max-w-lg flex flex-col gap-5">

            {/* ── Listening stage ── */}
            {stage === "listening" && (
              <>
                <div className="rounded-2xl bg-slate-800 border border-slate-700 p-8 flex flex-col items-center gap-4">
                  <button
                    onClick={() => speak(current.english, speed)}
                    className="w-20 h-20 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center text-4xl active:scale-95 transition hover:bg-indigo-800"
                  >
                    🔊
                  </button>
                  <p className="text-slate-400 text-sm text-center">
                    Toca para escuchar · escribe lo que oyes
                  </p>
                  {current.category && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-800">
                      {current.category}
                    </span>
                  )}
                </div>

                {/* Speed */}
                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <span className="text-xs text-slate-500">Velocidad:</span>
                  {([["Lenta", 0.6], ["Normal", 0.85], ["Rápida", 1.1]] as [string, number][]).map(([label, rate]) => (
                    <button
                      key={rate}
                      onClick={() => { setSpeed(rate); speak(current.english, rate); }}
                      className={`text-xs px-3 py-1 rounded-lg transition ${
                        speed === rate
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Hint */}
                {showHint ? (
                  <p className="text-center text-sm font-mono tracking-widest text-indigo-300 bg-indigo-900/30 rounded-xl px-4 py-2 border border-indigo-800/50">
                    {buildHint(current.english)}
                  </p>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition text-center"
                  >
                    Ver pista
                  </button>
                )}

                {/* Input */}
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
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition font-semibold text-lg"
                  >
                    ✓
                  </button>
                </form>
              </>
            )}

            {/* ── Answered stage ── */}
            {stage === "answered" && (
              <>
                {/* Score */}
                <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 flex flex-col items-center gap-4">
                  <div className={`text-5xl font-bold ${ringColor}`}>
                    {pct}%
                  </div>
                  <p className="text-xs text-slate-500 -mt-2">
                    {pct >= 90 ? "¡Perfecto!" : pct >= 75 ? "¡Muy bien!" : pct >= 50 ? "Casi…" : "Sigue practicando"}
                  </p>

                  {/* Correct answer */}
                  <div className="w-full rounded-xl bg-slate-900/60 px-4 py-3 text-center">
                    <p className="text-lg font-semibold text-white">{current.english}</p>
                    <p className="text-sm text-slate-400 mt-1">{current.spanish}</p>
                  </div>

                  {/* Word diff */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {diff.map((w, i) => (
                      <span
                        key={i}
                        className={`text-sm px-2.5 py-0.5 rounded-lg font-mono ${
                          w.status === "correct"
                            ? "bg-emerald-900/60 text-emerald-300"
                            : w.status === "missing"
                            ? "bg-yellow-900/40 text-yellow-400 italic"
                            : "bg-red-900/60 text-red-300 line-through"
                        }`}
                      >
                        {w.word}
                        {w.status === "missing" && " ←"}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Your answer */}
                <p className="text-xs text-slate-500 text-center">
                  Escribiste: <span className="text-slate-400 italic">"{typed}"</span>
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => speak(current.english, speed)}
                    className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
                  >
                    🔊 Escuchar
                  </button>
                  <button
                    onClick={handleNext}
                    className={`flex-1 py-3 rounded-xl transition text-sm font-semibold ${
                      isGood
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
