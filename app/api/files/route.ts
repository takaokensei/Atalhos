import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    let whereClause = "WHERE deleted_at IS NULL"
    let searchValue = ""

    if (search) {
      whereClause += " AND (original_name ILIKE $1 OR filename ILIKE $1)"
      searchValue = `%${search}%`
    }

    // Get files with pagination
    const filesQuery = searchValue
      ? sql`
          SELECT * FROM file_uploads 
          WHERE deleted_at IS NULL 
          AND (original_name ILIKE ${searchValue} OR filename ILIKE ${searchValue})
          ORDER BY created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT * FROM file_uploads 
          WHERE deleted_at IS NULL 
          ORDER BY created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `

    // Get total count
    const countQuery = searchValue
      ? sql`
          SELECT COUNT(*) as total FROM file_uploads 
          WHERE deleted_at IS NULL 
          AND (original_name ILIKE ${searchValue} OR filename ILIKE ${searchValue})
        `
      : sql`
          SELECT COUNT(*) as total FROM file_uploads 
          WHERE deleted_at IS NULL
        `

    const [files, countResult] = await Promise.all([filesQuery, countQuery])

    const total = Number.parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        fileSize: file.file_size,
        fileExtension: file.file_extension,
        downloadSlug: file.download_slug,
        downloadCount: file.download_count || 0,
        uploadDate: file.upload_date,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        expiresAt: file.expires_at,
      })),
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
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
