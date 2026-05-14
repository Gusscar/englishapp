"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface JournalEntry {
  id: string;
  created_at: string;
  date: string;
  prompt: string | null;
  content: string;
}

const PROMPTS = [
  "Describe your ideal day in English.",
  "What did you learn today? Write 3 sentences.",
  "Describe someone important to you.",
  "What is your favorite movie and why?",
  "Write about a place you want to visit.",
  "What are your goals for this month?",
  "Describe what you can see from your window.",
  "Write about a challenge you overcame.",
  "What do you enjoy doing on weekends?",
  "Describe your morning routine.",
  "Write about a food you love.",
  "What would you do with a million dollars?",
  "Describe a skill you want to learn.",
  "Write about your favorite season.",
  "What advice would you give your younger self?",
  "Describe your neighborhood.",
  "Write about a book or series you recommend.",
  "What makes you laugh?",
  "Describe a perfect weekend.",
  "Write about something that surprised you recently.",
  "What is something you are proud of?",
  "Describe your dream job.",
  "Write about a tradition in your family.",
  "What technology could you not live without?",
  "Describe a memorable meal.",
  "Write about a time you helped someone.",
  "What do you do to relax?",
  "Describe your favorite hobby in detail.",
  "Write about a goal you achieved.",
  "What is something new you tried recently?",
];

function todayPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function WritingPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prompt = todayPrompt();

  const todayISO = new Date().toISOString().split("T")[0];
  const todayEntry = entries.find(e => e.date === todayISO);

  async function load() {
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    if (todayEntry) {
      await supabase
        .from("journal_entries")
        .update({ content: content.trim() })
        .eq("id", todayEntry.id);
    } else {
      await supabase.from("journal_entries").insert({
        date: todayISO,
        prompt,
        content: content.trim(),
      });
    }
    setSaving(false);
    setContent("");
    load();
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-semibold text-xl tracking-tight">Diario en Ingles</h1>
        <p className="text-xs text-slate-500 mt-0.5">Escribe todos los dias para ganar fluidez</p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-5 max-w-2xl mx-auto w-full">

        {/* Today's prompt + editor */}
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-900/30 border-b border-indigo-800/30">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Prompt de hoy</p>
            <p className="text-sm text-slate-200 leading-relaxed">{prompt}</p>
          </div>

          {todayEntry && !content ? (
            <div className="px-4 py-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Ya escribiste hoy</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{todayEntry.content}</p>
              <button
                onClick={() => setContent(todayEntry.content)}
                className="self-start text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700"
              >
                Editar
              </button>
            </div>
          ) : (
            <div className="px-4 py-4 flex flex-col gap-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Start writing in English…"
                rows={5}
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm leading-relaxed resize-none"
                autoFocus={!!content}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{content.length} caracteres</span>
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-95 transition-all text-sm font-semibold"
                >
                  {saving ? "Guardando…" : "Guardar entrada"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Past entries */}
        {!loading && entries.filter(e => e.date !== todayISO).length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Entradas anteriores</p>
            {entries
              .filter(e => e.date !== todayISO)
              .map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full text-left rounded-2xl bg-slate-800/60 border border-slate-700/40 px-4 py-3 flex flex-col gap-1 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">{formatDate(entry.date)}</span>
                    <span className="text-slate-600 text-xs">{expandedId === entry.id ? "▲" : "▼"}</span>
                  </div>
                  {expandedId !== entry.id ? (
                    <p className="text-sm text-slate-400 leading-snug line-clamp-2">{entry.content}</p>
                  ) : (
                    <div className="mt-1 flex flex-col gap-2">
                      {entry.prompt && (
                        <p className="text-xs text-indigo-400/80 italic">"{entry.prompt}"</p>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{entry.content}</p>
                    </div>
                  )}
                </button>
              ))}
          </div>
        )}

        {loading && <p className="text-slate-500 text-sm animate-pulse">Cargando…</p>}
      </main>
    </div>
  );
}
