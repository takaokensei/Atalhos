"use server"

import { supabase, isSupabaseAvailable, getSupabaseError, testSupabaseConnection } from "../../lib/supabase"
import type { LinkItem } from "../../types"

export interface ImportResult {
  success: boolean
  links?: LinkItem[]
  collectionName?: string
  error?: string
  details?: string
}

function validateAccessKey(accessKey: string): { isValid: boolean; error?: string } {
  if (!accessKey || typeof accessKey !== "string") {
    return { isValid: false, error: "Access key is required" }
  }

  const trimmed = accessKey.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Access key cannot be empty" }
  }

  if (trimmed.length < 8) {
    return { isValid: false, error: "Access key is too short" }
  }

  // Basic format validation (alphanumeric only)
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { isValid: false, error: "Access key contains invalid characters" }
  }

  return { isValid: true }
}

export async function importShortcuts(accessKey: string): Promise<ImportResult> {
  console.log("Starting import process...")
  console.log("Access key provided:", accessKey ? "Yes" : "No")

  try {
    // Validate access key
    const validation = validateAccessKey(accessKey)
    if (!validation.isValid) {
      console.error("Access key validation failed:", validation.error)
      return {
        success: false,
        error: validation.error,
        details: "Access key validation failed",
      }
    }

    const cleanAccessKey = accessKey.trim()

    // Check Supabase availability
    if (!isSupabaseAvailable()) {
      const error = getSupabaseError() || "Supabase not configured"
      console.error("Supabase not available:", error)
      return {
        success: false,
        error: "Database not available",
        details: error,
      }
    }

    // Test connection
    console.log("Testing database connection...")
    const connectionTest = await testSupabaseConnection()
    if (!connectionTest.success) {
      console.error("Connection test failed:", connectionTest.error)
      return {
        success: false,
        error: "Database connection failed",
        details: connectionTest.error,
      }
    }

    console.log("Database connection successful")

    // Get collection
    console.log("Searching for collection with access key...")
    const { data: collection, error: collectionError } = await supabase!
      .from("shortcuts_collections")
      .select("*")
      .eq("access_key", cleanAccessKey)
      .single()

    if (collectionError) {
      console.error("Collection query error:", collectionError)

      if (collectionError.code === "PGRST116") {
        return {
          success: false,
          error: "Collection not found",
          details: "No collection found with this access key",
        }
      }

      return {
        success: false,
        error: "Failed to find collection",
        details: collectionError.message,
      }
    }

    if (!collection) {
      console.error("No collection found")
      return {
        success: false,
        error: "Collection not found",
        details: "No collection found with this access key",
      }
    }

    console.log("Collection found:", collection.id, collection.name)

    // Get links
    console.log("Fetching links for collection...")
    const { data: links, error: linksError } = await supabase!
      .from("shortcuts_links")
      .select("*")
      .eq("collection_id", collection.id)
      .order("created_at", { ascending: true })

    if (linksError) {
      console.error("Links query error:", linksError)
      return {
        success: false,
        error: "Failed to load links",
        details: linksError.message,
      }
    }

    console.log("Links found:", links?.length || 0)

    // Convert to LinkItem format
    const convertedLinks: LinkItem[] = (links || []).map((link) => ({
      id: link.id,
      url: link.url,
      slug: link.slug,
      title: link.title || undefined,
      createdAt: new Date(link.created_at),
    }))

    console.log("Import completed successfully")

    return {
      success: true,
      links: convertedLinks,
      collectionName: collection.name,
    }
  } catch (error) {
    console.error("Unexpected import error:", error)
    return {
      success: false,
      error: "Unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
