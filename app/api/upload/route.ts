import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql } from "@/lib/neon"
import { nanoid } from "nanoid"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 100MB limit",
        },
        { status: 400 },
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only .zip and .rar files are allowed",
        },
        { status: 400 },
      )
    }

    // Generate unique filename and slug
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
    const uniqueFilename = `${nanoid()}.${fileExtension}`
    const downloadSlug = nanoid(10)

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
    })

    // Save to database
    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      )
    }

    const result = await sql`
      INSERT INTO file_uploads (
        filename, 
        original_name, 
        file_size, 
        mime_type, 
        file_extension, 
        storage_url, 
        download_slug,
        metadata
      ) VALUES (
        ${uniqueFilename},
        ${file.name},
        ${file.size},
        ${file.type},
        ${fileExtension},
        ${blob.url},
        ${downloadSlug},
        ${JSON.stringify({ uploadedAt: new Date().toISOString() })}
      )
      RETURNING *
    `

    const uploadedFile = result[0]
    const downloadUrl = `${request.nextUrl.origin}/download/${downloadSlug}`

    return NextResponse.json({
      success: true,
      file: uploadedFile,
      downloadUrl,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
      },
      { status: 500 },
    )
  }
}
