import { createClient } from "@supabase/supabase-js"

// Environment variables with validation
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
function validateSupabaseConfig(): { isValid: boolean; error?: string } {
  if (!supabaseUrl) {
    return { isValid: false, error: "SUPABASE_URL environment variable is missing" }
  }

  if (!supabaseServiceKey) {
    return { isValid: false, error: "SUPABASE_SERVICE_ROLE_KEY environment variable is missing" }
  }

  // Basic URL validation
  try {
    new URL(supabaseUrl)
  } catch {
    return { isValid: false, error: "SUPABASE_URL is not a valid URL" }
  }

  return { isValid: true }
}

// Create client with validation
const config = validateSupabaseConfig()
export const supabase = config.isValid ? createClient(supabaseUrl!, supabaseServiceKey!) : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return config.isValid && supabase !== null
}

// Get configuration error message
export const getSupabaseError = (): string | null => {
  return config.error || null
}

// Test connection function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: getSupabaseError() || "Supabase not configured" }
  }

  try {
    const { data, error } = await supabase!.from("shortcuts_collections").select("count").limit(1)

    if (error) {
      return { success: false, error: `Database connection failed: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: `Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

export interface DatabaseLink {
  id: string
  url: string
  slug: string
  title?: string
  created_at: string
}

export interface ShortcutCollection {
  id: string
  name: string
  description?: string
  access_key: string
  created_at: string
  updated_at: string
}
