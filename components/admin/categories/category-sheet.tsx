"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
}

interface CategorySheetProps {
  open: boolean
  category?: StoreCategory | null
  parentCategories: StoreCategory[]
  onClose: () => void
  onSave: (data: { name: string; name_ar?: string; parent_id?: string | null }) => Promise<void>
}

export function CategorySheet({ open, category, parentCategories, onClose, onSave }: CategorySheetProps) {
  const t = useTranslations("admin")
  const [name, setName] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setNameAr(category.name_ar || "")
      setParentId(category.parent_id || "")
    } else {
      setName("")
      setNameAr("")
      setParentId("")
    }
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        name_ar: nameAr.trim() || undefined,
        parent_id: parentId || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              {category ? t("categories.editCategory") : t("categories.addCategory")}
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("categories.nameEn")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("categories.nameEnPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("categories.nameAr")}</label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t("categories.nameArPlaceholder")}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("categories.parentCategory")}</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">{t("categories.noParent")}</option>
                {parentCategories
                  .filter(c => c.id !== category?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("categories.cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving || !name.trim()}>
              {saving ? t("categories.saving") : category ? t("categories.update") : t("categories.create")}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
