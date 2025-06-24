"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { importShortcuts } from "../../actions/import-shortcuts"
import type { LinkItem } from "../../../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LinkIcon, ExternalLink, Copy, Check, Download, Home, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function CollectionPage() {
  const params = useParams()
  const accessKey = params.accessKey as string
  const [links, setLinks] = useState<LinkItem[]>([])
  const [collectionName, setCollectionName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadCollection()
  }, [accessKey])

  const loadCollection = async () => {
    try {
      const result = await importShortcuts(accessKey)

      if (result.success && result.links) {
        setLinks(result.links)
        setCollectionName(result.collectionName || "Coleção de Atalhos")
      } else {
        setError(result.error || "Erro ao carregar coleção")
      }
    } catch (err) {
      setError("Erro ao carregar coleção")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [linkId]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [linkId]: false }))
      }, 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const downloadAsJson = () => {
    const dataStr = JSON.stringify(links, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${collectionName.toLowerCase().replace(/\s+/g, "-")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando coleção...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <CardTitle className="text-xl text-orange-600">Funcionalidade não disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-left">
              <p className="text-sm text-orange-800 mb-2">{error}</p>
              <p className="text-xs text-orange-600">
                Para usar coleções compartilhadas, configure as variáveis de ambiente do Supabase no projeto.
              </p>
            </div>
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-xl">
              <LinkIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{collectionName}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">Coleção compartilhada com {links.length} atalhos</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={downloadAsJson}>
              <Download className="h-4 w-4 mr-2" />
              Baixar JSON
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Criar meus atalhos
              </Link>
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => {
              const shortUrl = `https://atalho.vercel.app/${link.slug}`
              const isCopied = copiedStates[link.id]

              return (
                <Card key={link.id} className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{link.title || new URL(link.url).hostname}</h3>
                        <p className="text-xs text-gray-500 truncate mt-1">{link.url}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-blue-600 truncate flex-1">{shortUrl}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(shortUrl, link.id)}
                            className="ml-2 flex-shrink-0"
                          >
                            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {link.slug}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, "_blank")}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
