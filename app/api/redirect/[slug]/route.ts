import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params

  // Since we're using localStorage (client-side), we can't access the links server-side
  // We'll redirect to a special page that handles the slug lookup client-side
  const baseUrl = request.nextUrl.origin

  // Redirect to a slug handler page that will check localStorage and redirect accordingly
  return NextResponse.redirect(`${baseUrl}/slug/${slug}`)
}
