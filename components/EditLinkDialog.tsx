"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { LinkItem } from "../types"
import { Edit3, Save, X } from "lucide-react"

interface EditLinkDialogProps {
  link: LinkItem
  onSave: (updatedLink: LinkItem) => void
  existingSlugs: string[]
}

export default function EditLinkDialog({ link, onSave, existingSlugs }: EditLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(link.url)
  const [slug, setSlug] = useState(link.slug)
  const [title, setTitle] = useState(link.title || "")
  const [error, setError] = useState("")

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

  const handleSave = () => {
    setError("")

    if (!url.trim()) {
      setError("URL é obrigatória")
      return
    }

    if (!validateUrl(url)) {
      setError("URL inválida")
      return
    }

    if (!slug.trim()) {
      setError("Slug é obrigatório")
      return
    }

    if (!validateSlug(slug)) {
      setError("Slug deve conter apenas letras, números, hífens e underscores (2-50 caracteres)")
      return
    }

    // Check if slug is already used by another link
    if (slug !== link.slug && existingSlugs.includes(slug)) {
      setError("Este slug já está sendo usado")
      return
    }

    const updatedLink: LinkItem = {
      ...link,
      url: url.trim(),
      slug: slug.trim(),
      title: title.trim() || undefined,
    }

    onSave(updatedLink)
    setOpen(false)
  }

  const handleCancel = () => {
    setUrl(link.url)
    setSlug(link.slug)
    setTitle(link.title || "")
    setError("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="h-4 w-4" />
          <span className="sr-only">Editar link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-slug">Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">atalho.vercel.app/</span>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="meu-slug"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Título (opcional)</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título personalizado"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
