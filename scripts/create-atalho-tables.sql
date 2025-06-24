-- Create the shortcuts_collections table
CREATE TABLE IF NOT EXISTS shortcuts_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    access_key VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the shortcuts_links table
CREATE TABLE IF NOT EXISTS shortcuts_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500),
    collection_id UUID REFERENCES shortcuts_collections(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_slug ON shortcuts_links(slug);
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_collection_id ON shortcuts_links(collection_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_collections_access_key ON shortcuts_collections(access_key);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_shortcuts_links_updated_at ON shortcuts_links;
CREATE TRIGGER update_shortcuts_links_updated_at
    BEFORE UPDATE ON shortcuts_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shortcuts_collections_updated_at ON shortcuts_collections;
CREATE TRIGGER update_shortcuts_collections_updated_at
    BEFORE UPDATE ON shortcuts_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO shortcuts_links (id, url, slug, title) 
VALUES 
    (gen_random_uuid(), 'https://github.com', 'github', 'GitHub - Where the world builds software'),
    (gen_random_uuid(), 'https://vercel.com', 'vercel', 'Vercel - Deploy web projects with the best frontend developer experience')
ON CONFLICT (slug) DO NOTHING;
