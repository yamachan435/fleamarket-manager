-- Add status column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT '準備中';

-- Drop existing constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_product_status;

-- Add constraint for valid status values
ALTER TABLE products ADD CONSTRAINT valid_product_status 
  CHECK (status IN ('準備中', '出品中', '販売中', '取引中', '完了'));
