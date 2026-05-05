"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Phrase } from "@/lib/types";
import FlashCard from "@/components/FlashCard";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function HomePage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [queue, setQueue] = useState<Phrase[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhrases() {
      const { data, error } = await supabase
        .from("phrases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("No se pudieron cargar las frases.");
      } else {
        setPhrases(data ?? []);
        setQueue(shuffle(data ?? []));
      }
      setLoading(false);
    }
    loadPhrases();
  }, []);

  const handleResult = useCallback(async (id: string, correct: boolean) => {
    const field = correct ? "correct_count" : "incorrect_count";
    const phrase = phrases.find((p) => p.id === id);
    if (!phrase) return;
    const newVal = phrase[field] + 1;
    await supabase.from("phrases").update({ [field]: newVal }).eq("id", id);
    setPhrases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: newVal } : p))
    );
  }, [phrases]);

  function handleNext() {
    setIndex((i) => {
      if (i + 1 >= queue.length) {
        setQueue(shuffle(phrases));
        return 0;
      }
      return i + 1;
    });
  }

  const current = queue[index];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇺🇸</span>
          <h1 className="font-bold text-lg">English Practice</h1>
        </div>
        <Link
          href="/manage"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Gestionar frases →
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {loading && (
          <p className="text-slate-400 animate-pulse">Cargando frases…</p>
        )}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && phrases.length === 0 && (
          <div className="text-center">
            <p className="text-slate-400 mb-4">No hay frases todavía.</p>
            <Link
              href="/manage"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium"
            >
              Agregar frases
            </Link>
          </div>
        )}
        {!loading && current && (
          <>
            <p className="text-slate-500 text-sm mb-6">
              {index + 1} / {queue.length}
            </p>
            <FlashCard
              phrase={current}
              onResult={handleResult}
              onNext={handleNext}
            />
          </>
        )}
      </main>
    </div>
  );
}
