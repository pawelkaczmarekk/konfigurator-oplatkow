-- Migracja thumbnail z base64 do storage
-- Uruchom w Supabase SQL Editor

-- 1. Dodaj kolumnę thumbnail_path
ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- 2. Skopiuj istniejące thumbnail base64 do storage (ręcznie - stare miniaturki będą null)
-- Stara kolumna thumbnail zostaje dla kompatybilności, ale GET już jej nie używa

-- 3. Utwórz bucket storage dla szablonów (jeśli nie istnieje)
INSERT INTO storage.buckets (id, name, public)
VALUES ('szablony-thumbs', 'szablony-thumbs', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Polityki storage dla szablonów
DROP POLICY IF EXISTS "Public read szablony-thumbs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload szablony-thumbs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update szablony-thumbs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete szablony-thumbs" ON storage.objects;

CREATE POLICY "Public read szablony-thumbs" ON storage.objects
  FOR SELECT USING (bucket_id = 'szablony-thumbs');

CREATE POLICY "Authenticated upload szablony-thumbs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'szablony-thumbs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update szablony-thumbs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'szablony-thumbs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete szablony-thumbs" ON storage.objects
  FOR DELETE USING (bucket_id = 'szablony-thumbs' AND auth.role() = 'authenticated');