import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/vnd.rar",
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(zip|rar)$/i)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only .zip and .rar files are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${formatFileSize(maxSize)}.`,
        },
        { status: 400 },
      )
    }

    // Generate unique slug
    let slug = generateSlug()
    let attempts = 0
    while (attempts < 10) {
      const existing = await sql`SELECT id FROM file_uploads WHERE slug = ${slug} AND deleted_at IS NULL`
      if (existing.length === 0) break
      slug = generateSlug()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate unique slug. Please try again.",
        },
        { status: 500 },
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`uploads/${slug}-${file.name}`, file, {
      access: "public",
    })

    // Save to database
    const result = await sql`
      INSERT INTO file_uploads (
        filename, original_filename, file_size, mime_type, slug, blob_url
      ) VALUES (
        ${`${slug}-${file.name}`}, ${file.name}, ${file.size}, ${file.type}, ${slug}, ${blob.url}
      ) RETURNING *
    `

    const fileUpload = result[0]

    return NextResponse.json({
      success: true,
      file: {
        ...fileUpload,
        created_at: new Date(fileUpload.created_at),
        updated_at: new Date(fileUpload.updated_at),
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
