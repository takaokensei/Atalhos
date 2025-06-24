"use server"

import { sql, isNeonAvailable, ensureTablesExist } from "../../lib/neon"
import type { LinkItem } from "../../types"

export interface LinkActionResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

// Ensure tables exist before any operation
async function ensureDatabase(): Promise<{ success: boolean; error?: string }> {
  if (!isNeonAvailable()) {
    return {
      success: false,
      error: "Database not available - Neon database not configured",
    }
  }

  const tablesResult = await ensureTablesExist()
  if (!tablesResult.success) {
    return {
      success: false,
      error: `Database setup failed: ${tablesResult.error}`,
    }
  }

  return { success: true }
}

// Save a single link to database
export async function saveLink(link: LinkItem): Promise<LinkActionResult> {
  try {
    console.log(`Saving link: ${link.slug} -> ${link.url}`)

    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    // Check if slug already exists
    const existingLinks = await sql!`
      SELECT id, slug FROM shortcuts_links 
      WHERE slug = ${link.slug}
      LIMIT 1
    `

    if (existingLinks.length > 0) {
      console.log(`Slug ${link.slug} already exists`)
      return {
        success: false,
        error: "Slug already exists",
        details: `The slug "${link.slug}" is already in use`,
      }
    }

    // Insert the link
    const result = await sql!`
      INSERT INTO shortcuts_links (id, url, slug, title, collection_id, created_at, updated_at)
      VALUES (
        ${link.id},
        ${link.url},
        ${link.slug},
        ${link.title || null},
        null,
        ${link.createdAt.toISOString()},
        ${link.createdAt.toISOString()}
      )
      RETURNING *
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "Failed to save link",
        details: "No rows returned from insert",
      }
    }

    console.log(`Link saved successfully: ${link.slug}`)
    return {
      success: true,
      data: result[0],
    }
  } catch (error) {
    console.error("Unexpected error saving link:", error)
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Update an existing link
export async function updateLink(link: LinkItem): Promise<LinkActionResult> {
  try {
    console.log(`Updating link: ${link.id} -> ${link.slug}`)

    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    // Check if new slug conflicts with other links
    const conflictingLinks = await sql!`
      SELECT id, slug FROM shortcuts_links 
      WHERE slug = ${link.slug} AND id != ${link.id}
      LIMIT 1
    `

    if (conflictingLinks.length > 0) {
      console.log(`Slug ${link.slug} conflicts with existing link`)
      return {
        success: false,
        error: "Slug already exists",
        details: `The slug "${link.slug}" is already in use by another link`,
      }
    }

    // Update the link
    const result = await sql!`
      UPDATE shortcuts_links 
      SET 
        url = ${link.url},
        slug = ${link.slug},
        title = ${link.title || null},
        updated_at = NOW()
      WHERE id = ${link.id}
      RETURNING *
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "Link not found",
        details: "No link found with the specified ID",
      }
    }

    console.log(`Link updated successfully: ${link.slug}`)
    return {
      success: true,
      data: result[0],
    }
  } catch (error) {
    console.error("Unexpected error updating link:", error)
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Delete a link
export async function deleteLink(linkId: string): Promise<LinkActionResult> {
  try {
    console.log(`Deleting link: ${linkId}`)

    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    const result = await sql!`
      DELETE FROM shortcuts_links 
      WHERE id = ${linkId}
      RETURNING id
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "Link not found",
        details: "No link found with the specified ID",
      }
    }

    console.log(`Link deleted successfully: ${linkId}`)
    return {
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error deleting link:", error)
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Get all individual links (not part of collections)
export async function getAllLinks(): Promise<LinkActionResult> {
  try {
    console.log("Fetching all individual links")

    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    const result = await sql!`
      SELECT * FROM shortcuts_links 
      WHERE collection_id IS NULL 
      ORDER BY created_at DESC
    `

    const links: LinkItem[] = result.map((link: any) => ({
      id: link.id,
      url: link.url,
      slug: link.slug,
      title: link.title || undefined,
      createdAt: new Date(link.created_at),
    }))

    console.log(`Fetched ${links.length} individual links`)
    return {
      success: true,
      data: links,
    }
  } catch (error) {
    console.error("Unexpected error fetching links:", error)
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Get a link by slug
export async function getLinkBySlug(slug: string): Promise<LinkActionResult> {
  try {
    console.log(`Looking up slug: ${slug}`)

    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    const result = await sql!`
      SELECT * FROM shortcuts_links 
      WHERE slug = ${slug}
      LIMIT 1
    `

    if (result.length === 0) {
      console.log(`No link found for slug: ${slug}`)
      return {
        success: false,
        error: "Link not found",
        details: `No link found with slug "${slug}"`,
      }
    }

    const linkData = result[0]
    const link: LinkItem = {
      id: linkData.id,
      url: linkData.url,
      slug: linkData.slug,
      title: linkData.title || undefined,
      createdAt: new Date(linkData.created_at),
    }

    console.log(`Found link for slug ${slug}: ${link.url}`)
    return {
      success: true,
      data: link,
    }
  } catch (error) {
    console.error("Unexpected error fetching link by slug:", error)
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Check if a slug exists
export async function checkSlugExists(slug: string, excludeId?: string): Promise<LinkActionResult> {
  try {
    // Ensure database and tables exist
    const dbCheck = await ensureDatabase()
    if (!dbCheck.success) {
      return {
        success: false,
        error: "Database setup failed",
        details: dbCheck.error,
      }
    }

    let result
    if (excludeId) {
      result = await sql!`
        SELECT id FROM shortcuts_links 
        WHERE slug = ${slug} AND id != ${excludeId}
        LIMIT 1
      `
    } else {
      result = await sql!`
        SELECT id FROM shortcuts_links 
        WHERE slug = ${slug}
        LIMIT 1
      `
    }

    return {
      success: true,
      data: { exists: result.length > 0 },
    }
  } catch (error) {
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
