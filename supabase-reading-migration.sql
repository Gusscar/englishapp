-- Ejecutar en SQL Editor de Supabase

CREATE TABLE saved_stories (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL,
  level         TEXT,
  topic         TEXT,
  source        TEXT        NOT NULL, -- 'ai' | 'gutenberg'
  vocabulary    JSONB,                -- [{word, spanish, example}]
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"   ON saved_stories FOR SELECT USING (true);
CREATE POLICY "Public insert" ON saved_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete" ON saved_stories FOR DELETE USING (true);
