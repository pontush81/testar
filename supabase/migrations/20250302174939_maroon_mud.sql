/*
  # Fix bookings table relationships

  1. Changes
     - Fix foreign key relationships for bookings table
     - Update RLS policies to use proper JWT claims
     - Add proper indexes for performance
  
  2. Security
     - Maintain existing RLS policies with corrected references
*/

-- First ensure the bookings table exists with proper structure
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_apartment_id_idx ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS bookings_start_date_idx ON bookings(start_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

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

-- Create a view to make it easier to query bookings with related data
CREATE OR REPLACE VIEW bookings_with_users AS
SELECT 
  b.*,
  p.email as user_email,
  p.full_name as user_full_name,
  a.name as apartment_name,
  a.price_low_season,
  a.price_high_season,
  a.price_tennis_season
FROM 
  bookings b
LEFT JOIN 
  profiles p ON b.user_id = p.id
LEFT JOIN 
  apartments a ON b.apartment_id = a.id;

-- Grant access to the view
GRANT SELECT ON bookings_with_users TO authenticated, anon;