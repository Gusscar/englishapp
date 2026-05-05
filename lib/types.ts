export interface Phrase {
  id: string;
  english: string;
  spanish: string;
  category: string | null;
  created_at: string;
  correct_count: number;
  incorrect_count: number;
}

export type PhraseInsert = Omit<Phrase, "id" | "created_at" | "correct_count" | "incorrect_count">;
