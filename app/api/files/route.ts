import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT * FROM file_uploads 
      WHERE deleted_at IS NULL
    `
    const params: any[] = []

    if (search) {
      query += ` AND (original_filename ILIKE $${params.length + 1} OR slug ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const files = await sql(query, params)

    // Get stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(SUM(download_count), 0) as total_downloads
      FROM file_uploads 
      WHERE deleted_at IS NULL
    `

    return NextResponse.json({
      files: files.map((file) => ({
        ...file,
        created_at: new Date(file.created_at),
        updated_at: new Date(file.updated_at),
        expires_at: file.expires_at ? new Date(file.expires_at) : null,
      })),
      stats: stats[0],
    })
  } catch (error) {
    console.error("Files fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
