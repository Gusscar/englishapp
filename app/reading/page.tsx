"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  formats: Record<string, string>;
}

interface VocabItem {
  word: string;
  spanish: string;
  example: string;
}

interface GeneratedStory {
  title: string;
  content: string;
  vocabulary: VocabItem[];
}

interface SavedStory {
  id: string;
  title: string;
  content: string;
  level: string | null;
  topic: string | null;
  source: string;
  created_at: string;
  vocabulary?: VocabItem[];
}

interface ReadingState {
  title: string;
  content: string;
  vocabulary?: VocabItem[];
  source: "ai" | "gutenberg";
  level?: string;
  topic?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function speakText(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  // Split into sentences to avoid TTS cutoff on long texts
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let i = 0;
  function next() {
    if (i >= sentences.length) return;
    const u = new SpeechSynthesisUtterance(sentences[i++]);
    u.lang = "en-US";
    u.rate = rate;
    u.onend = next;
    window.speechSynthesis.speak(u);
  }
  next();
}

function wc(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── ReadingView (modal overlay) ────────────────────────────────────────────

function ReadingView({
  state,
  onClose,
  onSaved,
}: {
  state: ReadingState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [speed, setSpeed] = useState(0.85);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  function handlePlay() {
    setPlaying(true);
    speakText(state.content, speed);
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  async function handleSave() {
    await supabase.from("saved_stories").insert({
      title: state.title,
      content: state.content,
      level: state.level ?? null,
      topic: state.topic ?? null,
      source: state.source,
      vocabulary: state.vocabulary ?? null,
    });
    setSaved(true);
    onSaved();
  }

  const words = wc(state.content);
  const minutes = Math.ceil(words / 150);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl mb-8">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold leading-snug">{state.title}</h2>
            <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
              <span>{words} palabras</span>
              <span>~{minutes} min</span>
              {state.level && <span className="text-indigo-400 font-medium">{state.level}</span>}
              {state.source === "ai" && <span className="text-purple-400">✨ IA</span>}
              {state.source === "gutenberg" && <span className="text-amber-400">📚 Gutenberg</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Speed + TTS controls */}
        <div className="flex gap-2 px-6 py-3 border-b border-slate-700 flex-wrap items-center">
          <span className="text-xs text-slate-500 mr-1">Velocidad:</span>
          {(["Lenta", "Normal", "Rápida"] as const).map((label, i) => {
            const rates = [0.6, 0.85, 1.1];
            return (
              <button
                key={label}
                onClick={() => setSpeed(rates[i])}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  speed === rates[i] ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                {label}
              </button>
            );
          })}
          <button
            onClick={playing ? handleStop : handlePlay}
            className={`ml-auto text-xs px-4 py-1.5 rounded-lg font-medium transition ${
              playing ? "bg-red-700 hover:bg-red-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {playing ? "⏹ Detener" : "🔊 Escuchar"}
          </button>
        </div>

        {/* Story text */}
        <div className="p-6 text-slate-200 leading-8 text-[15px] whitespace-pre-wrap">
          {state.content}
        </div>

        {/* Vocabulary */}
        {state.vocabulary && state.vocabulary.length > 0 && (
          <div className="px-6 pb-6 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-indigo-400 mt-5 mb-3">
              📖 Vocabulario clave
            </h3>
            <div className="flex flex-col gap-2">
              {state.vocabulary.map((v, i) => (
                <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                  <div className="flex gap-2 items-baseline flex-wrap">
                    <span className="font-bold text-white">{v.word}</span>
                    <span className="text-slate-400 text-sm">— {v.spanish}</span>
                  </div>
                  {v.example && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">"{v.example}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            ← Volver
          </button>
          {saved ? (
            <span className="text-sm text-emerald-400 font-medium">✅ Guardado</span>
          ) : (
            <button
              onClick={handleSave}
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium"
            >
              💾 Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ClassicBrowser (Gutendex) ──────────────────────────────────────────────

const LEVEL_PRESETS: { label: string; desc: string; query: string; topic?: string }[] = [
  { label: "A1–A2", desc: "Fábulas, cuentos simples",        query: "Aesop",          topic: "children" },
  { label: "B1",    desc: "Cuentos cortos, aventura fácil",  query: "O. Henry"                         },
  { label: "B2",    desc: "Sherlock, Verne, Wells",          query: "Sherlock Holmes"                   },
  { label: "C1+",   desc: "Literatura clásica compleja",     query: "Henry James"                       },
];

function ClassicBrowser({ onRead }: { onRead: (title: string, content: string) => void }) {
  const [books, setBooks] = useState<GutendexBook[]>([]);
  const [search, setSearch] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  async function loadBooks(query: string, p: number, topic?: string) {
    setLoading(true);
    const params = new URLSearchParams({
      languages: "en",
      page: String(p),
      ...(query.trim() ? { search: query } : { topic: topic ?? "children" }),
    });
    try {
      const res = await fetch(`https://gutendex.com/books?${params}`);
      const data = await res.json();
      setBooks(data.results ?? []);
      setHasNext(!!data.next);
    } catch {
      setBooks([]);
    }
    setLoading(false);
  }

  useEffect(() => { loadBooks("", 1); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActivePreset(null);
    setPage(1);
    loadBooks(search, 1);
  }

  function handlePreset(preset: typeof LEVEL_PRESETS[0]) {
    setActivePreset(preset.label);
    setSearch(preset.query);
    setPage(1);
    loadBooks(preset.query, 1, preset.topic);
  }

  function changePage(delta: number) {
    const p = page + delta;
    setPage(p);
    loadBooks(search, p);
  }

  async function handleRead(book: GutendexBook) {
    const textUrl =
      book.formats["text/plain; charset=utf-8"] ??
      book.formats["text/plain"] ??
      null;
    if (!textUrl) { alert("Este libro no tiene versión de texto disponible."); return; }

    setFetching(book.id);
    try {
      const res = await fetch(
        `/api/gutenberg-text?url=${encodeURIComponent(textUrl)}&page=0`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onRead(book.title, data.content);
    } catch {
      alert("No se pudo cargar el libro. Intenta con otro.");
    } finally {
      setFetching(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Level filter presets */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Filtrar por nivel aproximado:</p>
        <div className="grid grid-cols-4 gap-2">
          {LEVEL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${
                activePreset === preset.label
                  ? "bg-indigo-600/30 border-indigo-500/60 text-indigo-300"
                  : "bg-slate-700/40 border-slate-600/40 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="text-sm font-bold">{preset.label}</span>
              <span className="text-[10px] opacity-70 leading-tight mt-0.5">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActivePreset(null); }}
          placeholder="Buscar libro (Alice, Sherlock, Aesop…)"
          className="flex-1 rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      <p className="text-xs text-slate-500">
        Mostrando {search ? `resultados para "${search}"` : "libros infantiles"} en inglés · Por defecto ordenados por popularidad
      </p>

      {loading ? (
        <div className="text-center py-10 text-slate-400 animate-pulse">Cargando libros…</div>
      ) : books.length === 0 ? (
        <p className="text-center py-8 text-slate-400">Sin resultados. Prueba otra búsqueda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {books.map((book) => {
            const hasText = !!(
              book.formats["text/plain; charset=utf-8"] ?? book.formats["text/plain"]
            );
            return (
              <div
                key={book.id}
                className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 flex flex-col gap-2"
              >
                <div>
                  <p className="font-medium text-sm line-clamp-2 leading-snug">{book.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {book.authors.map((a) => a.name).join(", ") || "Anónimo"}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {book.subjects.slice(0, 2).map((s, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-600 text-slate-300 truncate max-w-[130px]"
                    >
                      {s.replace(/ -- Juvenile fiction/i, "")}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleRead(book)}
                  disabled={!hasText || fetching === book.id}
                  className={`mt-auto text-xs py-2 rounded-lg transition font-medium ${
                    hasText
                      ? "bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
                      : "bg-slate-600 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {fetching === book.id ? "Cargando…" : hasText ? "📖 Leer extracto" : "Sin texto"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-1">
        <button
          onClick={() => changePage(-1)}
          disabled={page === 1 || loading}
          className="text-xs px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition"
        >
          ← Anterior
        </button>
        <span className="text-xs text-slate-500">Página {page}</span>
        <button
          onClick={() => changePage(1)}
          disabled={!hasNext || loading}
          className="text-xs px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// ── StoryGenerator (Claude AI) ─────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const LEVEL_DESC: Record<string, string> = {
  A1: "Principiante · vocabulario básico, frases muy simples",
  A2: "Básico · situaciones cotidianas, frases conectadas",
  B1: "Intermedio · temas familiares, expresiones comunes",
  B2: "Intermedio alto · vocabulario variado, phrasal verbs",
  C1: "Avanzado · lenguaje fluido y sofisticado",
};
const TOPICS = ["Viaje", "Amistad", "Trabajo", "Familia", "Aventura", "Naturaleza", "Tecnología", "Misterio", "Amor", "Comida"];

function StoryGenerator({ onReady }: { onReady: (story: GeneratedStory) => void }) {
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState("Aventura");
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const t = customTopic.trim() || topic;
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic: t }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onReady({ ...data, _level: level, _topic: t });
    } catch {
      setError("No se pudo generar el cuento. Verifica que ANTHROPIC_API_KEY esté configurada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Level */}
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">Nivel CEFR</label>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                level === l ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{LEVEL_DESC[level]}</p>
      </div>

      {/* Topic */}
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-2">Tema</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => { setTopic(t); setCustomTopic(""); }}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                topic === t && !customTopic ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="O escribe un tema personalizado…"
          className="w-full rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 transition font-semibold text-white"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block animate-spin">⟳</span> Generando cuento…
          </span>
        ) : (
          "✨ Generar cuento con IA"
        )}
      </button>

      {loading && (
        <p className="text-xs text-slate-400 text-center animate-pulse">
          Claude está escribiendo tu cuento… puede tardar unos segundos
        </p>
      )}
    </div>
  );
}

// ── SavedStoriesTab ────────────────────────────────────────────────────────

function SavedStoriesTab({ onRead }: { onRead: (s: SavedStory) => void }) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("saved_stories")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setStories(data ?? []); setLoading(false); });
  }, []);

  async function del(id: string) {
    await supabase.from("saved_stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <p className="text-slate-400 text-center py-10 animate-pulse">Cargando…</p>;

  if (stories.length === 0) return (
    <div className="text-center py-12 text-slate-400">
      <p className="text-2xl mb-3">📚</p>
      <p>No hay cuentos guardados todavía.</p>
      <p className="text-sm mt-1">Genera uno con IA o guarda un extracto clásico.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {stories.map((s) => (
        <div
          key={s.id}
          className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 flex gap-3 items-start"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-1">{s.title}</p>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {s.level && <span className="text-xs text-indigo-400 font-medium">{s.level}</span>}
              <span className="text-xs text-slate-500">{s.source === "ai" ? "✨ IA" : "📚 Gutenberg"}</span>
              <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString("es")}</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 mt-1">{s.content.slice(0, 140)}…</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => onRead(s)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium"
            >
              Leer
            </button>
            <button
              onClick={() => del(s.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-300 transition"
            >
              Borrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "classics" | "generate" | "saved";

export default function ReadingPage() {
  const [tab, setTab] = useState<Tab>("classics");
  const [reading, setReading] = useState<ReadingState | null>(null);
  const [savedKey, setSavedKey] = useState(0); // force SavedStoriesTab refresh

  function openReading(state: ReadingState) {
    setReading(state);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "classics", label: "📚 Clásicos" },
    { key: "generate", label: "✨ Generar IA" },
    { key: "saved", label: "💾 Guardados" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="text-2xl">📖</span>
        <h1 className="font-bold text-lg">Lectura</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              tab === key
                ? "text-white border-indigo-500"
                : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {tab === "classics" && (
          <ClassicBrowser
            onRead={(title, content) =>
              openReading({ title, content, source: "gutenberg" })
            }
          />
        )}

        {tab === "generate" && (
          <StoryGenerator
            onReady={(story) =>
              openReading({
                title: story.title,
                content: story.content,
                vocabulary: story.vocabulary,
                source: "ai",
              })
            }
          />
        )}

        {tab === "saved" && (
          <SavedStoriesTab
            key={savedKey}
            onRead={(s) =>
              openReading({
                title: s.title,
                content: s.content,
                vocabulary: s.vocabulary,
                source: s.source as "ai" | "gutenberg",
                level: s.level ?? undefined,
                topic: s.topic ?? undefined,
              })
            }
          />
        )}
      </main>

      {/* Reading overlay */}
      {reading && (
        <ReadingView
          state={reading}
          onClose={() => setReading(null)}
          onSaved={() => { setSavedKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
