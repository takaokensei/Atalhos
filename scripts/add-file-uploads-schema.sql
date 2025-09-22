-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    storage_url TEXT NOT NULL,
    download_slug VARCHAR(50) UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_download_slug ON file_uploads(download_slug);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_deleted_at ON file_uploads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO file_uploads (filename, original_name, file_size, mime_type, file_extension, storage_url, download_slug)
-- VALUES 
--     ('test1.zip', 'example.zip', 1024000, 'application/zip', 'zip', 'https://example.com/test1.zip', 'abc123def4'),
--     ('test2.rar', 'archive.rar', 2048000, 'application/vnd.rar', 'rar', 'https://example.com/test2.rar', 'xyz789ghi0');
