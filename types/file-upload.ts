export interface FileUpload {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  file_extension: string
  storage_url: string
  download_slug: string
  upload_date: string
  download_count: number
  expires_at?: string
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
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
  total?: number
}

export interface FileDeleteResponse {
  success: boolean
  error?: string
}

export interface FileStats {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  activeFiles: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export const ALLOWED_FILE_TYPES = [".zip", ".rar"] as const
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MIME_TYPES = {
  ".zip": ["application/zip", "application/x-zip-compressed"],
  ".rar": ["application/vnd.rar", "application/x-rar-compressed"],
} as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]
