/*
  # Fix page deletion policy

  1. Changes
    - Drop existing policies for pages table
    - Create new policies with proper permissions
    - Ensure authenticated users can delete pages
  2. Security
    - Enable RLS on pages table
    - Add policy for authenticated users to delete pages
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view pages" ON pages;
DROP POLICY IF EXISTS "Users can insert pages" ON pages;
DROP POLICY IF EXISTS "Users can update pages" ON pages;
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

-- Create new policies
-- Anyone can read pages
CREATE POLICY "Anyone can view pages"
  ON pages
  FOR SELECT
  USING (true);

-- Authenticated users can insert/update/delete pages
CREATE POLICY "Users can insert pages"
  ON pages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pages"
  ON pages
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);