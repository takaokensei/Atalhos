-- Migration script for file_uploads table
-- This script ensures the table has the correct structure and data types

-- First, check if the table exists
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        CREATE TABLE file_uploads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_size BIGINT NOT NULL DEFAULT 0,
            mime_type VARCHAR(100),
            extension VARCHAR(10),
            storage_url TEXT NOT NULL,
            download_slug VARCHAR(50) UNIQUE NOT NULL,
            download_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_file_uploads_slug ON file_uploads(download_slug);
        CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);
        CREATE INDEX idx_file_uploads_expires_at ON file_uploads(expires_at);
        
        RAISE NOTICE 'Created file_uploads table with proper structure';
    ELSE
        RAISE NOTICE 'file_uploads table already exists, checking columns...';
    END IF;
END
$$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add download_slug column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'download_slug') THEN
        -- If we have a 'slug' column, rename it to 'download_slug'
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'slug') THEN
            ALTER TABLE file_uploads RENAME COLUMN slug TO download_slug;
            RAISE NOTICE 'Renamed slug column to download_slug';
        ELSE
            -- Add new download_slug column
            ALTER TABLE file_uploads ADD COLUMN download_slug VARCHAR(50);
            -- Update existing records with a default slug based on id
            UPDATE file_uploads SET download_slug = id::text WHERE download_slug IS NULL;
            -- Make it NOT NULL and UNIQUE
            ALTER TABLE file_uploads ALTER COLUMN download_slug SET NOT NULL;
            ALTER TABLE file_uploads ADD CONSTRAINT file_uploads_download_slug_unique UNIQUE (download_slug);
            RAISE NOTICE 'Added download_slug column';
        END IF;
    END IF;

    -- Add original_name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'original_name') THEN
        -- Check if we have original_filename column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'original_filename') THEN
            ALTER TABLE file_uploads RENAME COLUMN original_filename TO original_name;
            RAISE NOTICE 'Renamed original_filename column to original_name';
        ELSE
            ALTER TABLE file_uploads ADD COLUMN original_name VARCHAR(255);
            -- Update existing records
            UPDATE file_uploads SET original_name = filename WHERE original_name IS NULL;
            ALTER TABLE file_uploads ALTER COLUMN original_name SET NOT NULL;
            RAISE NOTICE 'Added original_name column';
        END IF;
    END IF;

    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'file_size') THEN
        ALTER TABLE file_uploads ADD COLUMN file_size BIGINT DEFAULT 0;
        RAISE NOTICE 'Added file_size column';
    END IF;

    -- Add storage_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'storage_url') THEN
        -- Check if we have blob_url column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'blob_url') THEN
            ALTER TABLE file_uploads RENAME COLUMN blob_url TO storage_url;
            RAISE NOTICE 'Renamed blob_url column to storage_url';
        ELSE
            ALTER TABLE file_uploads ADD COLUMN storage_url TEXT DEFAULT '';
            ALTER TABLE file_uploads ALTER COLUMN storage_url SET NOT NULL;
            RAISE NOTICE 'Added storage_url column';
        END IF;
    END IF;

    -- Add download_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'download_count') THEN
        ALTER TABLE file_uploads ADD COLUMN download_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added download_count column';
    END IF;

    -- Add mime_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'mime_type') THEN
        ALTER TABLE file_uploads ADD COLUMN mime_type VARCHAR(100);
        RAISE NOTICE 'Added mime_type column';
    END IF;

    -- Add extension column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'extension') THEN
        ALTER TABLE file_uploads ADD COLUMN extension VARCHAR(10);
        RAISE NOTICE 'Added extension column';
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'expires_at') THEN
        ALTER TABLE file_uploads ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'updated_at') THEN
        ALTER TABLE file_uploads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END
$$;

-- Ensure proper data types
DO $$
BEGIN
    -- Fix file_size data type if needed
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'file_uploads' 
        AND column_name = 'file_size' 
        AND data_type != 'bigint'
    ) THEN
        ALTER TABLE file_uploads ALTER COLUMN file_size TYPE BIGINT USING file_size::BIGINT;
        RAISE NOTICE 'Fixed file_size data type to BIGINT';
    END IF;

    -- Fix download_count data type if needed
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'file_uploads' 
        AND column_name = 'download_count' 
        AND data_type != 'integer'
    ) THEN
        ALTER TABLE file_uploads ALTER COLUMN download_count TYPE INTEGER USING download_count::INTEGER;
        RAISE NOTICE 'Fixed download_count data type to INTEGER';
    END IF;
END
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_file_uploads_download_slug ON file_uploads(download_slug);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_download_count ON file_uploads(download_count DESC);

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;

-- Create the trigger
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update any NULL values in critical columns
UPDATE file_uploads 
SET 
    original_name = COALESCE(original_name, filename),
    file_size = COALESCE(file_size, 0),
    download_count = COALESCE(download_count, 0),
    storage_url = COALESCE(storage_url, ''),
    updated_at = COALESCE(updated_at, created_at)
WHERE 
    original_name IS NULL 
    OR file_size IS NULL 
    OR download_count IS NULL 
    OR storage_url IS NULL 
    OR updated_at IS NULL;

-- Final verification
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'file_uploads';
    
    RAISE NOTICE 'Migration completed. file_uploads table now has % columns', column_count;
    
    -- List all columns
    RAISE NOTICE 'Columns in file_uploads table:';
    FOR column_name IN 
        SELECT c.column_name 
        FROM information_schema.columns c
        WHERE c.table_name = 'file_uploads'
        ORDER BY c.ordinal_position
    LOOP
        RAISE NOTICE '  - %', column_name;
    END LOOP;
END
$$;
