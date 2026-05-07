import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

async function translateWithMyMemory(english: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(english)}&langpair=en|es`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory error: ${res.status}`);
  const data = await res.json();
  const translation: string = data.responseData?.translatedText ?? "";
  if (!translation) throw new Error("MyMemory returned empty");
  return translation;
}

export async function POST(req: NextRequest) {
  const { english } = await req.json();
  if (!english?.trim()) {
    return NextResponse.json({ error: "english is required" }, { status: 400 });
  }

  // Try AI providers first (better for idioms/expressions)
  const prompt = `Translate this English phrase or expression to Spanish. If it is a colloquial or idiomatic expression, give the natural Spanish equivalent, not a word-for-word translation. Return ONLY the Spanish translation, nothing else — no explanations, no quotes.

English: "${english.trim()}"`;

  try {
    const spanish = await generateText(prompt, { maxTokens: 120, temperature: 0.2 });
    return NextResponse.json({ spanish });
  } catch {
    // AI unavailable — fall back to MyMemory (free, no key needed)
  }

  try {
    const spanish = await translateWithMyMemory(english.trim());
    return NextResponse.json({ spanish });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[translate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
