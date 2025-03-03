/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Drop problematic policies that cause infinite recursion
    - Create new policies with a different approach to avoid recursion
    - Use auth.jwt() to check for admin role instead of querying the profiles table

  2. Security
    - Maintains same security model but implements it in a way that avoids recursion
    - Uses JWT claims for role-based access control
*/

-- Drop policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new policies using JWT claims instead of querying the profiles table
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.uid() = id);

CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.uid() = id);