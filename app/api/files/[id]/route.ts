import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "ID não fornecido" }, { status: 400 })
    }

    // Soft delete the file
    const result = await sql`
      UPDATE file_uploads 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
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
    console.error("Delete file error:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "ID não fornecido" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM file_uploads 
      WHERE id = ${id} AND deleted_at IS NULL
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    const file = result[0]

    return NextResponse.json({
      success: true,
      file: {
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
        storageUrl: file.storage_url,
      },
    })
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
