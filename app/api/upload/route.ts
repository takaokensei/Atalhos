import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
import { nanoid } from "nanoid"

const sql = neon(process.env.DATABASE_URL!)

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_EXTENSIONS = [".zip", ".rar"]
const ALLOWED_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
]

function getFileExtension(filename: string): string {
  return "." + filename.split(".").pop()?.toLowerCase() || ""
}

function isValidFileType(file: File): boolean {
  const extension = getFileExtension(file.name)
  const mimeTypeValid = ALLOWED_MIME_TYPES.includes(file.type)
  const extensionValid = ALLOWED_EXTENSIONS.includes(extension)

  return mimeTypeValid || extensionValid
}

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called")

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not configured")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not configured")
      return NextResponse.json({ success: false, error: "File storage not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        },
        { status: 400 },
      )
    }

    // Validate file type
    if (!isValidFileType(file)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only .zip and .rar files are allowed",
        },
        { status: 400 },
      )
    }

    // Generate unique identifiers
    const fileId = nanoid()
    const downloadSlug = nanoid(10)
    const fileExtension = getFileExtension(file.name).substring(1) // Remove the dot
    const uniqueFilename = `${fileId}.${fileExtension}`

    console.log("Generated identifiers:", {
      fileId,
      downloadSlug,
      uniqueFilename,
    })

    // Upload to Vercel Blob
    let blobResult
    try {
      blobResult = await put(`uploads/${uniqueFilename}`, file, {
        access: "public",
      })
      console.log("Blob upload successful:", blobResult.url)
    } catch (blobError) {
      console.error("Blob upload failed:", blobError)
      return NextResponse.json({ success: false, error: "Failed to upload file to storage" }, { status: 500 })
    }

    // Save to database
    try {
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
          ${file.type || "application/octet-stream"},
          ${fileExtension},
          ${blobResult.url},
          ${downloadSlug},
          ${JSON.stringify({
            uploadedAt: new Date().toISOString(),
            originalSize: file.size,
            userAgent: request.headers.get("user-agent") || "unknown",
          })}
        )
        RETURNING *
      `

      const uploadedFile = result[0]
      console.log("Database insert successful:", uploadedFile.id)

      const downloadUrl = `${request.nextUrl.origin}/download/${downloadSlug}`

      return NextResponse.json({
        success: true,
        file: {
          id: uploadedFile.id,
          filename: uploadedFile.filename,
          originalName: uploadedFile.original_name,
          fileSize: uploadedFile.file_size,
          fileExtension: uploadedFile.file_extension,
          downloadSlug: uploadedFile.download_slug,
          storageUrl: uploadedFile.storage_url,
          uploadDate: uploadedFile.upload_date,
          downloadCount: uploadedFile.download_count || 0,
          createdAt: uploadedFile.created_at,
          updatedAt: uploadedFile.updated_at,
        },
        downloadUrl,
      })
    } catch (dbError) {
      console.error("Database insert failed:", dbError)

      // Try to clean up the uploaded blob
      try {
        // Note: Vercel Blob doesn't have a delete API in the free tier
        // The file will remain in storage but won't be referenced
      } catch (cleanupError) {
        console.error("Failed to cleanup blob after database error:", cleanupError)
      }

      return NextResponse.json({ success: false, error: "Failed to save file information" }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
