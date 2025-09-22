import { NextResponse } from "next/server"
import { sql, isNeonAvailable, getNeonError } from "@/lib/neon"

export async function GET() {
  try {
    if (!isNeonAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: getNeonError() || "Database not available",
        },
        { status: 500 },
      )
    }

    // Check if deleted_at column exists
    const columnCheck = await sql!`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'file_uploads' 
      AND column_name IN ('deleted_at', 'is_active')
    `

    const hasDeletedAt = columnCheck.some((col: any) => col.column_name === "deleted_at")
    const hasIsActive = columnCheck.some((col: any) => col.column_name === "is_active")

    // Build query based on available columns
    let whereClause = "1=1"
    if (hasDeletedAt) {
      whereClause += " AND deleted_at IS NULL"
    }
    if (hasIsActive) {
      whereClause += " AND is_active = true"
    }

    // Get files with dynamic where clause
    const files = await sql!`
      SELECT 
        id,
        filename,
        original_name,
        file_size,
        mime_type,
        file_extension,
        storage_url,
        download_slug,
        upload_date,
        download_count,
        expires_at,
        created_at,
        updated_at
      FROM file_uploads 
      WHERE ${sql!.unsafe(whereClause)}
      ORDER BY created_at DESC
    `

    // Calculate stats
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum: number, file: any) => sum + (file.file_size || 0), 0),
      totalDownloads: files.reduce((sum: number, file: any) => sum + (file.download_count || 0), 0),
      recentUploads: files.filter((file: any) => {
        const uploadDate = new Date(file.created_at || file.upload_date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return uploadDate > weekAgo
      }).length,
    }

    // Format files for frontend
    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      size: file.file_size,
      mimeType: file.mime_type,
      extension: file.file_extension,
      storageUrl: file.storage_url,
      slug: file.download_slug,
      uploadDate: file.upload_date,
      downloadCount: file.download_count || 0,
      expiresAt: file.expires_at,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    }))

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      stats,
    })
  } catch (error) {
    console.error("Files API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch files: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
