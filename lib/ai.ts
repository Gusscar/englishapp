/**
 * Shared AI helper — tries Gemini first, falls back to DeepSeek.
 * Set GEMINI_API_KEY and/or DEEPSEEK_API_KEY in .env.local.
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

async function callGemini(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GEMINI_API_KEY");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return text.trim();
}

async function callDeepSeek(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("No DEEPSEEK_API_KEY");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[DeepSeek] HTTP ${res.status}:`, body);
    throw new Error(`DeepSeek error: ${res.status} — ${body}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("DeepSeek returned empty response");
  return text.trim();
}

async function callGroq(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("No GROQ_API_KEY");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Groq] HTTP ${res.status}:`, body);
    throw new Error(`Groq error: ${res.status} — ${body}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned empty response");
  return text.trim();
}

/**
 * Generates text using whichever AI provider is configured.
 * Order: Gemini → DeepSeek → Groq
 */
export async function generateText(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const maxTokens   = options.maxTokens   ?? 400;
  const temperature = options.temperature ?? 0.3;

  const errors: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    try { return await callGemini(prompt, maxTokens, temperature); }
    catch (e) { errors.push(`Gemini: ${e}`); }
  }

  if (process.env.DEEPSEEK_API_KEY) {
    try { return await callDeepSeek(prompt, maxTokens, temperature); }
    catch (e) { errors.push(`DeepSeek: ${e}`); }
  }

  if (process.env.GROQ_API_KEY) {
    try { return await callGroq(prompt, maxTokens, temperature); }
    catch (e) { errors.push(`Groq: ${e}`); }
  }

  const msg = `All AI providers failed. ${errors.join(" | ")}`;
  console.error("[ai]", msg);
  throw new Error(msg);
}
