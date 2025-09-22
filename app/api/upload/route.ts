import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sql, isNeonAvailable, getNeonError } from "@/lib/neon"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_EXTENSIONS = [".zip", ".rar", ".7z", ".tar", ".gz"]

function generateSlug(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    if (!isNeonAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: getNeonError() || "Database not available",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo fornecido" }, { status: 400 })
    }

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
      const existing = await sql!`
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
    }

    if (slugExists) {
      return NextResponse.json({ success: false, error: "Não foi possível gerar um slug único" }, { status: 500 })
    }

    // Upload to Vercel Blob
    const filename = `${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    // Save to database
    const result = await sql!`
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
        ${filename},
        ${file.name},
        ${file.size},
        ${file.type || "application/octet-stream"},
        ${extension},
        ${blob.url},
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
