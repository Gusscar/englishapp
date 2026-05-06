"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/",          icon: "🏠", label: "Inicio"    },
  { href: "/dictation", icon: "🎧", label: "Dictado"   },
  { href: "/reading",   icon: "📖", label: "Leer"      },
  { href: "/manage",    icon: "⚙️", label: "Gestionar" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors ${
              active ? "text-indigo-400" : "text-slate-500 active:text-slate-300"
            }`}
          >
            <span className={`text-2xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
