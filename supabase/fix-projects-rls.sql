-- Naprawa polityk RLS dla projects
-- Uruchom w Supabase SQL Editor

-- Usuń stare polityki
DROP POLICY IF EXISTS "Anyone can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;

-- Odczyt dla wszystkich (zeby klient mogl otworzyc link do projektu i zeby INSERT .select() dzialal)
CREATE POLICY "Anyone can read projects" ON projects
  FOR SELECT USING (true);

-- INSERT dla wszystkich (klient bez logowania tworzy projekt)
CREATE POLICY "Anyone can insert projects" ON projects
  FOR INSERT WITH CHECK (true);

-- UPDATE dla wszystkich (klient zapisuje/lockuje projekt bez logowania)
CREATE POLICY "Anyone can update projects" ON projects
  FOR UPDATE USING (true) WITH CHECK (true);