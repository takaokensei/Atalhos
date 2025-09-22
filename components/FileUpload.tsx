"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  File,
  Download,
  Trash2,
  Search,
  HardDrive,
  BarChart3,
  Clock,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface FileData {
  id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  slug: string
  blob_url: string
  download_count: number
  expires_at: string | null
  created_at: string
  updated_at: string
}

interface Statistics {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  recentFiles: number
}

interface FileUploadResponse {
  files: FileData[]
  statistics: Statistics
}

export default function FileUpload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    recentFiles: 0,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const fetchFiles = useCallback(async (search = "") => {
    try {
      setError(null)
      const response = await fetch(`/api/files?search=${encodeURIComponent(search)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FileUploadResponse = await response.json()
      setFiles(data.files || [])
      setStatistics(
        data.statistics || {
          totalFiles: 0,
          totalSize: 0,
          totalDownloads: 0,
          recentFiles: 0,
        },
      )
    } catch (error) {
      console.error("Error loading files:", error)
      setError("Erro ao carregar arquivos. Tente novamente.")
      setFiles([])
      setStatistics({
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        recentFiles: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFiles(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchFiles])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Limite máximo: 50MB")
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + 10
          })
        }, 200)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro no upload")
        }

        const result = await response.json()

        toast.success("Arquivo enviado com sucesso!")

        // Refresh the files list
        await fetchFiles(searchTerm)
      } catch (error) {
        console.error("Upload error:", error)
        toast.error(error instanceof Error ? error.message : "Erro no upload do arquivo")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [searchTerm, fetchFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/files?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir arquivo")
      }

      toast.success("Arquivo excluído com sucesso!")
      await fetchFiles(searchTerm)
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Erro ao excluir arquivo")
    }
  }

  const handleCopyLink = async (slug: string) => {
    const link = `${window.location.origin}/download/${slug}`

    try {
      await navigator.clipboard.writeText(link)
      setCopiedSlug(slug)
      toast.success("Link copiado!")

      setTimeout(() => setCopiedSlug(null), 2000)
    } catch (error) {
      console.error("Copy error:", error)
      toast.error("Erro ao copiar link")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"

    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleRetry = () => {
    setIsLoading(true)
    fetchFiles(searchTerm)
  }

  if (error && files.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar arquivos</h3>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Arquivos</p>
                <p className="text-2xl font-bold">{statistics.totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Espaço Usado</p>
                <p className="text-2xl font-bold">{formatFileSize(statistics.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Downloads</p>
                <p className="text-2xl font-bold">{statistics.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Recentes (7d)</p>
                <p className="text-2xl font-bold">{statistics.recentFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos
          </CardTitle>
          <CardDescription>Faça upload de arquivos até 50MB. Suporta todos os tipos de arquivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${isUploading ? "pointer-events-none opacity-50" : "hover:border-primary hover:bg-primary/5"}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Solte o arquivo aqui...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Clique ou arraste um arquivo aqui</p>
                <p className="text-sm text-muted-foreground">Limite máximo: 50MB</p>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Enviando arquivo...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Files List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Arquivos Enviados</CardTitle>
              <CardDescription>Gerencie seus arquivos enviados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente uma busca diferente" : "Faça upload do seu primeiro arquivo"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.original_name}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{file.download_count} downloads</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant="secondary" className="hidden sm:inline-flex">
                        /{file.slug}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(file.slug)}
                        className="hidden sm:inline-flex"
                      >
                        {copiedSlug === file.slug ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>

                      <Button variant="outline" size="sm" asChild>
                        <a href={`/download/${file.slug}`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
