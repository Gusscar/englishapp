import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { english, spanish } = await req.json();
  if (!english?.trim()) {
    return NextResponse.json({ error: "english is required" }, { status: 400 });
  }

  const prompt = `You are a native English teacher helping a Spanish speaker learn natural English.

For the phrase: "${english.trim()}" (meaning in Spanish: "${spanish?.trim() ?? ""}")

Return ONLY valid JSON — no markdown, no extra text:
{
  "tip": "One sentence in Spanish explaining when and how native speakers use this naturally. Mention register (formal/casual), typical situations, and any important nuances.",
  "examples": [
    "Short realistic English dialogue (2-3 lines) showing the phrase used naturally in context. Format: — Speaker A\\n— Speaker B",
    "Another short realistic English dialogue in a DIFFERENT situation or register"
  ]
}

Keep examples concise and natural. Use everyday spoken English, not textbook language.`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
  }

  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const context = JSON.parse(jsonStr);
    return NextResponse.json(context);
  } catch {
    return NextResponse.json({ error: "Failed to parse context" }, { status: 500 });
  }
}
