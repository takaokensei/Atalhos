-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS shortcuts_links CASCADE;
DROP TABLE IF EXISTS shortcuts_collections CASCADE;

-- Create shortcuts_collections table with proper structure
CREATE TABLE shortcuts_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  access_key VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shortcuts_links table with proper structure
CREATE TABLE shortcuts_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES shortcuts_collections(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_collection_slug UNIQUE(collection_id, slug)
);

-- Create indexes for better performance
CREATE INDEX idx_shortcuts_collections_access_key ON shortcuts_collections(access_key);
CREATE INDEX idx_shortcuts_links_collection_id ON shortcuts_links(collection_id);
CREATE INDEX idx_shortcuts_links_slug ON shortcuts_links(slug);

-- Enable Row Level Security
ALTER TABLE shortcuts_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts_links ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using access keys for security)
CREATE POLICY "Allow public access to collections" ON shortcuts_collections
  FOR ALL USING (true);

CREATE POLICY "Allow public access to links" ON shortcuts_links
  FOR ALL USING (true);

-- Insert a test collection to verify setup
INSERT INTO shortcuts_collections (name, description, access_key) 
VALUES ('Test Collection', 'Test collection for verification', 'test123456789abc')
ON CONFLICT (access_key) DO NOTHING;
