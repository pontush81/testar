/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users.id
      - `email` (text, not null)
      - `full_name` (text)
      - `apartment` (text)
      - `role` (text, not null, default 'member')
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to read all profiles
    - Add policies for users to update their own profile
    - Add policies for admins to manage all profiles
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  apartment text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can read all profiles
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Users can update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can insert, update, and delete any profile
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );