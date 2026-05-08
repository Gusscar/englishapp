"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Phrase } from "@/lib/types";
import SpeechButton from "@/components/SpeechButton";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface WordToken {
  id: number;
  word: string;
}

function tokenize(english: string): WordToken[] {
  return shuffle(
    english.split(" ").filter(Boolean).map((word, i) => ({ id: i, word }))
  );
}

type Result = "correct" | "wrong" | null;

export default function ScramblePage() {
  const [phrases, setPhrases]   = useState<Phrase[]>([]);
  const [index, setIndex]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [bank, setBank]         = useState<WordToken[]>([]);
  const [answer, setAnswer]     = useState<WordToken[]>([]);
  const [result, setResult]     = useState<Result>(null);
  const [score, setScore]       = useState({ correct: 0, total: 0 });

  useEffect(() => {
    supabase.from("phrases").select("*").then(({ data }) => {
      setPhrases(shuffle(data ?? []));
      setLoading(false);
    });
  }, []);

  const current = phrases[index];

  useEffect(() => {
    if (!current) return;
    setBank(tokenize(current.english));
    setAnswer([]);
    setResult(null);
  }, [current?.id]); // eslint-disable-line

  function moveToAnswer(item: WordToken) {
    setBank(prev => prev.filter(w => w.id !== item.id));
    setAnswer(prev => [...prev, item]);
  }

  function moveToBank(item: WordToken) {
    setAnswer(prev => prev.filter(w => w.id !== item.id));
    setBank(prev => [...prev, item]);
  }

  function handleCheck() {
    if (!current || answer.length === 0) return;
    const userAnswer = answer.map(w => w.word).join(" ").toLowerCase().trim();
    const correct    = current.english.toLowerCase().trim();
    const isCorrect  = userAnswer === correct;
    setResult(isCorrect ? "correct" : "wrong");
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }

  function handleNext() {
    setIndex(i => (i + 1 >= phrases.length ? 0 : i + 1));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      <span className="text-4xl animate-spin">⟳</span>
    </div>
  );

  if (!current) return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="text-4xl mb-4">🧩</p>
        <p className="font-semibold text-lg mb-1">Sin frases</p>
        <p className="text-slate-400 text-sm">Agrega frases en Gestionar para empezar.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="font-bold text-lg">🧩 Word Scramble</h1>
          <p className="text-xs text-slate-500">Ordenar palabras</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {score.correct}/{score.total} correctas
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-4 px-4 py-2 max-w-lg mx-auto w-full">
        {/* Phrase counter */}
        <p className="text-xs text-slate-500 text-center">
          {index + 1} / {phrases.length}
        </p>

        {/* Prompt */}
        <div className="rounded-2xl bg-indigo-900/30 border border-indigo-800/50 px-5 py-5 text-center">
          <p className="text-xs text-indigo-400 mb-2 uppercase tracking-wide font-semibold">
            Ordena en inglés
          </p>
          <p className="text-xl font-semibold text-indigo-100 leading-snug">{current.spanish}</p>
          {current.category && (
            <p className="text-xs text-slate-500 mt-2">{current.category}</p>
          )}
        </div>

        {/* Answer zone */}
        <div
          className={`min-h-[72px] rounded-2xl border-2 border-dashed px-3 py-3 flex flex-wrap gap-2 items-start content-start transition-colors ${
            result === "correct"
              ? "bg-emerald-900/20 border-emerald-700"
              : result === "wrong"
              ? "bg-red-900/20 border-red-800"
              : "bg-slate-800 border-slate-600"
          }`}
        >
          {answer.length === 0 ? (
            <p className="text-slate-600 text-sm w-full text-center py-2">
              Toca las palabras para colocarlas aquí
            </p>
          ) : (
            answer.map(item => (
              <button
                key={item.id}
                onClick={() => result === null && moveToBank(item)}
                disabled={result !== null}
                className="px-3 py-1.5 rounded-lg bg-indigo-700 border border-indigo-500 text-sm font-medium transition hover:bg-indigo-600 active:scale-95 disabled:cursor-default"
              >
                {item.word}
              </button>
            ))
          )}
        </div>

        {/* Result feedback */}
        {result && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center border ${
            result === "correct"
              ? "bg-emerald-900/50 border-emerald-700 text-emerald-300"
              : "bg-red-900/50 border-red-700 text-red-300"
          }`}>
            {result === "correct" ? (
              "✅ ¡Correcto!"
            ) : (
              <span>
                ❌ La frase es:{" "}
                <span className="font-mono font-medium text-white">{current.english}</span>
              </span>
            )}
          </div>
        )}

        {/* Word bank */}
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {bank.map(item => (
            <button
              key={item.id}
              onClick={() => result === null && moveToAnswer(item)}
              disabled={result !== null}
              className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-sm font-medium transition hover:bg-slate-600 active:scale-95 disabled:cursor-default disabled:opacity-50"
            >
              {item.word}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <SpeechButton text={current.english} />
          {result === null ? (
            <button
              onClick={handleCheck}
              disabled={answer.length === 0}
              className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition font-semibold text-sm"
            >
              Verificar
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 transition font-semibold text-sm"
            >
              Siguiente →
            </button>
          )}
        </div>

        {/* Notes / context hint (shown after answering) */}
        {result && current.notes && (
          <div className="rounded-xl bg-slate-700/50 border border-slate-600/60 px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">📝 Tu ejemplo</p>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{current.notes}</p>
          </div>
        )}
      </main>
    </div>
  );
}
