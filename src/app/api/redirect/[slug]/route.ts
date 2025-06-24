import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params

  // Em um cenário real, você buscaria no banco de dados
  // Por enquanto, vamos retornar uma página de erro amigável
  return NextResponse.redirect(new URL(`/?slug=${slug}&error=not-found`, request.url))
}
