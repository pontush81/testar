/*
  # Fix page deletion policy

  1. Changes
    - Recreate the delete policy for pages table to ensure it works properly
    - Drop any existing delete policy to avoid conflicts
  
  2. Security
    - Maintain row level security for the pages table
    - Allow authenticated users to delete pages
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
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON pages;

-- Create new delete policy with proper permissions
CREATE POLICY "Authenticated users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);