"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(phrases: Phrase[]): Phrase[] {
  const due      = shuffle(phrases.filter((p) => p.next_review_date <= today));
  const upcoming = shuffle(phrases.filter((p) => p.next_review_date > today));
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

  async function handleContextSave(id: string, context: string) {
    await supabase.from("phrases").update({ context }).eq("id", id);
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, context } : p)));
    setQueue((prev) => prev.map((p) => (p.id === id ? { ...p, context } : p)));
  }

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

  // Auto-generate context for phrases that don't have it yet
  const generatingContext = useRef(new Set<string>());
  useEffect(() => {
    if (!current || current.context || generatingContext.current.has(current.id)) return;
    generatingContext.current.add(current.id);
    fetch("/api/phrase-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ english: current.english, spanish: current.spanish }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then(async (ctx) => {
        if (!ctx?.tip) return;
        const contextStr = JSON.stringify(ctx);
        await supabase.from("phrases").update({ context: contextStr }).eq("id", current.id);
        setPhrases((prev) =>
          prev.map((p) => (p.id === current.id ? { ...p, context: contextStr } : p))
        );
      })
      .catch(() => { /* silent */ });
  }, [current?.id]); // eslint-disable-line

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="font-semibold text-xl tracking-tight text-white">English Practice</h1>
          {!loading && phrases.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {phrases.length} frases en total
            </p>
          )}
        </div>
        {!loading && phrases.length > 0 && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            dueCount > 0
              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}>
            {dueCount > 0 ? `${dueCount} pendientes` : "Al dia"}
          </span>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">

        {loading && (
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="size-10 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
            <p className="text-sm">Cargando frases…</p>
          </div>
        )}

        {error && (
          <div className="text-center p-6 rounded-3xl bg-red-950/40 border border-red-800/50 max-w-sm w-full">
            <p className="text-red-400 font-bold mb-1">Sin conexion</p>
            <p className="text-slate-400 text-sm mb-5">{error}</p>
            <button
              onClick={loadPhrases}
              className="px-5 py-2.5 rounded-2xl bg-red-700/80 hover:bg-red-600/80 active:scale-95 transition-all text-sm font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && phrases.length === 0 && (
          <div className="text-center px-6 py-8">
            <div className="size-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-5 text-4xl">
              📝
            </div>
            <p className="font-bold text-xl mb-2">Sin frases todavia</p>
            <p className="text-slate-400 text-sm mb-7 leading-relaxed max-w-[260px] mx-auto">
              Agrega tus primeras frases para empezar a practicar
            </p>
            <Link
              href="/manage"
              className="inline-block px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all font-semibold text-sm shadow-lg shadow-indigo-900/40"
            >
              Agregar frases
            </Link>
          </div>
        )}

        {allCaughtUp && (
          <div className="text-center px-6 py-8 rounded-3xl bg-emerald-950/30 border border-emerald-800/30 max-w-sm w-full">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-bold text-2xl text-emerald-300 mb-1">Al dia</p>
            <p className="text-slate-400 text-sm mb-1">No hay frases pendientes para hoy.</p>
            <p className="text-slate-600 text-xs mb-6">
              Proxima revision:{" "}
              <span className="text-slate-400">
                {phrases.find((p) => p.next_review_date > today)?.next_review_date ?? "—"}
              </span>
            </p>
            <button
              onClick={() => { setQueue(buildQueue(phrases)); setIndex(0); }}
              className="px-5 py-2.5 rounded-2xl bg-slate-700/80 hover:bg-slate-600/80 active:scale-95 transition-all text-sm font-semibold border border-slate-600/40"
            >
              Repasar de todas formas
            </button>
          </div>
        )}

        {!loading && !error && current && !allCaughtUp && (
          <>
            <p className="text-slate-600 text-xs tabular-nums self-start pl-1">
              {index + 1} de {queue.length}
            </p>
            <FlashCard
              phrase={current}
              dueCount={dueCount}
              totalCount={phrases.length}
              onResult={handleResult}
              onNext={handleNext}
              onContextSave={handleContextSave}
            />
          </>
        )}
      </main>
    </div>
  );
}
