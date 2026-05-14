import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { english, spanish } = await req.json();
  if (!english?.trim()) {
    return NextResponse.json({ error: "english is required" }, { status: 400 });
  }

  const prompt = `You are a native English teacher helping a Spanish speaker learn natural English.

For the phrase: "${english.trim()}" (meaning in Spanish: "${spanish?.trim() ?? ""}")

Return ONLY valid JSON — no markdown, no extra text:
{
  "level": "A1",
  "tip": "One sentence in Spanish explaining when and how native speakers use this naturally. Mention register (formal/casual), typical situations, and any important nuances.",
  "examples": [
    "Short realistic English dialogue (2-3 lines) showing the phrase used naturally in context. Format: — Speaker A\\n— Speaker B",
    "Another short realistic English dialogue in a DIFFERENT situation or register"
  ]
}

For "level", assign the CEFR level (A1/A2/B1/B2/C1) based on vocabulary complexity, grammar structures, and how common the phrase is for learners. A1=basic greetings/survival, A2=everyday topics, B1=independent communication, B2=complex ideas/nuance, C1=idiomatic/advanced.
Keep examples concise and natural. Use everyday spoken English, not textbook language.`;

  try {
    const raw = await generateText(prompt, { maxTokens: 400, temperature: 0.4 });
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const context = JSON.parse(jsonStr);
    return NextResponse.json(context);
  } catch {
    return NextResponse.json({ error: "Failed to generate context" }, { status: 500 });
  }
}
