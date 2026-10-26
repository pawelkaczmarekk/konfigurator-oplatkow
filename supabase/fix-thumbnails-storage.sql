-- Migracja thumbnail z base64 do storage
-- Uruchom w Supabase SQL Editor

-- 1. Dodaj kolumnę thumbnail_path
ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

ALTER TABLE templates ADD COLUMN IF NOT EXISTS canvas_json_path TEXT;

ALTER TABLE templates ALTER COLUMN canvas_json DROP NOT NULL;

-- 2. Skopiuj istniejące thumbnail base64 do storage (ręcznie - stare miniaturki będą null)
-- Stara kolumna thumbnail zostaje dla kompatybilności, ale GET już jej nie używa

-- 3. Utwórz bucket storage dla szablonów (jeśli nie istnieje)
INSERT INTO storage.buckets (id, name, public)
VALUES ('szablony', 'szablony', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Polityki storage dla szablonów
DROP POLICY IF EXISTS "Public read szablony" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload szablony" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update szablony" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete szablony" ON storage.objects;

CREATE POLICY "Public read szablony" ON storage.objects
  FOR SELECT USING (bucket_id = 'szablony');

CREATE POLICY "Authenticated upload szablony" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'szablony' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update szablony" ON storage.objects
  FOR UPDATE USING (bucket_id = 'szablony' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete szablony" ON storage.objects
  FOR DELETE USING (bucket_id = 'szablony' AND auth.role() = 'authenticated');