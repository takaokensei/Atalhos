import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    // Soft delete - mark as inactive
    const result = await sql`
      UPDATE file_uploads 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "File not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete file",
      },
      { status: 500 },
    )
  }
}
