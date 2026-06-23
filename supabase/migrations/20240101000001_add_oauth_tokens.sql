-- OAuth tokens table for Google Drive integration
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  token_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, adjust as needed)
CREATE POLICY "Allow all operations on google_drive_tokens" ON google_drive_tokens FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_created_at ON google_drive_tokens(created_at);