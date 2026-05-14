"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";

function SpeakButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  }, [text]);

  return (
    <button
      onClick={e => { e.stopPropagation(); speak(); }}
      disabled={playing}
      aria-label="Escuchar en ingles"
      className={`shrink-0 size-8 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
        playing
          ? "bg-indigo-500/30 text-indigo-300"
          : "bg-slate-700/60 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {playing ? (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" className="animate-pulse"/>
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 010 7.07"/>
          </>
        )}
      </svg>
    </button>
  );
}
import { supabase } from "@/lib/supabase";

interface Example {
  spanish: string;
  english: string;
}

interface PhraseGroup {
  id: string;
  pattern_english: string;
  pattern_spanish: string;
  examples: Example[];
  notes: string | null;
  created_at: string;
}

const EMPTY_EXAMPLE: Example = { spanish: "", english: "" };

export default function PatternsPage() {
  const [groups, setGroups] = useState<PhraseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PhraseGroup | null>(null);
  const [formPatternES, setFormPatternES] = useState("");
  const [formPatternEN, setFormPatternEN] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formExamples, setFormExamples] = useState<Example[]>([{ ...EMPTY_EXAMPLE }]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("phrase_groups")
      .select("*")
      .order("created_at", { ascending: false });
    setGroups(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setFormPatternES("");
    setFormPatternEN("");
    setFormNotes("");
    setFormExamples([{ ...EMPTY_EXAMPLE }]);
    setShowForm(true);
  }

  function openEdit(g: PhraseGroup) {
    setEditing(g);
    setFormPatternES(g.pattern_spanish);
    setFormPatternEN(g.pattern_english);
    setFormNotes(g.notes ?? "");
    setFormExamples(g.examples.length > 0 ? g.examples.map(e => ({ ...e })) : [{ ...EMPTY_EXAMPLE }]);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function updateExample(i: number, field: keyof Example, val: string) {
    setFormExamples(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  }

  function addExample() {
    setFormExamples(prev => [...prev, { ...EMPTY_EXAMPLE }]);
  }

  function removeExample(i: number) {
    setFormExamples(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!formPatternES.trim() || !formPatternEN.trim()) return;
    setSaving(true);
    const examples = formExamples.filter(e => e.spanish.trim() || e.english.trim());
    const payload = {
      pattern_spanish: formPatternES.trim(),
      pattern_english: formPatternEN.trim(),
      examples,
      notes: formNotes.trim() || null,
    };
    if (editing) {
      await supabase.from("phrase_groups").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("phrase_groups").insert(payload);
    }
    setSaving(false);
    closeForm();
    load();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("phrase_groups").delete().eq("id", id);
    setDeleting(null);
    load();
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="font-bold text-lg">Patrones & Ejemplos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Guarda frases con multiples usos</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-sm"
        >
          + Agregar
        </button>
      </header>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-lg border border-slate-700 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editing ? "Editar patron" : "Nuevo patron"}</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-white text-xl leading-none">x</button>
            </div>

            {/* Pattern */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Patron en Ingles</label>
                <input
                  value={formPatternEN}
                  onChange={e => setFormPatternEN(e.target.value)}
                  placeholder="Ej: There's gotta be..."
                  className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-indigo-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Patron en Espanol</label>
                <input
                  value={formPatternES}
                  onChange={e => setFormPatternES(e.target.value)}
                  placeholder="Ej: Tiene que haber..."
                  className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notas (opcional)</label>
                <input
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Contexto, nivel, fuente..."
                  className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Examples */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ejemplos</p>
              <div className="flex flex-col gap-3">
                {formExamples.map((ex, i) => (
                  <div key={i} className="flex flex-col gap-1.5 bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-500">Ejemplo {i + 1}</span>
                      {formExamples.length > 1 && (
                        <button
                          onClick={() => removeExample(i)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <input
                      value={ex.english}
                      onChange={e => updateExample(i, "english", e.target.value)}
                      placeholder="In English..."
                      className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-indigo-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      value={ex.spanish}
                      onChange={e => updateExample(i, "spanish", e.target.value)}
                      placeholder="En espanol..."
                      className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <button
                  onClick={addExample}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition text-left py-1"
                >
                  + Agregar otro ejemplo
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formPatternES.trim() || !formPatternEN.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-sm font-medium"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <main className="flex-1 px-4 py-3 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {loading && <p className="text-slate-400 animate-pulse text-sm">Cargando...</p>}

        {!loading && groups.length === 0 && (
          <div className="text-center px-6 py-16">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-semibold text-lg mb-1">Sin patrones todavia</p>
            <p className="text-slate-400 text-sm mb-6">Agrega tu primera frase con ejemplos</p>
            <button
              onClick={openAdd}
              className="inline-block px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-sm"
            >
              + Agregar patron
            </button>
          </div>
        )}

        {groups.map(g => {
          const isOpen = expanded === g.id;
          return (
            <div
              key={g.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
            >
              {/* Pattern header */}
              <button
                onClick={() => setExpanded(isOpen ? null : g.id)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-indigo-300 leading-snug">{g.pattern_english}</p>
                    <SpeakButton text={g.pattern_english} />
                  </div>
                  <p className="text-base text-slate-400 leading-snug mt-0.5">{g.pattern_spanish}</p>
                  {g.notes && (
                    <p className="text-xs text-slate-500 mt-1">{g.notes}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1.5">
                    {g.examples.length} ejemplo{g.examples.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className={`text-slate-500 text-lg leading-none mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  v
                </span>
              </button>

              {/* Examples */}
              {isOpen && (
                <div className="border-t border-slate-700">
                  <div className="px-5 py-4 flex flex-col gap-4">
                    {g.examples.length === 0 && (
                      <p className="text-sm text-slate-500 italic">Sin ejemplos aun.</p>
                    )}
                    {g.examples.map((ex, i) => (
                      <div key={i} className="flex flex-col gap-0.5 border-l-2 border-indigo-700/60 pl-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-indigo-300 leading-relaxed font-medium flex-1">{ex.english}</p>
                          <SpeakButton text={ex.english} />
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{ex.spanish}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700/60 px-5 py-3 flex gap-3">
                    <button
                      onClick={() => openEdit(g)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deleting === g.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 transition disabled:opacity-50"
                    >
                      {deleting === g.id ? "..." : "Borrar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
