"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, LinkIcon, Edit3, Sparkles } from "lucide-react"

interface LinkInputProps {
  onAddLink: (url: string) => void
  onAddCustomLink: (url: string, customSlug: string) => void
  loading?: boolean
}

export default function LinkInput({ onAddLink, onAddCustomLink, loading = false }: LinkInputProps) {
  const [url, setUrl] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"ai" | "custom">("ai")

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateSlug = (slug: string): boolean => {
    return /^[a-zA-Z0-9_-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Por favor, insira uma URL")
      return
    }

    const fullUrl = url.startsWith("http") ? url : `https://${url}`

    if (!validateUrl(fullUrl)) {
      setError("Por favor, insira uma URL válida")
      return
    }

    if (mode === "custom") {
      if (!customSlug.trim()) {
        setError("Por favor, insira um slug personalizado")
        return
      }

      if (!validateSlug(customSlug.trim())) {
        setError("Slug deve conter apenas letras, números, hífens e underscores (2-50 caracteres)")
        return
      }

      onAddCustomLink(fullUrl, customSlug.trim())
      setUrl("")
      setCustomSlug("")
    } else {
      onAddLink(fullUrl)
      setUrl("")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Adicionar novo link</CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant={mode === "ai" ? "default" : "outline"} size="sm" onClick={() => setMode("ai")}>
            <Sparkles className="h-4 w-4 mr-2" />
            IA Sugestões
          </Button>
          <Button
            type="button"
            variant={mode === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("custom")}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Slug Personalizado
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              URL do Link
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="url"
                type="text"
                placeholder="https://exemplo.com ou exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {mode === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                Slug Personalizado
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">atalho.vercel.app/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="meu-link-personalizado"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                  disabled={loading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Use apenas letras, números, hífens (-) e underscores (_)</p>
            </div>
          )}

          <Button type="submit" disabled={loading || !url.trim()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Processando..." : mode === "ai" ? "Gerar Sugestões" : "Criar Link"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
