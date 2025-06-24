import { type NextRequest, NextResponse } from "next/server"
import { getLinkBySlug } from "../../../actions/link-actions"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.redirect(new URL("/?error=missing-slug", request.url))
    }

    console.log(`Redirecting slug: ${slug}`)

    const result = await getLinkBySlug(slug)

    if (!result.success || !result.data) {
      console.log(`Slug not found: ${slug}`)
      return NextResponse.redirect(new URL(`/?slug=${encodeURIComponent(slug)}&error=not-found`, request.url))
    }

    const link = result.data
    console.log(`Redirecting ${slug} to ${link.url}`)

    return NextResponse.redirect(link.url, { status: 302 })
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.redirect(new URL("/?error=server-error", request.url))
  }
}
