"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { LinkItem } from "../types"
import { ExternalLink, Copy, Trash2, Check, Globe } from "lucide-react"
import EditLinkDialog from "../../components/EditLinkDialog"

interface LinkCardProps {
  link: LinkItem
  onDelete: (id: string) => void
  onEdit: (updatedLink: LinkItem) => void
  existingSlugs: string[]
  baseUrl?: string
}

export default function LinkCard({
  link,
  onDelete,
  onEdit,
  existingSlugs,
  baseUrl = "atalho.vercel.app",
}: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const shortUrl = `https://${baseUrl}/${link.slug}`

  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return ""
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || "Link compartilhado",
          url: shortUrl,
        })
      } catch (err) {
        console.error("Erro ao compartilhar:", err)
      }
    } else {
      copyToClipboard()
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getDomainName = (url: string): string => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return "Link"
    }
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {!faviconError ? (
              <img
                src={getFaviconUrl(link.url) || "/placeholder.svg"}
                alt=""
                className="w-6 h-6 rounded-sm"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{link.title || getDomainName(link.url)}</h3>
            <p className="text-xs text-muted-foreground truncate mt-1">{link.url}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            <EditLinkDialog link={link} onSave={onEdit} existingSlugs={existingSlugs} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(link.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Deletar link</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Short URL */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-primary truncate flex-1 min-w-0">{shortUrl}</code>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="flex-shrink-0 h-8 w-8 p-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copiar link</span>
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {link.slug}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">{formatDate(link.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={shareLink} className="flex-1 text-xs">
            Compartilhar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(link.url, "_blank")}
            className="flex-1 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
