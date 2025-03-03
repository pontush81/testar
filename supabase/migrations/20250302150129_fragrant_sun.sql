/*
  # Fix page deletion functionality

  1. Security
    - Ensure all authenticated users can delete pages
    - Fix any issues with the delete policy
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

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

-- Create new delete policy with proper permissions
CREATE POLICY "Users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);