-- Verify tables were created successfully
SELECT 
  'shortcuts_collections' as table_name,
  COUNT(*) as record_count
FROM shortcuts_collections
UNION ALL
SELECT 
  'shortcuts_links' as table_name,
  COUNT(*) as record_count  
FROM shortcuts_links;

-- Show the test collection that was inserted
SELECT 
  id,
  name,
  description,
  access_key,
  created_at
FROM shortcuts_collections 
WHERE access_key = 'test123456789abc';
