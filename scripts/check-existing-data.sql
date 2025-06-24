-- Check for duplicate slugs
SELECT slug, COUNT(*) as count
FROM shortcuts_links 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Show all existing data
SELECT id, slug, url, title, collection_id, created_at
FROM shortcuts_links
ORDER BY created_at DESC;
