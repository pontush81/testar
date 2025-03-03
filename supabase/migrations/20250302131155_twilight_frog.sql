/*
  # Fix profiles table RLS policies for registration

  1. Changes
    - Add policy to allow new users to create their own profile during registration
    - This ensures users can complete the registration process

  2. Security
    - Maintains existing RLS policies
    - Adds specific policy for self-registration
*/

-- Add policy to allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);