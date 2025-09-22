import { type NextRequest, NextResponse } from "next/server"
import { sql, isNeonAvailable, getNeonError } from "@/lib/neon"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
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

    const { slug } = params

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug não fornecido" }, { status: 400 })
    }

    console.log("Looking for file with slug:", slug)

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
    let whereClause = `download_slug = '${slug}'`
    if (hasDeletedAt) {
      whereClause += " AND deleted_at IS NULL"
    }
    if (hasIsActive) {
      whereClause += " AND is_active = true"
    }

    // Find file by slug
    const result = await sql!`
      SELECT * FROM file_uploads 
      WHERE ${sql!.unsafe(whereClause)}
      LIMIT 1
    `

    console.log("Database query result:", result)

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    const file = result[0]

    // Check if file has expired
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Arquivo expirado" }, { status: 410 })
    }

    // Increment download count
    await sql!`
      UPDATE file_uploads 
      SET download_count = COALESCE(download_count, 0) + 1,
          updated_at = NOW()
      WHERE id = ${file.id}
    `

    console.log("Redirecting to storage URL:", file.storage_url)

    // Redirect to the actual file URL
    return NextResponse.redirect(file.storage_url, 302)
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno do servidor: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
