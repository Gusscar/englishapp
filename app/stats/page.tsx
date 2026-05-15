"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  totalPhrases: number;
  mastered: number;
  dueToday: number;
  totalImmersionMinutes: number;
  journalEntries: number;
  streak: number;
  levelCounts: Record<string, number>;
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const unique = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  if (unique[0] !== today && unique[0] !== new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [phrasesRes, immRes, journalRes] = await Promise.all([
        supabase.from("phrases").select("ease_factor, interval, next_review, last_reviewed, level"),
        supabase.from("immersion_logs").select("logged_at, minutes"),
        supabase.from("journal_entries").select("created_at"),
      ]);

      const phrases = phrasesRes.data ?? [];
      const immLogs = immRes.data ?? [];
      const journals = journalRes.data ?? [];

      const today = new Date().toISOString().slice(0, 10);
      const totalPhrases = phrases.length;
      const mastered = phrases.filter(p => (p.ease_factor ?? 0) >= 2.5 && (p.interval ?? 0) >= 7).length;
      const dueToday = phrases.filter(p => p.next_review && p.next_review.slice(0, 10) <= today).length;
      const totalImmersionMinutes = immLogs.reduce((s, l) => s + (l.minutes ?? 0), 0);
      const journalEntries = journals.length;

      const levelCounts: Record<string, number> = {};
      for (const p of phrases) {
        const lvl = p.level ?? "Sin nivel";
        levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
      }

      // Streak: any day with reviewed phrase, journal entry, or immersion log
      const allDates = [
        ...phrases.filter(p => p.last_reviewed).map(p => p.last_reviewed as string),
        ...journals.map(j => j.created_at as string),
        ...immLogs.map(l => l.logged_at as string),
      ];
      const streak = calcStreak(allDates);

      setStats({ totalPhrases, mastered, dueToday, totalImmersionMinutes, journalEntries, streak, levelCounts });
      setLoading(false);
    }
    load();
  }, []);

  const LEVEL_COLORS: Record<string, string> = {
    A1: "bg-emerald-500", A2: "bg-green-500", B1: "bg-sky-500",
    B2: "bg-indigo-500", C1: "bg-violet-500", "Sin nivel": "bg-slate-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-slate-700 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  const s = stats!;
  const masteredPct = s.totalPhrases > 0 ? Math.round((s.mastered / s.totalPhrases) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-semibold text-xl tracking-tight">Mi progreso</h1>
        <p className="text-xs text-slate-500 mt-0.5">Tu actividad de aprendizaje</p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-4">

        {/* Streak */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-900/60 to-amber-900/20 border border-amber-700/40 p-5 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
            {s.streak > 0 ? "🔥" : "💤"}
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{s.streak} <span className="text-base font-normal text-amber-300">{s.streak === 1 ? "día" : "días"}</span></p>
            <p className="text-sm text-amber-300/70 mt-0.5">Racha actual de práctica</p>
          </div>
        </div>

        {/* 2-col quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-4">
            <p className="text-2xl font-bold text-white">{s.totalPhrases}</p>
            <p className="text-xs text-slate-400 mt-1">Frases totales</p>
          </div>
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-4">
            <p className="text-2xl font-bold text-emerald-400">{s.mastered}</p>
            <p className="text-xs text-slate-400 mt-1">Dominadas</p>
          </div>
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-4">
            <p className="text-2xl font-bold text-red-400">{s.dueToday}</p>
            <p className="text-xs text-slate-400 mt-1">Para repasar hoy</p>
          </div>
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-4">
            <p className="text-2xl font-bold text-sky-400">{s.journalEntries}</p>
            <p className="text-xs text-slate-400 mt-1">Entradas de diario</p>
          </div>
        </div>

        {/* Immersion time */}
        <div className="rounded-3xl bg-gradient-to-br from-cyan-900/50 to-cyan-900/10 border border-cyan-700/30 p-5 flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {s.totalImmersionMinutes >= 60
                ? `${Math.floor(s.totalImmersionMinutes / 60)}h ${s.totalImmersionMinutes % 60}m`
                : `${s.totalImmersionMinutes}m`}
            </p>
            <p className="text-sm text-cyan-300/70 mt-0.5">Total de inmersión registrado</p>
          </div>
        </div>

        {/* Mastery progress bar */}
        {s.totalPhrases > 0 && (
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Progreso de dominio</p>
              <span className="text-sm font-bold text-emerald-400">{masteredPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${masteredPct}%` }} />
            </div>
            <p className="text-xs text-slate-500">{s.mastered} de {s.totalPhrases} frases con intervalo ≥ 7 días</p>
          </div>
        )}

        {/* Level breakdown */}
        {Object.keys(s.levelCounts).length > 0 && (
          <div className="rounded-3xl bg-slate-800/60 border border-slate-700/40 p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Frases por nivel CEFR</p>
            <div className="flex flex-col gap-2">
              {["A1","A2","B1","B2","C1","Sin nivel"].filter(l => s.levelCounts[l]).map(lvl => {
                const count = s.levelCounts[lvl] ?? 0;
                const pct = Math.round((count / s.totalPhrases) * 100);
                return (
                  <div key={lvl} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-14 shrink-0">{lvl}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${LEVEL_COLORS[lvl] ?? "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
