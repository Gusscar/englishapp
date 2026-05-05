"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Ya está instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setVisible(false);
      setInstalled(true);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setVisible(false);
  }

  if (installed) return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 border border-emerald-600 text-emerald-100 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg animate-fade-in">
      ✅ ¡App instalada correctamente!
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <span className="text-3xl shrink-0">🇺🇸</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instala English Practice</p>
          <p className="text-xs text-slate-400 mt-0.5">Úsala sin internet, como una app nativa</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium"
          >
            Instalar
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs text-slate-400"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
