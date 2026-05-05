-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE phrases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  english TEXT NOT NULL,
  spanish TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  correct_count INT DEFAULT 0 NOT NULL,
  incorrect_count INT DEFAULT 0 NOT NULL
);

-- Habilitar acceso público (sin auth por ahora)
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON phrases FOR SELECT USING (true);
CREATE POLICY "Public insert" ON phrases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON phrases FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON phrases FOR DELETE USING (true);

-- Datos de ejemplo
INSERT INTO phrases (english, spanish, category) VALUES
  ('How are you doing?', '¿Cómo estás?', 'Saludos'),
  ('Nice to meet you.', 'Mucho gusto.', 'Saludos'),
  ('Can you repeat that, please?', '¿Puedes repetir eso, por favor?', 'Conversación'),
  ('I would like a coffee, please.', 'Quisiera un café, por favor.', 'Cotidiano'),
  ('What time is it?', '¿Qué hora es?', 'Cotidiano');
