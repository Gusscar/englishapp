import { NextRequest, NextResponse } from "next/server";

const WORDS_PER_PAGE = 400;

function stripGutenbergWrapper(text: string): string {
  const startMarkers = [
    "*** START OF THE PROJECT GUTENBERG",
    "***START OF THE PROJECT GUTENBERG",
    "*** START OF THIS PROJECT GUTENBERG",
  ];
  const endMarkers = [
    "*** END OF THE PROJECT GUTENBERG",
    "***END OF THE PROJECT GUTENBERG",
    "*** END OF THIS PROJECT GUTENBERG",
  ];

  let start = 0;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      const lineEnd = text.indexOf("\n", idx);
      start = lineEnd + 1;
      break;
    }
  }

  let end = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      end = idx;
      break;
    }
  }

  return text.slice(start, end).trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const page = parseInt(searchParams.get("page") ?? "0");

  if (!url || !url.includes("gutenberg.org")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "EnglishPracticeApp/1.0" },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const raw = await res.text();
    const clean = stripGutenbergWrapper(raw);

    const words = clean.split(/\s+/).filter(Boolean);
    const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
    const pageWords = words.slice(
      page * WORDS_PER_PAGE,
      (page + 1) * WORDS_PER_PAGE
    );

    // Reconstruct readable paragraphs by preserving double-newlines
    const pageStart = words.slice(0, page * WORDS_PER_PAGE).join(" ").length;
    const pageEnd = pageStart + pageWords.join(" ").length;
    const rawSlice = clean.slice(pageStart, pageEnd + 500);
    const excerpt = rawSlice
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      content: excerpt || pageWords.join(" "),
      page,
      totalPages,
      totalWords: words.length,
    });
  } catch (error) {
    console.error("Gutenberg fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}
