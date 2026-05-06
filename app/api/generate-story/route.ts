import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const LEVEL_GUIDE: Record<string, { words: string; guide: string }> = {
  A1: { words: "80-100",  guide: "solo presente simple, vocabulario de las 500 palabras más comunes, oraciones muy cortas y directas" },
  A2: { words: "120-150", guide: "presente y pasado simple, vocabulario cotidiano, oraciones simples conectadas con 'and', 'but', 'because'" },
  B1: { words: "180-220", guide: "varios tiempos verbales, vocabulario intermedio, algunas expresiones idiomáticas sencillas" },
  B2: { words: "240-280", guide: "oraciones complejas, vocabulario variado, phrasal verbs comunes, voz pasiva ocasional" },
  C1: { words: "300-350", guide: "vocabulario avanzado, estructuras complejas, lenguaje matizado, registro formal e informal" },
};

export async function POST(req: NextRequest) {
  try {
    const { level, topic } = await req.json();
    const guide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.B1;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Write a short story in English for a ${level} CEFR level English learner.

Topic: "${topic}"
Word count: approximately ${guide.words} words
Level requirements: ${guide.guide}

The story should have a clear beginning, middle and end. Make it engaging and natural.

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "title": "Story title in English",
  "content": "Full story text here...",
  "vocabulary": [
    {"word": "word from story", "spanish": "definición en español", "example": "sentence from the story using this word"}
  ]
}

Include 5-7 vocabulary items that are challenging for a ${level} learner. Only choose words that actually appear in the story.`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Strip potential markdown fences if Claude adds them anyway
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const story = JSON.parse(jsonStr);

    return NextResponse.json(story);
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
  }
}
