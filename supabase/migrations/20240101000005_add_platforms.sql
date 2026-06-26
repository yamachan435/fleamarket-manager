-- Create platforms master table
CREATE TABLE IF NOT EXISTS platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert initial platform data
INSERT INTO platforms (name, display_order) VALUES
  ('メルカリ', 1),
  ('ラクマ', 2),
  ('ヤフオク', 3),
  ('フリマ', 4),
  ('ミクモ', 5),
  ('オタマケ', 6)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

-- Create policy for platforms
CREATE POLICY "Allow public read access to platforms" ON platforms
  FOR SELECT USING (true);
