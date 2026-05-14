"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Phrase, PhraseInsert } from "@/lib/types";
import PhraseForm from "@/components/PhraseForm";
import { LEVEL_CONFIG } from "@/lib/levels";

function parseImportText(text: string): PhraseInsert[] {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"))
    .map(line => {
      const sep = line.includes("|") ? "|" : ",";
      const parts = line.split(sep).map(p => p.trim());
      if (!parts[0] || !parts[1]) return null;
      return {
        english:  parts[0],
        spanish:  parts[1],
        category: parts[2] || null,
        notes:    parts[3] || null,
      };
    })
    .filter(Boolean) as PhraseInsert[];
}

export default function ManagePage() {
  const [phrases, setPhrases]       = useState<Phrase[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Phrase | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const importParsed = parseImportText(importText);

  async function loadPhrases() {
    const { data } = await supabase
      .from("phrases")
      .select("*")
      .order("created_at", { ascending: false });
    setPhrases(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadPhrases(); }, []);

  async function handleAdd(data: PhraseInsert) {
    await supabase.from("phrases").insert({ ...data, correct_count: 0, incorrect_count: 0 });
    setShowForm(false);
    loadPhrases();
  }

  async function handleEdit(data: PhraseInsert) {
    if (!editing) return;
    await supabase.from("phrases").update(data).eq("id", editing.id);
    setEditing(null);
    loadPhrases();
  }

  async function handleImport() {
    if (importParsed.length === 0) return;
    setImportLoading(true);
    const rows = importParsed.map(p => ({ ...p, correct_count: 0, incorrect_count: 0 }));
    await supabase.from("phrases").insert(rows);
    setImportLoading(false);
    setShowImport(false);
    setImportText("");
    loadPhrases();
  }

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target?.result as string ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("phrases").delete().eq("id", id);
    setDeleting(null);
    loadPhrases();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="font-bold text-lg">Mis frases</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition font-semibold text-sm"
          >
            Importar
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-sm"
          >
            + Nueva
          </button>
        </div>
      </header>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Importar frases</h2>
              <button onClick={() => { setShowImport(false); setImportText(""); }} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="rounded-lg bg-slate-700/50 border border-slate-600 px-3 py-2.5 text-xs text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-300 mb-1">Formato por línea:</p>
              <p className="font-mono">inglés | español | categoría | notas</p>
              <p className="mt-1 text-slate-500">La categoría y las notas son opcionales. También se acepta coma (,) como separador.</p>
            </div>

            <div className="flex gap-2">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"How are you? | ¿Cómo estás? | Saludos\nNice to meet you | Mucho gusto | Saludos\nI need help | Necesito ayuda"}
                rows={6}
                className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileRead} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 transition"
              >
                📂 Subir archivo
              </button>
              <span className="text-xs text-slate-500">o pega el texto directamente</span>
            </div>

            {/* Preview */}
            {importParsed.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Vista previa — {importParsed.length} frase{importParsed.length !== 1 ? "s" : ""}
                </p>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {importParsed.map((p, i) => (
                    <li key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs flex gap-2">
                      <span className="text-white font-medium flex-1 truncate">{p.english}</span>
                      <span className="text-slate-400 flex-1 truncate">{p.spanish}</span>
                      {p.category && <span className="text-indigo-400 shrink-0">{p.category}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importText.trim() && importParsed.length === 0 && (
              <p className="text-xs text-red-400">No se pudo parsear ninguna línea. Revisa el formato.</p>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => { setShowImport(false); setImportText(""); }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importParsed.length === 0 || importLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-sm font-medium"
              >
                {importLoading ? "Importando…" : `Importar ${importParsed.length > 0 ? importParsed.length : ""} frases`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {(showForm || editing) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="font-semibold text-lg mb-5">
              {editing ? "Editar frase" : "Nueva frase"}
            </h2>
            <PhraseForm
              initial={editing ?? undefined}
              onSave={editing ? handleEdit : handleAdd}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {loading && <p className="text-slate-400 animate-pulse">Cargando…</p>}
        {!loading && phrases.length === 0 && (
          <p className="text-slate-400 text-center mt-16">
            No hay frases. ¡Agrega la primera!
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {phrases.map((phrase) => (
            <li
              key={phrase.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-medium truncate">{phrase.english}</p>
                    {phrase.level && LEVEL_CONFIG[phrase.level as keyof typeof LEVEL_CONFIG] && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${LEVEL_CONFIG[phrase.level as keyof typeof LEVEL_CONFIG].badge}`}>
                        {phrase.level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{phrase.spanish}</p>
                  {phrase.category && (
                    <span className="text-xs text-indigo-400">{phrase.category}</span>
                  )}
                  {phrase.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">📝 {phrase.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setShowForm(false); setEditing(phrase); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(phrase.id)}
                    disabled={deleting === phrase.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 transition disabled:opacity-50"
                  >
                    {deleting === phrase.id ? "…" : "Borrar"}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>✅ {phrase.correct_count} correctas</span>
                <span>❌ {phrase.incorrect_count} incorrectas</span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
