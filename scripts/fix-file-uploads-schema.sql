-- Add missing columns to file_uploads table if they don't exist
DO $$ 
BEGIN
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_uploads' AND column_name = 'deleted_at') THEN
        ALTER TABLE file_uploads ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_uploads' AND column_name = 'is_active') THEN
        ALTER TABLE file_uploads ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Update existing records to have is_active = true
    UPDATE file_uploads SET is_active = true WHERE is_active IS NULL;
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_file_uploads_deleted_at ON file_uploads(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_file_uploads_is_active ON file_uploads(is_active);
    
END $$;

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'file_uploads' 
ORDER BY ordinal_position;
