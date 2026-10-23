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
-- STORAGE BUCKET: grafiki
-- ==========================================

-- Usuń stare polityki storage
DELETE FROM storage.policies WHERE bucket_id = 'grafiki';

-- Odczyt publiczny (żeby grafiki się wyświetlały)
INSERT INTO storage.policies (name, bucket_id, definition, allow, operation)
VALUES ('Public read grafiki', 'grafiki', 'true', true, 'SELECT');

-- Upload dla zalogowanych
INSERT INTO storage.policies (name, bucket_id, definition, allow, operation)
VALUES ('Authenticated upload grafiki', 'grafiki', 'auth.role() = ''authenticated''', true, 'INSERT');

-- Update dla zalogowanych
INSERT INTO storage.policies (name, bucket_id, definition, allow, operation)
VALUES ('Authenticated update grafiki', 'grafiki', 'auth.role() = ''authenticated''', true, 'UPDATE');

-- Delete dla zalogowanych
INSERT INTO storage.policies (name, bucket_id, definition, allow, operation)
VALUES ('Authenticated delete grafiki', 'grafiki', 'auth.role() = ''authenticated''', true, 'DELETE');