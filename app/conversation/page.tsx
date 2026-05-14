"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/lib/ai";

/* ── Scenarios ── */
const SCENARIOS = [
  { id: "free",       title: "Conversacion libre",      desc: "Habla de cualquier tema",            color: "from-indigo-900/60 to-indigo-900/20 border-indigo-700/40",  iconColor: "text-indigo-400",  icon: "💬" },
  { id: "job",        title: "Entrevista de trabajo",   desc: "Practica para una entrevista",       color: "from-sky-900/60 to-sky-900/20 border-sky-700/40",          iconColor: "text-sky-400",     icon: "💼" },
  { id: "restaurant", title: "En el restaurante",       desc: "Pide comida en ingles",              color: "from-amber-900/60 to-amber-900/20 border-amber-700/40",    iconColor: "text-amber-400",   icon: "🍽️" },
  { id: "airport",    title: "En el aeropuerto",        desc: "Check-in y preguntas de viaje",      color: "from-violet-900/60 to-violet-900/20 border-violet-700/40", iconColor: "text-violet-400",  icon: "✈️" },
  { id: "doctor",     title: "En el medico",            desc: "Describe sintomas en ingles",        color: "from-rose-900/60 to-rose-900/20 border-rose-700/40",       iconColor: "text-rose-400",    icon: "🏥" },
  { id: "shopping",   title: "De compras",              desc: "Precios, tallas y productos",        color: "from-emerald-900/60 to-emerald-900/20 border-emerald-700/40", iconColor: "text-emerald-400", icon: "🛍️" },
  { id: "phone",      title: "Llamada telefonica",      desc: "Conversacion formal por telefono",   color: "from-teal-900/60 to-teal-900/20 border-teal-700/40",       iconColor: "text-teal-400",    icon: "📞" },
  { id: "smalltalk",  title: "Small talk",              desc: "Charla casual con desconocidos",     color: "from-pink-900/60 to-pink-900/20 border-pink-700/40",       iconColor: "text-pink-400",    icon: "🤝" },
];

interface Feedback {
  corrections: { original: string; corrected: string; explanation: string }[];
  vocabulary:  { used: string; better: string; note: string }[];
  assessment:  string;
}

/* ── Speech recognition types ── */
interface WebSpeechRec extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void;
  onstart: ((e: Event) => void) | null;
  onend:   ((e: Event) => void) | null;
  onerror: ((e: Event) => void) | null;
  onresult: ((e: { results: { length: number; [i: number]: { length: number; [j: number]: { transcript: string } } } }) => void) | null;
}

