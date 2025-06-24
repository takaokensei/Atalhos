"use server"

import { supabase, isSupabaseAvailable, getSupabaseError, testSupabaseConnection } from "../../lib/supabase"
import type { LinkItem } from "../../types"

export interface ExportResult {
  success: boolean
  url?: string
  accessKey?: string
  error?: string
  details?: string
}

function generateAccessKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function validateLinks(links: LinkItem[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(links)) {
    return { isValid: false, error: "Links must be an array" }
  }

  if (links.length === 0) {
    return { isValid: false, error: "No links to export" }
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i]

    if (!link.id || typeof link.id !== "string") {
      return { isValid: false, error: `Link ${i + 1}: Invalid or missing ID` }
    }

    if (!link.url || typeof link.url !== "string") {
      return { isValid: false, error: `Link ${i + 1}: Invalid or missing URL` }
    }

    if (!link.slug || typeof link.slug !== "string") {
      return { isValid: false, error: `Link ${i + 1}: Invalid or missing slug` }
    }

    // Validate URL format
    try {
      new URL(link.url)
    } catch {
      return { isValid: false, error: `Link ${i + 1}: Invalid URL format` }
    }

    // Validate slug format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(link.slug)) {
      return { isValid: false, error: `Link ${i + 1}: Invalid slug format` }
    }
  }

  return { isValid: true }
}

export async function exportShortcuts(links: LinkItem[], collectionName = "Meus Atalhos"): Promise<ExportResult> {
  console.log("Starting export process...")
  console.log("Links to export:", links?.length || 0)
  console.log("Collection name:", collectionName)

  try {
    // Validate input
    const validation = validateLinks(links)
    if (!validation.isValid) {
      console.error("Validation failed:", validation.error)
      return {
        success: false,
        error: validation.error,
        details: "Input validation failed",
      }
    }

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

    // Generate unique access key
    const accessKey = generateAccessKey()
    console.log("Generated access key:", accessKey)

    // Validate collection name
    if (!collectionName || typeof collectionName !== "string" || collectionName.trim().length === 0) {
      collectionName = "Meus Atalhos"
    }

    // Insert collection
    console.log("Creating collection...")
    const { data: collection, error: collectionError } = await supabase!
      .from("shortcuts_collections")
      .insert({
        name: collectionName.trim(),
        description: `Coleção com ${links.length} links`,
        access_key: accessKey,
      })
      .select()
      .single()

    if (collectionError) {
      console.error("Collection creation error:", collectionError)
      return {
        success: false,
        error: "Failed to create collection",
        details: collectionError.message,
      }
    }

    if (!collection) {
      console.error("Collection created but no data returned")
      return {
        success: false,
        error: "Collection creation failed",
        details: "No collection data returned from database",
      }
    }

    console.log("Collection created successfully:", collection.id)

    // Prepare links for insertion
    const linksToInsert = links.map((link) => ({
      collection_id: collection.id,
      url: link.url.trim(),
      slug: link.slug.trim(),
      title: link.title?.trim() || null,
    }))

    console.log("Inserting links:", linksToInsert.length)

    // Insert links
    const { data: insertedLinks, error: linksError } = await supabase!
      .from("shortcuts_links")
      .insert(linksToInsert)
      .select()

    if (linksError) {
      console.error("Links insertion error:", linksError)

      // Clean up collection if links failed
      console.log("Cleaning up collection due to links error...")
      await supabase!.from("shortcuts_collections").delete().eq("id", collection.id)

      return {
        success: false,
        error: "Failed to save links",
        details: linksError.message,
      }
    }

    console.log("Links inserted successfully:", insertedLinks?.length || 0)

    // Generate shareable URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://atalho.vercel.app"

    const shareableUrl = `${baseUrl}/collection/${accessKey}`

    console.log("Export completed successfully")
    console.log("Shareable URL:", shareableUrl)

    return {
      success: true,
      url: shareableUrl,
      accessKey,
    }
  } catch (error) {
    console.error("Unexpected export error:", error)
    return {
      success: false,
      error: "Unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
