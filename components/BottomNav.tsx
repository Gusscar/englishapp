"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* ── SVG icons ── */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const PracticeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/>
    <line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/>
    <line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
);

const LearnIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
);

const MoreIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

/* ── More sheet items ── */
const moreItems = [
  {
    href: "/manage",
    label: "Gestionar frases",
    desc: "Agregar, editar o borrar frases",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

const practiceRoutes = ["/practicar", "/scramble", "/dictation", "/writing", "/conversation"];
const learnRoutes   = ["/aprender", "/reading", "/videos", "/grammar", "/patterns", "/immersion", "/stats", "/curso"];
const moreRoutes    = ["/manage"];

export default function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const tabs = [
    {
      label: "Inicio",
      href: "/",
      icon: HomeIcon,
      active: pathname === "/",
      action: null,
    },
    {
      label: "Practicar",
      href: "/practicar",
      icon: PracticeIcon,
      active: practiceRoutes.includes(pathname),
      action: null,
    },
    {
      label: "Aprender",
      href: "/aprender",
      icon: LearnIcon,
      active: learnRoutes.includes(pathname),
      action: null,
    },
    {
      label: "Mas",
      href: null,
      icon: MoreIcon,
      active: moreRoutes.includes(pathname) || sheetOpen,
      action: () => setSheetOpen(true),
    },
  ];

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map(({ href, label, icon: Icon, active, action }) => {
          const inner = (
            <>
              <span className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-200 ${
                active ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500"
              }`}>
                <Icon active={active} />
              </span>
              <span className={`text-[11px] font-medium transition-colors leading-none ${
                active ? "text-indigo-400" : "text-slate-500"
              }`}>
                {label}
              </span>
            </>
          );

          if (action) {
            return (
              <button
                key={label}
                onClick={action}
                className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 select-none"
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={href!}
              href={href!}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 select-none"
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* More sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full bg-slate-800 rounded-t-3xl border-t border-slate-700/60 px-4 pt-3 flex flex-col"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-4" />

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
              Opciones
            </p>

            <div className="flex flex-col gap-2 mb-2">
              {moreItems.map(({ href, label, desc, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-slate-700/50 hover:bg-slate-700 active:scale-[0.98] transition-all border border-slate-600/30"
                >
                  <span className="text-slate-400 shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <svg className="ml-auto text-slate-600 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
