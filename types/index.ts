export interface LinkItem {
  id: string
  url: string
  slug: string
  title?: string
  createdAt: Date
}

export interface SlugSuggestion {
  slug: string
  description?: string
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}
