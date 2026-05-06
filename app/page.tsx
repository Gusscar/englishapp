"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { applySM2, todayISO, type Quality } from "@/lib/sm2";
import type { Phrase } from "@/lib/types";
import FlashCard from "@/components/FlashCard";

function buildQueue(phrases: Phrase[]): Phrase[] {
  const today = todayISO();
  const due = phrases.filter((p) => p.next_review_date <= today);
  const upcoming = phrases.filter((p) => p.next_review_date > today);
  // Due phrases first (sorted by date asc), then upcoming as preview
  due.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  upcoming.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
  return [...due, ...upcoming];
}

export default function HomePage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [queue, setQueue] = useState<Phrase[]>([]);
  const [index, setIndex] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPhrases() {
    const { data, error } = await supabase
      .from("phrases")
      .select("*")
      .order("next_review_date", { ascending: true });
    if (error) {
      setError("No se pudieron cargar las frases.");
    } else {
      const list = data ?? [];
      const today = todayISO();
      const due = list.filter((p) => p.next_review_date <= today).length;
      setPhrases(list);
      setQueue(buildQueue(list));
      setDueCount(due);
    }
    setLoading(false);
  }

  useEffect(() => { loadPhrases(); }, []);

  const handleResult = useCallback(async (id: string, quality: Quality) => {
    const phrase = phrases.find((p) => p.id === id);
    if (!phrase) return;

    const newState = applySM2(
      {
        interval: phrase.interval,
        ease_factor: phrase.ease_factor,
        repetitions: phrase.repetitions,
        next_review_date: phrase.next_review_date,
      },
      quality
    );

    const correct = quality >= 3;
    const updates = {
      ...newState,
      correct_count: phrase.correct_count + (correct ? 1 : 0),
      incorrect_count: phrase.incorrect_count + (correct ? 0 : 1),
    };

    await supabase.from("phrases").update(updates).eq("id", id);

    setPhrases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    // Recount due
    const today = todayISO();
    setDueCount((prev) =>
      correct && newState.next_review_date > today ? Math.max(0, prev - 1) : prev
    );
  }, [phrases]);

  function handleNext() {
    setIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) {
        // Rebuild queue with updated phrases
        const newQueue = buildQueue(phrases);
        setQueue(newQueue);
        return 0;
      }
      return next;
    });
  }

  const current = queue[index];
  const today = todayISO();
  const allCaughtUp = !loading && dueCount === 0 && phrases.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇺🇸</span>
          <h1 className="font-bold text-lg">English Practice</h1>
        </div>
        <Link href="/manage" className="text-sm text-slate-400 hover:text-white transition">
          Gestionar →
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {loading && <p className="text-slate-400 animate-pulse">Cargando…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && phrases.length === 0 && (
          <div className="text-center">
            <p className="text-slate-400 mb-4">No hay frases todavía.</p>
            <Link href="/manage" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium">
              Agregar frases
            </Link>
          </div>
        )}

        {/* All caught up today */}
        {allCaughtUp && (
          <div className="text-center mb-8 p-5 rounded-2xl bg-emerald-900/30 border border-emerald-800 max-w-sm">
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-semibold text-emerald-300">¡Al día!</p>
            <p className="text-sm text-slate-400 mt-1">
              No hay frases pendientes para hoy. Próxima revisión:{" "}
              <span className="text-slate-300">
                {phrases.find((p) => p.next_review_date > today)?.next_review_date ?? "—"}
              </span>
            </p>
            <button
              onClick={() => { setQueue(buildQueue(phrases)); setIndex(0); }}
              className="mt-4 text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
            >
              Repasar de todas formas
            </button>
          </div>
        )}

        {!loading && current && (
          <FlashCard
            phrase={current}
            dueCount={dueCount}
            totalCount={phrases.length}
            onResult={handleResult}
            onNext={handleNext}
          />
        )}
      </main>
    </div>
  );
}
