import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { sql, isNeonAvailable } from "@/lib/neon"

interface DownloadPageProps {
  params: { slug: string }
}

async function getFileBySlug(slug: string) {
  if (!isNeonAvailable()) {
    return null
  }

  try {
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

    const result = await sql!`
      SELECT * FROM file_uploads 
      WHERE ${sql!.unsafe(whereClause)}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    const file = result[0]

    // Check if file has expired
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return null
    }

    return file
  } catch (error) {
    console.error("Error fetching file:", error)
    return null
  }
}

export async function generateMetadata({ params }: DownloadPageProps): Promise<Metadata> {
  const file = await getFileBySlug(params.slug)

  if (!file) {
    return {
      title: "Arquivo não encontrado",
      description: "O arquivo solicitado não foi encontrado ou expirou.",
    }
  }

  return {
    title: `Download: ${file.original_name}`,
    description: `Baixar arquivo ${file.original_name} (${Math.round((file.file_size / 1024 / 1024) * 100) / 100} MB)`,
  }
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const file = await getFileBySlug(params.slug)

  if (!file) {
    notFound()
  }

  // Increment download count
  try {
    await sql!`
      UPDATE file_uploads 
      SET download_count = COALESCE(download_count, 0) + 1,
          updated_at = NOW()
      WHERE id = ${file.id}
    `
  } catch (error) {
    console.error("Error updating download count:", error)
  }

  // Redirect to the actual file
  redirect(file.storage_url)
}
