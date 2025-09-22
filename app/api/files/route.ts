import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    // Check if Neon is available
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database não configurado" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    // First, check if the table exists and has the required columns
    const tableCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'file_uploads' 
      AND table_schema = 'public'
    `

    if (tableCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Tabela file_uploads não encontrada" }, { status: 500 })
    }

    const columns = tableCheck.map((row) => row.column_name)
    const hasDeletedAt = columns.includes("deleted_at")

    // Build the base query based on available columns
    const baseWhere = hasDeletedAt ? "WHERE (deleted_at IS NULL OR deleted_at > NOW())" : "WHERE is_active = true"

    // Get files with pagination
    let filesQuery
    let countQuery

    if (search) {
      const searchPattern = `%${search}%`

      filesQuery = await sql`
        SELECT 
          id,
          filename,
          original_name,
          file_size,
          mime_type,
          file_extension,
          download_slug,
          download_count,
          upload_date,
          created_at,
          updated_at,
          expires_at
        FROM file_uploads 
        WHERE ${hasDeletedAt ? sql`(deleted_at IS NULL OR deleted_at > NOW())` : sql`is_active = true`}
        AND (original_name ILIKE ${searchPattern} OR filename ILIKE ${searchPattern})
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `

      countQuery = await sql`
        SELECT COUNT(*) as total 
        FROM file_uploads 
        WHERE ${hasDeletedAt ? sql`(deleted_at IS NULL OR deleted_at > NOW())` : sql`is_active = true`}
        AND (original_name ILIKE ${searchPattern} OR filename ILIKE ${searchPattern})
      `
    } else {
      filesQuery = await sql`
        SELECT 
          id,
          filename,
          original_name,
          file_size,
          mime_type,
          file_extension,
          download_slug,
          download_count,
          upload_date,
          created_at,
          updated_at,
          expires_at
        FROM file_uploads 
        WHERE ${hasDeletedAt ? sql`(deleted_at IS NULL OR deleted_at > NOW())` : sql`is_active = true`}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `

      countQuery = await sql`
        SELECT COUNT(*) as total 
        FROM file_uploads 
        WHERE ${hasDeletedAt ? sql`(deleted_at IS NULL OR deleted_at > NOW())` : sql`is_active = true`}
      `
    }

    const total = Number.parseInt(countQuery[0].total)
    const totalPages = Math.ceil(total / limit)

    // Calculate stats
    const statsQuery = await sql`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(SUM(download_count), 0) as total_downloads,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_uploads
      FROM file_uploads 
      WHERE ${hasDeletedAt ? sql`(deleted_at IS NULL OR deleted_at > NOW())` : sql`is_active = true`}
    `

    const stats = statsQuery[0] || {
      total_files: 0,
      total_size: 0,
      total_downloads: 0,
      recent_uploads: 0,
    }

    return NextResponse.json({
      success: true,
      files: filesQuery.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        size: Number(file.file_size),
        fileExtension: file.file_extension,
        slug: file.download_slug,
        downloadCount: Number(file.download_count || 0),
        uploadDate: file.upload_date,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        expiresAt: file.expires_at,
      })),
      stats: {
        totalFiles: Number(stats.total_files),
        totalSize: Number(stats.total_size),
        totalDownloads: Number(stats.total_downloads),
        recentUploads: Number(stats.recent_uploads),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Files API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno do servidor: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
