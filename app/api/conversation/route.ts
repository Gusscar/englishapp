import { NextRequest, NextResponse } from "next/server";
import { generateChat, type ChatMessage } from "@/lib/ai";

const SCENARIO_CONTEXTS: Record<string, string> = {
  free:       "Have a friendly casual conversation about any topic the user brings up.",
  job:        "You are a professional interviewer conducting a job interview in English. Ask typical interview questions one at a time.",
  restaurant: "You are a friendly waiter at an English-speaking restaurant. Take the user's order and answer questions about the menu.",
  airport:    "You are an airport check-in agent. Help the user with check-in, boarding passes, luggage, and gate information.",
  doctor:     "You are a doctor at an English-speaking clinic. Ask about symptoms and give general advice.",
  shopping:   "You are a helpful store clerk. Assist the user in finding items, checking prices, sizes, and availability.",
  phone:      "You are receiving a business phone call. Simulate a professional telephone conversation.",
  smalltalk:  "You just met the user at a social event. Make friendly small talk about hobbies, weekend plans, the weather, etc.",
};

const SYSTEM_CHAT = (scenario: string) => `You are a friendly English conversation partner helping a Spanish speaker practice their English.
Scenario: ${SCENARIO_CONTEXTS[scenario] ?? SCENARIO_CONTEXTS.free}

Rules:
- Respond ONLY in English, always.
- Keep responses short and natural (2-4 sentences max).
- Be warm, patient, and encouraging.
- Do NOT correct grammar during the conversation — just respond naturally as a real person would.
- If the user writes in Spanish, gently remind them to use English and rephrase what they tried to say in English so they can learn.
- Stay in character for the scenario throughout the conversation.`;

const SYSTEM_FEEDBACK = `You are an English teacher reviewing a conversation. Provide feedback in Spanish for the learner.`;

export async function POST(req: NextRequest) {
  const { messages, scenario, mode } = await req.json() as {
    messages: ChatMessage[];
    scenario: string;
    mode: "chat" | "feedback";
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  try {
    if (mode === "feedback") {
      const conversation = messages
        .map(m => `${m.role === "user" ? "Estudiante" : "AI"}: ${m.content}`)
        .join("\n");

      const feedbackPrompt = `Review this English learning conversation and provide feedback in Spanish.

CONVERSATION:
${conversation}

Respond with ONLY valid JSON (no markdown):
{
  "corrections": [
    {"original": "exact phrase the student used", "corrected": "corrected version", "explanation": "brief explanation in Spanish"}
  ],
  "vocabulary": [
    {"used": "word/phrase used", "better": "more natural alternative", "note": "brief note in Spanish"}
  ],
  "assessment": "2-3 encouraging sentences in Spanish summarizing overall performance and main areas to improve"
}

Only include real errors in corrections. If there are no errors, return empty array. Max 5 corrections and 3 vocabulary suggestions.`;

      const raw = await generateChat(SYSTEM_FEEDBACK, [{ role: "user", content: feedbackPrompt }], { maxTokens: 600, temperature: 0.3 });
      const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const feedback = JSON.parse(jsonStr);
      return NextResponse.json({ feedback });
    }

    // Regular chat turn
    const reply = await generateChat(SYSTEM_CHAT(scenario ?? "free"), messages, { maxTokens: 250, temperature: 0.75 });
    return NextResponse.json({ reply });

  } catch (e) {
    console.error("[conversation]", e);
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}
