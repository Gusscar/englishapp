import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { english } = await req.json();
  if (!english?.trim()) {
    return NextResponse.json({ error: "english is required" }, { status: 400 });
  }

  const prompt = `Translate this English phrase or expression to Spanish. If it is a colloquial or idiomatic expression, give the natural Spanish equivalent, not a word-for-word translation. Return ONLY the Spanish translation, nothing else — no explanations, no quotes.

English: "${english.trim()}"`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
  }

  const data = await res.json();
  const spanish = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return NextResponse.json({ spanish });
}
