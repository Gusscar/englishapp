import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.YOUTUBE_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "children stories english";
  const pageToken = searchParams.get("pageToken") ?? "";

  if (!KEY) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not set" }, { status: 500 });
  }

  const params = new URLSearchParams({
    part: "snippet",
    q,
    type: "video",
    videoDuration: "medium",
    relevanceLanguage: "en",
    videoEmbeddable: "true",
    maxResults: "12",
    key: KEY,
    ...(pageToken ? { pageToken } : {}),
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }
    return NextResponse.json({
      items: data.items ?? [],
      nextPageToken: data.nextPageToken ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch YouTube results" }, { status: 500 });
  }
}
