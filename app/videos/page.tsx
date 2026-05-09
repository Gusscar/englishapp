"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface YTItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: { medium: { url: string } };
  };
}

// ── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "Cuentos infantiles", query: "children stories english read aloud" },
  { label: "Principiante A1/A2", query: "english stories for beginners slow" },
  { label: "Intermedio B1/B2", query: "english short stories intermediate level" },
  { label: "Phrasal verbs", query: "english phrasal verbs stories" },
  { label: "Fábulas", query: "aesop fables english animated" },
  { label: "Ciencia ficción", query: "science fiction short story english" },
];

// ── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ item, onPlay }: { item: YTItem; onPlay: (id: string, title: string) => void }) {
  const { videoId } = item.id;
  const { title, channelTitle, thumbnails } = item.snippet;
  return (
    <div className="bg-slate-700/40 border border-slate-600 rounded-xl overflow-hidden flex flex-col">
      <button
        onClick={() => onPlay(videoId, title)}
        className="relative group w-full"
        aria-label={`Reproducir ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnails.medium.url}
          alt={title}
          className="w-full object-cover aspect-video"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="text-4xl">▶</span>
        </div>
      </button>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">{title}</p>
        <p className="text-xs text-slate-400">{channelTitle}</p>
        <button
          onClick={() => onPlay(videoId, title)}
          className="mt-auto text-xs py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium"
        >
          Ver video
        </button>
      </div>
    </div>
  );
}

// ── PlayerModal ──────────────────────────────────────────────────────────────

function PlayerModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-200 flex-1 pr-4 leading-snug">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none shrink-0">×</button>
        </div>
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-700">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&hl=en`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          Tip: activa los subtitulos con el boton CC del video
        </p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("children stories english read aloud");
  const [items, setItems] = useState<YTItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ id: string; title: string } | null>(null);

  async function search(q: string, pageToken?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, ...(pageToken ? { pageToken } : {}) });
      const res = await fetch(`/api/youtube-search?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems((prev) => pageToken ? [...prev, ...data.items] : data.items);
      setNextPageToken(data.nextPageToken);
      setActiveQuery(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al buscar videos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search("children stories english read aloud"); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setItems([]);
    search(query.trim());
  }

  function handlePreset(q: string) {
    setQuery("");
    setItems([]);
    search(q);
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="text-2xl">🎬</span>
        <h1 className="font-bold text-lg">Videos en ingles</h1>
      </header>

      {/* Search */}
      <div className="px-4 flex flex-col gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar videos en ingles..."
            className="flex-1 rounded-xl bg-slate-700 border border-slate-600 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition text-sm font-medium"
          >
            Buscar
          </button>
        </form>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(({ label, query: q }) => (
            <button
              key={q}
              onClick={() => handlePreset(q)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                activeQuery === q
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {error && (
          <p className="text-red-400 text-sm text-center py-6">{error}</p>
        )}

        {!error && items.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-10">Sin resultados.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <VideoCard
              key={item.id.videoId}
              item={item}
              onPlay={(id, title) => setPlayer({ id, title })}
            />
          ))}
        </div>

        {loading && (
          <p className="text-center text-slate-400 animate-pulse py-8">Cargando videos...</p>
        )}

        {nextPageToken && !loading && (
          <button
            onClick={() => search(activeQuery, nextPageToken)}
            className="w-full mt-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
          >
            Cargar mas
          </button>
        )}
      </main>

      {/* Player modal */}
      {player && (
        <PlayerModal
          videoId={player.id}
          title={player.title}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  );
}
