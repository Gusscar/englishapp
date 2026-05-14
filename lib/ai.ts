/**
 * Shared AI helper — tries providers in order until one succeeds.
 * Set any of these keys in .env.local / Vercel env vars:
 *   GEMINI_API_KEY, DEEPSEEK_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GEMINI_URL       = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const DEEPSEEK_URL     = "https://api.deepseek.com/v1/chat/completions";
const GROQ_URL         = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL    = "https://openrouter.ai/api/v1/chat/completions";
// Free models from different underlying providers — if one provider is down, others still work
const OPENROUTER_MODELS = [
  "deepseek/deepseek-r1-0528-qwen3-8b:free",   // DeepSeek infra
  "qwen/qwen3-8b:free",                          // Alibaba infra
  "google/gemma-3-12b-it:free",                  // Google infra
  "meta-llama/llama-3.3-70b-instruct:free",      // Venice/Meta
  "mistralai/mistral-nemo:free",                 // Mistral infra
  "qwen/qwen-2.5-72b-instruct:free",             // Alibaba infra
  "deepseek/deepseek-r1:free",                   // DeepSeek infra
  "meta-llama/llama-3.1-8b-instruct:free",       // Venice/Meta
  "google/gemma-2-9b-it:free",                   // Google infra
  "mistralai/mistral-7b-instruct:free",          // Mistral infra
];

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

async function callOpenRouter(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://englishapp-sand.vercel.app",
    "X-Title": "English Practice App",
  };

  const modelErrors: string[] = [];
  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) { modelErrors.push(`${model}:${res.status}`); continue; }
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      if (text) return text.trim();
      modelErrors.push(`${model}:empty`);
    } catch (e) { modelErrors.push(`${model}:err`); continue; }
  }
  throw new Error(`OpenRouter: all models failed — ${modelErrors.join(", ")}`);
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

/* ── Multi-turn chat helpers ── */

async function chatGemini(system: string, messages: ChatMessage[], maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GEMINI_API_KEY");

  // Prepend system as user/model pair — more compatible than system_instruction
  const contents = [
    { role: "user",  parts: [{ text: `[Instructions]: ${system}` }] },
    { role: "model", parts: [{ text: "Understood. I will follow these instructions." }] },
    ...messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini chat error: ${res.status} — ${body}`);
  }
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return text.trim();
}

async function chatOpenAI(url: string, model: string, apiKey: string, system: string, messages: ChatMessage[], maxTokens: number, temperature: number, extraHeaders: Record<string,string> = {}): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`Chat error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response");
  return text.trim();
}

/**
 * Multi-turn chat using whichever AI provider is configured.
 * Order: OpenRouter → Gemini → DeepSeek → Groq
 */
export async function generateChat(
  system: string,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const maxTokens   = options.maxTokens   ?? 300;
  const temperature = options.temperature ?? 0.7;
  const errors: string[] = [];

  if (process.env.OPENROUTER_API_KEY) {
    const orHeaders = { "HTTP-Referer": "https://englishapp-sand.vercel.app", "X-Title": "English Practice App" };
    const modelErrors: string[] = [];
    for (const model of OPENROUTER_MODELS) {
      try {
        const result = await chatOpenAI(OPENROUTER_URL, model, process.env.OPENROUTER_API_KEY, system, messages, maxTokens, temperature, orHeaders);
        return result;
      } catch (e) { modelErrors.push(`${model}:${e}`); continue; }
    }
    errors.push(`OpenRouter: ${modelErrors.join(", ")}`);
  }
  if (process.env.GEMINI_API_KEY) {
    try { return await chatGemini(system, messages, maxTokens, temperature); }
    catch (e) { errors.push(`Gemini: ${e}`); }
  }
  if (process.env.DEEPSEEK_API_KEY) {
    try { return await chatOpenAI(DEEPSEEK_URL, "deepseek-chat", process.env.DEEPSEEK_API_KEY, system, messages, maxTokens, temperature); }
    catch (e) { errors.push(`DeepSeek: ${e}`); }
  }
  if (process.env.GROQ_API_KEY) {
    try { return await chatOpenAI(GROQ_URL, "llama-3.3-70b-versatile", process.env.GROQ_API_KEY, system, messages, maxTokens, temperature); }
    catch (e) { errors.push(`Groq: ${e}`); }
  }

  throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
}

/**
 * Generates text using whichever AI provider is configured.
 * Order: OpenRouter → Gemini → DeepSeek → Groq
 */
export async function generateText(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const maxTokens   = options.maxTokens   ?? 400;
  const temperature = options.temperature ?? 0.3;

  const errors: string[] = [];

  if (process.env.OPENROUTER_API_KEY) {
    try { return await callOpenRouter(prompt, maxTokens, temperature); }
    catch (e) { errors.push(`OpenRouter: ${e}`); }
  }

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
