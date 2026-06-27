-- ラベル印刷用の選択セット（常に1行のみ運用）
CREATE TABLE IF NOT EXISTS label_print_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'デフォルト',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- セットに含まれる商品
CREATE TABLE IF NOT EXISTS label_print_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES label_print_sets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(set_id, product_id)
);

ALTER TABLE label_print_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_print_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on label_print_sets" ON label_print_sets FOR ALL USING (true);
CREATE POLICY "Allow all operations on label_print_items" ON label_print_items FOR ALL USING (true);
