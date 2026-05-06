// Levenshtein distance for similarity scoring
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

export function similarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

// Returns word-level diff: each word tagged correct | wrong | missing
export type WordTag = { word: string; status: "correct" | "wrong" | "extra" };

export function diffWords(typed: string, expected: string): WordTag[] {
  const ta = normalize(typed).split(" ").filter(Boolean);
  const ea = normalize(expected).split(" ").filter(Boolean);

  return ta.map((word, i) => ({
    word,
    status: ea[i] === word ? "correct" : "wrong",
  }));
}
