import { type NextRequest, NextResponse } from "next/server"

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

interface SlugSuggestion {
  slug: string
  description?: string
}

// Inline slugify function to avoid import issues
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim()
    .substring(0, 50) // Limita o tamanho
}

function parseGeminiResponse(data: GeminiResponse): string[] {
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    console.log("Raw Gemini response:", text)

    const lines = text.split("\n").filter((line) => line.trim())
    const slugs = lines
      .map((line) => {
        const cleaned = line.replace(/^\d+[.)\-\s]*/, "").trim()
        return slugify(cleaned)
      })
      .filter((slug) => slug.length > 0)
      .slice(0, 5)

    console.log("Parsed slugs:", slugs)
    return slugs.length > 0 ? slugs : []
  } catch (error) {
    console.error("Error parsing Gemini response:", error)
    return []
  }
}

function generateFallbackSuggestions(link: string): SlugSuggestion[] {
  try {
    const url = new URL(link)
    const domain = url.hostname.replace("www.", "")
    const path = url.pathname.split("/").filter(Boolean)
    const timestamp = Date.now().toString().slice(-6)

    const suggestions: SlugSuggestion[] = [
      { slug: `${slugify(domain)}-${timestamp}`, description: "Baseado no domínio" },
      { slug: `link-${timestamp}`, description: "Slug genérico" },
    ]

    // Add path-based suggestions if available
    if (path.length > 0) {
      suggestions.unshift({
        slug: `${slugify(domain)}-${slugify(path[0])}`,
        description: "Baseado no domínio e caminho",
      })
    }

    // Add date-based suggestion
    const date = new Date()
    const dateSlug = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`
    suggestions.push({
      slug: `${slugify(domain)}-${dateSlug}`,
      description: "Baseado no domínio e data",
    })

    return suggestions.slice(0, 5)
  } catch {
    const timestamp = Date.now().toString().slice(-6)
    return [
      { slug: `link-${timestamp}`, description: "Slug automático" },
      { slug: `atalho-${timestamp}`, description: "Slug alternativo" },
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { link } = await request.json()
    console.log("Processing suggestions request for:", link)

    if (!link) {
      return NextResponse.json({ error: "Link é obrigatório" }, { status: 400 })
    }

    // Use consistent environment variable name
    const apiKey = process.env.GEMINI_API_KEY
    console.log("Gemini API key available:", !!apiKey)

    if (!apiKey) {
      console.log("No Gemini API key, returning fallback suggestions")
      const fallbackSuggestions = generateFallbackSuggestions(link)
      return NextResponse.json({
        success: false,
        suggestions: fallbackSuggestions,
        error: "API Gemini não configurada - usando sugestões básicas",
      })
    }

    const prompt = `Analise este link e sugira 5 slugs curtos, descritivos e amigáveis (máximo 30 caracteres cada):
      
Link: ${link}

Retorne apenas os slugs, um por linha, sem numeração ou explicações adicionais.
Exemplo de formato desejado:
react-tutorial
javascript-guide
web-development
frontend-tips
coding-basics`

    console.log("Making request to Gemini API...")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        }),
      },
    )

    console.log("Gemini API response status:", response.status)

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText)
      throw new Error(`Erro na API Gemini: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()
    console.log("Gemini API response received")

    const slugs = parseGeminiResponse(data)

    if (slugs.length === 0) {
      console.log("No valid slugs from Gemini, using fallback")
      const fallbackSuggestions = generateFallbackSuggestions(link)
      return NextResponse.json({
        success: false,
        suggestions: fallbackSuggestions,
        error: "Não foi possível gerar sugestões - usando sugestões básicas",
      })
    }

    const suggestions: SlugSuggestion[] = slugs.map((slug) => ({
      slug,
      description: `Sugestão baseada no conteúdo do link`,
    }))

    console.log("Returning suggestions:", suggestions)

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
    console.error("API error:", errorMessage)

    // Always return fallback suggestions on error
    try {
      const { link } = await request.json().catch(() => ({ link: "" }))
      const fallbackSuggestions = generateFallbackSuggestions(link)

      return NextResponse.json({
        success: false,
        suggestions: fallbackSuggestions,
        error: "Erro na API - usando sugestões básicas",
      })
    } catch {
      // If we can't even generate fallbacks, return minimal suggestions
      const timestamp = Date.now().toString().slice(-6)
      return NextResponse.json({
        success: false,
        suggestions: [{ slug: `link-${timestamp}`, description: "Slug automático" }],
        error: errorMessage,
      })
    }
  }
}
