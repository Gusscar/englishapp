"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Phrase, PhraseInsert } from "@/lib/types";
import PhraseForm from "@/components/PhraseForm";

export default function ManagePage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Phrase | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("phrases").delete().eq("id", id);
    setDeleting(null);
    loadPhrases();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
          ← Practicar
        </Link>
        <h1 className="font-bold text-lg">Gestionar frases</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium"
        >
          + Nueva
        </button>
      </header>

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
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
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
                  <p className="font-medium truncate">{phrase.english}</p>
                  <p className="text-sm text-slate-400 truncate">{phrase.spanish}</p>
                  {phrase.category && (
                    <span className="text-xs text-indigo-400">{phrase.category}</span>
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
