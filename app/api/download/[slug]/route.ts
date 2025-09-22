import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug não fornecido" }, { status: 400 })
    }

    // Find file by slug
    const result = await sql`
      SELECT * FROM file_uploads 
      WHERE download_slug = ${slug} 
      AND deleted_at IS NULL
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 })
    }

    const file = result[0]

    // Check if file has expired
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Arquivo expirado" }, { status: 410 })
    }

    // Increment download count
    await sql`
      UPDATE file_uploads 
      SET download_count = download_count + 1,
          updated_at = NOW()
      WHERE id = ${file.id}
    `

    // Redirect to the actual file URL
    return NextResponse.redirect(file.storage_url)
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
