"use server"

import { supabase, isSupabaseAvailable } from "../../lib/supabase"
import type { LinkItem } from "../../types"

export interface LinkActionResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

// Save a single link to database
export async function saveLink(link: LinkItem): Promise<LinkActionResult> {
  try {
    console.log(`Saving link: ${link.slug} -> ${link.url}`)

    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    // Check if slug already exists
    const { data: existingLink, error: checkError } = await supabase!
      .from("shortcuts_links")
      .select("id, slug")
      .eq("slug", link.slug)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing slug:", checkError)
      return {
        success: false,
        error: "Failed to check existing slug",
        details: checkError.message,
      }
    }

    if (existingLink) {
      console.log(`Slug ${link.slug} already exists`)
      return {
        success: false,
        error: "Slug already exists",
        details: `The slug "${link.slug}" is already in use`,
      }
    }

    // Insert the link
    const { data, error } = await supabase!
      .from("shortcuts_links")
      .insert({
        id: link.id,
        url: link.url,
        slug: link.slug,
        title: link.title || null,
        collection_id: null, // Individual links don't belong to collections
        created_at: link.createdAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting link:", error)
      return {
        success: false,
        error: "Failed to save link",
        details: error.message,
      }
    }

    console.log(`Link saved successfully: ${link.slug}`)
    return {
      success: true,
      data,
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

    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    // Check if new slug conflicts with other links
    const { data: existingLink, error: checkError } = await supabase!
      .from("shortcuts_links")
      .select("id, slug")
      .eq("slug", link.slug)
      .neq("id", link.id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking slug conflict:", checkError)
      return {
        success: false,
        error: "Failed to check slug conflict",
        details: checkError.message,
      }
    }

    if (existingLink) {
      console.log(`Slug ${link.slug} conflicts with existing link`)
      return {
        success: false,
        error: "Slug already exists",
        details: `The slug "${link.slug}" is already in use by another link`,
      }
    }

    // Update the link
    const { data, error } = await supabase!
      .from("shortcuts_links")
      .update({
        url: link.url,
        slug: link.slug,
        title: link.title || null,
      })
      .eq("id", link.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating link:", error)
      return {
        success: false,
        error: "Failed to update link",
        details: error.message,
      }
    }

    console.log(`Link updated successfully: ${link.slug}`)
    return {
      success: true,
      data,
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

    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    const { error } = await supabase!.from("shortcuts_links").delete().eq("id", linkId)

    if (error) {
      console.error("Error deleting link:", error)
      return {
        success: false,
        error: "Failed to delete link",
        details: error.message,
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

    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    const { data, error } = await supabase!
      .from("shortcuts_links")
      .select("*")
      .is("collection_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching links:", error)
      return {
        success: false,
        error: "Failed to fetch links",
        details: error.message,
      }
    }

    const links: LinkItem[] = (data || []).map((link) => ({
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

    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    const { data, error } = await supabase!.from("shortcuts_links").select("*").eq("slug", slug).maybeSingle()

    if (error) {
      console.error("Error fetching link by slug:", error)
      return {
        success: false,
        error: "Failed to fetch link",
        details: error.message,
      }
    }

    if (!data) {
      console.log(`No link found for slug: ${slug}`)
      return {
        success: false,
        error: "Link not found",
        details: `No link found with slug "${slug}"`,
      }
    }

    const link: LinkItem = {
      id: data.id,
      url: data.url,
      slug: data.slug,
      title: data.title || undefined,
      createdAt: new Date(data.created_at),
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
    if (!isSupabaseAvailable()) {
      return {
        success: false,
        error: "Database not available",
        details: "Supabase not configured",
      }
    }

    let query = supabase!.from("shortcuts_links").select("id").eq("slug", slug)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      return {
        success: false,
        error: "Failed to check slug",
        details: error.message,
      }
    }

    return {
      success: true,
      data: { exists: !!data },
    }
  } catch (error) {
    return {
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
