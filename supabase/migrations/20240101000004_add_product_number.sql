-- Add product_number column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_number INTEGER UNIQUE;

-- Create sequence for product_number
CREATE SEQUENCE IF NOT EXISTS product_number_seq START WITH 1;

-- Create function to auto-generate product_number
CREATE OR REPLACE FUNCTION generate_product_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_number IS NULL THEN
    NEW.product_number := nextval('product_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate product_number on insert
DROP TRIGGER IF EXISTS set_product_number ON products;
CREATE TRIGGER set_product_number
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_number();
