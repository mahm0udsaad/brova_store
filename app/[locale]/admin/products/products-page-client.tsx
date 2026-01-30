"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFilters } from "@/components/admin/products/product-filters"
import { ProductTable } from "@/components/admin/products/product-table"
import { ProductBulkBar } from "@/components/admin/products/product-bulk-bar"
import { useProductList } from "@/hooks/use-product-list"
import { useLocale, useTranslations } from "next-intl"
import { triggerHaptic } from "@/lib/haptics"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
  slug: string
  store_id: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface ProductsPageClientProps {
  initialProducts: any[]
  initialNextCursor: string | null
  initialTotalCount: number
  categories: StoreCategory[]
}

export default function ProductsPageClient({
  initialProducts,
  initialNextCursor,
  initialTotalCount,
  categories,
}: ProductsPageClientProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const buildHref = (href: string) => `/${locale}${href}`
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    products,
    loading,
    loadingMore,
    totalCount,
    hasMore,
    filters,
    updateFilter,
    loadMore,
    refresh,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkAction,
    allSelected,
  } = useProductList({
    initialProducts,
    initialNextCursor,
    initialTotalCount,
  })

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(t("products.confirmDelete", { name: productName }))) return

    setDeleteError(null)
    triggerHaptic("warning")

    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      triggerHaptic("success")
      refresh()
    } catch {
      setDeleteError(t("products.deleteError"))
      triggerHaptic("error")
    }
  }

  const handleBulkDelete = () => {
    if (!confirm(t("products.confirmBulkDelete", { count: selectedIds.size }))) return
    triggerHaptic("warning")
    bulkAction('delete')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("products.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("products.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href={buildHref("/admin/products/new")}>
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" /> {t("products.addProduct")}
              </Button>
            </Link>
          </div>
        </div>

        {deleteError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-500">{deleteError}</p>
          </div>
        )}

        {/* Filters */}
        <ProductFilters
          search={filters.search}
          status={filters.status}
          categoryId={filters.categoryId}
          stockLevel={filters.stockLevel}
          categories={categories}
          onSearchChange={(v) => updateFilter('search', v)}
          onStatusChange={(v) => updateFilter('status', v)}
          onCategoryChange={(v) => updateFilter('categoryId', v)}
          onStockLevelChange={(v) => updateFilter('stockLevel', v)}
          totalCount={totalCount}
        />

        {/* Table */}
        <ProductTable
          products={products}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onDelete={handleDelete}
          loading={loading}
        />

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? t("products.loadingMore") : t("products.loadMore")}
            </Button>
          </div>
        )}

        {/* Bulk bar */}
        <ProductBulkBar
          selectedCount={selectedIds.size}
          onPublish={() => bulkAction('publish')}
          onUnpublish={() => bulkAction('unpublish')}
          onDelete={handleBulkDelete}
          onClear={clearSelection}
        />
      </div>
    </div>
  )
}
