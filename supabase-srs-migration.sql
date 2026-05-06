-- Ejecutar en SQL Editor de Supabase
-- Agrega columnas SRS a la tabla phrases

ALTER TABLE phrases
  ADD COLUMN IF NOT EXISTS interval INT DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS ease_factor FLOAT DEFAULT 2.5 NOT NULL,
  ADD COLUMN IF NOT EXISTS repetitions INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS next_review_date DATE DEFAULT CURRENT_DATE NOT NULL;

-- Índice para consultas de revisión por fecha
CREATE INDEX IF NOT EXISTS idx_phrases_next_review ON phrases (next_review_date);
