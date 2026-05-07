"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SOURCE_CHIPS = [
  { label: "Netflix",  icon: "🎬" },
  { label: "Serie",    icon: "📺" },
  { label: "Película", icon: "🎥" },
  { label: "Podcast",  icon: "🎧" },
  { label: "Canción",  icon: "🎵" },
  { label: "Trabajo",  icon: "💼" },
  { label: "Redes",    icon: "📱" },
];

export default function QuickCapture() {
  const [open, setOpen]           = useState(false);
  const [english, setEnglish]     = useState("");
  const [spanish, setSpanish]     = useState("");
  const [source, setSource]       = useState("");
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setEnglish("");
    setSpanish("");
    setSource("");
    setError(null);
  }

  async function handleTranslate() {
    if (!english.trim()) return;
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ english }),
      });
      const data = await res.json();
      if (data.spanish) {
        setSpanish(data.spanish);
      } else {
        setError("No se pudo traducir. Escríbela manualmente.");
      }
    } catch {
      setError("Sin conexión. Escríbela manualmente.");
    } finally {
      setTranslating(false);
    }
  }

  function handleEnglishKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!spanish) handleTranslate();
      else handleSave();
    }
  }

  async function handleSave() {
    if (!english.trim() || !spanish.trim()) {
      setError("Necesitas la frase y la traducción.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: dbErr } = await supabase.from("phrases").insert({
      english: english.trim(),
      spanish: spanish.trim(),
      category: source || null,
      correct_count: 0,
      incorrect_count: 0,
    });
    setSaving(false);
    if (dbErr) {
      setError("Error al guardar. Intenta de nuevo.");
      return;
    }
    handleClose();
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 bg-emerald-700 rounded-full text-sm font-semibold shadow-xl pointer-events-none">
          Frase guardada
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[84px] right-4 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/60 flex items-center justify-center text-3xl font-light transition active:scale-95"
        aria-label="Agregar frase rápida"
      >
        +
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-slate-800 rounded-t-3xl border-t border-slate-700 px-5 pt-4 pb-10 flex flex-col gap-4">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-1" />

            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Captura rápida</h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* English input + translate button */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                onKeyDown={handleEnglishKeyDown}
                placeholder="Frase en inglés…"
                className="flex-1 rounded-xl bg-slate-700 border border-slate-600 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleTranslate}
                disabled={!english.trim() || translating}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-sm font-semibold shrink-0"
              >
                {translating ? "…" : "Traducir"}
              </button>
            </div>

            {/* Spanish input */}
            <input
              value={spanish}
              onChange={(e) => setSpanish(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Traducción en español…"
              className="w-full rounded-xl bg-slate-700 border border-slate-600 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Source chips */}
            <div>
              <p className="text-xs text-slate-400 mb-2">¿Dónde lo escuchaste? (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {SOURCE_CHIPS.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSource(source === label ? "" : label)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      source === label
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!english.trim() || !spanish.trim() || saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition font-semibold text-sm"
            >
              {saving ? "Guardando…" : "Guardar frase"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
