import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

const LEVEL_GUIDE: Record<string, { words: string; guide: string }> = {
  A1: { words: "80-120",  guide: "only present simple, vocabulary from the 500 most common words, very short and direct sentences" },
  A2: { words: "150-200", guide: "present and past simple, everyday vocabulary, simple sentences connected with 'and', 'but', 'because'" },
  B1: { words: "350-450", guide: "various tenses, intermediate vocabulary, some idiomatic expressions, clear narrative with dialogue" },
  B2: { words: "450-550", guide: "complex sentences, varied vocabulary, common phrasal verbs, passive voice, engaging plot with developed characters" },
  C1: { words: "550-650", guide: "advanced vocabulary, complex structures, nuanced language, formal and informal registers, rich descriptions" },
};

export async function POST(req: NextRequest) {
  try {
    const { level, topic } = await req.json();
    const guide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.B1;

    const prompt = `Write a short story in English for a ${level} CEFR level English learner.

Topic: "${topic}"
Word count: approximately ${guide.words} words
Level requirements: ${guide.guide}

The story must have a clear beginning, middle and end. Make it engaging and natural.

Respond ONLY with valid JSON — no markdown fences, no extra text before or after:
{
  "title": "Story title in English",
  "content": "Full story text here...",
  "vocabulary": [
    {"word": "word from the story", "spanish": "definición en español", "example": "sentence from the story using this word"}
  ]
}

Include 5-7 vocabulary items challenging for a ${level} learner. Only use words that actually appear in the story.`;

    const raw = await generateText(prompt, { maxTokens: 2500, temperature: 0.8 });
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const story = JSON.parse(jsonStr);
    return NextResponse.json(story);
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
  }
}
