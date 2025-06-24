import { type NextRequest, NextResponse } from "next/server"
import { getLinkBySlug } from "../../../actions/link-actions"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    console.log(`Resolving slug: ${slug}`)

    const result = await getLinkBySlug(slug)

    if (!result.success || !result.data) {
      console.log(`Slug not found: ${slug}`)
      return NextResponse.json({ error: "Slug not found", slug }, { status: 404 })
    }

    const link = result.data
    console.log(`Resolved ${slug} to ${link.url}`)

    return NextResponse.json({
      slug: link.slug,
      url: link.url,
      title: link.title,
      createdAt: link.createdAt,
    })
  } catch (error) {
    console.error("Resolve error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
