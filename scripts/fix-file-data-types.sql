-- Fix file_uploads table data types and clean up inconsistent data
BEGIN;

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'file_uploads' 
ORDER BY ordinal_position;

-- Clean up any invalid data
UPDATE file_uploads 
SET file_size = 0 
WHERE file_size IS NULL OR file_size = '' OR NOT file_size ~ '^[0-9]+$';

UPDATE file_uploads 
SET download_count = 0 
WHERE download_count IS NULL OR download_count = '' OR NOT download_count::text ~ '^[0-9]+$';

-- Ensure file_size is BIGINT and download_count is INTEGER
ALTER TABLE file_uploads 
ALTER COLUMN file_size TYPE BIGINT USING COALESCE(file_size::BIGINT, 0);

ALTER TABLE file_uploads 
ALTER COLUMN download_count TYPE INTEGER USING COALESCE(download_count::INTEGER, 0);

-- Set NOT NULL constraints with default values
ALTER TABLE file_uploads 
ALTER COLUMN file_size SET DEFAULT 0,
ALTER COLUMN file_size SET NOT NULL;

ALTER TABLE file_uploads 
ALTER COLUMN download_count SET DEFAULT 0,
ALTER COLUMN download_count SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_uploads_slug ON file_uploads(slug);
CREATE INDEX IF NOT EXISTS idx_file_uploads_filename ON file_uploads(original_filename);

-- Clean up expired files (optional - uncomment if you want to remove expired files)
-- DELETE FROM file_uploads WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Verify the changes
SELECT 
  COUNT(*) as total_files,
  SUM(file_size) as total_size_bytes,
  SUM(download_count) as total_downloads,
  AVG(file_size) as avg_file_size,
  MAX(file_size) as max_file_size,
  MIN(file_size) as min_file_size
FROM file_uploads;

COMMIT;
