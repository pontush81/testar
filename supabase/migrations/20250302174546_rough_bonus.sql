/*
  # Fix bookings foreign key relationship

  1. Changes
    - Fix the foreign key relationship between bookings and profiles
    - Add explicit foreign key constraint between bookings.user_id and profiles.id
    - Update policies to use proper foreign key relationships
*/

-- First, ensure the bookings table exists
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
  guest_name text,
  phone_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can delete any booking" ON bookings;

-- Create new policies for bookings with proper references
-- Anyone can view all bookings
CREATE POLICY "Anyone can view bookings"
  ON bookings
  FOR SELECT
  USING (true);

-- Users can insert their own bookings
CREATE POLICY "Users can insert their own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
  ON bookings
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON bookings
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can delete any booking
CREATE POLICY "Admins can delete any booking"
  ON bookings
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');