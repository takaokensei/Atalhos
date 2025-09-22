-- Add missing columns to file_uploads table
ALTER TABLE file_uploads 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Update existing records to have proper structure
UPDATE file_uploads 
SET deleted_at = NULL 
WHERE deleted_at IS NULL;

-- Ensure all required columns exist with proper types
ALTER TABLE file_uploads 
ALTER COLUMN mime_type SET DEFAULT 'application/octet-stream',
ALTER COLUMN file_extension SET DEFAULT 'bin',
ALTER COLUMN download_count SET DEFAULT 0,
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN metadata SET DEFAULT '{}';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_deleted_at ON file_uploads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_is_active ON file_uploads(is_active);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'file_uploads' 
ORDER BY ordinal_position;
