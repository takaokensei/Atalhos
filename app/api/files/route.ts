import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get files with search filter
    let filesQuery = `
      SELECT 
        id, 
        filename, 
        original_filename, 
        file_size::bigint as file_size, 
        mime_type, 
        download_count::integer as download_count, 
        created_at, 
        expires_at,
        slug
      FROM file_uploads 
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      filesQuery += ` AND (original_filename ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    filesQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    const files = await sql(filesQuery, queryParams)

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM file_uploads WHERE 1=1`
    const countParams: any[] = []

    if (search) {
      countQuery += ` AND (original_filename ILIKE $1 OR slug ILIKE $1)`
      countParams.push(`%${search}%`)
    }

    const [{ total }] = await sql(countQuery, countParams)

    // Get statistics with proper type casting
    const statsQuery = `
      SELECT 
        COUNT(*)::integer as total_files,
        COALESCE(SUM(CAST(file_size AS BIGINT)), 0) as total_size,
        COALESCE(SUM(CAST(download_count AS INTEGER)), 0) as total_downloads,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::integer as recent_files
      FROM file_uploads
      WHERE expires_at IS NULL OR expires_at > NOW()
    `

    const [stats] = await sql(statsQuery)

    // Format the response
    const formattedFiles = files.map((file: any) => ({
      ...file,
      file_size: Number.parseInt(file.file_size) || 0,
      download_count: Number.parseInt(file.download_count) || 0,
      formatted_size: formatFileSize(Number.parseInt(file.file_size) || 0),
      created_at: new Date(file.created_at).toISOString(),
      expires_at: file.expires_at ? new Date(file.expires_at).toISOString() : null,
    }))

    const formattedStats = {
      total_files: Number.parseInt(stats.total_files) || 0,
      total_size: Number.parseInt(stats.total_size) || 0,
      formatted_total_size: formatFileSize(Number.parseInt(stats.total_size) || 0),
      total_downloads: Number.parseInt(stats.total_downloads) || 0,
      recent_files: Number.parseInt(stats.recent_files) || 0,
    }

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      pagination: {
        page,
        limit,
        total: Number.parseInt(total),
        pages: Math.ceil(Number.parseInt(total) / limit),
      },
      stats: formattedStats,
    })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
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
      return NextResponse.json({ success: false, error: "ID do arquivo é obrigatório" }, { status: 400 })
    }

    // Get file info before deletion
    const [file] = await sql("SELECT filename FROM file_uploads WHERE id = $1", [id])

    if (!file) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    // Delete from database
    await sql("DELETE FROM file_uploads WHERE id = $1", [id])

    // Note: In a production environment, you would also delete the file from Vercel Blob here
    // await del(file.filename)

    return NextResponse.json({
      success: true,
      message: "Arquivo deletado com sucesso",
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao deletar arquivo",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
