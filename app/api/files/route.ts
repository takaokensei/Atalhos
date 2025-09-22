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

    // First, check if the table exists and what columns it has
    const tableExists = await sql!`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'file_uploads'
      )
    `

    if (!tableExists[0]?.exists) {
      // Create the table with the correct schema
      await sql!`
        CREATE TABLE file_uploads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL DEFAULT 0,
          mime_type VARCHAR(100),
          file_extension VARCHAR(10),
          storage_url TEXT NOT NULL,
          download_slug VARCHAR(100) UNIQUE NOT NULL,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          download_count INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create indexes
      await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_download_slug ON file_uploads(download_slug)`
      await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC)`
      await sql!`CREATE INDEX IF NOT EXISTS idx_file_uploads_is_active ON file_uploads(is_active)`

      // Return empty data for new table
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

    // Check what columns exist in the table
    const columns = await sql!`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'file_uploads' 
      AND table_schema = 'public'
    `

    const columnNames = columns.map((col: any) => col.column_name)

    // Get files with proper column handling
    let files = []

    if (columnNames.includes("download_slug")) {
      // New schema with download_slug
      files = await sql!`
        SELECT 
          id,
          filename,
          original_name,
          COALESCE(file_size::bigint, 0) as file_size,
          COALESCE(mime_type, 'application/octet-stream') as mime_type,
          COALESCE(file_extension, '.zip') as file_extension,
          storage_url,
          download_slug,
          COALESCE(upload_date, created_at) as upload_date,
          COALESCE(download_count::integer, 0) as download_count,
          expires_at,
          created_at,
          COALESCE(updated_at, created_at) as updated_at
        FROM file_uploads 
        WHERE COALESCE(is_active, true) = true
        ORDER BY created_at DESC
      `
    } else if (columnNames.includes("slug")) {
      // Old schema with slug
      files = await sql!`
        SELECT 
          id,
          filename,
          COALESCE(original_name, filename) as original_name,
          COALESCE(file_size::bigint, 0) as file_size,
          COALESCE(mime_type, 'application/octet-stream') as mime_type,
          COALESCE(file_extension, '.zip') as file_extension,
          COALESCE(storage_url, blob_url) as storage_url,
          slug as download_slug,
          COALESCE(upload_date, created_at) as upload_date,
          COALESCE(download_count::integer, 0) as download_count,
          expires_at,
          created_at,
          COALESCE(updated_at, created_at) as updated_at
        FROM file_uploads 
        ORDER BY created_at DESC
      `
    } else {
      // Minimal schema - create basic structure
      files = await sql!`
        SELECT 
          id,
          filename,
          filename as original_name,
          0 as file_size,
          'application/octet-stream' as mime_type,
          '.zip' as file_extension,
          '' as storage_url,
          id::text as download_slug,
          created_at as upload_date,
          0 as download_count,
          NULL as expires_at,
          created_at,
          created_at as updated_at
        FROM file_uploads 
        ORDER BY created_at DESC
      `
    }

    // Calculate statistics safely
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let totalSize = 0
    let totalDownloads = 0
    let recentUploads = 0

    files.forEach((file: any) => {
      const fileSize = Number(file.file_size) || 0
      totalSize += fileSize

      const downloadCount = Number(file.download_count) || 0
      totalDownloads += downloadCount

      const uploadDate = new Date(file.created_at || file.upload_date)
      if (uploadDate >= sevenDaysAgo) {
        recentUploads++
      }
    })

    // Format files for frontend
    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name || file.filename,
      size: Number(file.file_size) || 0,
      mimeType: file.mime_type || "application/octet-stream",
      extension: file.file_extension || ".zip",
      storageUrl: file.storage_url || "",
      slug: file.download_slug || file.id,
      uploadDate: file.upload_date || file.created_at,
      downloadCount: Number(file.download_count) || 0,
      expiresAt: file.expires_at,
      createdAt: file.created_at,
      updatedAt: file.updated_at || file.created_at,
    }))

    const stats = {
      totalFiles: files.length,
      totalSize: totalSize,
      totalDownloads: totalDownloads,
      recentUploads: recentUploads,
    }

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      stats,
    })
  } catch (error) {
    console.error("Files API error:", error)

    // Return safe fallback
    return NextResponse.json({
      success: true,
      files: [],
      stats: {
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        recentUploads: 0,
      },
      error: `Database error: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    if (!isNeonAvailable()) {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 })
    }

    // Delete the file using tagged template
    const result = await sql!`
      DELETE FROM file_uploads 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Arquivo deletado com sucesso",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
