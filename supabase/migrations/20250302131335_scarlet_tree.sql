/*
  # Add admin RLS policies for user management

  1. Changes
    - Add policy to allow admins to manage users through standard API
    - Ensures admins can perform user management without requiring admin API access

  2. Security
    - Maintains existing RLS policies
    - Adds specific policies for admin user management
*/

-- Ensure admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Ensure admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Ensure admins can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );