"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface WikiResult {
  title: string;
  description: string;
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
  source: "ai" | "wikipedia";
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
              {state.source === "wikipedia" && <span className="text-sky-400">🌐 Wikipedia</span>}
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

// ── WikiReader (Wikipedia API) ─────────────────────────────────────────────

const WIKI_TOPICS: Record<string, { desc: string; topics: string[] }> = {
  "A1–A2": { desc: "Temas simples",     topics: ["Cat", "Dog", "Football", "Pizza", "Rain", "Apple", "Horse"] },
  "B1":    { desc: "Temas cotidianos",  topics: ["The Beatles", "Olympic Games", "Amazon River", "Coffee", "Solar System"] },
  "B2":    { desc: "Historia, ciencia", topics: ["World War II", "Climate change", "William Shakespeare", "Internet", "Moon landing"] },
  "C1+":   { desc: "Temas complejos",   topics: ["French Revolution", "Cognitive psychology", "Existentialism", "Quantum mechanics"] },
};

async function fetchWikiArticle(title: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0] as { extract?: string };
  const text = (page?.extract ?? "").trim();
  // Return first ~600 words to keep it readable
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, 600).join(" ");
}

function WikiReader({ onRead }: { onRead: (title: string, content: string) => void }) {
  const [search, setSearch]         = useState("");
  const [results, setResults]       = useState<WikiResult[]>([]);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState<string | null>(null);
  const [searched, setSearched]     = useState(false);

  async function doSearch(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&format=json&origin=*`;
      const res = await fetch(url);
      const [, titles, descs] = await res.json() as [string, string[], string[]];
      setResults(titles.map((t, i) => ({ title: t, description: descs[i] ?? "" })));
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  async function handleRead(title: string) {
    setFetching(title);
    try {
      const content = await fetchWikiArticle(title);
      if (!content) throw new Error("empty");
      onRead(title, content);
    } catch {
      alert("No se pudo cargar el artículo. Intenta con otro.");
    }
    setFetching(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveLevel(null);
    doSearch(search);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Level buttons */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Filtrar por nivel:</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(WIKI_TOPICS).map(([level, { desc }]) => (
            <button
              key={level}
              onClick={() => {
                setActiveLevel(level);
                const topics = WIKI_TOPICS[level].topics;
                const pick = topics[Math.floor(Math.random() * topics.length)];
                setSearch(pick);
                doSearch(pick);
              }}
              className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${
                activeLevel === level
                  ? "bg-indigo-600/30 border-indigo-500/60 text-indigo-300"
                  : "bg-slate-700/40 border-slate-600/40 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="text-sm font-bold">{level}</span>
              <span className="text-[10px] opacity-70 leading-tight mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic chips for active level */}
      {activeLevel && (
        <div className="flex flex-wrap gap-2">
          {WIKI_TOPICS[activeLevel].topics.map((topic) => (
            <button
              key={topic}
              onClick={() => { setSearch(topic); doSearch(topic); }}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                search === topic
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveLevel(null); }}
          placeholder="Buscar tema en Wikipedia (en inglés)…"
          className="flex-1 rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <p className="text-center py-8 text-slate-400 animate-pulse">Buscando…</p>
      ) : !searched ? (
        <p className="text-center py-8 text-slate-500 text-sm">Elige un nivel o busca un tema para empezar.</p>
      ) : results.length === 0 ? (
        <p className="text-center py-8 text-slate-400">Sin resultados. Prueba otra búsqueda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <div key={r.title} className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.title}</p>
                {r.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{r.description}</p>
                )}
              </div>
              <button
                onClick={() => handleRead(r.title)}
                disabled={fetching === r.title}
                className="shrink-0 text-xs px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 transition font-medium"
              >
                {fetching === r.title ? "Cargando…" : "📖 Leer"}
              </button>
            </div>
          ))}
        </div>
      )}
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
              <span className="text-xs text-slate-500">{s.source === "ai" ? "✨ IA" : "🌐 Wikipedia"}</span>
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
    { key: "classics", label: "🌐 Artículos" },
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
          <WikiReader
            onRead={(title, content) =>
              openReading({ title, content, source: "wikipedia" })
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
