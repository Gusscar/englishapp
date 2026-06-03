"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface Chapter {
  id: number;
  title: string;
  desc: string;
  level: Level;
  grammarId?: string; // links to /grammar?topic=id
}

interface Unit {
  id: number;
  title: string;
  subtitle: string;
  level: Level;
  color: UnitColor;
  chapters: Chapter[];
}

type Level = "A1" | "A2" | "B1" | "B2";
type UnitColor = "emerald" | "teal" | "sky" | "indigo" | "amber" | "orange" | "rose" | "purple";

// ── Color map ────────────────────────────────────────────────────────────────

const COLOR: Record<UnitColor, {
  ring: string; badge: string; dot: string;
  barFill: string; unitBg: string; unitBorder: string;
  chDone: string; levelBadge: string;
}> = {
  emerald: {
    ring:        "ring-emerald-500/40",
    badge:       "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    dot:         "bg-emerald-400",
    barFill:     "bg-emerald-500",
    unitBg:      "bg-emerald-950/20",
    unitBorder:  "border-emerald-800/40",
    chDone:      "bg-emerald-900/30 border-emerald-700/40",
    levelBadge:  "bg-emerald-900/60 text-emerald-300",
  },
  teal: {
    ring:        "ring-teal-500/40",
    badge:       "bg-teal-500/15 text-teal-300 border border-teal-500/30",
    dot:         "bg-teal-400",
    barFill:     "bg-teal-500",
    unitBg:      "bg-teal-950/20",
    unitBorder:  "border-teal-800/40",
    chDone:      "bg-teal-900/30 border-teal-700/40",
    levelBadge:  "bg-teal-900/60 text-teal-300",
  },
  sky: {
    ring:        "ring-sky-500/40",
    badge:       "bg-sky-500/15 text-sky-300 border border-sky-500/30",
    dot:         "bg-sky-400",
    barFill:     "bg-sky-500",
    unitBg:      "bg-sky-950/20",
    unitBorder:  "border-sky-800/40",
    chDone:      "bg-sky-900/30 border-sky-700/40",
    levelBadge:  "bg-sky-900/60 text-sky-300",
  },
  indigo: {
    ring:        "ring-indigo-500/40",
    badge:       "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
    dot:         "bg-indigo-400",
    barFill:     "bg-indigo-500",
    unitBg:      "bg-indigo-950/20",
    unitBorder:  "border-indigo-800/40",
    chDone:      "bg-indigo-900/30 border-indigo-700/40",
    levelBadge:  "bg-indigo-900/60 text-indigo-300",
  },
  amber: {
    ring:        "ring-amber-500/40",
    badge:       "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dot:         "bg-amber-400",
    barFill:     "bg-amber-500",
    unitBg:      "bg-amber-950/20",
    unitBorder:  "border-amber-800/40",
    chDone:      "bg-amber-900/30 border-amber-700/40",
    levelBadge:  "bg-amber-900/60 text-amber-300",
  },
  orange: {
    ring:        "ring-orange-500/40",
    badge:       "bg-orange-500/15 text-orange-300 border border-orange-500/30",
    dot:         "bg-orange-400",
    barFill:     "bg-orange-500",
    unitBg:      "bg-orange-950/20",
    unitBorder:  "border-orange-800/40",
    chDone:      "bg-orange-900/30 border-orange-700/40",
    levelBadge:  "bg-orange-900/60 text-orange-300",
  },
  rose: {
    ring:        "ring-rose-500/40",
    badge:       "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    dot:         "bg-rose-400",
    barFill:     "bg-rose-500",
    unitBg:      "bg-rose-950/20",
    unitBorder:  "border-rose-800/40",
    chDone:      "bg-rose-900/30 border-rose-700/40",
    levelBadge:  "bg-rose-900/60 text-rose-300",
  },
  purple: {
    ring:        "ring-purple-500/40",
    badge:       "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    dot:         "bg-purple-400",
    barFill:     "bg-purple-500",
    unitBg:      "bg-purple-950/20",
    unitBorder:  "border-purple-800/40",
    chDone:      "bg-purple-900/30 border-purple-700/40",
    levelBadge:  "bg-purple-900/60 text-purple-300",
  },
};

