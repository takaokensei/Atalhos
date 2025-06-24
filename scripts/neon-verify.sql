-- Verify tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shortcuts_links', 'shortcuts_collections');

-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('shortcuts_links', 'shortcuts_collections');

-- Check table structures
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shortcuts_links'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shortcuts_collections'
ORDER BY ordinal_position;

-- Test basic operations
INSERT INTO shortcuts_links (url, slug, title) 
VALUES ('https://example.com', 'test-slug', 'Test Link')
ON CONFLICT (slug) DO NOTHING;

SELECT COUNT(*) as total_links FROM shortcuts_links;
SELECT COUNT(*) as total_collections FROM shortcuts_collections;
