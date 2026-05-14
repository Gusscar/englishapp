import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No OPENROUTER_API_KEY" }, { status: 400 });

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) return NextResponse.json({ error: `OpenRouter models error: ${res.status}` }, { status: 500 });

  const data = await res.json();
  const freeModels = (data.data as { id: string; pricing: { prompt: string } }[])
    .filter(m => m.pricing?.prompt === "0")
    .map(m => m.id)
    .sort();

  return NextResponse.json({ freeModels, total: freeModels.length });
}
