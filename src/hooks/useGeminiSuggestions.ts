"use client"

import { useState } from "react"
import type { SlugSuggestion } from "../types"

export const useGeminiSuggestions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSuggestions = async (link: string): Promise<SlugSuggestion[]> => {
    setLoading(true)
    setError(null)

    try {
      console.log("Requesting suggestions for:", link)

      // Call our server API instead of Gemini directly
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link }),
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      console.log("API response data:", result)

      // Handle both success and fallback cases
      if (!result.success && result.error) {
        setError(result.error)
      }

      return result.suggestions || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      console.error("Suggestions error:", errorMessage)
      setError(errorMessage)

      // Return empty array on error - the API should handle fallbacks
      return []
    } finally {
      setLoading(false)
    }
  }

  return { getSuggestions, loading, error }
}
