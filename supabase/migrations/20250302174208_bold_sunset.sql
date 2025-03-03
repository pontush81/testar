/*
  # Update booking system

  1. Changes
     - Add season_settings table for managing yearly season configurations
     - Add season_weeks table for defining which weeks belong to which season
     - Add admin_settings table for general configuration options
  2. Security
     - Enable RLS on new tables
     - Add policies for authenticated users and admins
*/

-- Create season_settings table
CREATE TABLE IF NOT EXISTS season_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  low_season_price integer NOT NULL DEFAULT 350,
  high_season_price integer NOT NULL DEFAULT 450,
  tennis_season_price integer NOT NULL DEFAULT 550,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year)
);

-- Create season_weeks table
CREATE TABLE IF NOT EXISTS season_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_setting_id uuid NOT NULL REFERENCES season_settings(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  season_type text NOT NULL CHECK (season_type IN ('low', 'high', 'tennis')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_setting_id, week_number)
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE season_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for season_settings
CREATE POLICY "Anyone can view season_settings"
  ON season_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert season_settings"
  ON season_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update season_settings"
  ON season_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete season_settings"
  ON season_settings
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create policies for season_weeks
CREATE POLICY "Anyone can view season_weeks"
  ON season_weeks
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert season_weeks"
  ON season_weeks
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update season_weeks"
  ON season_weeks
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete season_weeks"
  ON season_weeks
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create policies for admin_settings
CREATE POLICY "Anyone can view admin_settings"
  ON admin_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert admin_settings"
  ON admin_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin_settings"
  ON admin_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete admin_settings"
  ON admin_settings
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Insert default season settings for current year
INSERT INTO season_settings (year, low_season_price, high_season_price, tennis_season_price)
VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  350,
  450,
  550
)
ON CONFLICT (year) DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value)
VALUES 
  ('max_booking_days', '7'),
  ('max_booking_months_ahead', '6'),
  ('cancellation_days', '7')
ON CONFLICT (setting_key) DO NOTHING;

-- Modify bookings table to remove season_type column
-- Instead, the season will be determined by the week number and the season_weeks table
ALTER TABLE bookings DROP COLUMN IF EXISTS season_type;