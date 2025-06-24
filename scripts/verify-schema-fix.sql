-- Verify the schema changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'shortcuts_links' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'shortcuts_links' 
  AND table_schema = 'public';

-- Test that individual links work
SELECT 
  id, slug, url, title, 
  CASE WHEN collection_id IS NULL THEN 'Individual' ELSE 'Collection' END as link_type
FROM shortcuts_links
ORDER BY created_at DESC
LIMIT 10;
