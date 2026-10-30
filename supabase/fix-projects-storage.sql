-- Dodaj kolumnę canvas_json_path do projects
-- canvas_json zostaje jako fallback
-- Uruchom w Supabase SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS canvas_json_path TEXT;

-- Polityka publiczna na projects (zeby klient mogl zapisac/odczytac bez logowania)
DROP POLICY IF EXISTS "Anyone can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;

CREATE POLICY "Anyone can read projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update projects" ON projects
  FOR UPDATE USING (true) WITH CHECK (true);

-- Polityka publiczna na storage szablonow (zeby klient mogl uploadowac JSON projektu)
DROP POLICY IF EXISTS "Public upload projekty" ON storage.objects;
CREATE POLICY "Public upload projekty" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'szablony');