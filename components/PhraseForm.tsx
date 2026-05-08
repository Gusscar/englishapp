"use client";

import { useState } from "react";
import type { Phrase, PhraseInsert } from "@/lib/types";

interface PhraseFormProps {
  initial?: Phrase;
  onSave: (data: PhraseInsert) => Promise<void>;
  onCancel: () => void;
}

export default function PhraseForm({ initial, onSave, onCancel }: PhraseFormProps) {
  const [english, setEnglish] = useState(initial?.english ?? "");
  const [spanish, setSpanish] = useState(initial?.spanish ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!english.trim() || !spanish.trim()) {
      setError("Inglés y español son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({
        english: english.trim(),
        spanish: spanish.trim(),
        category: category.trim() || null,
        notes: notes.trim() || null,
      });
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Inglés *
        </label>
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="e.g. How are you doing?"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Español *
        </label>
        <input
          value={spanish}
          onChange={(e) => setSpanish(e.target.value)}
          placeholder="e.g. ¿Cómo estás?"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Categoría (opcional)
        </label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Saludos, Negocios…"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Tu ejemplo / notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. — Hey! How are you doing? — Pretty good, thanks!"
          rows={3}
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition text-sm font-medium"
        >
          {loading ? "Guardando…" : initial ? "Guardar cambios" : "Agregar frase"}
        </button>
      </div>
    </form>
  );
}
