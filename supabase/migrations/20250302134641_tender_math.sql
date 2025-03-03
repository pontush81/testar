/*
  # Add support for custom pages

  1. Changes
    - Ensure pages table exists with proper structure
    - Ensure RLS policies are set up correctly
    - Add policy for authenticated users to create new pages
  2. Security
    - Enable RLS on pages table
    - Add policies for authenticated users to manage pages
*/

-- Ensure the pages table exists
CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

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