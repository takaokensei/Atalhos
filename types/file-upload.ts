export interface FileUpload {
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
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface FileUploadResponse {
  success: boolean
  file?: FileUpload
  error?: string
  downloadUrl?: string
}

export interface FileListResponse {
  success: boolean
  files?: FileUpload[]
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FileDeleteResponse {
  success: boolean
  error?: string
  message?: string
}

export interface FileStats {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  recentUploads: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResponse {
  success: boolean
  error?: string
  data?: {
    id: string
    slug: string
    downloadUrl: string
    file: FileUpload
  }
}

export const ALLOWED_FILE_TYPES = [".zip", ".rar"] as const
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const MIME_TYPES = {
  ".zip": ["application/zip", "application/x-zip-compressed"],
  ".rar": ["application/vnd.rar", "application/x-rar-compressed"],
} as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]
