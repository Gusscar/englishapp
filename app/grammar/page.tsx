"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Example {
  english: string;
  highlight: string;
  spanish: string;
  note?: string;
}

interface GrammarTopic {
  id: string;
  label: string;
  icon: string;
  color: Color;
  title: string;
  structure: string;
  description: string;
  examples: Example[];
}

type Color =
  | "indigo" | "emerald" | "amber" | "orange" | "purple"
  | "rose" | "sky" | "teal" | "lime" | "pink" | "yellow" | "violet";

// ── Color map ────────────────────────────────────────────────────────────────

const COLORS: Record<Color, { text: string; border: string; badge: string }> = {
  indigo:  { text: "text-indigo-400",  border: "border-indigo-500",  badge: "bg-indigo-900/60 text-indigo-300 border border-indigo-700"   },
  emerald: { text: "text-emerald-400", border: "border-emerald-500", badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700" },
  amber:   { text: "text-amber-400",   border: "border-amber-500",   badge: "bg-amber-900/60 text-amber-300 border border-amber-700"       },
  orange:  { text: "text-orange-400",  border: "border-orange-500",  badge: "bg-orange-900/60 text-orange-300 border border-orange-700"    },
  purple:  { text: "text-purple-400",  border: "border-purple-500",  badge: "bg-purple-900/60 text-purple-300 border border-purple-700"    },
  rose:    { text: "text-rose-400",    border: "border-rose-500",    badge: "bg-rose-900/60 text-rose-300 border border-rose-700"          },
  sky:     { text: "text-sky-400",     border: "border-sky-500",     badge: "bg-sky-900/60 text-sky-300 border border-sky-700"             },
  teal:    { text: "text-teal-400",    border: "border-teal-500",    badge: "bg-teal-900/60 text-teal-300 border border-teal-700"          },
  lime:    { text: "text-lime-400",    border: "border-lime-500",    badge: "bg-lime-900/60 text-lime-300 border border-lime-700"          },
  pink:    { text: "text-pink-400",    border: "border-pink-500",    badge: "bg-pink-900/60 text-pink-300 border border-pink-700"          },
  yellow:  { text: "text-yellow-400",  border: "border-yellow-500",  badge: "bg-yellow-900/60 text-yellow-300 border border-yellow-700"    },
  violet:  { text: "text-violet-400",  border: "border-violet-500",  badge: "bg-violet-900/60 text-violet-300 border border-violet-700"    },
};

// ── Grammar data ─────────────────────────────────────────────────────────────

const TOPICS: GrammarTopic[] = [
  {
    id: "past-participle",
    label: "Past Participle",
    icon: "📌",
    color: "indigo",
    title: "Past Participle",
    structure: "have / has / had + verb³   |   be + verb³",
    description:
      "El participio pasado (3.ª forma verbal) se usa en tiempos perfectos y en la voz pasiva. Muchos son irregulares: go → gone, write → written, break → broken.",
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
    label: "Pres. Continuous",
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
        spanish: "Él está cocinando una cena especial esta noche.",
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
  {
    id: "simple-past",
    label: "Simple Past",
    icon: "⏪",
    color: "amber",
    title: "Simple Past",
    structure: "subject + verb² (past form)",
    description:
      "El Simple Past describe acciones completadas en un momento específico del pasado. Los verbos regulares añaden -ed; los irregulares tienen su propia forma: go → went, see → saw, buy → bought.",
    examples: [
      {
        english: "She visited Paris last summer.",
        highlight: "visited",
        spanish: "Ella visitó París el verano pasado.",
        note: "Verbo regular: visit → visited.",
      },
      {
        english: "He didn't go to the party.",
        highlight: "didn't go",
        spanish: "Él no fue a la fiesta.",
        note: "Negación con didn't + base form.",
      },
      {
        english: "They bought a new car yesterday.",
        highlight: "bought",
        spanish: "Ellos compraron un carro nuevo ayer.",
        note: "Verbo irregular: buy → bought.",
      },
      {
        english: "Did you see that movie?",
        highlight: "Did",
        spanish: "¿Viste esa película?",
        note: "Pregunta con did + base form.",
      },
      {
        english: "We lived in Mexico for five years.",
        highlight: "lived",
        spanish: "Vivimos en México durante cinco años.",
        note: "Período de tiempo ya terminado.",
      },
    ],
  },
  {
    id: "past-continuous",
    label: "Past Continuous",
    icon: "⏳",
    color: "orange",
    title: "Past Continuous",
    structure: "was / were + verb-ing",
    description:
      "El Past Continuous describe una acción que estaba en progreso en un momento del pasado. Se usa frecuentemente con Simple Past para indicar una acción interrumpida.",
    examples: [
      {
        english: "I was reading when you called.",
        highlight: "was reading",
        spanish: "Estaba leyendo cuando llamaste.",
        note: "Acción en progreso interrumpida por otra.",
      },
      {
        english: "They were playing football at 5 pm.",
        highlight: "were playing",
        spanish: "Estaban jugando fútbol a las 5 pm.",
        note: "Acción en progreso en un momento específico.",
      },
      {
        english: "She was cooking while he was cleaning.",
        highlight: "was cooking",
        spanish: "Ella cocinaba mientras él limpiaba.",
        note: "Dos acciones paralelas en el pasado.",
      },
      {
        english: "It was raining all morning.",
        highlight: "was raining",
        spanish: "Estuvo lloviendo toda la mañana.",
        note: "Acción continua durante un período pasado.",
      },
      {
        english: "Were you sleeping when I arrived?",
        highlight: "Were you sleeping",
        spanish: "¿Estabas durmiendo cuando llegué?",
        note: "Pregunta sobre actividad en progreso.",
      },
    ],
  },
  {
    id: "present-perfect",
    label: "Pres. Perfect",
    icon: "✅",
    color: "purple",
    title: "Present Perfect",
    structure: "have / has + past participle",
    description:
      "El Present Perfect conecta el pasado con el presente. Se usa para experiencias de vida, acciones recientes con resultado presente y situaciones que empezaron en el pasado y continúan ahora.",
    examples: [
      {
        english: "I have visited Japan twice.",
        highlight: "have visited",
        spanish: "He visitado Japón dos veces.",
        note: "Experiencia de vida — sin fecha específica.",
      },
      {
        english: "She has just finished her homework.",
        highlight: "has just finished",
        spanish: "Ella acaba de terminar su tarea.",
        note: "Acción muy reciente — just.",
      },
      {
        english: "Have you ever tried sushi?",
        highlight: "Have you ever tried",
        spanish: "¿Alguna vez has probado sushi?",
        note: "Pregunta de experiencia — ever.",
      },
      {
        english: "He hasn't called me yet.",
        highlight: "hasn't called",
        spanish: "Él no me ha llamado todavía.",
        note: "Negación con yet — acción esperada que no ocurrió.",
      },
      {
        english: "They have lived here since 2010.",
        highlight: "have lived",
        spanish: "Ellos han vivido aquí desde 2010.",
        note: "Situación que continúa hasta el presente — since.",
      },
    ],
  },
  {
    id: "past-perfect",
    label: "Past Perfect",
    icon: "⏮",
    color: "rose",
    title: "Past Perfect",
    structure: "had + past participle",
    description:
      "El Past Perfect describe una acción que ocurrió antes de otra acción en el pasado. Es el 'pasado del pasado' y establece una secuencia clara de eventos.",
    examples: [
      {
        english: "By the time I arrived, the movie had already started.",
        highlight: "had already started",
        spanish: "Para cuando llegué, la película ya había empezado.",
        note: "Acción anterior a otra acción pasada.",
      },
      {
        english: "She had never seen snow before that day.",
        highlight: "had never seen",
        spanish: "Ella nunca había visto nieve antes de ese día.",
        note: "Experiencia previa a un momento del pasado.",
      },
      {
        english: "He was tired because he had worked all night.",
        highlight: "had worked",
        spanish: "Estaba cansado porque había trabajado toda la noche.",
        note: "Causa de una situación pasada.",
      },
      {
        english: "They had already eaten when we arrived.",
        highlight: "had already eaten",
        spanish: "Ya habían comido cuando llegamos.",
        note: "Secuencia de eventos — already enfatiza el orden.",
      },
      {
        english: "I realized I had forgotten my keys.",
        highlight: "had forgotten",
        spanish: "Me di cuenta de que había olvidado mis llaves.",
        note: "Descubrimiento de algo ocurrido antes.",
      },
    ],
  },
  {
    id: "future",
    label: "Future",
    icon: "🔮",
    color: "sky",
    title: "Future: will vs going to",
    structure: "will + base  |  am/is/are going to + base",
    description:
      "Will se usa para decisiones espontáneas, predicciones generales y promesas. Going to se usa para planes ya decididos e intenciones. Cuando hay evidencia visible, going to es la opción natural.",
    examples: [
      {
        english: "I will help you with that.",
        highlight: "will help",
        spanish: "Te ayudaré con eso.",
        note: "Decisión espontánea o promesa — will.",
      },
      {
        english: "She is going to study medicine.",
        highlight: "is going to study",
        spanish: "Ella va a estudiar medicina.",
        note: "Plan ya decidido — going to.",
      },
      {
        english: "It will rain tomorrow, according to the forecast.",
        highlight: "will rain",
        spanish: "Lloverá mañana, según el pronóstico.",
        note: "Predicción basada en opinión — will.",
      },
      {
        english: "Look at those clouds — it is going to rain!",
        highlight: "is going to rain",
        spanish: "¡Mira esas nubes — va a llover!",
        note: "Predicción basada en evidencia visible — going to.",
      },
      {
        english: "Will you open the window, please?",
        highlight: "Will you open",
        spanish: "¿Podrías abrir la ventana, por favor?",
        note: "Petición educada — will.",
      },
    ],
  },
  {
    id: "modals",
    label: "Modal Verbs",
    icon: "🎛️",
    color: "teal",
    title: "Modal Verbs",
    structure: "modal + base verb (sin to)",
    description:
      "Los modales expresan posibilidad, habilidad, obligación, permiso o consejo. No se conjugan ni añaden -s. Los principales: can, could, should, must, may, might, would, shall.",
    examples: [
      {
        english: "You should study more for the exam.",
        highlight: "should study",
        spanish: "Deberías estudiar más para el examen.",
        note: "Consejo — should.",
      },
      {
        english: "She can speak three languages.",
        highlight: "can speak",
        spanish: "Ella puede hablar tres idiomas.",
        note: "Habilidad — can.",
      },
      {
        english: "You must wear a seatbelt.",
        highlight: "must wear",
        spanish: "Debes usar cinturón de seguridad.",
        note: "Obligación fuerte — must.",
      },
      {
        english: "It might snow tonight.",
        highlight: "might snow",
        spanish: "Podría nevar esta noche.",
        note: "Posibilidad débil — might.",
      },
      {
        english: "Could I use your phone?",
        highlight: "Could I use",
        spanish: "¿Podría usar tu teléfono?",
        note: "Permiso educado — could.",
      },
    ],
  },
  {
    id: "passive",
    label: "Passive Voice",
    icon: "🔃",
    color: "lime",
    title: "Passive Voice",
    structure: "be (conjugado) + past participle",
    description:
      "La voz pasiva enfoca la acción en el objeto que la recibe, no en quien la realiza. El agente se omite o se introduce con 'by'. Se puede usar en cualquier tiempo verbal.",
    examples: [
      {
        english: "The book was written by Hemingway.",
        highlight: "was written",
        spanish: "El libro fue escrito por Hemingway.",
        note: "Simple past pasivo — agente introducido con by.",
      },
      {
        english: "English is spoken in many countries.",
        highlight: "is spoken",
        spanish: "El inglés se habla en muchos países.",
        note: "Simple present pasivo — agente general omitido.",
      },
      {
        english: "The package will be delivered tomorrow.",
        highlight: "will be delivered",
        spanish: "El paquete será entregado mañana.",
        note: "Future pasivo.",
      },
      {
        english: "The road has been closed due to construction.",
        highlight: "has been closed",
        spanish: "La carretera ha sido cerrada por construcción.",
        note: "Present perfect pasivo.",
      },
      {
        english: "Mistakes were made.",
        highlight: "were made",
        spanish: "Se cometieron errores.",
        note: "Agente omitido intencionalmente.",
      },
    ],
  },
  {
    id: "conditionals",
    label: "Conditionals",
    icon: "🔀",
    color: "pink",
    title: "Conditionals",
    structure: "If + condition, result",
    description:
      "Los condicionales expresan situaciones y sus consecuencias. Zero: verdades generales. First: situaciones posibles. Second: hipotéticas en el presente. Third: hipotéticas en el pasado.",
    examples: [
      {
        english: "If you heat water to 100°C, it boils.",
        highlight: "heat",
        spanish: "Si calientas agua a 100°C, hierve.",
        note: "Zero conditional — verdad universal o científica.",
      },
      {
        english: "If it rains tomorrow, we will cancel the trip.",
        highlight: "will cancel",
        spanish: "Si llueve mañana, cancelaremos el viaje.",
        note: "1st conditional — situación posible y real.",
      },
      {
        english: "If I had more money, I would travel the world.",
        highlight: "would travel",
        spanish: "Si tuviera más dinero, viajaría por el mundo.",
        note: "2nd conditional — hipotético en el presente.",
      },
      {
        english: "If she had studied harder, she would have passed.",
        highlight: "would have passed",
        spanish: "Si hubiera estudiado más, habría pasado.",
        note: "3rd conditional — hipotético en el pasado.",
      },
      {
        english: "If I were you, I would apologize.",
        highlight: "were",
        spanish: "Si fuera tú, me disculparía.",
        note: "2nd conditional — 'were' para todos los sujetos en consejos.",
      },
    ],
  },
  {
    id: "gerund-infinitive",
    label: "Gerund / Inf.",
    icon: "🔤",
    color: "yellow",
    title: "Gerund vs Infinitive",
    structure: "verb + -ing  |  to + base verb",
    description:
      "Algunos verbos van seguidos de gerundio (-ing), otros de infinitivo (to + base) y algunos admiten ambos. Enjoy, avoid, keep → gerundio. Want, decide, plan → infinitivo. Stop cambia de significado según la forma.",
    examples: [
      {
        english: "She enjoys reading books every night.",
        highlight: "reading",
        spanish: "A ella le gusta leer libros cada noche.",
        note: "Enjoy siempre va seguido de gerundio.",
      },
      {
        english: "He decided to leave the company.",
        highlight: "to leave",
        spanish: "Él decidió dejar la empresa.",
        note: "Decide siempre va seguido de infinitivo.",
      },
      {
        english: "They stopped talking when I entered.",
        highlight: "talking",
        spanish: "Dejaron de hablar cuando entré.",
        note: "Stop + gerundio = dejar de hacer algo.",
      },
      {
        english: "She stopped to talk to me.",
        highlight: "to talk",
        spanish: "Ella se detuvo para hablarme.",
        note: "Stop + infinitivo = detenerse con un propósito.",
      },
      {
        english: "I avoid eating fast food.",
        highlight: "eating",
        spanish: "Evito comer comida rápida.",
        note: "Avoid siempre va seguido de gerundio.",
      },
    ],
  },
  {
    id: "reported-speech",
    label: "Reported Speech",
    icon: "💬",
    color: "violet",
    title: "Reported Speech",
    structure: "said (that) + retroceso de tiempo verbal",
    description:
      "El estilo indirecto reporta lo que alguien dijo. Los tiempos retroceden: present → past, past → past perfect, will → would. Los pronombres y expresiones de tiempo también cambian.",
    examples: [
      {
        english: "She said she loved pizza.",
        highlight: "loved",
        spanish: "Dijo que le encantaba la pizza.",
        note: 'Direct: "I love pizza." → Present simple retrocede a Past simple.',
      },
      {
        english: "They said they were working.",
        highlight: "were working",
        spanish: "Dijeron que estaban trabajando.",
        note: 'Direct: "We are working." → Present continuous → Past continuous.',
      },
      {
        english: "He said he would call me.",
        highlight: "would call",
        spanish: "Dijo que me llamaría.",
        note: 'Direct: "I will call you." → Will retrocede a Would.',
      },
      {
        english: "She asked if I had eaten.",
        highlight: "had eaten",
        spanish: "Preguntó si había comido.",
        note: 'Direct: "Have you eaten?" → Present perfect → Past perfect.',
      },
      {
        english: "He told me not to touch that.",
        highlight: "not to touch",
        spanish: "Me dijo que no tocara eso.",
        note: 'Direct: "Don\'t touch that!" → Imperativo negativo en reported speech.',
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function ExampleCard({ ex, color, index }: { ex: Example; color: Color; index: number }) {
  const c = COLORS[color];
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold mt-0.5 w-5 shrink-0 ${c.text}`}>
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
      {ex.note && (
        <div className={`text-xs rounded-lg px-3 py-1.5 ${c.badge}`}>
          💡 {ex.note}
        </div>
      )}
    </div>
  );
}

// ── TopicView ────────────────────────────────────────────────────────────────

function TopicView({ topic }: { topic: GrammarTopic }) {
  const c = COLORS[topic.color];
  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-xl px-4 py-3 border ${c.badge}`}>
        <p className="text-xs font-semibold mb-0.5 opacity-70">Estructura</p>
        <p className="font-mono font-bold text-sm">{topic.structure}</p>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{topic.description}</p>
      <div className="flex flex-col gap-3">
        <h3 className={`text-sm font-semibold ${c.text}`}>
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
        <span className="ml-auto text-xs text-slate-500">{TOPICS.length} temas</span>
      </header>

      {/* Scrollable topic selector */}
      <div className="overflow-x-auto border-b border-slate-800 scrollbar-none">
        <div className="flex min-w-max">
          {TOPICS.map((t) => {
            const isActive = activeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                  isActive
                    ? `text-white ${COLORS[t.color].border}`
                    : "text-slate-400 border-transparent hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <TopicView topic={active} />
      </main>
    </div>
  );
}
