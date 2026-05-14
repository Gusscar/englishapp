"use client";

import Link from "next/link";

const sections = [
  {
    href: "/scramble",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8"/>
        <line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/>
        <line x1="15" y1="15" x2="21" y2="21"/>
      </svg>
    ),
    title: "Armar frases",
    desc: "Ordena las palabras para construir la frase correcta",
    color: "from-violet-900/60 to-violet-900/20 border-violet-700/40",
    iconColor: "text-violet-400",
  },
  {
    href: "/dictation",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6"/>
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/>
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
      </svg>
    ),
    title: "Dictado",
    desc: "Escucha y escribe lo que oyes en ingles",
    color: "from-sky-900/60 to-sky-900/20 border-sky-700/40",
    iconColor: "text-sky-400",
  },
];

export default function PracticarPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-semibold text-xl tracking-tight">Practicar</h1>
        <p className="text-xs text-slate-500 mt-0.5">Ejercicios interactivos</p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-4">
        {sections.map(({ href, icon, title, desc, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-5 p-5 rounded-3xl bg-gradient-to-br border ${color} active:scale-[0.97] transition-transform`}
          >
            <span className={`shrink-0 ${iconColor}`}>{icon}</span>
            <div>
              <p className="font-semibold text-base text-white">{title}</p>
              <p className="text-sm text-slate-400 mt-0.5 leading-snug">{desc}</p>
            </div>
            <svg className="ml-auto shrink-0 text-slate-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </main>
    </div>
  );
}
