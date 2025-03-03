/*
  # Create pages table for content management

  1. New Tables
    - `pages`
      - `id` (text, primary key) - page identifier
      - `content` (text) - rich text content
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `pages` table
    - Add policies for authenticated users to read pages
    - Add policies for admins to update pages
*/

CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read pages
CREATE POLICY "Anyone can read pages"
  ON pages
  FOR SELECT
  USING (true);

-- Only admins can insert, update, or delete pages
CREATE POLICY "Admins can insert pages"
  ON pages
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update pages"
  ON pages
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete pages"
  ON pages
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');