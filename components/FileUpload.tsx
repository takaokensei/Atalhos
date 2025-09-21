"use client"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, CheckCircle, AlertCircle, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, type FileUploadResponse } from "@/types/file-upload"
import { useDropzone } from "react-dropzone"

interface UploadFile extends File {
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  downloadUrl?: string
}

export default function FileUploadComponent() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === "file-too-large") {
          toast.error(`${file.name} is too large. Maximum size is 100MB.`)
        } else if (error.code === "file-invalid-type") {
          toast.error(`${file.name} is not a supported file type. Only .zip and .rar files are allowed.`)
        }
      })
    })

    // Add accepted files
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
      "application/vnd.rar": [".rar"],
      "application/x-rar-compressed": [".rar"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const uploadFile = async (file: UploadFile) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f)))

      const xhr = new XMLHttpRequest()

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)))
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const response: FileUploadResponse = JSON.parse(xhr.responseText)
            if (response.success) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id
                    ? {
                        ...f,
                        status: "success",
                        progress: 100,
                        downloadUrl: response.downloadUrl,
                      }
                    : f,
                ),
              )
              toast.success(`${file.name} uploaded successfully!`)
              resolve()
            } else {
              throw new Error(response.error || "Upload failed")
            }
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`)
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Network error"))
        })

        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed"
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: errorMessage } : f)))
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
      throw error
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      await Promise.allSettled(pendingFiles.map(uploadFile))
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Download link copied to clipboard!")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isDragActive ? "Drop files here" : "Upload Files"}</h3>
            <p className="text-muted-foreground mb-4">Drag and drop your .zip or .rar files here, or click to browse</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {ALLOWED_FILE_TYPES.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Files ({files.length})</h3>
              {files.some((f) => f.status === "pending") && (
                <Button onClick={uploadAll} disabled={isUploading} className="ml-auto">
                  {isUploading ? "Uploading..." : "Upload All"}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{file.name}</p>
                        <Badge variant="outline">{formatFileSize(file.size)}</Badge>

                        {file.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>

                      {file.status === "uploading" && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{file.progress}% uploaded</p>
                        </div>
                      )}

                      {file.status === "error" && file.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{file.error}</AlertDescription>
                        </Alert>
                      )}

                      {file.status === "success" && file.downloadUrl && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(file.downloadUrl!)}>
                            Copy Link
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(file.downloadUrl, "_blank")}>
                            Download
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)} className="flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
