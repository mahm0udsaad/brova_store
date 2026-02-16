"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface ProductFormValues {
  name: string
  name_ar: string
  description: string
  description_ar: string
  price: number
  inventory: number
  status: 'draft' | 'active'
  category: string
  category_ar: string
  category_id: string
  tags: string[]
  image_url: string
  images: string[]
  sku: string
  gender: 'men' | 'women' | 'unisex' | 'kids' | ''
  sizes: string[]
  colors: string[]
  variants: Record<string, unknown>[]
}

const DEFAULT_VALUES: ProductFormValues = {
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  price: 0,
  inventory: 0,
  status: 'draft',
  category: '',
  category_ar: '',
  category_id: '',
  tags: [],
  image_url: '',
  images: [],
  sku: '',
  gender: '',
  sizes: [],
  colors: [],
  variants: [],
}

interface UseProductFormOptions {
  productId?: string
  initialValues?: Partial<ProductFormValues>
  autosaveEnabled?: boolean
  autosaveDelay?: number
}

function validateProduct(values: ProductFormValues): string | null {
  if (!values.name.trim()) return "Product name is required"
  if (!Number.isFinite(values.price) || values.price < 0) {
    return "Price must be a non-negative number"
  }
  if (!Number.isFinite(values.inventory) || values.inventory < 0) {
    return "Inventory must be a non-negative number"
  }
  return null
}

export function useProductForm(options: UseProductFormOptions = {}) {
  const [values, setValues] = useState<ProductFormValues>({
    ...DEFAULT_VALUES,
    ...options.initialValues,
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autosaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const aiPausedRef = useRef(false)

  const updateField = useCallback(<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setDirty(true)
    setError(null)
  }, [])

  const updateFields = useCallback((partial: Partial<ProductFormValues>) => {
    setValues(prev => ({ ...prev, ...partial }))
    setDirty(true)
    setError(null)
  }, [])

  // Autosave for draft products
  useEffect(() => {
    if (!options.autosaveEnabled || !options.productId || !dirty || aiPausedRef.current) return
    if (values.status !== 'draft') return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        const res = await fetch('/api/admin/products/autosave', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: options.productId, ...values }),
        })
        if (res.ok) {
          const data = await res.json()
          setLastSaved(data.updated_at)
          setDirty(false)
        }
      } catch {
        // Silent fail for autosave
      } finally {
        setSaving(false)
      }
    }, options.autosaveDelay ?? 1500)

    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current) }
  }, [values, dirty, options.autosaveEnabled, options.productId, options.autosaveDelay])

  const pauseAutosave = useCallback(() => { aiPausedRef.current = true }, [])
  const resumeAutosave = useCallback(() => { aiPausedRef.current = false }, [])

  const save = useCallback(async () => {
    const validationError = validateProduct(values)
    if (validationError) {
      setError(validationError)
      throw new Error(validationError)
    }

    setSaving(true)
    setError(null)
    try {
      const url = options.productId
        ? `/api/admin/products/${options.productId}`
        : '/api/admin/products'
      const method = options.productId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save product')
      }

      const data = await res.json()
      setDirty(false)
      setLastSaved(new Date().toISOString())
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [values, options.productId])

  const publish = useCallback(async () => {
    const validationError = validateProduct(values)
    if (validationError) {
      setError(validationError)
      throw new Error(validationError)
    }

    updateField('status', 'active')
    // Need to save with active status
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${options.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, status: 'active' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to publish')
      }
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }, [values, options.productId, updateField])

  const unpublish = useCallback(async () => {
    updateField('status', 'draft')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${options.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      if (!res.ok) throw new Error('Failed to unpublish')
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish')
    } finally {
      setSaving(false)
    }
  }, [options.productId, updateField])

  return {
    values,
    updateField,
    updateFields,
    save,
    publish,
    unpublish,
    saving,
    dirty,
    lastSaved,
    error,
    pauseAutosave,
    resumeAutosave,
    setError,
  }
}
