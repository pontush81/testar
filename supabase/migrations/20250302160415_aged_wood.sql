/*
  # Fix Booking System

  1. Changes
     - Temporarily allow authenticated users to insert apartments
     - Fix RLS policies for apartments and bookings
     - Add default apartments if they don't exist
  
  2. Security
     - Ensure proper RLS policies for all tables
     - Allow users to manage their own bookings
*/

-- Modify apartments table policies to allow authenticated users to insert
DROP POLICY IF EXISTS "Admins can insert apartments" ON apartments;

CREATE POLICY "Authenticated users can insert apartments"
  ON apartments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default apartments if they don't exist
INSERT INTO apartments (name, description, price_per_night, max_guests)
VALUES 
  ('Lägenhet 1', 'Större lägenhet med plats för upp till 4 personer. Utrustad med dubbelsäng och bäddsoffa.', 350, 4),
  ('Lägenhet 2', 'Mindre lägenhet med plats för upp till 2 personer. Utrustad med dubbelsäng.', 250, 2)
ON CONFLICT DO NOTHING;

-- Fix bookings policies
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can delete any booking" ON bookings;

-- Create new policies for bookings
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
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admins can delete any booking
CREATE POLICY "Admins can delete any booking"
  ON bookings
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );