"use client";

import { useRef, useState } from "react";

interface MicButtonProps {
  expected: string;
  onResult: (correct: boolean, transcript: string) => void;
}

// Web Speech API types not in default TS lib
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventData extends Event {
  results: SpeechRecognitionResultList;
}
interface WebSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: WebSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: WebSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: WebSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: WebSpeechRecognition, ev: SpeechRecognitionEventData) => void) | null;
}
interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

export default function MicButton({ expected, onResult }: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);

  function startListening() {
    const win = window as Window & {
      SpeechRecognition?: WebSpeechRecognitionConstructor;
      webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcripts = Array.from({ length: event.results[0].length }, (_, i) =>
        event.results[0][i].transcript
      );
      const normalizedExpected = normalize(expected);
      const correct = transcripts.some((t) => normalize(t) === normalizedExpected);
      onResult(correct, transcripts[0]);
    };

    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  return (
    <button
      onClick={listening ? stopListening : startListening}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
        listening
          ? "bg-red-600 hover:bg-red-500 animate-pulse"
          : "bg-emerald-600 hover:bg-emerald-500"
      }`}
    >
      {listening ? <>🎙️ Escuchando…</> : <>🎙️ Hablar</>}
    </button>
  );
}
