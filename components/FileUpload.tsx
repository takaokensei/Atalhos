"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  File,
  Download,
  Trash2,
  Search,
  HardDrive,
  Calendar,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileData {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  extension: string
  storageUrl: string
  slug: string
  uploadDate: string
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

export default function FileUpload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    recentUploads: 0,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Load files from API
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/files")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setFiles(data.files || [])
        setStats(
          data.stats || {
            totalFiles: 0,
            totalSize: 0,
            totalDownloads: 0,
            recentUploads: 0,
          },
        )
      } else {
        throw new Error(data.error || "Erro ao carregar arquivos")
      }
    } catch (error) {
      console.error("Error loading files:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")

      // Set empty state on error
      setFiles([])
      setStats({
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        recentUploads: 0,
      })

      toast({
        title: "Erro ao carregar arquivos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load files on component mount
  useState(() => {
    loadFiles()
  })

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 50MB",
        variant: "destructive",
      })
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
            return 90
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Upload realizado com sucesso!",
          description: `Arquivo ${file.name} foi enviado`,
        })

        // Reload files to show the new upload
        await loadFiles()
      } else {
        throw new Error(result.error || "Erro no upload")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle file deletion
  const handleDeleteFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Arquivo excluído",
          description: `${filename} foi removido`,
        })

        // Reload files
        await loadFiles()
      } else {
        throw new Error(result.error || "Erro ao excluir arquivo")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  // Copy download link
  const copyDownloadLink = (slug: string) => {
    const link = `${window.location.origin}/download/${slug}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado!",
      description: "Link de download copiado para a área de transferência",
    })
  }

  // Filter files based on search
  const filteredFiles = files.filter(
    (file) =>
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Gerenciador de Arquivos</h1>
        <p className="text-muted-foreground">Faça upload, gerencie e compartilhe seus arquivos</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Usado</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recentes (7d)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUploads}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivo</CardTitle>
              <CardDescription>Selecione um arquivo para fazer upload (máximo 50MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file">Arquivo</Label>
                <Input ref={fileInputRef} id="file" type="file" onChange={handleFileUpload} disabled={isUploading} />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Fazendo upload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Seus Arquivos
                <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </CardTitle>
              <CardDescription>Gerencie seus arquivos enviados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    <Button variant="outline" size="sm" onClick={loadFiles} className="ml-2 bg-transparent">
                      Tentar novamente
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando arquivos...</span>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredFiles.length === 0 && (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Tente uma busca diferente" : "Faça upload do seu primeiro arquivo"}
                  </p>
                </div>
              )}

              {/* Files List */}
              {!isLoading && !error && filteredFiles.length > 0 && (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{file.downloadCount} downloads</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{file.extension}</Badge>
                        <Button variant="outline" size="sm" onClick={() => copyDownloadLink(file.slug)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/download/${file.slug}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id, file.originalName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
