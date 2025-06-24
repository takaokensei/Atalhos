-- Update the shortcuts_links table to support individual links (not part of collections)
ALTER TABLE shortcuts_links ALTER COLUMN collection_id DROP NOT NULL;

-- Add index for individual links
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_individual ON shortcuts_links(slug) WHERE collection_id IS NULL;

-- Update the unique constraint to allow individual links
ALTER TABLE shortcuts_links DROP CONSTRAINT IF EXISTS unique_collection_slug;
ALTER TABLE shortcuts_links ADD CONSTRAINT unique_slug UNIQUE(slug);

-- Add some test data for individual links
INSERT INTO shortcuts_links (id, url, slug, title, collection_id, created_at) 
VALUES 
  (gen_random_uuid(), 'https://github.com', 'github', 'GitHub', NULL, NOW()),
  (gen_random_uuid(), 'https://vercel.com', 'vercel', 'Vercel', NULL, NOW())
ON CONFLICT (slug) DO NOTHING;
