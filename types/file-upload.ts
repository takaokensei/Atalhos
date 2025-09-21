export interface FileUpload {
  id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  slug: string
  blob_url: string
  download_count: number
  expires_at?: Date
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResponse {
  success: boolean
  file?: FileUpload
  error?: string
}

export interface FileStats {
  total_files: number
  total_size: number
  total_downloads: number
}
