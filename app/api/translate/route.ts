import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { english } = await req.json();
  if (!english?.trim()) {
    return NextResponse.json({ error: "english is required" }, { status: 400 });
  }

  const prompt = `Translate this English phrase or expression to Spanish. If it is a colloquial or idiomatic expression, give the natural Spanish equivalent, not a word-for-word translation. Return ONLY the Spanish translation, nothing else — no explanations, no quotes.

English: "${english.trim()}"`;

  try {
    const spanish = await generateText(prompt, { maxTokens: 120, temperature: 0.2 });
    return NextResponse.json({ spanish });
  } catch {
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}
