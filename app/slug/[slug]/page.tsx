"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkIcon, ExternalLink, Home, Clock } from "lucide-react"
import type { LinkItem } from "../../../types"

export default function SlugPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [link, setLink] = useState<LinkItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLinks = localStorage.getItem("atalho-links")
      if (savedLinks) {
        try {
          const links: LinkItem[] = JSON.parse(savedLinks)
          const foundLink = links.find((l) => l.slug === slug)
          setLink(foundLink || null)
        } catch (err) {
          console.error("Erro ao carregar links:", err)
        }
      }
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (link && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (link && countdown === 0) {
      window.location.href = link.url
    }
  }, [link, countdown])

  const redirectNow = () => {
    if (link) {
      window.location.href = link.url
    }
  }

  const goHome = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Procurando link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl">Link não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-600">
                O slug <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{slug}</code> não foi
                encontrado.
              </p>
              <p className="text-sm text-gray-500">
                Isso pode acontecer se o link foi removido ou se você está acessando de um dispositivo diferente.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={goHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Ir para página inicial
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = `https://atalho.vercel.app/?search=${slug}`)}
                className="w-full"
              >
                Criar novo link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <LinkIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Redirecionando...</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">Você será redirecionado para:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm truncate">{link.url}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Redirecionando em {countdown} segundos</span>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={redirectNow} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir agora
            </Button>
            <Button variant="outline" onClick={goHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>Slug: {link.slug}</p>
            <p>Criado em: {new Date(link.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
