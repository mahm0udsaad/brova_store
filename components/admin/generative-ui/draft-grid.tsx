"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DraftProductCard } from "./draft-product-card"
import { CheckCheck, Trash2, Package } from "lucide-react"

interface Draft {
  draft_id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  image_urls: string[]
  primary_image_url: string
  suggested_price?: number
  category?: string
  category_ar?: string
  tags?: string[]
  ai_confidence?: "high" | "medium" | "low"
  status: string
}

interface DraftGridProps {
  drafts: Draft[]
  locale?: "en" | "ar"
  onEdit?: (draftId: string, field: string) => void
  onDiscard?: (draftIds: string[]) => void
  onApprove?: (draftIds: string[]) => void
}

export function DraftGrid({
  drafts,
  locale = "en",
  onEdit,
  onDiscard,
  onApprove,
}: DraftGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const isRtl = locale === "ar"

  const toggleSelect = useCallback((draftId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(draftId)
      else next.delete(draftId)
      return next
    })
  }, [])

  const selectAll = () =>
    setSelectedIds(new Set(drafts.map((d) => d.draft_id)))
  const deselectAll = () => setSelectedIds(new Set())

  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
      >
        <div className="flex items-center gap-3">
          <Package className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium">
            {drafts.length} {isRtl ? "مسودة" : "draft(s)"}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-xs text-muted-foreground">
              ({selectedIds.size} {isRtl ? "محدد" : "selected"})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {allSelected
              ? isRtl
                ? "إلغاء الكل"
                : "Deselect all"
              : isRtl
                ? "تحديد الكل"
                : "Select all"}
          </button>

          {selectedIds.size > 0 && onDiscard && (
            <button
              onClick={() => onDiscard(Array.from(selectedIds))}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
              {isRtl ? "حذف" : "Discard"}
            </button>
          )}

          {selectedIds.size > 0 && onApprove && (
            <button
              onClick={() => onApprove(Array.from(selectedIds))}
              className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
            >
              <CheckCheck className="h-3 w-3" />
              {isRtl ? "إنشاء المنتجات" : "Create Products"} (
              {selectedIds.size})
            </button>
          )}
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {drafts.map((draft, idx) => (
          <motion.div
            key={draft.draft_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <DraftProductCard
              draftId={draft.draft_id}
              name={draft.name}
              nameAr={draft.name_ar}
              description={draft.description}
              descriptionAr={draft.description_ar}
              imageUrls={draft.image_urls}
              primaryImageUrl={draft.primary_image_url}
              suggestedPrice={draft.suggested_price}
              category={draft.category}
              categoryAr={draft.category_ar}
              tags={draft.tags}
              aiConfidence={draft.ai_confidence}
              locale={locale}
              onEdit={onEdit}
              onDiscard={onDiscard ? (id) => onDiscard([id]) : undefined}
              onSelect={toggleSelect}
              selected={selectedIds.has(draft.draft_id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
