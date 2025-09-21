import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const { slug } = params

    // Get file info and increment download count
    const result = await sql`
      UPDATE file_uploads 
      SET download_count = download_count + 1,
          updated_at = NOW()
      WHERE download_slug = ${slug} 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    const file = result[0]

    // Redirect to the actual file URL
    return NextResponse.redirect(file.storage_url)
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
