"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileArchive, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import type { FileUpload, UploadProgress } from "../types/file-upload"

interface FileUploadProps {
  onUploadComplete?: (file: FileUpload) => void
}

export default function FileUploadComponent({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<FileUpload | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    setError(null)
    setSuccess(null)
    setUploading(true)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100)
          setProgress({
            loaded: e.loaded,
            total: e.total,
            percentage,
          })
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            setSuccess(response.file)
            onUploadComplete?.(response.file)
          } else {
            setError(response.error || "Upload failed")
          }
        } else {
          const response = JSON.parse(xhr.responseText)
          setError(response.error || "Upload failed")
        }
        setUploading(false)
        setProgress(null)
      })

      xhr.addEventListener("error", () => {
        setError("Network error occurred")
        setUploading(false)
        setProgress(null)
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (err) {
      setError("Upload failed")
      setUploading(false)
      setProgress(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const resetState = () => {
    setError(null)
    setSuccess(null)
    setProgress(null)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
              <p className="text-muted-foreground mb-4">
                File: <span className="font-mono">{success.original_filename}</span>
              </p>
              <div className="bg-muted p-3 rounded-lg mb-4">
                <p className="text-sm font-medium mb-1">Download Link:</p>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {window.location.origin}/download/{success.slug}
                </code>
              </div>
              <Button onClick={resetState} variant="outline">
                Upload Another File
              </Button>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                  ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-primary/50"}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />

                <motion.div
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <FileArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                </motion.div>

                <h3 className="text-lg font-semibold mb-2">
                  {isDragging ? "Drop your file here" : "Upload Archive File"}
                </h3>

                <p className="text-muted-foreground mb-4">Drag & drop or click to select a .zip or .rar file</p>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Max size: 100MB</span>
                  <span>•</span>
                  <span>Formats: ZIP, RAR</span>
                </div>

                {!uploading && (
                  <Button className="mt-4 bg-transparent" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                )}
              </div>

              {uploading && progress && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground mt-2">{progress.percentage}% complete</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-medium text-destructive">Upload Failed</h4>
                      <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
