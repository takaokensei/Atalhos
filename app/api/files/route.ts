import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // First, ensure the table exists
    await sql`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        mime_type VARCHAR(100),
        slug VARCHAR(100) UNIQUE NOT NULL,
        blob_url TEXT NOT NULL,
        download_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get files with search filter
    const files = await sql`
      SELECT 
        id,
        filename,
        original_name,
        CAST(file_size AS BIGINT) as file_size,
        mime_type,
        slug,
        blob_url,
        CAST(download_count AS INTEGER) as download_count,
        expires_at,
        created_at,
        updated_at
      FROM file_uploads 
      WHERE (${search} = '' OR original_name ILIKE ${"%" + search + "%"})
      ORDER BY created_at DESC
    `

    // Get statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(CAST(file_size AS BIGINT)), 0) as total_size,
        COALESCE(SUM(CAST(download_count AS INTEGER)), 0) as total_downloads,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_files
      FROM file_uploads
    `

    const statistics = stats[0] || {
      total_files: 0,
      total_size: 0,
      total_downloads: 0,
      recent_files: 0,
    }

    return NextResponse.json({
      files: files || [],
      statistics: {
        totalFiles: Number(statistics.total_files) || 0,
        totalSize: Number(statistics.total_size) || 0,
        totalDownloads: Number(statistics.total_downloads) || 0,
        recentFiles: Number(statistics.recent_files) || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching files:", error)

    // Return empty data instead of error to prevent UI crashes
    return NextResponse.json({
      files: [],
      statistics: {
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        recentFiles: 0,
      },
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    // Delete the file record
    const result = await sql`
      DELETE FROM file_uploads 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Arquivo excluído com sucesso",
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
