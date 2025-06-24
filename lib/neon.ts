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

// Test connection function
export async function testNeonConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isNeonAvailable()) {
    return { success: false, error: getNeonError() || "Neon not configured" }
  }

  try {
    const result = await sql!`SELECT 1 as test`

    if (result && result.length > 0) {
      return { success: true }
    }

    return { success: false, error: "Database connection test failed" }
  } catch (err) {
    return {
      success: false,
      error: `Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`,
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
