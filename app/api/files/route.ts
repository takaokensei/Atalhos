import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Check if the table exists and what columns it has
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'file_uploads' 
      AND table_schema = 'public'
    `

    if (tableInfo.length === 0) {
      // Table doesn't exist, create it
      await sql`
        CREATE TABLE IF NOT EXISTS file_uploads (
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
        )
      `

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_file_uploads_slug ON file_uploads(download_slug)`
      await sql`CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at)`

      return NextResponse.json({
        success: true,
        files: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          totalDownloads: 0,
          recentUploads: 0,
        },
      })
    }

    // Check which columns exist
    const columns = tableInfo.map((col: any) => col.column_name)
    const hasDownloadSlug = columns.includes("download_slug")
    const hasSlug = columns.includes("slug")
    const hasStorageUrl = columns.includes("storage_url")
    const hasBlobUrl = columns.includes("blob_url")
    const hasOriginalName = columns.includes("original_name")
    const hasFileSize = columns.includes("file_size")
    const hasDownloadCount = columns.includes("download_count")

    // Get files with proper error handling
    let files = []
    let stats = { total_files: 0, total_size: 0, total_downloads: 0, recent_uploads: 0 }

    try {
      // Build the query based on available columns
      if (search) {
        if (hasDownloadSlug) {
          files = await sql`
            SELECT 
              id,
              filename,
              COALESCE(original_name, filename) as original_name,
              COALESCE(file_size, 0)::bigint as file_size,
              COALESCE(mime_type, 'application/octet-stream') as mime_type,
              COALESCE(extension, '.zip') as extension,
              COALESCE(storage_url, '') as storage_url,
              download_slug,
              COALESCE(download_count, 0) as download_count,
              expires_at,
              created_at,
              COALESCE(updated_at, created_at) as updated_at
            FROM file_uploads 
            WHERE (original_name ILIKE ${"%" + search + "%"} OR filename ILIKE ${"%" + search + "%"})
            ORDER BY created_at DESC
            LIMIT 100
          `
        } else if (hasSlug) {
          files = await sql`
            SELECT 
              id,
              filename,
              COALESCE(original_name, filename) as original_name,
              COALESCE(file_size, 0)::bigint as file_size,
              COALESCE(mime_type, 'application/octet-stream') as mime_type,
              COALESCE(extension, '.zip') as extension,
              COALESCE(${hasStorageUrl ? "storage_url" : hasBlobUrl ? "blob_url" : "''"}, '') as storage_url,
              slug as download_slug,
              COALESCE(download_count, 0) as download_count,
              expires_at,
              created_at,
              COALESCE(updated_at, created_at) as updated_at
            FROM file_uploads 
            WHERE (${hasOriginalName ? "original_name" : "filename"} ILIKE ${"%" + search + "%"} OR filename ILIKE ${"%" + search + "%"})
            ORDER BY created_at DESC
            LIMIT 100
          `
        } else {
          files = await sql`
            SELECT 
              id,
              filename,
              filename as original_name,
              0::bigint as file_size,
              'application/octet-stream' as mime_type,
              '.zip' as extension,
              '' as storage_url,
              id::text as download_slug,
              0 as download_count,
              NULL as expires_at,
              created_at,
              created_at as updated_at
            FROM file_uploads 
            WHERE filename ILIKE ${"%" + search + "%"}
            ORDER BY created_at DESC
            LIMIT 100
          `
        }
      } else {
        if (hasDownloadSlug) {
          files = await sql`
            SELECT 
              id,
              filename,
              COALESCE(original_name, filename) as original_name,
              COALESCE(file_size, 0)::bigint as file_size,
              COALESCE(mime_type, 'application/octet-stream') as mime_type,
              COALESCE(extension, '.zip') as extension,
              COALESCE(storage_url, '') as storage_url,
              download_slug,
              COALESCE(download_count, 0) as download_count,
              expires_at,
              created_at,
              COALESCE(updated_at, created_at) as updated_at
            FROM file_uploads 
            ORDER BY created_at DESC
            LIMIT 100
          `
        } else if (hasSlug) {
          files = await sql`
            SELECT 
              id,
              filename,
              COALESCE(original_name, filename) as original_name,
              COALESCE(file_size, 0)::bigint as file_size,
              COALESCE(mime_type, 'application/octet-stream') as mime_type,
              COALESCE(extension, '.zip') as extension,
              COALESCE(${hasStorageUrl ? "storage_url" : hasBlobUrl ? "blob_url" : "''"}, '') as storage_url,
              slug as download_slug,
              COALESCE(download_count, 0) as download_count,
              expires_at,
              created_at,
              COALESCE(updated_at, created_at) as updated_at
            FROM file_uploads 
            ORDER BY created_at DESC
            LIMIT 100
          `
        } else {
          files = await sql`
            SELECT 
              id,
              filename,
              filename as original_name,
              0::bigint as file_size,
              'application/octet-stream' as mime_type,
              '.zip' as extension,
              '' as storage_url,
              id::text as download_slug,
              0 as download_count,
              NULL as expires_at,
              created_at,
              created_at as updated_at
            FROM file_uploads 
            ORDER BY created_at DESC
            LIMIT 100
          `
        }
      }

      // Get statistics with proper column handling
      if (hasFileSize && hasDownloadCount) {
        const statsResult = await sql`
          SELECT 
            COUNT(*)::integer as total_files,
            COALESCE(SUM(file_size), 0)::bigint as total_size,
            COALESCE(SUM(download_count), 0)::integer as total_downloads,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::integer as recent_uploads
          FROM file_uploads
        `
        stats = statsResult[0] || stats
      } else {
        const statsResult = await sql`
          SELECT 
            COUNT(*)::integer as total_files,
            0::bigint as total_size,
            0::integer as total_downloads,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::integer as recent_uploads
          FROM file_uploads
        `
        stats = statsResult[0] || stats
      }
    } catch (queryError) {
      console.error("Query error:", queryError)
      // Return empty results on query error but don't fail the entire request
      files = []
      stats = { total_files: 0, total_size: 0, total_downloads: 0, recent_uploads: 0 }
    }

    // Format files data safely
    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      filename: file.filename || "unknown",
      originalName: file.original_name || file.filename || "unknown",
      size: Number.parseInt(file.file_size?.toString() || "0") || 0,
      mimeType: file.mime_type || "application/octet-stream",
      extension: file.extension || ".zip",
      storageUrl: file.storage_url || "",
      slug: file.download_slug || file.id,
      downloadCount: Number.parseInt(file.download_count?.toString() || "0") || 0,
      expiresAt: file.expires_at,
      createdAt: file.created_at,
      updatedAt: file.updated_at || file.created_at,
    }))

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      stats: {
        totalFiles: Number.parseInt(stats.total_files?.toString() || "0") || 0,
        totalSize: Number.parseInt(stats.total_size?.toString() || "0") || 0,
        totalDownloads: Number.parseInt(stats.total_downloads?.toString() || "0") || 0,
        recentUploads: Number.parseInt(stats.recent_uploads?.toString() || "0") || 0,
      },
    })
  } catch (error) {
    console.error("Files API error:", error)

    // Return a safe fallback response
    return NextResponse.json(
      {
        success: false,
        error: `Database error: ${error instanceof Error ? error.message : "Unknown error"}`,
        files: [],
        stats: {
          totalFiles: 0,
          totalSize: 0,
          totalDownloads: 0,
          recentUploads: 0,
        },
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 })
    }

    const result = await sql`DELETE FROM file_uploads WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
