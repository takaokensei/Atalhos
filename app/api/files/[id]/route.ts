import { type NextRequest, NextResponse } from "next/server"
import { sql, isNeonAvailable, getNeonError } from "@/lib/neon"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "ID do arquivo não fornecido" }, { status: 400 })
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

    // Soft delete if deleted_at column exists, otherwise hard delete
    if (hasDeletedAt) {
      await sql!`
        UPDATE file_uploads 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `
    } else if (hasIsActive) {
      await sql!`
        UPDATE file_uploads 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      // Hard delete as fallback
      await sql!`
        DELETE FROM file_uploads 
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "ID do arquivo não fornecido" }, { status: 400 })
    }

    // Get file info
    const result = await sql!`
      SELECT * FROM file_uploads 
      WHERE id = ${id}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    const file = result[0]

    // Format file for frontend
    const formattedFile = {
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
    }

    return NextResponse.json({
      success: true,
      file: formattedFile,
    })
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get file: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
