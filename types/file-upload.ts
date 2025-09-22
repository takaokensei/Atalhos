export interface FileUpload {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType?: string
  fileExtension: string
  slug: string
  downloadCount: number
  uploadDate: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  isActive?: boolean
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
  data?: {
    id: string
    slug: string
    downloadUrl: string
    filename: string
  }
  error?: string
}

export const ALLOWED_FILE_TYPES = [".zip", ".rar"] as const
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const MIME_TYPES = {
  ".zip": ["application/zip", "application/x-zip-compressed"],
  ".rar": ["application/vnd.rar", "application/x-rar-compressed"],
} as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]
