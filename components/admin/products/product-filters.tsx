"use client"

import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
}

interface ProductFiltersProps {
  search: string
  status: string
  categoryId: string
  stockLevel: string
  categories: StoreCategory[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: 'draft' | 'active' | '') => void
  onCategoryChange: (value: string) => void
  onStockLevelChange: (value: 'in_stock' | 'low_stock' | 'out_of_stock' | '') => void
  totalCount: number
}

export function ProductFilters({
  search, status, categoryId, stockLevel, categories,
  onSearchChange, onStatusChange, onCategoryChange, onStockLevelChange,
  totalCount,
}: ProductFiltersProps) {
  const t = useTranslations("admin")
  const hasFilters = status || categoryId || stockLevel

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("products.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as 'draft' | 'active' | '')}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">{t("products.allStatuses")}</option>
            <option value="active">{t("products.published")}</option>
            <option value="draft">{t("products.draft")}</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">{t("products.allCategories")}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={stockLevel}
            onChange={(e) => onStockLevelChange(e.target.value as 'in_stock' | 'low_stock' | 'out_of_stock' | '')}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">{t("products.allStock")}</option>
            <option value="in_stock">{t("products.inStock")}</option>
            <option value="low_stock">{t("products.lowStock")}</option>
            <option value="out_of_stock">{t("products.outOfStock")}</option>
          </select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              onClick={() => {
                onStatusChange('')
                onCategoryChange('')
                onStockLevelChange('')
              }}
            >
              <X className="w-4 h-4 mr-1" />
              {t("products.clearFilters")}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("products.showingCount", { count: totalCount })}
      </p>
    </div>
  )
}
