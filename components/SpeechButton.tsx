"use client";

import { useState } from "react";

interface SpeechButtonProps {
  text: string;
}

export default function SpeechButton({ text }: SpeechButtonProps) {
  const [playing, setPlaying] = useState(false);

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  }

  return (
    <button
      onClick={speak}
      disabled={playing}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition font-medium text-sm"
    >
      {playing ? (
        <>
          <span className="animate-pulse">🔊</span> Reproduciendo…
        </>
      ) : (
        <>🔊 Escuchar</>
      )}
    </button>
  );
}
