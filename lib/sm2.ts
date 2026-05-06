export type Quality = 1 | 3 | 4 | 5;
// 1 = incorrecto, 3 = difícil, 4 = bien, 5 = fácil

export interface SM2State {
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string; // "YYYY-MM-DD"
}

export function applySM2(state: SM2State, quality: Quality): SM2State {
  let { interval, ease_factor, repetitions } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);
    repetitions += 1;
  } else {
    interval = 1;
    repetitions = 0;
  }

  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const next = new Date();
  next.setDate(next.getDate() + interval);
  const next_review_date = next.toISOString().split("T")[0];

  return { interval, ease_factor, repetitions, next_review_date };
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}