const LEVEL_STYLE: Record<Level, string> = {
  A1: "bg-emerald-900/60 text-emerald-300",
  A2: "bg-teal-900/60 text-teal-300",
  B1: "bg-sky-900/60 text-sky-300",
  B2: "bg-amber-900/60 text-amber-300",
};

// ── Curriculum data ───────────────────────────────────────────────────────────

const UNITS: Unit[] = [
  {
    id: 1, title: "Unidad 1", subtitle: "Inglés Básico I", level: "A1", color: "emerald",
    chapters: [
      { id: 4,  title: "Vocabulario del salón de clases", desc: "Palabras esenciales del aula: teacher, student, book, pencil, blackboard y más.", level: "A1" },
      { id: 5,  title: "Presentaciones y saludos", desc: "Cómo presentarte: What is your name?, Nice to meet you!, Where are you from?", level: "A1" },
      { id: 6,  title: "Verbos y pronombres", desc: "To be (am/is/are) y to have. Pronombres sujeto: I, you, he, she, it, we, they.", level: "A1", grammarId: "to-be" },
      { id: 7,  title: "Sustantivos y plurales", desc: "Reglas para pluralizar: -s, -es, cambio de -y por -ies, irregulares (man→men).", level: "A1" },
      { id: 8,  title: "Práctica unidad 1", desc: "Ejercicios de escritura y comprensión sobre los temas anteriores.", level: "A1" },
      { id: 9,  title: "Los adverbios", desc: "Adverbios de modo, lugar, tiempo y de cantidad básicos.", level: "A1" },
      { id: 10, title: "Adverbios, preposiciones y conjunciones", desc: "Preposiciones básicas (in, on, at, to) y conjunciones simples (and, but, or).", level: "A1" },
      { id: 11, title: "Los artículos: the, a, an", desc: "Artículo definido 'the' vs. indefinidos 'a/an'. Cuándo usarlos y cuándo omitirlos.", level: "A1", grammarId: "articles" },
    ],
  },
  {
    id: 2, title: "Unidad 2", subtitle: "Inglés Básico II", level: "A1", color: "teal",
    chapters: [
      { id: 12, title: "Verbos regulares en presente", desc: "Lista de ~200 verbos regulares: accept, ask, believe, call, clean… con pronunciación.", level: "A1" },
      { id: 13, title: "Verbos irregulares en presente", desc: "Lista de ~100 verbos irregulares esenciales: be, go, come, have, get, know, make…", level: "A2" },
      { id: 14, title: "Adjetivos y sus opuestos", desc: "Pares de opuestos: tall/short, hot/cold, good/bad, expensive/cheap y más.", level: "A2" },
      { id: 15, title: "Preposiciones I", desc: "Preposiciones de lugar: in front of, behind, next to, between, above, below…", level: "A2", grammarId: "prepositions-place" },
      { id: 16, title: "Preposiciones II", desc: "Preposiciones de tiempo y movimiento: at, on, in, by, until, since, for.", level: "A2", grammarId: "prepositions-time" },
    ],
  },
  {
    id: 3, title: "Unidad 3", subtitle: "Inglés Básico III", level: "A2", color: "sky",
    chapters: [
      { id: 17, title: "Adjetivos y pronombres posesivos", desc: "My/mine, your/yours, his, her/hers, our/ours, their/theirs. Uso y diferencia.", level: "A2", grammarId: "possessives" },
      { id: 18, title: "Pronombres demostrativos", desc: "This/that (singular) y these/those (plural). Distancia y contexto.", level: "A2", grammarId: "demonstratives" },
      { id: 19, title: "There is / There are", desc: "Describir existencia: There is (singular) / There are (plural), negativo e interrogativo.", level: "A2", grammarId: "there-is-are" },
      { id: 20, title: "Uso de on, in y at", desc: "On (superficie/días), in (dentro/meses/años), at (punto exacto/horas/lugares).", level: "A2", grammarId: "prepositions-time" },
      { id: 21, title: "The use of the -ing", desc: "Gerundio como sujeto, complemento y con verbos como enjoy, avoid, keep.", level: "A2", grammarId: "gerund-infinitive" },
      { id: 22, title: "Another, the other, the others", desc: "Another (uno más, indeterminado), the other (el otro específico), the others (los demás).", level: "A2" },
    ],
  },
  {
    id: 4, title: "Unidad 4", subtitle: "Inglés Básico IV", level: "A2", color: "indigo",
    chapters: [
      { id: 23, title: "Presente progresivo", desc: "Am/is/are + verb-ing. Acciones en progreso ahora, planes futuros y situaciones temporales.", level: "A2", grammarId: "present-continuous" },
      { id: 24, title: "Presente simple", desc: "Rutinas y hechos. Do/Does en negativo e interrogativo. He/she/it: verbo + -s/-es.", level: "A2", grammarId: "simple-present" },
      { id: 25, title: "Palabras interrogativas", desc: "What, who, where, when, why, how, how much/many. Formación de preguntas abiertas.", level: "A2" },
      { id: 26, title: "Apéndice 1 y 2", desc: "Orden de adjetivos, expresiones de tiempo comunes y repaso de la unidad.", level: "A2" },
    ],
  },
  {
    id: 5, title: "Unidad 5", subtitle: "Inglés Intermedio I", level: "B1", color: "amber",
    chapters: [
      { id: 27, title: "Adverbios de frecuencia", desc: "Always (100%) → usually → often → sometimes → rarely → never (0%). Posición en la oración.", level: "B1", grammarId: "frequency-adverbs" },
      { id: 28, title: "Comparativos", desc: "Adj. cortos: -er + than. Adj. largos: more/less + than. Irregulares: good→better, bad→worse.", level: "B1", grammarId: "comparatives-superlatives" },
      { id: 29, title: "El uso de as, but, by y so", desc: "As (como/a medida que), but (pero), by (para cuando/mediante), so (así que/tan).", level: "B1" },
      { id: 30, title: "Superlativos", desc: "The + adj + -est (cortos). The most/least + adj (largos). The best, the worst, the farthest.", level: "B1", grammarId: "comparatives-superlatives" },
      { id: 31, title: "Pronombres reflexivos", desc: "Myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.", level: "B1", grammarId: "reflexive-pronouns" },
      { id: 32, title: "Pronombres del predicado (objeto)", desc: "Me, you, him, her, it, us, them. Posición después del verbo o preposición.", level: "B1" },
      { id: 33, title: "Cuantificadores", desc: "Some/any, many/much, a few/a little, a lot of, enough. Contables vs. incontables.", level: "B1", grammarId: "quantifiers" },
      { id: 34, title: "Very and too", desc: "Very (intensificador neutral), too (exceso con consecuencia negativa). Diferencia clave.", level: "B1", grammarId: "very-too" },
      { id: 35, title: "Calificadores", desc: "Quite, rather, pretty, fairly, extremely — grados entre 'a little' y 'very'.", level: "B1" },
    ],
  },
  {
    id: 6, title: "Unidad 6", subtitle: "Inglés Intermedio II", level: "B1", color: "orange",
    chapters: [
      { id: 36, title: "Futuro: idiomático, simple y continuo", desc: "Going to (planes), will (espontáneo/predicciones), will be + ing (acción en progreso futura).", level: "B1", grammarId: "future" },
      { id: 37, title: "Do and make", desc: "Do: actividades, tareas (homework, exercise). Make: crear, producir (mistake, plan, phone call).", level: "B1", grammarId: "do-make" },
      { id: 38, title: "Pasado simple y progresivo", desc: "Simple past (acción completada) vs. past continuous (acción en progreso). When/while.", level: "B1", grammarId: "simple-past" },
      { id: 39, title: "Interrupciones", desc: "Estructura con when/while para describir una acción interrumpida por otra.", level: "B1", grammarId: "past-continuous" },
      { id: 40, title: "Palabras interrogativas con futuro y pasado", desc: "What will…?, When did…?, Why was…?, Where were you…? — preguntas en diferentes tiempos.", level: "B1" },
      { id: 41, title: "Preguntas de confirmación (tag questions)", desc: "She works, doesn't she? / It wasn't raining, was it? Estructura y uso.", level: "B1", grammarId: "tag-questions" },
      { id: 42, title: "Pronombres indefinidos", desc: "Someone/anyone/no one, something/anything/nothing, somewhere/anywhere/nowhere.", level: "B1", grammarId: "indefinite-pronouns" },
      { id: 43, title: "Pronombres relativos", desc: "Who (personas), which (cosas), that (ambos), whose (posesión), where (lugar).", level: "B1", grammarId: "relative-pronouns" },
      { id: 44, title: "Whatever, whichever, whoever…", desc: "Pronombres libres: whatever (lo que sea), whoever (quien sea), whenever, however.", level: "B1" },
      { id: 45, title: "Pronombres recíprocos", desc: "Each other y one another. Expresar acciones mutuas entre dos o más personas.", level: "B1" },
      { id: 46, title: "Conectores y conjunciones", desc: "Because, so, although, even though, so that, in order to, while, unless.", level: "B1", grammarId: "connectors" },
      { id: 47, title: "The use of… (expresiones con once, twice)", desc: "Once, twice, three times. Expresiones de frecuencia exacta y frases hechas.", level: "B1" },
      { id: 48, title: "Apéndice unidad 6", desc: "Repaso general de la unidad con ejercicios de práctica.", level: "B1" },
    ],
  },
  {
    id: 7, title: "Unidad 7", subtitle: "Inglés Intermedio III", level: "B2", color: "rose",
    chapters: [
      { id: 49, title: "Presente perfecto y continuo", desc: "Have/has + participle (experiencias, resultados). Have been + -ing (duración hasta ahora).", level: "B2", grammarId: "present-perfect" },
      { id: 50, title: "Pasado perfecto y continuo", desc: "Had + participle (antes de otro evento pasado). Had been + -ing (duración en el pasado).", level: "B2", grammarId: "past-perfect" },
      { id: 51, title: "Preguntas de confirmación con pres. perfecto", desc: "You've been there, haven't you? She hasn't called, has she?", level: "B2" },
      { id: 52, title: "Verbos modales", desc: "Can/could, may/might, should/ought to, must/have to, would. Significados y usos.", level: "B2", grammarId: "modals" },
      { id: 53, title: "Already, yet y just", desc: "Already (ya, algo antes de lo esperado), yet (todavía, pregunta/negativo), just (recién).", level: "B2", grammarId: "already-yet-just" },
      { id: 54, title: "Discurso directo e indirecto", desc: "Reported speech: retroceso de tiempos, cambio de pronombres y expresiones de tiempo.", level: "B2", grammarId: "reported-speech" },
      { id: 55, title: "Modales en pasado", desc: "Could have, should have, would have, might have — situaciones hipotéticas en el pasado.", level: "B2", grammarId: "modal-past" },
      { id: 56, title: "Voz activa y voz pasiva", desc: "Be + past participle. Cuándo usarla y cómo transformar oraciones activas a pasivas.", level: "B2", grammarId: "passive" },
      { id: 57, title: "Would rather / would prefer", desc: "Expresar preferencia: I'd rather stay. I'd prefer to go. Comparación de estructuras.", level: "B2" },
      { id: 58, title: "Condicionales y unless", desc: "Zero, 1st, 2nd y 3rd conditional. Unless = if…not. Mixed conditionals.", level: "B2", grammarId: "conditionals" },
    ],
  },
  {
    id: 8, title: "Unidad 8", subtitle: "Inglés Intermedio IV", level: "B2", color: "purple",
    chapters: [
      { id: 59, title: "Verbos + complemento obligatorio", desc: "Verbos que necesitan un objeto para completar su significado: accuse of, rely on, insist on.", level: "B2" },
      { id: 60, title: "El uso de wish", desc: "Wish + past simple (deseo presente imposible), wish + past perfect (arrepentimiento).", level: "B2", grammarId: "wish" },
      { id: 61, title: "Verbos de los sentidos", desc: "See, hear, feel, smell, taste + object + bare infinitive o -ing. Percepciones directas.", level: "B2" },
      { id: 62, title: "Whether… or… not", desc: "Whether como conjunción de duda o alternativa. Diferencia con if en preguntas indirectas.", level: "B2" },
      { id: 63, title: "El uso de even", desc: "Even (incluso), even if (incluso si), even though (aunque), even so (aún así).", level: "B2" },
      { id: 64, title: "Verbos y preposiciones", desc: "Combinaciones fijas: think of, depend on, apologize for, congratulate on, remind of.", level: "B2" },
      { id: 65, title: "Prefijos", desc: "Un- (unhappy), il- (illegal), in- (incorrect), dis- (disagree), re- (redo), over-.", level: "B2" },
      { id: 66, title: "Abreviaturas comunes", desc: "Mr., Mrs., Dr., etc., e.g., i.e., a.m., p.m. y otras abreviaturas del inglés cotidiano.", level: "B2" },
      { id: 67, title: "Verbos de dos palabras (phrasal verbs)", desc: "Separables vs. inseparables. Give up, take over, run out of, show off y más.", level: "B2" },
      { id: 68, title: "Expresiones comunes", desc: "At last, by the way, make up one's mind, no longer, for sure, after all y muchas más.", level: "B2" },
    ],
  },
];

