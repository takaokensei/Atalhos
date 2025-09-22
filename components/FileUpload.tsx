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
  FileIcon,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  FileArchive,
  HardDrive,
  Calendar,
  Eye,
  Search,
} from "lucide-react"
import type { FileUpload, UploadProgress, FileStats } from "@/types/file-upload"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [".zip", ".rar", ".7z", ".tar", ".gz"]

interface UploadingFile {
  file: File
  progress: UploadProgress
  status: "uploading" | "success" | "error"
  result?: any
  error?: string
}

export default function FileUploader() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    recentUploads: 0,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load uploaded files
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/files")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setUploadedFiles(data.files || [])
        setStats(
          data.stats || {
            totalFiles: 0,
            totalSize: 0,
            totalDownloads: 0,
            recentUploads: 0,
          },
        )
        console.log("Loaded files:", data.files?.length || 0)
        console.log("Stats:", data.stats)
      } else {
        throw new Error(data.error || "Failed to load files")
      }
    } catch (error) {
      console.error("Error loading files:", error)
      toast.error(`Erro ao carregar arquivos: ${error instanceof Error ? error.message : "Unknown error"}`)
      // Set empty state on error
      setUploadedFiles([])
      setStats({
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        recentUploads: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load files on component mount
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

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

  const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append("file", file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          }

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
              // If response is not JSON, use status message
            }
            reject(new Error(errorMessage))
          }
        } catch (error) {
          reject(new Error("Invalid response format"))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"))
      })

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout"))
      })

      xhr.timeout = 5 * 60 * 1000 // 5 minutes
      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  }

  const handleFiles = async (files: FileList) => {
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

    // Initialize uploading files
    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      progress: { loaded: 0, total: file.size, percentage: 0 },
      status: "uploading",
    }))

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

    // Upload files concurrently
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
      // Reload files after uploads complete
      await loadFiles()
    } catch (error) {
      console.error("Some uploads failed:", error)
    }
  }

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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Link copiado!")
    } catch (error) {
      toast.error("Erro ao copiar link")
    }
  }

  const deleteFile = async (id: string) => {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Arquivo deletado com sucesso!")
        await loadFiles()
      } else {
        throw new Error(data.error || "Delete failed")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Erro ao deletar arquivo")
    }
  }

  const clearCompleted = () => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.status === "uploading"))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredFiles = uploadedFiles.filter(
    (file) =>
      file.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.filename?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileArchive className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Arquivos</p>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <HardDrive className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Espaço Usado</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Download className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recentes (7d)</p>
                <p className="text-2xl font-bold">{stats.recentUploads}</p>
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
          <CardDescription>Faça upload de arquivos .zip, .rar, .7z, .tar, .gz (máx. 50MB cada)</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Arraste arquivos aqui ou clique para selecionar</h3>
            <p className="text-muted-foreground mb-4">
              Suporte para: {ALLOWED_TYPES.join(", ")} • Máx: {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
              <FileIcon className="h-4 w-4" />
              Selecionar Arquivos
            </Button>
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
                <CardTitle className="text-lg">Progresso do Upload</CardTitle>
                <Button variant="outline" size="sm" onClick={clearCompleted} className="gap-2 bg-transparent">
                  <X className="h-4 w-4" />
                  Limpar Concluídos
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadingFiles.map((uploadingFile, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {uploadingFile.status === "uploading" && (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {uploadingFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {uploadingFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
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
                      <Progress value={uploadingFile.progress.percentage} className="w-full" />
                    )}
                    {uploadingFile.status === "error" && uploadingFile.error && (
                      <p className="text-sm text-red-500">{uploadingFile.error}</p>
                    )}
                    {uploadingFile.status === "success" && uploadingFile.result && (
                      <div className="flex items-center gap-2">
                        <Input value={uploadingFile.result.data?.downloadUrl || ""} readOnly className="text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(uploadingFile.result.data?.downloadUrl || "")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Arquivos Enviados ({uploadedFiles.length})</CardTitle>
            <CardDescription>Gerencie seus arquivos enviados</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={isLoading}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando arquivos...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum arquivo encontrado" : "Nenhum arquivo ainda"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente uma busca diferente" : "Faça upload do seu primeiro arquivo para começar"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileArchive className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{file.originalName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{file.downloadCount} downloads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}/download/${file.slug}`)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Link
                    </Button>
                    <Button size="sm" variant="outline" asChild className="gap-2 bg-transparent">
                      <a href={`/download/${file.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                        Baixar
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFile(file.id)}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
