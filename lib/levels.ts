export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_CONFIG: Record<Level, { label: string; desc: string; badge: string; chip: string; dot: string }> = {
  A1: {
    label: "A1",
    desc: "Principiante",
    badge: "bg-green-500/15 text-green-400 border border-green-500/30",
    chip:  "bg-green-500/20 text-green-300 border-green-500/40",
    dot:   "bg-green-400",
  },
  A2: {
    label: "A2",
    desc: "Elemental",
    badge: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
    chip:  "bg-teal-500/20 text-teal-300 border-teal-500/40",
    dot:   "bg-teal-400",
  },
  B1: {
    label: "B1",
    desc: "Intermedio",
    badge: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    chip:  "bg-sky-500/20 text-sky-300 border-sky-500/40",
    dot:   "bg-sky-400",
  },
  B2: {
    label: "B2",
    desc: "Intermedio alto",
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    chip:  "bg-amber-500/20 text-amber-300 border-amber-500/40",
    dot:   "bg-amber-400",
  },
  C1: {
    label: "C1",
    desc: "Avanzado",
    badge: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    chip:  "bg-rose-500/20 text-rose-300 border-rose-500/40",
    dot:   "bg-rose-400",
  },
};

export function levelBadge(level: string | null | undefined): string {
  if (!level || !(level in LEVEL_CONFIG)) return "";
  return LEVEL_CONFIG[level as Level].badge;
}
