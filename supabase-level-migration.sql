-- Add CEFR level column to phrases
alter table phrases
  add column if not exists level text
  check (level in ('A1','A2','B1','B2','C1'))
  default null;
