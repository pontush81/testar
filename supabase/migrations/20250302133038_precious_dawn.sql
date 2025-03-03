/*
  # Update page deletion policies

  1. Security
    - Ensure authenticated users can delete pages
*/

-- Ensure the pages table exists
CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Ensure the delete policy exists
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

CREATE POLICY "Users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);