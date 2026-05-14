-- Migración para la tabla phrase_groups
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS phrase_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_english TEXT NOT NULL,
  pattern_spanish TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE phrase_groups ENABLE ROW LEVEL SECURITY;

-- Policies de acceso público (sin auth)
CREATE POLICY "Public read" ON phrase_groups FOR SELECT USING (true);
CREATE POLICY "Public insert" ON phrase_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON phrase_groups USING (true);
CREATE POLICY "Public delete" ON phrase_groups FOR DELETE USING (true);
