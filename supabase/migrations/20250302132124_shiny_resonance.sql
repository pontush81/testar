/*
  # Fix Pages Table and Policies

  1. Changes
     - Ensures the pages table exists
     - Drops any existing policies to avoid conflicts
     - Recreates all necessary policies for page access
     - Adds initial content for the aktivitetsrum page

  2. Security
     - Enables RLS on pages table
     - Creates policies for reading, inserting, updating, and deleting pages
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

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can insert pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can update pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON pages;
DROP POLICY IF EXISTS "Admins can update pages" ON pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON pages;

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

-- Insert initial content for aktivitetsrum if it doesn't exist
INSERT INTO pages (id, content)
VALUES ('aktivitetsrum', '<p>Ett stort bord med 10 stolar finns att använda med dimbar belysning ovanför.</p><p>Darttavla med belysning är installerad. För att tända belysningen sker det direkt på armaturen på höger sida.</p><p>Biljardbord finns att använda.</p><p>I källaren finns en bluetooth-högtalare som är fri att använda men får inte lämna lokalen.</p><p>För att slippa städa mer än nödvändigt ber vi er att ställa ytterskor utanför svarta tejpmarkeringen.</p><p>Lokalen kan bokas genom att fylla i fysisk kalender som ligger på bordet i rummet.</p>')
ON CONFLICT (id) DO NOTHING;