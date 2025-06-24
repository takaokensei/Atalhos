-- Create shortcuts_collections table
CREATE TABLE IF NOT EXISTS shortcuts_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  access_key VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shortcuts_links table
CREATE TABLE IF NOT EXISTS shortcuts_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES shortcuts_collections(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, slug)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shortcuts_collections_access_key ON shortcuts_collections(access_key);
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_collection_id ON shortcuts_links(collection_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_slug ON shortcuts_links(slug);

-- Enable Row Level Security (optional)
ALTER TABLE shortcuts_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts_links ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we're using access keys)
CREATE POLICY "Allow public read access to collections" ON shortcuts_collections
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to collections" ON shortcuts_collections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to links" ON shortcuts_links
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to links" ON shortcuts_links
  FOR INSERT WITH CHECK (true);
