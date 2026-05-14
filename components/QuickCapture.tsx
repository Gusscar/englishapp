"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LEVELS, LEVEL_CONFIG, type Level } from "@/lib/levels";

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
  const [level, setLevel]         = useState<Level | "">("");
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setEnglish("");
    setSpanish("");
    setSource("");
    setLevel("");
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

  async function generateAndSaveContext(id: string, eng: string, esp: string) {
    try {
      const res = await fetch("/api/phrase-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ english: eng, spanish: esp }),
      });
      if (!res.ok) return;
      const context = await res.json();
      if (context.tip) {
        await supabase
          .from("phrases")
          .update({ context: JSON.stringify(context) })
          .eq("id", id);
      }
    } catch {
      // silent — context is optional
    }
  }

  async function handleSave() {
    if (!english.trim() || !spanish.trim()) {
      setError("Necesitas la frase y la traducción.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("phrases")
      .insert({
        english: english.trim(),
        spanish: spanish.trim(),
        category: source || null,
        level: level || null,
        correct_count: 0,
        incorrect_count: 0,
      })
      .select("id")
      .single();
    setSaving(false);
    if (dbErr || !data) {
      setError("Error al guardar. Intenta de nuevo.");
      return;
    }
    // Fire context generation in background — no await
    generateAndSaveContext(data.id, english.trim(), spanish.trim());
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
        className="fixed bottom-[84px] right-4 z-40 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/50 flex items-center justify-center transition-all active:scale-90"
        aria-label="Agregar frase rapida"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
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

            {/* Level picker */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Nivel (opcional — se detecta con IA)</p>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map(lvl => {
                  const cfg = LEVEL_CONFIG[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(level === lvl ? "" : lvl)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        level === lvl ? cfg.chip : "bg-slate-700 text-slate-400 border-slate-600"
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
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
