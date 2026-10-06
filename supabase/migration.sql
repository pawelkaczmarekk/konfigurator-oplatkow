-- Tabela projektów opłatków
-- Uruchom to w SQL Editor w Supabase Dashboard

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_json JSONB NOT NULL,
  shape JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Zezwalaj na odczyt i zapis bez autoryzacji (anon key)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read projects" ON projects
  FOR SELECT USING (true);