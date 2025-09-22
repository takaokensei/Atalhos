import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = [
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".txt",
  ".json",
  ".js",
  ".css",
  ".html",
]

function generateSlug(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function sanitizeFilename(filename: string): string {
  // Preserve folder structure by keeping forward slashes
  // Remove dangerous characters but keep folder separators
  return filename
    .replace(/[<>:"|?*]/g, "") // Remove Windows forbidden chars
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/^\/+/, "") // Remove leading slashes
    .trim()
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, error: "Nenhum arquivo fornecido" }, { status: 400 })
    }

    console.log("File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    // Validate file extension
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { success: false, error: `Tipo de arquivo não permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      )
    }

    // Generate unique slug
    let slug = generateSlug()
    let slugExists = true
    let attempts = 0

    while (slugExists && attempts < 10) {
      try {
        const existing = await sql`
          SELECT id FROM file_uploads 
          WHERE download_slug = ${slug}
          LIMIT 1
        `

        if (existing.length === 0) {
          slugExists = false
        } else {
          slug = generateSlug()
          attempts++
        }
      } catch (dbError) {
        console.error("Database check error:", dbError)
        // If we can't check the database, proceed with the slug
        slugExists = false
      }
    }

    if (slugExists) {
      return NextResponse.json({ success: false, error: "Não foi possível gerar um slug único" }, { status: 500 })
    }

    // Preserve original filename structure (including folder paths)
    const sanitizedOriginalName = sanitizeFilename(file.name)
    const timestamp = Date.now()
    const storageFilename = `${timestamp}-${sanitizedOriginalName}`

    // Upload to Vercel Blob with preserved structure
    let blobResult
    try {
      blobResult = await put(`uploads/${storageFilename}`, file, {
        access: "public",
      })
      console.log("Blob upload successful:", blobResult.url)
    } catch (blobError) {
      console.error("Blob upload failed:", blobError)
      return NextResponse.json({ success: false, error: "Falha no upload do arquivo" }, { status: 500 })
    }

    // Save to database with preserved original name
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
          upload_date,
          download_count,
          created_at,
          updated_at
        ) VALUES (
          ${storageFilename},
          ${sanitizedOriginalName},
          ${file.size},
          ${file.type || "application/octet-stream"},
          ${extension},
          ${blobResult.url},
          ${slug},
          NOW(),
          0,
          NOW(),
          NOW()
        )
        RETURNING *
      `

      const savedFile = result[0]
      const downloadUrl = `${request.nextUrl.origin}/download/${slug}`

      console.log("Database insert successful:", savedFile.id)

      return NextResponse.json({
        success: true,
        data: {
          id: savedFile.id,
          slug: slug,
          downloadUrl: downloadUrl,
          file: {
            id: savedFile.id,
            filename: savedFile.filename,
            originalName: savedFile.original_name,
            size: savedFile.file_size,
            mimeType: savedFile.mime_type,
            extension: savedFile.file_extension,
            storageUrl: savedFile.storage_url,
            slug: savedFile.download_slug,
            uploadDate: savedFile.upload_date,
            downloadCount: savedFile.download_count,
            createdAt: savedFile.created_at,
            updatedAt: savedFile.updated_at,
          },
        },
      })
    } catch (dbError) {
      console.error("Database insert failed:", dbError)
      return NextResponse.json({ success: false, error: "Falha ao salvar informações do arquivo" }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
