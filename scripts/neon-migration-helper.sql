-- This script helps verify the migration from Supabase to Neon
-- Run this after setting up the Neon database

-- Check if tables are properly created
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('shortcuts_links', 'shortcuts_collections')
ORDER BY table_name;

-- Check table constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('shortcuts_links', 'shortcuts_collections')
ORDER BY tc.table_name, tc.constraint_type;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('shortcuts_links', 'shortcuts_collections')
ORDER BY tablename, indexname;

-- Test basic CRUD operations
-- Insert test data
INSERT INTO shortcuts_links (url, slug, title) 
VALUES 
    ('https://example.com', 'test-migration', 'Migration Test Link'),
    ('https://google.com', 'google-test', 'Google Test')
ON CONFLICT (slug) DO NOTHING;

-- Verify insert
SELECT id, url, slug, title, created_at 
FROM shortcuts_links 
WHERE slug IN ('test-migration', 'google-test');

-- Test update
UPDATE shortcuts_links 
SET title = 'Updated Migration Test' 
WHERE slug = 'test-migration';

-- Verify update
SELECT id, url, slug, title, updated_at 
FROM shortcuts_links 
WHERE slug = 'test-migration';

-- Clean up test data
DELETE FROM shortcuts_links 
WHERE slug IN ('test-migration', 'google-test');

-- Final verification
SELECT COUNT(*) as total_links FROM shortcuts_links;
SELECT COUNT(*) as total_collections FROM shortcuts_collections;
