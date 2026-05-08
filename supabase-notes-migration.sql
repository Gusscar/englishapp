-- Ejecutar en el SQL Editor de Supabase
-- Agrega columna de notas/ejemplo propio del usuario

ALTER TABLE phrases ADD COLUMN IF NOT EXISTS notes TEXT;
