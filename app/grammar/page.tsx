"use client";

import { useState } from "react";

// ── Data ────────────────────────────────────────────────────────────────────

interface Example {
  english: string;
  highlight: string;   // the word/phrase to highlight
  spanish: string;
  note?: string;
}

interface GrammarTopic {
  id: string;
  label: string;
  icon: string;
  color: string;
  title: string;
  structure: string;
  description: string;
  examples: Example[];
}

const TOPICS: GrammarTopic[] = [
  {
    id: "past-participle",
    label: "Past Participle",
    icon: "📌",
    color: "indigo",
    title: "Past Participle",
    structure: "have / has / had + verb³  |  be + verb³",
    description:
      "El participio pasado (3.ª forma verbal) se usa en tiempos perfectos y en la voz pasiva. Muchos participios son irregulares: go → gone, write → written, break → broken.",
    examples: [
      {
        english: "She has written three novels.",
        highlight: "written",
        spanish: "Ella ha escrito tres novelas.",
        note: "Present perfect — logro sin fecha específica.",
      },
      {
        english: "The window was broken by the storm.",
        highlight: "broken",
        spanish: "La ventana fue rota por la tormenta.",
        note: "Voz pasiva — el sujeto recibe la acción.",
      },
      {
        english: "Have you ever eaten sushi?",
        highlight: "eaten",
        spanish: "¿Alguna vez has comido sushi?",
        note: "Pregunta de experiencia con 'ever'.",
      },
      {
        english: "By the time we arrived, the movie had already started.",
        highlight: "started",
        spanish: "Para cuando llegamos, la película ya había empezado.",
        note: "Past perfect — acción anterior a otra en el pasado.",
      },
      {
        english: "The report has been reviewed by the manager.",
        highlight: "reviewed",
        spanish: "El informe ha sido revisado por el gerente.",
        note: "Present perfect pasivo.",
      },
    ],
  },
  {
    id: "present-continuous",
    label: "Present Continuous",
    icon: "🔄",
    color: "emerald",
    title: "Present Continuous",
    structure: "am / is / are + verb-ing",
    description:
      "El presente continuo describe acciones en progreso ahora mismo, situaciones temporales y planes futuros ya acordados. Se forma con el auxiliar to be + el gerundio (-ing).",
    examples: [
      {
        english: "She is reading a novel right now.",
        highlight: "is reading",
        spanish: "Ella está leyendo una novela ahora mismo.",
        note: "Acción en progreso en este momento.",
      },
      {
        english: "They are playing football in the park.",
        highlight: "are playing",
        spanish: "Ellos están jugando fútbol en el parque.",
        note: "Actividad que ocurre mientras se habla.",
      },
      {
        english: "I am studying English every evening this month.",
        highlight: "am studying",
        spanish: "Estoy estudiando inglés todas las noches este mes.",
        note: "Situación temporal (solo este mes).",
      },
      {
        english: "He is cooking a special dinner for the family tonight.",
        highlight: "is cooking",
        spanish: "Él está cocinando una cena especial para la familia esta noche.",
        note: "Plan concreto para el futuro cercano.",
      },
      {
        english: "We are traveling to New York next week.",
        highlight: "are traveling",
        spanish: "Viajamos a Nueva York la próxima semana.",
        note: "Futuro acordado — ya hay reserva o plan definido.",
      },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function colorClasses(color: string, variant: "bg" | "border" | "text" | "badge") {
  const map: Record<string, Record<string, string>> = {
    indigo: {
      bg: "bg-indigo-600",
      border: "border-indigo-500",
      text: "text-indigo-400",
      badge: "bg-indigo-900/60 text-indigo-300 border border-indigo-700",
    },
    emerald: {
      bg: "bg-emerald-600",
      border: "border-emerald-500",
      text: "text-emerald-400",
      badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
    },
  };
  return map[color]?.[variant] ?? "";
}

function highlightSentence(sentence: string, highlight: string) {
  const idx = sentence.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <span>{sentence}</span>;
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="font-bold text-white underline decoration-dotted underline-offset-2">
        {sentence.slice(idx, idx + highlight.length)}
      </span>
      {sentence.slice(idx + highlight.length)}
    </>
  );
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ── ExampleCard ──────────────────────────────────────────────────────────────

function ExampleCard({ ex, color, index }: { ex: Example; color: string; index: number }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-2">
      {/* Number + English */}
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold mt-0.5 w-5 shrink-0 ${colorClasses(color, "text")}`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 leading-relaxed text-[15px]">
            {highlightSentence(ex.english, ex.highlight)}
          </p>
          <p className="text-slate-400 text-sm mt-0.5 italic">{ex.spanish}</p>
        </div>
        <button
          onClick={() => speakText(ex.english)}
          className="shrink-0 text-xl leading-none text-slate-500 hover:text-white transition mt-0.5"
          title="Escuchar"
        >
          🔊
        </button>
      </div>

      {/* Note */}
      {ex.note && (
        <div className={`text-xs rounded-lg px-3 py-1.5 ${colorClasses(color, "badge")}`}>
          💡 {ex.note}
        </div>
      )}
    </div>
  );
}

// ── TopicView ────────────────────────────────────────────────────────────────

function TopicView({ topic }: { topic: GrammarTopic }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Structure badge */}
      <div className={`rounded-xl px-4 py-3 border ${colorClasses(topic.color, "badge")}`}>
        <p className="text-xs font-semibold mb-0.5 opacity-70">Estructura</p>
        <p className="font-mono font-bold text-sm">{topic.structure}</p>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed">{topic.description}</p>

      {/* Examples */}
      <div className="flex flex-col gap-3">
        <h3 className={`text-sm font-semibold ${colorClasses(topic.color, "text")}`}>
          {topic.icon} 5 ejemplos
        </h3>
        {topic.examples.map((ex, i) => (
          <ExampleCard key={i} ex={ex} color={topic.color} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GrammarPage() {
  const [activeId, setActiveId] = useState<string>(TOPICS[0].id);
  const active = TOPICS.find((t) => t.id === activeId)!;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center gap-2 px-5 pt-5 pb-3">
        <span className="text-2xl">📝</span>
        <h1 className="font-bold text-lg">Gramática</h1>
      </header>

      {/* Topic tabs */}
      <div className="flex border-b border-slate-800">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              activeId === t.id
                ? `text-white ${colorClasses(t.color, "border")}`
                : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <TopicView topic={active} />
      </main>
    </div>
  );
}
