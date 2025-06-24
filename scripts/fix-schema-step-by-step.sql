-- Step 1: Remove any duplicate slugs (keep the most recent one)
WITH ranked_links AS (
  SELECT id, slug, 
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at DESC) as rn
  FROM shortcuts_links
)
DELETE FROM shortcuts_links 
WHERE id IN (
  SELECT id FROM ranked_links WHERE rn > 1
);

-- Step 2: Drop the old constraint if it exists
ALTER TABLE shortcuts_links DROP CONSTRAINT IF EXISTS unique_collection_slug;

-- Step 3: Make collection_id nullable
ALTER TABLE shortcuts_links ALTER COLUMN collection_id DROP NOT NULL;

-- Step 4: Add the unique constraint on slug only
ALTER TABLE shortcuts_links ADD CONSTRAINT unique_slug UNIQUE(slug);

-- Step 5: Add index for individual links
CREATE INDEX IF NOT EXISTS idx_shortcuts_links_individual ON shortcuts_links(slug) WHERE collection_id IS NULL;

-- Step 6: Add some test data for individual links (only if they don't exist)
INSERT INTO shortcuts_links (id, url, slug, title, collection_id, created_at) 
VALUES 
  (gen_random_uuid(), 'https://github.com', 'github', 'GitHub', NULL, NOW()),
  (gen_random_uuid(), 'https://vercel.com', 'vercel', 'Vercel', NULL, NOW())
ON CONFLICT (slug) DO NOTHING;
