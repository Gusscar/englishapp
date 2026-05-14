"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ImmersionLog {
  id: string;
  date: string;
  type: "listening" | "watching" | "reading" | "speaking";
  minutes: number;
  notes: string | null;
}

const TYPES = [
  { value: "listening", label: "Escuchar",  desc: "Podcast, audio",     color: "bg-sky-500/20 border-sky-500/40 text-sky-300",     dot: "bg-sky-400"     },
  { value: "watching",  label: "Ver",        desc: "Series, YouTube",    color: "bg-red-500/20 border-red-500/40 text-red-300",     dot: "bg-red-400"     },
  { value: "reading",   label: "Leer",       desc: "Textos, libros",     color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", dot: "bg-emerald-400" },
  { value: "speaking",  label: "Hablar",     desc: "Conversacion, voz",  color: "bg-violet-500/20 border-violet-500/40 text-violet-300", dot: "bg-violet-400"  },
] as const;

function typeColor(t: string) {
  return TYPES.find(x => x.value === t)?.color ?? "";
}
function typeDot(t: string) {
  return TYPES.find(x => x.value === t)?.dot ?? "bg-slate-400";
}
function typeLabel(t: string) {
  return TYPES.find(x => x.value === t)?.label ?? t;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function shortDay(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short" });
}

export default function ImmersionPage() {
  const [logs, setLogs]       = useState<ImmersionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType]       = useState<ImmersionLog["type"]>("listening");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];
  const last7 = getLast7Days();

  async function load() {
    const since = last7[0];
    const { data } = await supabase
      .from("immersion_logs")
      .select("*")
      .gte("date", since)
      .order("created_at", { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLog() {
    const mins = parseInt(minutes);
    if (!mins || mins <= 0) return;
    setSaving(true);
    await supabase.from("immersion_logs").insert({
      date: todayISO,
      type,
      minutes: mins,
      notes: notes.trim() || null,
    });
    setSaving(false);
    setMinutes("");
    setNotes("");
    load();
  }

  // Stats
  const todayLogs   = logs.filter(l => l.date === todayISO);
  const todayMins   = todayLogs.reduce((s, l) => s + l.minutes, 0);
  const weekMins    = logs.reduce((s, l) => s + l.minutes, 0);

  // Per-day totals for chart
  const dayTotals = last7.map(d => ({
    date: d,
    total: logs.filter(l => l.date === d).reduce((s, l) => s + l.minutes, 0),
  }));
  const maxMins = Math.max(...dayTotals.map(d => d.total), 30);

  // Streak
  let streak = 0;
  for (let i = last7.length - 1; i >= 0; i--) {
    if (dayTotals[i].total > 0) streak++;
    else break;
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-semibold text-xl tracking-tight">Inmersion</h1>
        <p className="text-xs text-slate-500 mt-0.5">Registra cuanto tiempo practicas ingles</p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-5 max-w-2xl mx-auto w-full">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hoy",      value: `${todayMins}min`, sub: `${todayLogs.length} sesion${todayLogs.length !== 1 ? "es" : ""}` },
            { label: "Esta semana", value: `${weekMins}min`, sub: "ultimos 7 dias" },
            { label: "Racha",    value: `${streak}d`,     sub: streak > 0 ? "consecutivos" : "empieza hoy" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-2xl bg-slate-800/60 border border-slate-700/40 px-3 py-3 flex flex-col gap-0.5">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-white tabular-nums">{value}</p>
              <p className="text-[10px] text-slate-600">{sub}</p>
            </div>
          ))}
        </div>

        {/* 7-day bar chart */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 px-4 pt-4 pb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Ultimos 7 dias</p>
          <div className="flex items-end gap-2 h-16">
            {dayTotals.map(({ date, total }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      date === todayISO ? "bg-indigo-500" : "bg-slate-600"
                    }`}
                    style={{ height: `${Math.max(total > 0 ? (total / maxMins) * 48 : 0, total > 0 ? 4 : 0)}px` }}
                  />
                </div>
                <span className={`text-[10px] ${date === todayISO ? "text-indigo-400 font-semibold" : "text-slate-600"}`}>
                  {shortDay(date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Log form */}
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700/50 p-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-slate-300">Registrar sesion</p>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, desc, color }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`flex flex-col items-start px-3 py-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                  type === value ? color : "bg-slate-700/40 border-slate-600/30 text-slate-400"
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs opacity-70 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>

          {/* Minutes */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-3 bg-slate-700/50 rounded-2xl border border-slate-600/40 px-4 py-3">
              <input
                type="number"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="0"
                min="1"
                className="w-16 bg-transparent text-white text-2xl font-bold focus:outline-none tabular-nums"
              />
              <span className="text-slate-400 text-sm">minutos</span>
            </div>

            {/* Quick +5 buttons */}
            <div className="flex flex-col gap-1.5">
              {[15, 30, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setMinutes(String(m))}
                  className="px-3 py-1 rounded-xl bg-slate-700/60 text-xs text-slate-400 hover:text-white hover:bg-slate-600 transition"
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Notes (optional) */}
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas opcionales (ej: episodio de Friends…)"
            className="w-full bg-slate-700/40 border border-slate-600/30 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />

          <button
            onClick={handleLog}
            disabled={saving || !minutes || parseInt(minutes) <= 0}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-95 transition-all text-sm font-semibold"
          >
            {saving ? "Guardando…" : "Registrar"}
          </button>
        </div>

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Hoy</p>
            {todayLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                <span className={`size-2.5 rounded-full shrink-0 ${typeDot(log.type)}`} />
                <span className="text-sm font-medium text-slate-300">{typeLabel(log.type)}</span>
                <span className="text-sm font-bold text-white tabular-nums ml-auto">{log.minutes}min</span>
                {log.notes && <span className="text-xs text-slate-500 ml-2 truncate max-w-[100px]">{log.notes}</span>}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
