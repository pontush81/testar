/*
  # Update Booking System

  1. Changes
     - Add season_type field to bookings table
     - Update price calculation based on season type
     - Add phone_number field to bookings table
  
  2. Security
     - Maintain existing RLS policies
*/

-- Add season_type to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS season_type text CHECK (season_type IN ('low', 'high', 'tennis')) DEFAULT 'low';

-- Add phone_number to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone_number text;

-- Update apartments table to have a single apartment
DELETE FROM apartments WHERE name = 'Lägenhet 2';
UPDATE apartments SET name = 'Gästlägenhet', description = 'Fullt utrustad lägenhet med badrum, pentry och sänglinne.' WHERE name = 'Lägenhet 1';

-- Add price columns for different seasons
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price_low_season integer DEFAULT 350;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price_high_season integer DEFAULT 450;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price_tennis_season integer DEFAULT 550;

-- Update the existing apartment with season prices
UPDATE apartments SET 
  price_low_season = 350,
  price_high_season = 450,
  price_tennis_season = 550
WHERE name = 'Gästlägenhet';