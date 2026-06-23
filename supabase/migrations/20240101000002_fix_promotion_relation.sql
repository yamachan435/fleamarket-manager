-- Fix: Make promotion 1:1 with product by adding product_id to promotions table

-- Add product_id column to promotions table if it doesn't exist
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Create unique index for 1:1 relationship
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);

-- Remove promotion_id from listings table if it exists
ALTER TABLE listings DROP COLUMN IF EXISTS promotion_id;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_listings_promotion_id;

-- Enable Row Level Security on promotions (if not already enabled)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now)
CREATE POLICY "Allow all operations on promotions" ON promotions FOR ALL USING (true);