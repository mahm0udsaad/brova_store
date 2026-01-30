"use client"

import { useState, useEffect, useCallback } from "react"

export interface ProductDraft {
  id: string
  batch_id?: string
  group_index?: number
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  category?: string
  category_ar?: string
  tags?: string[]
  suggested_price?: number
  image_urls: string[]
  primary_image_url: string
  ai_confidence?: "high" | "medium" | "low"
  status: "draft" | "editing" | "persisted" | "discarded"
  metadata?: Record<string, any>
}

const STORAGE_KEY = "onboarding_drafts"

/**
 * Hook to manage ephemeral draft state in SessionStorage
 * Drafts persist during the session but are cleared on tab close
 */
export function useDraftState() {
  const [drafts, setDrafts] = useState<ProductDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from SessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        setDrafts(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load drafts from SessionStorage:", error)
      setDrafts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync to SessionStorage whenever drafts change
  useEffect(() => {
    if (!isLoading) {
      try {
        if (drafts.length === 0) {
          sessionStorage.removeItem(STORAGE_KEY)
        } else {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
        }
      } catch (error) {
        console.error("Failed to save drafts to SessionStorage:", error)
      }
    }
  }, [drafts, isLoading])

  /**
   * Add one or more drafts to the collection
   */
  const addDrafts = useCallback((newDrafts: ProductDraft[]) => {
    setDrafts((prev) => [...prev, ...newDrafts])
  }, [])

  /**
   * Update a single draft
   */
  const updateDraft = useCallback((id: string, updates: Partial<ProductDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }, [])

  /**
   * Remove one or more drafts by ID
   */
  const removeDrafts = useCallback((ids: string[]) => {
    setDrafts((prev) => prev.filter((d) => !ids.includes(d.id)))
  }, [])

  /**
   * Get a draft by ID
   */
  const getDraft = useCallback(
    (id: string): ProductDraft | undefined => {
      return drafts.find((d) => d.id === id)
    },
    [drafts]
  )

  /**
   * Get drafts by batch ID
   */
  const getDraftsByBatchId = useCallback(
    (batchId: string): ProductDraft[] => {
      return drafts.filter((d) => d.batch_id === batchId)
    },
    [drafts]
  )

  /**
   * Get drafts by status
   */
  const getDraftsByStatus = useCallback(
    (status: ProductDraft["status"]): ProductDraft[] => {
      return drafts.filter((d) => d.status === status)
    },
    [drafts]
  )

  /**
   * Update multiple drafts at once
   */
  const updateMultipleDrafts = useCallback((updates: Record<string, Partial<ProductDraft>>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        const update = updates[d.id]
        return update ? { ...d, ...update } : d
      })
    )
  }, [])

  /**
   * Clear all drafts (when workflow is cancelled or completed)
   */
  const clearDrafts = useCallback(() => {
    setDrafts([])
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear drafts from SessionStorage:", error)
    }
  }, [])

  /**
   * Check if there are unsaved changes
   */
  const hasDirtyDrafts = useCallback((): boolean => {
    return drafts.some((d) => d.status === "editing" || d.status === "draft")
  }, [drafts])

  /**
   * Get count of drafts by status
   */
  const getCountByStatus = useCallback((): Record<ProductDraft["status"], number> => {
    return {
      draft: drafts.filter((d) => d.status === "draft").length,
      editing: drafts.filter((d) => d.status === "editing").length,
      persisted: drafts.filter((d) => d.status === "persisted").length,
      discarded: drafts.filter((d) => d.status === "discarded").length,
    }
  }, [drafts])

  return {
    drafts,
    isLoading,
    addDrafts,
    updateDraft,
    removeDrafts,
    getDraft,
    getDraftsByBatchId,
    getDraftsByStatus,
    updateMultipleDrafts,
    clearDrafts,
    hasDirtyDrafts,
    getCountByStatus,
  }
}
