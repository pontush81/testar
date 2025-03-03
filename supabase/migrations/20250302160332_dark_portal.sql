/*
  # Create booking tables

  1. New Tables
    - `apartments`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price_per_night` (integer)
      - `max_guests` (integer)
      - `created_at` (timestamp)
    - `bookings`
      - `id` (uuid, primary key)
      - `apartment_id` (uuid, foreign key to apartments)
      - `user_id` (uuid, foreign key to auth.users)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `guest_name` (text)
      - `notes` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create apartments table
CREATE TABLE IF NOT EXISTS apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_per_night integer NOT NULL,
  max_guests integer NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
  guest_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for apartments
-- Anyone can view apartments
CREATE POLICY "Anyone can view apartments"
  ON apartments
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete apartments
CREATE POLICY "Admins can insert apartments"
  ON apartments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update apartments"
  ON apartments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete apartments"
  ON apartments
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for bookings
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