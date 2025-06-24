"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SlugSuggestion } from "../types"
import { Sparkles, Check, AlertCircle } from "lucide-react"

interface SuggestionsProps {
  suggestions: SlugSuggestion[]
  onSelectSlug: (slug: string) => void
  loading?: boolean
}

export default function Suggestions({ suggestions, onSelectSlug, loading }: SuggestionsProps) {
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Gerando sugestões...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Sugestões de Slugs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted text-foreground px-2 py-1 rounded border">
                    {suggestion.slug}
                  </code>
                </div>
                {suggestion.description && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {suggestion.description.includes("básicas") || suggestion.description.includes("API") ? (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    ) : null}
                    {suggestion.description}
                  </p>
                )}
              </div>
              <Button size="sm" onClick={() => onSelectSlug(suggestion.slug)} className="ml-3 flex-shrink-0">
                <Check className="h-4 w-4 mr-1" />
                Usar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
