"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  FileArchive,
  HardDrive,
  Eye,
  Search,
  AlertTriangle,
  Plus,
  Grid3X3,
  List,
  TrendingUp,
  Clock,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface FileData {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  extension: string
  storageUrl: string
  slug: string
  downloadCount: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

interface FileStats {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  recentUploads: number
}

interface UploadingFile {
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  result?: any
  error?: string
}

interface ApiResponse {
  success: boolean
  files?: FileData[]
  stats?: FileStats
  error?: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [".zip", ".rar", ".7z", ".tar", ".gz"]

export default function FileUpload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    recentUploads: 0,
  })
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load files from API with improved error handling
  const loadFiles = useCallback(
    async (showLoadingState = true) => {
      try {
        if (showLoadingState) {
          setIsLoading(true)
        }
        setError(null)

        if (!isOnline) {
          throw new Error("Sem conexão com a internet")
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`/api/files${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 500) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Erro interno do servidor (${response.status})`)
          }
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()

        if (data.success) {
          setFiles(data.files || [])
          setStats(data.stats || { totalFiles: 0, totalSize: 0, totalDownloads: 0, recentUploads: 0 })
          setRetryCount(0) // Reset retry count on success
        } else {
          throw new Error(data.error || "Erro desconhecido na resposta da API")
        }
      } catch (error) {
        console.error("Error loading files:", error)

        let errorMessage = "Erro desconhecido"

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Timeout: A requisição demorou muito para responder"
          } else if (error.message.includes("fetch")) {
            errorMessage = "Erro de conexão: Verifique sua internet"
          } else {
            errorMessage = error.message
          }
        }

        setError(errorMessage)

        // Only clear data if this is the first error
        if (retryCount === 0) {
          setFiles([])
          setStats({ totalFiles: 0, totalSize: 0, totalDownloads: 0, recentUploads: 0 })
        }

        setRetryCount((prev) => prev + 1)

        if (showLoadingState) {
          toast.error(`Erro ao carregar arquivos: ${errorMessage}`)
        }
      } finally {
        if (showLoadingState) {
          setIsLoading(false)
        }
      }
    },
    [searchTerm, isOnline, retryCount],
  )

  // Load files on component mount and search change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFiles()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [loadFiles])

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(extension)) {
      return `Tipo não permitido. Permitidos: ${ALLOWED_TYPES.join(", ")}`
    }
    return null
  }

  // Handle file upload with improved error handling
  const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append("file", file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadingFiles((prev) => prev.map((uf) => (uf.file === file ? { ...uf, progress } : uf)))
        }
      })

      xhr.addEventListener("load", () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              resolve(response)
            } else {
              reject(new Error(response.error || "Upload failed"))
            }
          } else {
            let errorMessage = `Upload failed with status ${xhr.status}`
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              errorMessage = errorResponse.error || errorMessage
            } catch {
              // Use default error message
            }
            reject(new Error(errorMessage))
          }
        } catch (error) {
          reject(new Error("Invalid response format"))
        }
      })

      xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
      xhr.addEventListener("timeout", () => reject(new Error("Upload timeout")))

      xhr.timeout = 5 * 60 * 1000 // 5 minutes
      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  }

  // Handle multiple files
  const handleFiles = async (files: FileList) => {
    if (!isOnline) {
      toast.error("Sem conexão com a internet")
      return
    }

    const validFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }))

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

    const uploadPromises = validFiles.map(async (file) => {
      try {
        const result = await uploadFile(file)
        setUploadingFiles((prev) => prev.map((uf) => (uf.file === file ? { ...uf, status: "success", result } : uf)))
        toast.success(`${file.name} enviado com sucesso!`)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed"
        setUploadingFiles((prev) =>
          prev.map((uf) => (uf.file === file ? { ...uf, status: "error", error: errorMessage } : uf)),
        )
        toast.error(`Erro ao enviar ${file.name}: ${errorMessage}`)
        throw error
      }
    })

    try {
      await Promise.allSettled(uploadPromises)
      await loadFiles(false) // Reload without showing loading state
    } catch (error) {
      console.error("Some uploads failed:", error)
    }
  }

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  // Copy download link
  const copyToClipboard = async (slug: string) => {
    try {
      const link = `${window.location.origin}/download/${slug}`
      await navigator.clipboard.writeText(link)
      setCopiedSlug(slug)
      toast.success("Link copiado!")
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch (error) {
      toast.error("Erro ao copiar link")
    }
  }

  // Delete file with improved error handling
  const deleteFile = async (id: string, name: string) => {
    try {
      if (!isOnline) {
        toast.error("Sem conexão com a internet")
        return
      }

      const response = await fetch(`/api/files?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${name} foi excluído`)
        await loadFiles(false) // Reload without showing loading state
      } else {
        throw new Error(data.error || "Erro ao excluir arquivo")
      }
    } catch (error) {
      console.error("Delete error:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error(`Erro ao excluir arquivo: ${errorMessage}`)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  // Format date
  const formatDate = (date: string): string => {
    try {
      return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Data inválida"
    }
  }

  const clearCompleted = () => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.status === "uploading"))
  }

  const retryLoadFiles = () => {
    setRetryCount(0)
    loadFiles()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileArchive className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Gerenciador de Arquivos
                </h1>
                <p className="text-muted-foreground text-lg">
                  Faça upload, gerencie e compartilhe seus arquivos com facilidade
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              <span className="text-sm text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <ThemeToggle />
            <Button onClick={retryLoadFiles} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="relative overflow-hidden hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Arquivos</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalFiles}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <FileArchive className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="relative overflow-hidden hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Espaço Usado</p>
                    <p className="text-3xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <HardDrive className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="relative overflow-hidden hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalDownloads}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="relative overflow-hidden hover-lift">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recentes (7d)</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.recentUploads}</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Erro no Sistema</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">Tentativas: {retryCount}</p>
                    )}
                  </div>
                  <Button variant="outline" onClick={retryLoadFiles} className="bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                Upload de Arquivos
              </CardTitle>
              <CardDescription>Faça upload de arquivos .zip, .rar, .7z, .tar, .gz (máx. 50MB cada)</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  isDragOver
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isDragOver ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
                    </h3>
                    <p className="text-muted-foreground">
                      Suporte para: {ALLOWED_TYPES.join(", ")} • Máx: {MAX_FILE_SIZE / 1024 / 1024}MB
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    disabled={!isOnline}
                  >
                    <Plus className="h-5 w-5" />
                    Selecionar Arquivos
                  </Button>
                  {!isOnline && <p className="text-sm text-red-500">Upload indisponível offline</p>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={handleFileInput}
                  className="hidden"
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploadingFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Progresso do Upload
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={clearCompleted}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar Concluídos
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadingFiles.map((uploadingFile, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {uploadingFile.status === "uploading" && (
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                          )}
                          {uploadingFile.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {uploadingFile.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                          <div>
                            <p className="font-medium">{uploadingFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(uploadingFile.file.size)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            uploadingFile.status === "success"
                              ? "default"
                              : uploadingFile.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {uploadingFile.status === "uploading" && "Enviando..."}
                          {uploadingFile.status === "success" && "Concluído"}
                          {uploadingFile.status === "error" && "Erro"}
                        </Badge>
                      </div>
                      {uploadingFile.status === "uploading" && (
                        <Progress value={uploadingFile.progress} className="w-full" />
                      )}
                      {uploadingFile.status === "error" && uploadingFile.error && (
                        <p className="text-sm text-red-500">{uploadingFile.error}</p>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileArchive className="h-5 w-5 text-primary" />
                  Seus Arquivos ({files.length})
                </CardTitle>
                <CardDescription>Gerencie e compartilhe seus arquivos enviados</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Carregando arquivos...</p>
                </div>
              </div>
            ) : files.length === 0 && !error ? (
              <div className="text-center py-16">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
                    <FileArchive className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {searchTerm ? "Nenhum arquivo encontrado" : "Nenhum arquivo ainda"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Tente uma busca diferente" : "Faça upload do seu primeiro arquivo para começar"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={
                        viewMode === "grid"
                          ? "group"
                          : "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      }
                    >
                      {viewMode === "grid" ? (
                        <Card className="hover-lift group-hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                  <FileArchive className="h-8 w-8 text-primary" />
                                </div>
                                <Badge variant="secondary">{file.extension}</Badge>
                              </div>
                              <div>
                                <h3 className="font-semibold truncate" title={file.originalName}>
                                  {file.originalName}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span className="flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    {file.downloadCount}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(file.createdAt)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(file.slug)}
                                  className="flex-1"
                                >
                                  {copiedSlug === file.slug ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/download/${file.slug}`, "_blank")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteFile(file.id, file.originalName)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileArchive className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{file.originalName}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>{formatDate(file.createdAt)}</span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {file.downloadCount} downloads
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{file.extension}</Badge>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(file.slug)}>
                              {copiedSlug === file.slug ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/download/${file.slug}`, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteFile(file.id, file.originalName)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
