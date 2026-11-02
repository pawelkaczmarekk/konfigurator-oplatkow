CREATE TABLE IF NOT EXISTS category_order (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tab TEXT NOT NULL,
  path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tab, path)
);

ALTER TABLE category_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category_order" ON category_order
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert category_order" ON category_order
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update category_order" ON category_order
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete category_order" ON category_order
  FOR DELETE USING (true);