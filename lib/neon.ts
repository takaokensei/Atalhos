import { neon } from "@neondatabase/serverless"

// Environment variables with validation
const databaseUrl = process.env.DATABASE_URL
const databaseUrlUnpooled = process.env.DATABASE_URL_UNPOOLED

// Validate environment variables
function validateNeonConfig(): { isValid: boolean; error?: string } {
  if (!databaseUrl) {
    return { isValid: false, error: "DATABASE_URL environment variable is missing" }
  }

  // Basic URL validation
  try {
    new URL(databaseUrl)
  } catch {
    return { isValid: false, error: "DATABASE_URL is not a valid URL" }
  }

  return { isValid: true }
}

// Create SQL client with validation
const config = validateNeonConfig()
export const sql = config.isValid ? neon(databaseUrl!) : null
export const sqlUnpooled = config.isValid && databaseUrlUnpooled ? neon(databaseUrlUnpooled) : null

// Helper function to check if Neon is available
export const isNeonAvailable = (): boolean => {
  return config.isValid && sql !== null
}

// Get configuration error message
export const getNeonError = (): string | null => {
  return config.error || null
}

// Check if required tables exist
export async function checkTablesExist(): Promise<{ success: boolean; error?: string; missingTables?: string[] }> {
  if (!isNeonAvailable()) {
    return { success: false, error: getNeonError() || "Neon not configured" }
  }

  try {
    const result = await sql!`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('shortcuts_links', 'shortcuts_collections', 'file_uploads')
    `

    const existingTables = result.map((row: any) => row.table_name)
    const requiredTables = ["shortcuts_links", "shortcuts_collections", "file_uploads"]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    if (missingTables.length > 0) {
      return {
        success: false,
        error: `Missing required tables: ${missingTables.join(", ")}`,
        missingTables,
      }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: `Failed to check tables: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

// Test connection function
export async function testNeonConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  if (!isNeonAvailable()) {
    return { success: false, error: getNeonError() || "Neon not configured" }
  }

  try {
    // Test basic connection
    const connectionTest = await sql!`SELECT 1 as test, NOW() as timestamp`

    if (!connectionTest || connectionTest.length === 0) {
      return { success: false, error: "Database connection test failed" }
    }

    // Check if tables exist
    const tablesCheck = await checkTablesExist()

    return {
      success: tablesCheck.success,
      error: tablesCheck.error,
      details: {
        connection: "OK",
        timestamp: connectionTest[0].timestamp,
        tablesExist: tablesCheck.success,
        missingTables: tablesCheck.missingTables || [],
      },
    }
  } catch (err) {
    return {
      success: false,
      error: `Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

// Auto-create tables if they don't exist
export async function ensureTablesExist(): Promise<{ success: boolean; error?: string }> {
  if (!isNeonAvailable()) {
    return { success: false, error: getNeonError() || "Neon not configured" }
  }

  try {
    const tablesCheck = await checkTablesExist()

    if (tablesCheck.success) {
      return { success: true }
    }

    console.log("Creating missing tables...")

    // Create shortcuts_collections table
    await sql!`
      CREATE TABLE IF NOT EXISTS shortcuts_collections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          access_key VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create shortcuts_links table
    await sql!`
      CREATE TABLE IF NOT EXISTS shortcuts_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          url TEXT NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          title VARCHAR(500),
          collection_id UUID REFERENCES shortcuts_collections(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create file_uploads table with proper data types
    await sql!`
      CREATE TABLE IF NOT EXISTS file_uploads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL DEFAULT 0,
          mime_type VARCHAR(100) NOT NULL,
          file_extension VARCHAR(10) NOT NULL,
          storage_url TEXT NOT NULL,
          download_slug VARCHAR(100) UNIQUE NOT NULL,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          download_count INTEGER DEFAULT 0 NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes
    await sql!`CREATE INDEX IF NOT EXISTS idx_shortcuts_links_slug ON shortcuts_links(slug)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_shortcuts_links_collection_id ON shortcuts_links(collection_id)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_shortcuts_collections_access_key ON shortcuts_collections(access_key)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_slug ON file_uploads(download_slug)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_active ON file_uploads(is_active)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_expires ON file_uploads(expires_at)`
    await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_upload_date ON file_uploads(upload_date DESC)`

    // Create trigger function
    await sql!`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Create triggers
    await sql!`
      DROP TRIGGER IF EXISTS update_shortcuts_links_updated_at ON shortcuts_links;
      CREATE TRIGGER update_shortcuts_links_updated_at
          BEFORE UPDATE ON shortcuts_links
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    await sql!`
      DROP TRIGGER IF EXISTS update_shortcuts_collections_updated_at ON shortcuts_collections;
      CREATE TRIGGER update_shortcuts_collections_updated_at
          BEFORE UPDATE ON shortcuts_collections
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    await sql!`
      DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;
      CREATE TRIGGER update_file_uploads_updated_at
          BEFORE UPDATE ON file_uploads
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    console.log("Tables created successfully")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: `Failed to create tables: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

// Database interfaces
export interface DatabaseLink {
  id: string
  url: string
  slug: string
  title?: string
  created_at: string
  updated_at: string
}

export interface ShortcutCollection {
  id: string
  name: string
  description?: string
  access_key: string
  created_at: string
  updated_at: string
}