export default function ConversationPage() {
  const [scenario,    setScenario]    = useState<string | null>(null);
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [listening,   setListening]   = useState(false);
  const [feedback,    setFeedback]    = useState<Feedback | null>(null);
  const [loadingFb,   setLoadingFb]   = useState(false);
  const [showFb,      setShowFb]      = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const recognRef   = useRef<WebSpeechRec | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startScenario = useCallback(async (id: string) => {
    setScenario(id);
    setMessages([]);
    setFeedback(null);
    setLoading(true);
    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: id,
        mode: "chat",
        messages: [{ role: "user", content: "Hello! Let's start." }],
      }),
    });
    const data = await res.json();
    setMessages([
      { role: "user", content: "Hello! Let's start." },
      { role: "assistant", content: data.reply ?? "Hello! I'm ready to practice with you." },
    ]);
    setLoading(false);
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, mode: "chat", messages: next }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "..." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function getFeedback() {
    if (messages.length < 2) return;
    setLoadingFb(true);
    setShowFb(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, mode: "feedback", messages }),
      });
      const data = await res.json();
      setFeedback(data.feedback ?? null);
    } finally {
      setLoadingFb(false);
    }
  }

  function startMic() {
    const win = window as Window & { SpeechRecognition?: new () => WebSpeechRec; webkitSpeechRecognition?: new () => WebSpeechRec };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) { alert("Tu navegador no soporta voz."); return; }
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    recognRef.current = r;
    r.onstart = () => setListening(true);
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setTimeout(() => sendMessage(text), 300);
    };
    r.start();
  }

  function stopMic() { recognRef.current?.stop(); }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const currentScenario = SCENARIOS.find(s => s.id === scenario);

  /* ── Scenario picker ── */
  if (!scenario) {
    return (
      <div className="min-h-screen flex flex-col pb-24">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-semibold text-xl tracking-tight">Conversacion con IA</h1>
          <p className="text-xs text-slate-500 mt-0.5">Elige un escenario para practicar</p>
        </header>
        <main className="flex-1 px-4 grid grid-cols-2 gap-3 content-start">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => startScenario(s.id)}
              className={`flex flex-col gap-3 p-4 rounded-3xl bg-gradient-to-br border text-left active:scale-[0.97] transition-transform ${s.color}`}
            >
              <span className="text-3xl leading-none">{s.icon}</span>
              <div>
                <p className="font-semibold text-sm text-white leading-snug">{s.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{s.desc}</p>
              </div>
            </button>
          ))}
        </main>
      </div>
    );
  }

  /* ── Chat interface ── */
  return (
    <div className="flex flex-col h-screen pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setScenario(null)}
          className="size-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white active:scale-90 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">
            {currentScenario?.icon} {currentScenario?.title}
          </p>
          <p className="text-xs text-slate-500">Solo en ingles</p>
        </div>
        <button
          onClick={getFeedback}
          disabled={messages.length < 4 || loadingFb}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold disabled:opacity-30 active:scale-95 transition-all"
        >
          Feedback
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <span className="size-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2 mt-1">
                AI
              </span>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <span className="size-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2 mt-1">AI</span>
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="size-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-slate-800 bg-slate-900">
        <div className="flex items-end gap-2 bg-slate-800 rounded-2xl border border-slate-700/60 px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write in English… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-28 leading-relaxed py-1"
            style={{ scrollbarWidth: "none" }}
          />
          <div className="flex gap-2 shrink-0 pb-0.5">
            <button
              onClick={listening ? stopMic : startMic}
              className={`size-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                listening ? "bg-red-500/30 text-red-300 animate-pulse" : "bg-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="size-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 active:scale-90 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-1.5">
          {messages.filter(m => m.role === "user").length} mensajes · Feedback disponible con 2+ intercambios
        </p>
      </div>

      {/* Feedback sheet */}
      {showFb && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFb(false)} />
          <div className="relative w-full bg-slate-800 rounded-t-3xl border-t border-slate-700/60 px-4 pt-3 pb-10 max-h-[80vh] overflow-y-auto flex flex-col gap-4">
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Feedback de tu conversacion</h2>
              <button onClick={() => setShowFb(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            {loadingFb && (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
                <div className="size-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin" />
                <p className="text-sm">Analizando tu ingles…</p>
              </div>
            )}

            {feedback && (
              <>
                {/* Assessment */}
                <div className="rounded-2xl bg-emerald-900/30 border border-emerald-800/40 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">Evaluacion general</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{feedback.assessment}</p>
                </div>

                {/* Corrections */}
                {feedback.corrections.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Correcciones gramaticales</p>
                    {feedback.corrections.map((c, i) => (
                      <div key={i} className="rounded-2xl bg-red-900/20 border border-red-800/30 px-4 py-3 flex flex-col gap-1.5">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-red-400 line-through opacity-80 flex-1">{c.original}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0 mt-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <span className="text-emerald-300 flex-1">{c.corrected}</span>
                        </div>
                        <p className="text-xs text-slate-400">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vocabulary */}
                {feedback.vocabulary.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Vocabulario mas natural</p>
                    {feedback.vocabulary.map((v, i) => (
                      <div key={i} className="rounded-2xl bg-amber-900/20 border border-amber-800/30 px-4 py-3 flex flex-col gap-1.5">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-amber-400/70 flex-1">"{v.used}"</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0 mt-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <span className="text-indigo-300 flex-1">"{v.better}"</span>
                        </div>
                        <p className="text-xs text-slate-400">{v.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {feedback.corrections.length === 0 && feedback.vocabulary.length === 0 && (
                  <div className="rounded-2xl bg-slate-700/40 border border-slate-600/30 px-4 py-4 text-center">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-sm text-slate-300">No se encontraron errores. ¡Excelente ingles!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
