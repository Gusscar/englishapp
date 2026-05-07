export interface Phrase {
  id: string;
  english: string;
  spanish: string;
  category: string | null;
  context: string | null;
  created_at: string;
  correct_count: number;
  incorrect_count: number;
  // SRS fields
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
}

export type PhraseInsert = Omit<
  Phrase,
  "id" | "created_at" | "correct_count" | "incorrect_count" | "interval" | "ease_factor" | "repetitions" | "next_review_date" | "context"
>;
