"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, LinkIcon, Edit3, Sparkles, Zap, Globe, ArrowRight } from "lucide-react"

interface ModernLinkInputProps {
  onAddLink: (url: string) => void
  onAddCustomLink: (url: string, customSlug: string) => void
  loading?: boolean
}

const modeVariants = {
  ai: {
    background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(213 93% 68%) 100%)",
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  custom: {
    background: "linear-gradient(135deg, hsl(270 95% 75%) 0%, hsl(270 95% 85%) 100%)",
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  inactive: {
    background: "rgba(255, 255, 255, 0.1)",
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
}

export default function ModernLinkInput({ onAddLink, onAddCustomLink, loading = false }: ModernLinkInputProps) {
  const [url, setUrl] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"ai" | "custom">("ai")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

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
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(217 91% 60%) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(270 95% 75%) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, hsl(217 91% 60%) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gradient mb-2">Criar Novo Atalho</h3>
            <p className="text-muted-foreground">Transforme qualquer link em um atalho inteligente e memorável</p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            className="flex gap-3 mb-8 p-1 bg-muted/50 rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              type="button"
              onClick={() => setMode("ai")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all relative overflow-hidden"
              variants={modeVariants}
              animate={mode === "ai" ? "ai" : "inactive"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="h-4 w-4" />
              <span className={mode === "ai" ? "text-white" : "text-foreground"}>IA Sugestões</span>
              {mode === "ai" && (
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setMode("custom")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all relative overflow-hidden"
              variants={modeVariants}
              animate={mode === "custom" ? "custom" : "inactive"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit3 className="h-4 w-4" />
              <span className={mode === "custom" ? "text-white" : "text-foreground"}>Slug Personalizado</span>
              {mode === "custom" && (
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="url" className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                URL do Link
              </Label>
              <div className="relative group">
                <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
                <Input
                  ref={inputRef}
                  id="url"
                  type="text"
                  placeholder="https://exemplo.com ou exemplo.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="pl-12 h-14 text-lg glass-card border-0 bg-white/50 dark:bg-black/20 focus:bg-white/70 dark:focus:bg-black/30 transition-all duration-300"
                  disabled={loading}
                />
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-primary/50 pointer-events-none"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>

            {/* Custom Slug Input */}
            <AnimatePresence>
              {mode === "custom" && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: "auto", x: 0 }}
                  exit={{ opacity: 0, height: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="slug" className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-secondary" />
                    Slug Personalizado
                  </Label>
                  <div className="flex items-center gap-3 group">
                    <div className="glass-card px-4 py-3 rounded-lg bg-muted/50 border-0">
                      <span className="text-sm text-muted-foreground font-mono">atalho.vercel.app/</span>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        id="slug"
                        type="text"
                        placeholder="meu-link-personalizado"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                        disabled={loading}
                        className="h-12 text-lg glass-card border-0 bg-white/50 dark:bg-black/20 focus:bg-white/70 dark:focus:bg-black/30 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full" />
                    Use apenas letras, números, hífens (-) e underscores (_)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full h-14 text-lg font-semibold gradient-primary text-white hover:opacity-90 disabled:opacity-50 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      {mode === "ai" ? <Sparkles className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      <span>{mode === "ai" ? "Gerar Sugestões Inteligentes" : "Criar Atalho"}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </Button>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="glass-card p-4 border-red-200 bg-red-50/50 dark:bg-red-950/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
