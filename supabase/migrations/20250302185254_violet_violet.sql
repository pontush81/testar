/*
  # Update season settings tables

  This migration ensures the season tables exist and adds any missing policies,
  using IF NOT EXISTS to avoid errors with existing objects.
*/

-- Ensure season_settings table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'season_settings') THEN
    -- Create season_settings table
    CREATE TABLE season_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      year integer NOT NULL,
      low_season_price integer NOT NULL DEFAULT 350,
      high_season_price integer NOT NULL DEFAULT 450,
      tennis_season_price integer NOT NULL DEFAULT 550,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(year)
    );

    -- Enable Row Level Security
    ALTER TABLE season_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure season_weeks table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'season_weeks') THEN
    -- Create season_weeks table
    CREATE TABLE season_weeks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      season_setting_id uuid NOT NULL REFERENCES season_settings(id) ON DELETE CASCADE,
      week_number integer NOT NULL,
      season_type text NOT NULL CHECK (season_type IN ('low', 'high', 'tennis')),
      created_at timestamptz DEFAULT now(),
      UNIQUE(season_setting_id, week_number)
    );

    -- Enable Row Level Security
    ALTER TABLE season_weeks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for season_settings if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_settings' AND policyname = 'Anyone can view season_settings') THEN
    CREATE POLICY "Anyone can view season_settings"
      ON season_settings
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_settings' AND policyname = 'Authenticated users can insert season_settings') THEN
    CREATE POLICY "Authenticated users can insert season_settings"
      ON season_settings
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_settings' AND policyname = 'Authenticated users can update season_settings') THEN
    CREATE POLICY "Authenticated users can update season_settings"
      ON season_settings
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_settings' AND policyname = 'Authenticated users can delete season_settings') THEN
    CREATE POLICY "Authenticated users can delete season_settings"
      ON season_settings
      FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create policies for season_weeks if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_weeks' AND policyname = 'Anyone can view season_weeks') THEN
    CREATE POLICY "Anyone can view season_weeks"
      ON season_weeks
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_weeks' AND policyname = 'Authenticated users can insert season_weeks') THEN
    CREATE POLICY "Authenticated users can insert season_weeks"
      ON season_weeks
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_weeks' AND policyname = 'Authenticated users can update season_weeks') THEN
    CREATE POLICY "Authenticated users can update season_weeks"
      ON season_weeks
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'season_weeks' AND policyname = 'Authenticated users can delete season_weeks') THEN
    CREATE POLICY "Authenticated users can delete season_weeks"
      ON season_weeks
      FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Insert default season settings for current year if not already present
INSERT INTO season_settings (year, low_season_price, high_season_price, tennis_season_price)
VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  350,
  450,
  550
)
ON CONFLICT (year) DO NOTHING;