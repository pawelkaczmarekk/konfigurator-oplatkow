-- Naprawa polityk RLS dla graphics i templates + storage
-- Uruchom w Supabase SQL Editor

-- ==========================================
-- GRAPHICS TABLE
-- ==========================================

-- Usuń stare polityki jeśli istnieją
DROP POLICY IF EXISTS "Anyone can read graphics" ON graphics;
DROP POLICY IF EXISTS "Authenticated users can insert graphics" ON graphics;
DROP POLICY IF EXISTS "Authenticated users can update graphics" ON graphics;
DROP POLICY IF EXISTS "Authenticated users can delete graphics" ON graphics;

-- Odczyt dla wszystkich
CREATE POLICY "Anyone can read graphics" ON graphics
  FOR SELECT USING (true);

-- INSERT dla zalogowanych
CREATE POLICY "Authenticated users can insert graphics" ON graphics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE dla zalogowanych
CREATE POLICY "Authenticated users can update graphics" ON graphics
  FOR UPDATE USING (auth.role() = 'authenticated');

-- DELETE dla zalogowanych
CREATE POLICY "Authenticated users can delete graphics" ON graphics
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- TEMPLATES TABLE
-- ==========================================

DROP POLICY IF EXISTS "Anyone can read templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON templates;

-- Odczyt dla wszystkich
CREATE POLICY "Anyone can read templates" ON templates
  FOR SELECT USING (true);

-- INSERT dla zalogowanych
CREATE POLICY "Authenticated users can insert templates" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE dla zalogowanych
CREATE POLICY "Authenticated users can update templates" ON templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- DELETE dla zalogowanych
CREATE POLICY "Authenticated users can delete templates" ON templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- STORAGE BUCKET: grafiki (polityki na storage.objects)
-- ==========================================

-- Usuń stare polityki storage
DROP POLICY IF EXISTS "Public read grafiki" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload grafiki" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update grafiki" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete grafiki" ON storage.objects;

-- Odczyt publiczny (żeby grafiki się wyświetlały)
CREATE POLICY "Public read grafiki" ON storage.objects
  FOR SELECT USING (bucket_id = 'grafiki');

-- Upload dla zalogowanych
CREATE POLICY "Authenticated upload grafiki" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'grafiki' AND auth.role() = 'authenticated');

-- Update dla zalogowanych
CREATE POLICY "Authenticated update grafiki" ON storage.objects
  FOR UPDATE USING (bucket_id = 'grafiki' AND auth.role() = 'authenticated');

-- Delete dla zalogowanych
CREATE POLICY "Authenticated delete grafiki" ON storage.objects
  FOR DELETE USING (bucket_id = 'grafiki' AND auth.role() = 'authenticated');