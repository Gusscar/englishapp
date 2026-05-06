"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { applySM2, todayISO, type Quality } from "@/lib/sm2";
import type { Phrase } from "@/lib/types";
import FlashCard from "@/components/FlashCard";
import Link from "next/link";

const today = todayISO();

function withSRSDefaults(p: Phrase): Phrase {
  return {
    ...p,
    interval:          p.interval          ?? 1,
    ease_factor:       p.ease_factor       ?? 2.5,
    repetitions:       p.repetitions       ?? 0,
    next_review_date:  p.next_review_date  ?? today,
    correct_count:     p.correct_count     ?? 0,
    incorrect_count:   p.incorrect_count   ?? 0,
  };
}

function buildQueue(phrases: Phrase[]): Phrase[] {
  const due      = phrases.filter((p) => p.next_review_date <= today)
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  const upcoming = phrases.filter((p) => p.next_review_date > today)
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  return [...due, ...upcoming];
}

export default function HomePage() {
  const [phrases,  setPhrases]  = useState<Phrase[]>([]);
  const [queue,    setQueue]    = useState<Phrase[]>([]);
  const [index,    setIndex]    = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  async function loadPhrases() {
    setLoading(true);
    // order by created_at — works even without SRS columns
    const { data, error } = await supabase
      .from("phrases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Error al conectar con la base de datos.");
    } else {
      const list = (data ?? []).map(withSRSDefaults);
      const due  = list.filter((p) => p.next_review_date <= today).length;
      setPhrases(list);
      setQueue(buildQueue(list));
      setDueCount(due);
    }
    setLoading(false);
  }

  useEffect(() => { loadPhrases(); }, []); // eslint-disable-line

  const handleResult = useCallback(async (id: string, quality: Quality) => {
    const phrase = phrases.find((p) => p.id === id);
    if (!phrase) return;

    const newState = applySM2(
      { interval: phrase.interval, ease_factor: phrase.ease_factor,
        repetitions: phrase.repetitions, next_review_date: phrase.next_review_date },
      quality
    );
    const correct = quality >= 3;
    const updates = {
      ...newState,
      correct_count:   phrase.correct_count   + (correct ? 1 : 0),
      incorrect_count: phrase.incorrect_count + (correct ? 0 : 1),
    };

    await supabase.from("phrases").update(updates).eq("id", id);
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (correct && newState.next_review_date > today)
      setDueCount((n) => Math.max(0, n - 1));
  }, [phrases]);

  function handleNext() {
    setIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) { setQueue(buildQueue(phrases)); return 0; }
      return next;
    });
  }

  const current      = queue[index];
  const allCaughtUp  = !loading && !error && dueCount === 0 && phrases.length > 0;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇺🇸</span>
          <h1 className="font-bold text-lg tracking-tight">English Practice</h1>
        </div>
        {!loading && phrases.length > 0 && (
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            dueCount > 0
              ? "bg-indigo-900/60 text-indigo-300 border border-indigo-700"
              : "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
          }`}>
            {dueCount > 0 ? `${dueCount} pendientes` : "¡Al día! 🎉"}
          </span>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">

        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <span className="text-4xl animate-spin">⟳</span>
            <p className="text-sm">Cargando frases…</p>
          </div>
        )}

        {error && (
          <div className="text-center p-5 rounded-2xl bg-red-900/30 border border-red-800 max-w-sm w-full">
            <p className="text-red-400 font-semibold mb-1">Sin conexión</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={loadPhrases}
              className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 transition text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && phrases.length === 0 && (
          <div className="text-center px-6">
            <p className="text-5xl mb-4">📝</p>
            <p className="font-semibold text-lg mb-1">Sin frases todavía</p>
            <p className="text-slate-400 text-sm mb-6">Agrega tus primeras frases para empezar a practicar</p>
            <Link
              href="/manage"
              className="inline-block px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
            >
              + Agregar frases
            </Link>
          </div>
        )}

        {allCaughtUp && (
          <div className="text-center px-6 py-8 rounded-3xl bg-emerald-900/20 border border-emerald-800/50 max-w-sm w-full">
            <p className="text-5xl mb-3">🎉</p>
            <p className="font-bold text-xl text-emerald-300 mb-1">¡Al día!</p>
            <p className="text-slate-400 text-sm mb-1">No hay frases pendientes para hoy.</p>
            <p className="text-slate-500 text-xs mb-5">
              Próxima revisión:{" "}
              <span className="text-slate-300">
                {phrases.find((p) => p.next_review_date > today)?.next_review_date ?? "—"}
              </span>
            </p>
            <button
              onClick={() => { setQueue(buildQueue(phrases)); setIndex(0); }}
              className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
            >
              Repasar de todas formas
            </button>
          </div>
        )}

        {!loading && !error && current && !allCaughtUp && (
          <>
            <p className="text-slate-500 text-xs">
              {index + 1} / {queue.length}
            </p>
            <FlashCard
              phrase={current}
              dueCount={dueCount}
              totalCount={phrases.length}
              onResult={handleResult}
              onNext={handleNext}
            />
          </>
        )}
      </main>
    </div>
  );
}
