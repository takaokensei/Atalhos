"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { LinkItem, SlugSuggestion } from "../types"
import { useGeminiSuggestions } from "../hooks/useGeminiSuggestions"
import { useLinkSync } from "../../hooks/useLinkSync"
import LinkInput from "../components/LinkInput"
import Suggestions from "../components/Suggestions"
import LinkCard from "../components/LinkCard"
import { ThemeToggle } from "../../components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LinkIcon, Sparkles, Download, Upload, AlertCircle, Info, Search, RefreshCw, Wifi, WifiOff } from "lucide-react"

export default function Home() {
  const searchParams = useSearchParams()
  const searchSlug = searchParams.get("slug")
  const errorType = searchParams.get("error")
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSuggestions, setCurrentSuggestions] = useState<SlugSuggestion[]>([])
  const [pendingUrl, setPendingUrl] = useState<string>("")

  // Use the new sync system
  const { links, syncStatus, addLink, editLink, removeLink, checkSlugExists, manualSync } = useLinkSync()
  const { getSuggestions, loading, error } = useGeminiSuggestions()

  // Filter links based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(links)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = links.filter(
        (link) =>
          link.slug.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.title && link.title.toLowerCase().includes(query)),
      )
      setFilteredLinks(filtered)
    }
  }, [links, searchQuery])

  const handleAddLink = async (url: string) => {
    setPendingUrl(url)
    setCurrentSuggestions([])

    try {
      console.log("Getting suggestions for:", url)
      const suggestions = await getSuggestions(url)
      console.log("Received suggestions:", suggestions)
      setCurrentSuggestions(suggestions)
    } catch (err) {
      console.error("Erro ao obter sugestões:", err)
    }
  }

  const handleAddCustomLink = async (url: string, customSlug: string) => {
    if (checkSlugExists(customSlug)) {
      alert("Este slug já está sendo usado. Escolha outro.")
      return
    }

    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url,
      slug: customSlug,
      createdAt: new Date(),
    }

    const result = await addLink(newLink)
    if (!result.success) {
      alert(`Erro ao salvar link: ${result.error}`)
    }
  }

  const handleSelectSlug = async (slug: string) => {
    if (!pendingUrl) return

    if (checkSlugExists(slug)) {
      alert("Este slug já está sendo usado. Escolha outro.")
      return
    }

    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url: pendingUrl,
      slug,
      createdAt: new Date(),
    }

    const result = await addLink(newLink)
    if (result.success) {
      setPendingUrl("")
      setCurrentSuggestions([])
    } else {
      alert(`Erro ao salvar link: ${result.error}`)
    }
  }

  const handleEditLink = async (updatedLink: LinkItem) => {
    const result = await editLink(updatedLink)
    if (!result.success) {
      alert(`Erro ao atualizar link: ${result.error}`)
    }
  }

  const handleDeleteLink = async (id: string) => {
    const result = await removeLink(id)
    if (!result.success) {
      alert(`Erro ao deletar link: ${result.error}`)
    }
  }

  const exportLinks = () => {
    const dataStr = JSON.stringify(links, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "atalho-links.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importLinks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        const validLinks = imported.filter((link: any) => link.id && link.url && link.slug)

        for (const linkData of validLinks) {
          const link: LinkItem = {
            ...linkData,
            createdAt: new Date(linkData.createdAt || Date.now()),
          }
          await addLink(link)
        }

        alert(`${validLinks.length} links importados com sucesso!`)
      } catch (err) {
        alert("Erro ao importar arquivo. Verifique o formato.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const existingSlugs = links.map((link) => link.slug)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <LinkIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Atalho</h1>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Organize seus links com slugs inteligentes gerados por IA. Crie atalhos curtos e descritivos para seus links
            favoritos.
          </p>

          {/* Sync Status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {syncStatus.syncing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sincronizando...
              </div>
            ) : syncStatus.error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <WifiOff className="h-4 w-4" />
                Modo offline
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Wifi className="h-4 w-4" />
                Sincronizado
                {syncStatus.lastSync && (
                  <span className="text-muted-foreground">• {syncStatus.lastSync.toLocaleTimeString()}</span>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={manualSync} disabled={syncStatus.syncing}>
              <RefreshCw className={`h-4 w-4 ${syncStatus.syncing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Error/Not Found Message */}
        {searchSlug && (
          <div className="mb-6 max-w-2xl mx-auto">
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900 dark:text-orange-100">Slug não encontrado</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                      O slug <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">{searchSlug}</code> não
                      existe. Crie um novo link abaixo!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Link Input */}
        <div className="mb-8">
          <LinkInput onAddLink={handleAddLink} onAddCustomLink={handleAddCustomLink} loading={loading} />
          {error && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm max-w-2xl mx-auto">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <strong>Aviso:</strong> {error}
                  <p className="text-xs mt-1">Sugestões básicas foram geradas automaticamente.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {(currentSuggestions.length > 0 || loading) && (
          <div className="mb-8">
            <Suggestions suggestions={currentSuggestions} onSelectSlug={handleSelectSlug} loading={loading} />
          </div>
        )}

        {/* Links Section */}
        <div className="max-w-6xl mx-auto">
          {/* Header with controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Meus Links ({filteredLinks.length})</h2>

            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-48"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={exportLinks}>
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Baixar</span>
                  </Button>

                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Arquivo</span>
                      </span>
                    </Button>
                    <input type="file" accept=".json" onChange={importLinks} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Links Grid */}
          {filteredLinks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "Nenhum link encontrado" : "Nenhum link ainda"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Tente buscar por outro termo ou limpe o filtro."
                    : "Adicione seu primeiro link acima para começar a criar atalhos inteligentes!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onDelete={handleDeleteLink}
                  onEdit={handleEditLink}
                  existingSlugs={existingSlugs.filter((slug) => slug !== link.slug)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Como funciona?</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Cole um link no campo acima</p>
                <p>2. Escolha entre sugestões da IA ou crie um slug personalizado</p>
                <p>3. Acesse seu link através de atalho.vercel.app/seu-slug</p>
                <p>4. Links são sincronizados automaticamente entre dispositivos</p>
                <p>5. Edite links existentes clicando no ícone de edição</p>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Links são salvos no servidor e sincronizados automaticamente. Funciona offline com sincronização
                  automática quando conectado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
