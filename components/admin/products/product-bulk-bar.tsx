"use client"

import { Eye, EyeOff, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface ProductBulkBarProps {
  selectedCount: number
  onPublish: () => void
  onUnpublish: () => void
  onDelete: () => void
  onClear: () => void
}

export function ProductBulkBar({ selectedCount, onPublish, onUnpublish, onDelete, onClear }: ProductBulkBarProps) {
  const t = useTranslations("admin")

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card shadow-xl px-4 py-3">
      <span className="text-sm font-semibold whitespace-nowrap">
        {t("products.selectedCount", { count: selectedCount })}
      </span>
      <div className="h-5 w-px bg-border" />
      <Button size="sm" variant="outline" onClick={onPublish} className="gap-1.5">
        <Eye className="w-3.5 h-3.5" /> {t("products.publish")}
      </Button>
      <Button size="sm" variant="outline" onClick={onUnpublish} className="gap-1.5">
        <EyeOff className="w-3.5 h-3.5" /> {t("products.unpublish")}
      </Button>
      <Button size="sm" variant="outline" onClick={onDelete} className="gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-500/10">
        <Trash2 className="w-3.5 h-3.5" /> {t("products.delete")}
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={onClear}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
