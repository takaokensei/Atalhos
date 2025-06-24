"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { LinkItem } from "../types"
import { ExternalLink, Copy, Trash2, Check, Globe, Share2, Calendar, TrendingUp, Zap } from "lucide-react"
import EditLinkDialog from "./EditLinkDialog"

interface ModernLinkCardProps {
  link: LinkItem
  onDelete: (id: string) => void
  onEdit: (updatedLink: LinkItem) => void
  existingSlugs: string[]
  baseUrl?: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
}

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
}

export default function ModernLinkCard({
  link,
  onDelete,
  onEdit,
  existingSlugs,
  baseUrl = "atalho.vercel.app",
}: ModernLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className="glass-card border-0 h-full flex flex-col relative overflow-hidden">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(217 91% 60%) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(270 95% 75%) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, hsl(217 91% 60%) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        <CardHeader className="pb-3 flex-shrink-0 relative z-10">
          <div className="flex items-start gap-3">
            {/* Favicon with Animation */}
            <motion.div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {!faviconError ? (
                <motion.img
                  src={getFaviconUrl(link.url) || "/placeholder.svg"}
                  alt=""
                  className="w-7 h-7 rounded-lg shadow-sm"
                  onError={() => setFaviconError(true)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
              ) : (
                <motion.div
                  className="w-7 h-7 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}

              {/* Status Indicator */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.h3
                className="font-semibold text-sm truncate mb-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {link.title || getDomainName(link.url)}
              </motion.h3>
              <motion.p
                className="text-xs text-muted-foreground truncate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {link.url}
              </motion.p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <motion.div variants={buttonVariants} whileHover="hover">
                <EditLinkDialog link={link} onSave={onEdit} existingSlugs={existingSlugs} />
              </motion.div>
              <motion.div variants={buttonVariants} whileHover="hover">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(link.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Deletar link</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col relative z-10">
          <div className="space-y-4 flex-1">
            {/* Short URL Display */}
            <motion.div
              className="p-3 bg-gradient-to-r from-white/50 to-white/30 dark:from-black/20 dark:to-black/10 rounded-xl border border-white/20 relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  x: isHovered ? ["-100%", "100%"] : "-100%",
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              <div className="flex items-center gap-2 relative z-10">
                <motion.div className="flex items-center gap-1 flex-1 min-w-0" whileHover={{ scale: 1.02 }}>
                  <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                  <code className="text-sm font-mono text-primary truncate font-semibold">{shortUrl}</code>
                </motion.div>

                <motion.div variants={buttonVariants} whileHover="hover">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                        >
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className="sr-only">Copiar link</span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Metadata */}
            <motion.div
              className="flex items-center justify-between gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge
                    variant="secondary"
                    className="text-xs flex-shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {link.slug}
                  </Badge>
                </motion.div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(link.createdAt)}</span>
                </div>
              </div>

              <motion.div className="flex items-center gap-1 text-xs text-green-600" whileHover={{ scale: 1.05 }}>
                <TrendingUp className="h-3 w-3" />
                <span>Ativo</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-2 mt-4 pt-4 border-t border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={shareLink}
                className="w-full text-xs glass-card border-0 bg-white/30 dark:bg-black/20 hover:bg-primary/10 transition-colors"
              >
                <Share2 className="h-3 w-3 mr-2" />
                Compartilhar
              </Button>
            </motion.div>

            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(link.url, "_blank")}
                className="w-full text-xs glass-card border-0 bg-white/30 dark:bg-black/20 hover:bg-secondary/10 transition-colors"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Abrir
              </Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
