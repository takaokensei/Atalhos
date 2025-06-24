import { type NextRequest, NextResponse } from "next/server"
import { getLinkBySlug } from "../../../actions/link-actions"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params

  try {
    console.log(`Resolving slug: ${slug}`)

    // Get link from database
    const result = await getLinkBySlug(slug)

    if (result.success && result.data) {
      console.log(`Found link for slug ${slug}: ${result.data.url}`)
      return NextResponse.redirect(result.data.url, { status: 302 })
    }

    console.log(`Link not found for slug: ${slug}`)

    // If not found, redirect to main page with slug info
    const baseUrl = request.nextUrl.origin
    return NextResponse.redirect(`${baseUrl}/?slug=${slug}&error=not-found`, { status: 302 })
  } catch (error) {
    console.error("Error resolving slug:", error)
    const baseUrl = request.nextUrl.origin
    return NextResponse.redirect(`${baseUrl}/?slug=${slug}&error=server-error`, { status: 302 })
  }
}
