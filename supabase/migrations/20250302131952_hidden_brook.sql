/*
  # Fix pages table and policies for content management

  1. Changes
    - Create pages table if it doesn't exist
    - Set up proper RLS policies for the pages table
    - Allow all users to read pages
    - Allow authenticated users to update pages
  
  2. Security
    - Ensure pages can be read by anyone
    - Allow authenticated users to update pages
*/

-- Create pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert pages" ON pages;
DROP POLICY IF EXISTS "Admins can update pages" ON pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON pages;
DROP POLICY IF EXISTS "Anyone can read pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can insert pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can update pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON pages;

-- Create new policies
-- Anyone can read pages
CREATE POLICY "Anyone can read pages"
  ON pages
  FOR SELECT
  USING (true);

-- Temporarily allow any authenticated user to insert/update pages
CREATE POLICY "Authenticated users can insert pages"
  ON pages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pages"
  ON pages
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete pages
CREATE POLICY "Authenticated users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);