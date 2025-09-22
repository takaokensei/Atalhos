import { redirect } from "next/navigation"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface PageProps {
  params: {
    slug: string
  }
}

export default async function DownloadPage({ params }: PageProps) {
  try {
    // Find the file in database
    const result = await sql`
      SELECT * FROM file_uploads 
      WHERE download_slug = ${params.slug}
      LIMIT 1
    `

    if (result.length === 0) {
      redirect("/not-found")
    }

    const file = result[0]

    // Increment download count
    await sql`
      UPDATE file_uploads 
      SET download_count = download_count + 1,
          updated_at = NOW()
      WHERE id = ${file.id}
    `

    // Redirect to success page with file info
    const successUrl = `/download/${params.slug}/success?filename=${encodeURIComponent(file.original_name)}&size=${file.file_size}&type=${encodeURIComponent(file.mime_type)}`

    // Redirect to the actual file for download
    redirect(file.storage_url)
  } catch (error) {
    console.error("Download error:", error)
    redirect("/not-found")
  }
}
