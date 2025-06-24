"use client"

import { useState, useEffect, useCallback } from "react"
import type { LinkItem } from "../types"
import { saveLink, updateLink, deleteLink, getAllLinks } from "../app/actions/link-actions"

const STORAGE_KEY = "atalho-links"
const LAST_SYNC_KEY = "atalho-last-sync"

export interface SyncStatus {
  syncing: boolean
  lastSync: Date | null
  error: string | null
}

export function useLinkSync() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    syncing: false,
    lastSync: null,
    error: null,
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Load from localStorage first for immediate display
      const localLinks = loadFromLocalStorage()
      setLinks(localLinks)

      // Then sync with server
      await syncWithServer()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const loadFromLocalStorage = (): LinkItem[] => {
    if (typeof window === "undefined") return []

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map((link: any) => ({
          ...link,
          createdAt: new Date(link.createdAt),
        }))
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }
    return []
  }

  const saveToLocalStorage = (links: LinkItem[]) => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  const updateLastSync = () => {
    if (typeof window === "undefined") return

    const now = new Date()
    localStorage.setItem(LAST_SYNC_KEY, now.toISOString())
    setSyncStatus((prev) => ({ ...prev, lastSync: now }))
  }

  const syncWithServer = async () => {
    setSyncStatus((prev) => ({ ...prev, syncing: true, error: null }))

    try {
      const result = await getAllLinks()

      if (result.success && result.data) {
        const serverLinks = result.data as LinkItem[]
        setLinks(serverLinks)
        saveToLocalStorage(serverLinks)
        updateLastSync()
        console.log(`Synced ${serverLinks.length} links from server`)
      } else {
        console.log("Server sync failed, using local data:", result.error)
        setSyncStatus((prev) => ({ ...prev, error: result.error || "Sync failed" }))
      }
    } catch (error) {
      console.error("Sync error:", error)
      setSyncStatus((prev) => ({ ...prev, error: "Network error" }))
    } finally {
      setSyncStatus((prev) => ({ ...prev, syncing: false }))
    }
  }

  const addLink = async (newLink: LinkItem): Promise<{ success: boolean; error?: string }> => {
    try {
      // Add to local state immediately for responsive UI
      const updatedLinks = [newLink, ...links]
      setLinks(updatedLinks)
      saveToLocalStorage(updatedLinks)

      // Save to server
      const result = await saveLink(newLink)

      if (!result.success) {
        // Revert local changes if server save failed
        setLinks(links)
        saveToLocalStorage(links)
        return { success: false, error: result.error }
      }

      console.log("Link saved successfully:", newLink.slug)
      return { success: true }
    } catch (error) {
      // Revert local changes
      setLinks(links)
      saveToLocalStorage(links)
      return { success: false, error: "Failed to save link" }
    }
  }

  const editLink = async (updatedLink: LinkItem): Promise<{ success: boolean; error?: string }> => {
    try {
      // Update local state immediately
      const updatedLinks = links.map((link) => (link.id === updatedLink.id ? updatedLink : link))
      setLinks(updatedLinks)
      saveToLocalStorage(updatedLinks)

      // Update on server
      const result = await updateLink(updatedLink)

      if (!result.success) {
        // Revert local changes if server update failed
        setLinks(links)
        saveToLocalStorage(links)
        return { success: false, error: result.error }
      }

      console.log("Link updated successfully:", updatedLink.slug)
      return { success: true }
    } catch (error) {
      // Revert local changes
      setLinks(links)
      saveToLocalStorage(links)
      return { success: false, error: "Failed to update link" }
    }
  }

  const removeLink = async (linkId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Remove from local state immediately
      const updatedLinks = links.filter((link) => link.id !== linkId)
      setLinks(updatedLinks)
      saveToLocalStorage(updatedLinks)

      // Delete from server
      const result = await deleteLink(linkId)

      if (!result.success) {
        // Revert local changes if server delete failed
        setLinks(links)
        saveToLocalStorage(links)
        return { success: false, error: result.error }
      }

      console.log("Link deleted successfully")
      return { success: true }
    } catch (error) {
      // Revert local changes
      setLinks(links)
      saveToLocalStorage(links)
      return { success: false, error: "Failed to delete link" }
    }
  }

  const checkSlugExists = (slug: string, excludeId?: string): boolean => {
    return links.some((link) => link.slug === slug && link.id !== excludeId)
  }

  const manualSync = useCallback(async () => {
    await syncWithServer()
  }, [])

  return {
    links,
    syncStatus,
    addLink,
    editLink,
    removeLink,
    checkSlugExists,
    manualSync,
  }
}
