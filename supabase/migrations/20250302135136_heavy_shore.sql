/*
  # Fix pages table and policies

  1. Changes
    - Ensure pages table exists
    - Recreate all policies for pages table
    - Create default pages if they don't exist
  2. Security
    - Enable RLS on pages table
    - Ensure authenticated users can perform CRUD operations
*/

-- Ensure the pages table exists
CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view pages" ON pages;
DROP POLICY IF EXISTS "Users can insert pages" ON pages;
DROP POLICY IF EXISTS "Users can update pages" ON pages;
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

-- Create new policies
-- Anyone can read pages
CREATE POLICY "Anyone can view pages"
  ON pages
  FOR SELECT
  USING (true);

-- Authenticated users can insert/update/delete pages
CREATE POLICY "Users can insert pages"
  ON pages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update pages"
  ON pages
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete pages"
  ON pages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Insert initial content for aktivitetsrum if it doesn't exist
INSERT INTO pages (id, content, created_at, updated_at)
VALUES (
  'aktivitetsrum', 
  '<h1>Aktivitetsrum</h1><p>Ett stort bord med 10 stolar finns att använda med dimbar belysning ovanför.</p><p>Darttavla med belysning är installerad. För att tända belysningen sker det direkt på armaturen på höger sida.</p><p>Biljardbord finns att använda.</p><p>I källaren finns en bluetooth-högtalare som är fri att använda men får inte lämna lokalen.</p><p>För att slippa städa mer än nödvändigt ber vi er att ställa ytterskor utanför svarta tejpmarkeringen.</p><p>Lokalen kan bokas genom att fylla i fysisk kalender som ligger på bordet i rummet.</p>',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert default content for other pages if they don't exist
INSERT INTO pages (id, content, created_at, updated_at)
VALUES 
('elbil', '<h1>Elbil</h1><p>Information om elbilsladdning kommer snart...</p>', now(), now()),
('ellagarden', '<h1>Ellagården</h1><p>Information om Ellagården kommer snart...</p>', now(), now()),
('fargkoder', '<h1>Färgkoder</h1><p>Information om färgkoder kommer snart...</p>', now(), now()),
('foreningsstamma', '<h1>Föreningsstämma</h1><p>Information om föreningsstämma kommer snart...</p>', now(), now()),
('gastlagenhet', '<h1>Gästlägenhet</h1><p>Information om gästlägenheten kommer snart...</p>', now(), now()),
('grillregler', '<h1>Grillregler</h1><p>Information om grillregler kommer snart...</p>', now(), now()),
('skotselplan', '<h1>Skötselplan</h1><p>Information om skötselplan kommer snart...</p>', now(), now()),
('sophantering', '<h1>Sophantering</h1><p>Information om sophantering kommer snart...</p>', now(), now()),
('styrelse', '<h1>Styrelse</h1><p>Information om styrelsen kommer snart...</p>', now(), now()),
('styrelsemoten', '<h1>Styrelsemöten</h1><p>Information om styrelsemöten kommer snart...</p>', now(), now())
ON CONFLICT (id) DO NOTHING;