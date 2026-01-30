"use client"

import { useState, useCallback } from "react"

interface AISuggestion {
  action: string
  productId: string
  original: Record<string, unknown>
  suggestion: Record<string, unknown> | null
  status: 'pending' | 'ready' | 'accepted' | 'rejected'
  message?: string
}

export function useAIProductAction(productId: string) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestAction = useCallback(async (action: string, context?: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const res = await fetch(`/api/admin/products/${productId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, context }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'AI action failed')
      }

      const data = await res.json()
      setSuggestion({ ...data, status: data.suggestion ? 'ready' : 'pending' })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI action failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [productId])

  const accept = useCallback(async (applyValues: Record<string, unknown>) => {
    // Apply the suggestion via PATCH
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyValues),
      })
      if (!res.ok) throw new Error('Failed to apply suggestion')
      setSuggestion(prev => prev ? { ...prev, status: 'accepted' } : null)
      return true
    } catch {
      return false
    }
  }, [productId])

  const reject = useCallback(() => {
    setSuggestion(prev => prev ? { ...prev, status: 'rejected' } : null)
  }, [])

  const clear = useCallback(() => {
    setSuggestion(null)
    setError(null)
  }, [])

  return {
    suggestion,
    loading,
    error,
    requestAction,
    accept,
    reject,
    clear,
  }
}
