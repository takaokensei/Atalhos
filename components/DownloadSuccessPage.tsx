"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Download,
  Share2,
  Copy,
  Home,
  FileText,
  Archive,
  ImageIcon,
  File,
  Calendar,
  HardDrive,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DownloadSuccessPageProps {
  slug: string
  filename?: string
  size?: string
  type?: string
}

export function DownloadSuccessPage({ slug, filename, size, type }: DownloadSuccessPageProps) {
  const [copied, setCopied] = useState(false)
  const [confetti, setConfetti] = useState(true)
  const { toast } = useToast()

  const downloadUrl = `${window.location.origin}/download/${slug}`

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get file icon based on type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-8 w-8" />

    if (mimeType.startsWith("image/")) return <ImageIcon className="h-8 w-8" />
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive"))
      return <Archive className="h-8 w-8" />
    if (mimeType.includes("text") || mimeType.includes("pdf")) return <FileText className="h-8 w-8" />

    return <File className="h-8 w-8" />
  }

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      toast({
        title: "Link copiado!",
        description: "O link de download foi copiado para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      })
    }
  }

  // Share using Web Share API
  const shareFile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Download: ${filename || "Arquivo"}`,
          text: `Baixe o arquivo: ${filename || "Arquivo compartilhado"}`,
          url: downloadUrl,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      copyToClipboard()
    }
  }

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti Effect */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-white/90 shadow-2xl border-0 relative z-10">
        <CardContent className="p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4 animate-pulse">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Download Concluído!</h1>
            <p className="text-gray-600 text-lg">Seu arquivo foi baixado com sucesso</p>
          </div>

          {/* File Information */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 text-emerald-600">{getFileIcon(type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{filename || "Arquivo baixado"}</h3>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  {size && (
                    <div className="flex items-center space-x-1">
                      <HardDrive className="h-4 w-4" />
                      <span>{formatFileSize(Number.parseInt(size))}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                {type && (
                  <Badge variant="secondary" className="mt-2">
                    {type}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button onClick={shareFile} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="lg"
              className={copied ? "bg-emerald-50 border-emerald-200" : ""}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>

          {/* Download Link Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link de Download:</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-sm text-gray-800 truncate">
                {downloadUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={() => window.open(downloadUrl, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => (window.location.href = "/files")} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Ver Todos os Arquivos
            </Button>

            <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
