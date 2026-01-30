"use client"

import { Sparkles, Tag, DollarSign, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface AIActionBarProps {
  onImproveDescription: () => void
  onSuggestCategory: () => void
  onOptimizePrice: () => void
  loading?: boolean
  loadingAction?: string
}

export function AIActionBar({
  onImproveDescription, onSuggestCategory, onOptimizePrice, loading, loadingAction,
}: AIActionBarProps) {
  const t = useTranslations("admin")

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-500">{t("editor.aiAssist")}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-600"
          onClick={onImproveDescription}
          disabled={loading}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loadingAction === 'improve-description' ? t("editor.aiWorking") : t("editor.improveDescription")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-600"
          onClick={onSuggestCategory}
          disabled={loading}
        >
          <Tag className="w-3.5 h-3.5" />
          {loadingAction === 'suggest-category' ? t("editor.aiWorking") : t("editor.suggestCategory")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-600"
          onClick={onOptimizePrice}
          disabled={loading}
        >
          <DollarSign className="w-3.5 h-3.5" />
          {loadingAction === 'optimize-price' ? t("editor.aiWorking") : t("editor.optimizePrice")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-500/20 opacity-50 cursor-not-allowed"
          disabled
          title={t("editor.comingSoon")}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {t("editor.editImage")}
        </Button>
      </div>
    </div>
  )
}
