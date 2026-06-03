-- ─────────────────────────────────────────────────────────────────────────────
-- Schema completo para Neon (English Practice App)
-- Ejecutar en: Neon Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── phrases ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phrases (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  english         TEXT        NOT NULL,
  spanish         TEXT        NOT NULL,
  category        TEXT,
  notes           TEXT,
  context         TEXT,
  level           TEXT        CHECK (level IN ('A1','A2','B1','B2','C1')),
  correct_count   INT         DEFAULT 0 NOT NULL,
  incorrect_count INT         DEFAULT 0 NOT NULL,
  interval        INT         DEFAULT 1 NOT NULL,
  ease_factor     FLOAT       DEFAULT 2.5 NOT NULL,
  repetitions     INT         DEFAULT 0 NOT NULL,
  next_review_date DATE       DEFAULT CURRENT_DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phrases_next_review ON phrases (next_review_date);

-- ── saved_stories ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_stories (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  level      TEXT,
  topic      TEXT,
  source     TEXT        NOT NULL, -- 'ai' | 'wikipedia'
  vocabulary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── phrase_groups ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phrase_groups (
  id              UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_english TEXT  NOT NULL,
  pattern_spanish TEXT  NOT NULL,
  examples        JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── journal_entries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id         UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date       DATE  NOT NULL DEFAULT CURRENT_DATE,
  prompt     TEXT,
  content    TEXT  NOT NULL
);

-- ── immersion_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS immersion_logs (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date       DATE    NOT NULL DEFAULT CURRENT_DATE,
  type       TEXT    NOT NULL CHECK (type IN ('listening','watching','reading','speaking')),
  minutes    INTEGER NOT NULL CHECK (minutes > 0),
  notes      TEXT
);

-- ── Datos de ejemplo ──────────────────────────────────────────────────────────
INSERT INTO phrases (english, spanish, category, level) VALUES
  ('How are you doing?',            '¿Cómo estás?',                'Saludos',      'A1'),
  ('Nice to meet you.',             'Mucho gusto.',                'Saludos',      'A1'),
  ('Can you repeat that, please?',  '¿Puedes repetir eso?',        'Conversación', 'A1'),
  ('I would like a coffee, please.','Quisiera un café, por favor.','Cotidiano',    'A1'),
  ('What time is it?',              '¿Qué hora es?',               'Cotidiano',    'A1')
ON CONFLICT DO NOTHING;
