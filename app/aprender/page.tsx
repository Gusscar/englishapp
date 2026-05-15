"use client";

import Link from "next/link";

const sections = [
  {
    href: "/reading",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
    title: "Leer",
    desc: "Textos en ingles con traduccion",
    color: "from-emerald-900/50 to-emerald-900/10 border-emerald-700/30",
    iconColor: "text-emerald-400",
    badge: null,
  },
  {
    href: "/videos",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
      </svg>
    ),
    title: "Videos",
    desc: "Practica con YouTube en ingles",
    color: "from-red-900/50 to-red-900/10 border-red-700/30",
    iconColor: "text-red-400",
    badge: null,
  },
  {
    href: "/grammar",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="14" y2="12"/>
        <line x1="4" y1="18" x2="18" y2="18"/>
      </svg>
    ),
    title: "Gramatica",
    desc: "Tiempos verbales, modales y mas",
    color: "from-amber-900/50 to-amber-900/10 border-amber-700/30",
    iconColor: "text-amber-400",
    badge: null,
  },
  {
    href: "/patterns",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    title: "Patrones & Frases",
    desc: "Estructuras con multiples ejemplos",
    color: "from-indigo-900/50 to-indigo-900/10 border-indigo-700/30",
    iconColor: "text-indigo-400",
    badge: null,
  },
  {
    href: "/immersion",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: "Tracker de inmersion",
    desc: "Registra tu tiempo escuchando y leyendo",
    color: "from-cyan-900/50 to-cyan-900/10 border-cyan-700/30",
    iconColor: "text-cyan-400",
    badge: null,
  },
  {
    href: "/stats",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Mi progreso",
    desc: "Racha, frases dominadas y estadisticas",
    color: "from-violet-900/50 to-violet-900/10 border-violet-700/30",
    iconColor: "text-violet-400",
    badge: null,
  },
];

export default function AprenderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-semibold text-xl tracking-tight">Aprender</h1>
        <p className="text-xs text-slate-500 mt-0.5">Contenido para mejorar tu ingles</p>
      </header>

      <main className="flex-1 px-4 grid grid-cols-2 gap-3 content-start">
        {sections.map(({ href, icon, title, desc, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col gap-3 p-4 rounded-3xl bg-gradient-to-br border ${color} active:scale-[0.97] transition-transform`}
          >
            <span className={iconColor}>{icon}</span>
            <div>
              <p className="font-semibold text-sm text-white leading-snug">{title}</p>
              <p className="text-xs text-slate-400 mt-1 leading-snug">{desc}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
