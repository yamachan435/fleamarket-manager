-- Add policies to allow migration script to insert data
-- These policies allow authenticated users to insert/update/delete during migration

-- Platforms table
CREATE POLICY "Allow authenticated insert on platforms" ON platforms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on platforms" ON platforms
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on platforms" ON platforms
  FOR DELETE USING (auth.role() = 'authenticated');

-- Products table
CREATE POLICY "Allow authenticated insert on products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Promotions table
CREATE POLICY "Allow authenticated insert on promotions" ON promotions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on promotions" ON promotions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on promotions" ON promotions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Listings table
CREATE POLICY "Allow authenticated insert on listings" ON listings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on listings" ON listings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on listings" ON listings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Product images table
CREATE POLICY "Allow authenticated insert on product_images" ON product_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on product_images" ON product_images
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on product_images" ON product_images
  FOR DELETE USING (auth.role() = 'authenticated');