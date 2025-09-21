import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query
    let countQuery

    if (search) {
      query = sql`
        SELECT * FROM file_uploads 
        WHERE is_active = true 
          AND (original_name ILIKE ${`%${search}%`} OR filename ILIKE ${`%${search}%`})
        ORDER BY upload_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM file_uploads 
        WHERE is_active = true 
          AND (original_name ILIKE ${`%${search}%`} OR filename ILIKE ${`%${search}%`})
      `
    } else {
      query = sql`
        SELECT * FROM file_uploads 
        WHERE is_active = true 
        ORDER BY upload_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM file_uploads 
        WHERE is_active = true
      `
    }

    const [files, countResult] = await Promise.all([query, countQuery])
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      files,
      total: Number.parseInt(total),
    })
  } catch (error) {
    console.error("Files fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch files",
      },
      { status: 500 },
    )
  }
}
