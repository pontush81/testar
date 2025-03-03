/*
  # Fix delete policy for pages table

  1. Changes
    - Drop existing delete policy
    - Create new delete policy with proper permissions
  2. Security
    - Ensure authenticated users can delete pages
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

-- Create new delete policy with proper permissions
CREATE POLICY "Users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;