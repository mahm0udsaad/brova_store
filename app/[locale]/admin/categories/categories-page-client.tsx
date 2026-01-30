"use client"

import { useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryList } from "@/components/admin/categories/category-list"
import { CategorySheet } from "@/components/admin/categories/category-sheet"
import { useTranslations } from "next-intl"
import { triggerHaptic } from "@/lib/haptics"

interface StoreCategory {
  id: string
  store_id?: string
  name: string
  name_ar: string | null
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

interface CategoriesPageClientProps {
  initialCategories: StoreCategory[]
}

export default function CategoriesPageClient({ initialCategories }: CategoriesPageClientProps) {
  const t = useTranslations("admin")
  const [categories, setCategories] = useState<StoreCategory[]>(initialCategories)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshCategories = useCallback(async () => {
    const res = await fetch('/api/admin/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data.categories)
    }
  }, [])

  const handleEdit = (category: StoreCategory) => {
    setEditingCategory(category)
    setSheetOpen(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setSheetOpen(true)
  }

  const handleSave = async (data: { name: string; name_ar?: string; parent_id?: string | null }) => {
    setError(null)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Update failed')
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Create failed')
      }
      triggerHaptic("success")
      await refreshCategories()
    } catch {
      setError(t("categories.saveError"))
      triggerHaptic("error")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("categories.confirmDelete", { name }))) return
    triggerHaptic("warning")

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      triggerHaptic("success")
      await refreshCategories()
    } catch {
      setError(t("categories.deleteError"))
      triggerHaptic("error")
    }
  }

  const handleReorder = async (orderedIds: string[]) => {
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
      if (!res.ok) throw new Error('Reorder failed')
      await refreshCategories()
    } catch {
      setError(t("categories.reorderError"))
    }
  }

  const topLevelCategories = categories.filter(c => !c.parent_id)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("categories.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("categories.subtitle")}</p>
          </div>
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="w-4 h-4" /> {t("categories.add")}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <CategoryList
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />

        <CategorySheet
          open={sheetOpen}
          category={editingCategory}
          parentCategories={topLevelCategories}
          onClose={() => setSheetOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
