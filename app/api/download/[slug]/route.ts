import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Get file from database
    const result = await sql`
      SELECT * FROM file_uploads 
      WHERE slug = ${slug} AND deleted_at IS NULL
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = result[0]

    // Update download count
    await sql`
      UPDATE file_uploads 
      SET download_count = download_count + 1 
      WHERE id = ${file.id}
    `

    // Redirect to blob URL for download
    return NextResponse.redirect(file.blob_url)
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
