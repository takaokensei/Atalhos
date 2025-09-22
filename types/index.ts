export interface LinkItem {
  id: string
  url: string
  slug: string
  title?: string
  description?: string
  createdAt: Date
  updatedAt?: Date
  clicks?: number
  isActive?: boolean
}

export interface LinkData {
  id: string
  url: string
  slug: string
  title?: string
  description?: string
  createdAt: Date
  updatedAt?: Date
  clicks?: number
  isActive?: boolean
}

export interface SlugSuggestion {
  slug: string
  description?: string
  confidence?: number
}

export interface Collection {
  id: string
  name: string
  description?: string
  accessKey: string
  isPublic: boolean
  createdAt: Date
  updatedAt?: Date
  links: LinkItem[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncStatus {
  syncing: boolean
  lastSync: Date | null
  error: string | null
}
