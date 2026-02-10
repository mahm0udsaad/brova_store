"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface StoreProduct {
  id: string
  store_id: string
  name: string
  name_ar: string | null
  price: number
  inventory: number
  stock_quantity: number
  status: 'draft' | 'active'
  slug: string
  description: string | null
  description_ar: string | null
  currency: string
  category: string | null
  category_ar: string | null
  category_id: string | null
  tags: string[]
  image_url: string | null
  images: string[]
  sku: string | null
  ai_generated: boolean
  ai_confidence: 'high' | 'medium' | 'low' | null
  created_at: string
  updated_at: string | null
  published_at: string | null
}

interface ProductListFilters {
  search: string
  status: 'draft' | 'active' | ''
  categoryId: string
  stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock' | ''
}

interface UseProductListOptions {
  initialProducts?: StoreProduct[]
  initialNextCursor?: string | null
  initialTotalCount?: number
  limit?: number
}

export function useProductList(options: UseProductListOptions = {}) {
  const [products, setProducts] = useState<StoreProduct[]>(options.initialProducts ?? [])
  const [nextCursor, setNextCursor] = useState<string | null>(options.initialNextCursor ?? null)
  const [totalCount, setTotalCount] = useState(options.initialTotalCount ?? 0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState<ProductListFilters>({
    search: '',
    status: '',
    categoryId: '',
    stockLevel: '',
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const limit = options.limit ?? 20
  const abortRef = useRef<AbortController | null>(null)

  const buildParams = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    if (cursor) params.set('cursor', cursor)
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.stockLevel) params.set('stockLevel', filters.stockLevel)
    return params
  }, [filters, limit])

  const fetchProducts = useCallback(async (cursor?: string | null, append = false) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = buildParams(cursor)
      const res = await fetch(`/api/admin/products?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()

      if (append) {
        setProducts(prev => [...prev, ...data.products])
      } else {
        setProducts(data.products)
      }
      setNextCursor(data.nextCursor)
      setTotalCount(data.totalCount)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to fetch products:', err)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) {
      fetchProducts(nextCursor, true)
    }
  }, [nextCursor, loadingMore, fetchProducts])

  const refresh = useCallback(() => {
    setSelectedIds(new Set())
    fetchProducts()
  }, [fetchProducts])

  // Refetch when filters change (debounced for search)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const updateFilter = useCallback(<K extends keyof ProductListFilters>(key: K, value: ProductListFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts()
    }, filters.search ? 300 : 0)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }, [selectedIds.size, products])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  // Bulk actions
  const bulkAction = useCallback(async (action: 'publish' | 'unpublish' | 'delete') => {
    const productIds = Array.from(selectedIds)
    if (productIds.length === 0) return

    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds }),
      })
      if (!res.ok) throw new Error('Bulk action failed')
      clearSelection()
      refresh()
    } catch (err) {
      console.error('Bulk action failed:', err)
    }
  }, [selectedIds, clearSelection, refresh])

  return {
    products,
    loading,
    loadingMore,
    nextCursor,
    totalCount,
    hasMore: !!nextCursor,
    filters,
    updateFilter,
    loadMore,
    refresh,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkAction,
    allSelected: products.length > 0 && selectedIds.size === products.length,
  }
}