const TOTAL_CHAPTERS = UNITS.reduce((s, u) => s + u.chapters.length, 0);
const STORAGE_KEY = "curso_completed";

// ── Main component ────────────────────────────────────────────────────────────

export default function CursoPage() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expanded,  setExpanded]  = useState<Set<number>>(new Set([1])); // unit 1 open by default
  const [mounted,   setMounted]   = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw) as number[]));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Save progress to localStorage
  const toggleChapter = useCallback((id: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toggleUnit = useCallback((id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const totalDone = completed.size;
  const pct = Math.round((totalDone / TOTAL_CHAPTERS) * 100);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-semibold text-xl tracking-tight text-white">Curso Completo</h1>
            <p className="text-xs text-slate-500 mt-0.5">Omar Ali Caldela · 8 unidades · {TOTAL_CHAPTERS} capítulos</p>
          </div>
          {mounted && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
              pct === 100
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
            }`}>
              {totalDone}/{TOTAL_CHAPTERS}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {mounted && (
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{pct}% completado</p>
          </div>
        )}
      </header>

      {/* ── Units ── */}
      <main className="flex-1 px-4 pb-4 space-y-3">
        {UNITS.map(unit => {
          const c         = COLOR[unit.color];
          const unitDone  = unit.chapters.filter(ch => completed.has(ch.id)).length;
          const unitPct   = Math.round((unitDone / unit.chapters.length) * 100);
          const isOpen    = expanded.has(unit.id);

          return (
            <div
              key={unit.id}
              className={`rounded-2xl border ${c.unitBorder} ${c.unitBg} overflow-hidden`}
            >
              {/* Unit header — tap to expand */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                {/* Unit number dot */}
                <span className={`size-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold text-white ${c.dot.replace('bg-', 'bg-')}`}
                  style={{ background: c.dot.includes('emerald') ? '#10b981'
                    : c.dot.includes('teal') ? '#14b8a6'
                    : c.dot.includes('sky') ? '#0ea5e9'
                    : c.dot.includes('indigo') ? '#6366f1'
                    : c.dot.includes('amber') ? '#f59e0b'
                    : c.dot.includes('orange') ? '#f97316'
                    : c.dot.includes('rose') ? '#f43f5e'
                    : '#a855f7' }}
                >
                  {unit.id}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{unit.subtitle}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${LEVEL_STYLE[unit.level]}`}>
                      {unit.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.barFill} rounded-full transition-all duration-300`}
                        style={{ width: mounted ? `${unitPct}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {mounted ? `${unitDone}/${unit.chapters.length}` : `0/${unit.chapters.length}`}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Chapter list */}
              {isOpen && (
                <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
                  {unit.chapters.map((ch) => {
                    const done = completed.has(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          done ? c.chDone : "hover:bg-slate-800/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          className={`mt-0.5 size-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                            done
                              ? `${c.barFill} border-transparent`
                              : "border-slate-600 hover:border-slate-400"
                          }`}
                          aria-label={done ? "Marcar como no completado" : "Marcar como completado"}
                        >
                          {done && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-mono text-slate-600`}>Cap. {ch.id}</span>
                            <span className={`text-sm font-medium leading-tight ${done ? "text-slate-400 line-through decoration-slate-600" : "text-white"}`}>
                              {ch.title}
                            </span>
                            {ch.level !== unit.level && (
                              <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${LEVEL_STYLE[ch.level]}`}>
                                {ch.level}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ch.desc}</p>
                          {ch.grammarId && (
                            <Link
                              href={`/grammar?topic=${ch.grammarId}`}
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/>
                              </svg>
                              Ver en Gramática
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
