"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Pencil,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

interface DraftProductCardProps {
  draftId: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  imageUrls: string[]
  primaryImageUrl: string
  suggestedPrice?: number
  category?: string
  categoryAr?: string
  tags?: string[]
  aiConfidence?: "high" | "medium" | "low"
  locale?: "en" | "ar"
  onEdit?: (draftId: string, field: string) => void
  onDiscard?: (draftId: string) => void
  onSelect?: (draftId: string, selected: boolean) => void
  selected?: boolean
}

export function DraftProductCard({
  draftId,
  name,
  nameAr,
  description,
  descriptionAr,
  imageUrls,
  primaryImageUrl,
  suggestedPrice,
  category,
  categoryAr,
  tags,
  aiConfidence,
  locale = "en",
  onEdit,
  onDiscard,
  onSelect,
  selected = false,
}: DraftProductCardProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const isRtl = locale === "ar"
  const displayName = isRtl && nameAr ? nameAr : name
  const displayDesc = isRtl && descriptionAr ? descriptionAr : description
  const displayCategory = isRtl && categoryAr ? categoryAr : category

  const confidenceColors = {
    high: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const prevImage = () =>
    setCurrentImageIdx((i) =>
      i === 0 ? imageUrls.length - 1 : i - 1
    )
  const nextImage = () =>
    setCurrentImageIdx((i) =>
      i === imageUrls.length - 1 ? 0 : i + 1
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all",
        selected
          ? "border-violet-500 ring-2 ring-violet-500/20"
          : "border-border hover:border-violet-300"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <button
          onClick={() => onSelect(draftId, !selected)}
          className={cn(
            "absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
            selected
              ? "border-violet-500 bg-violet-500 text-white"
              : "border-white/60 bg-black/20 text-transparent hover:border-white"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}

      {/* AI confidence badge */}
      {aiConfidence && (
        <div
          className={cn(
            "absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            confidenceColors[aiConfidence]
          )}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {aiConfidence}
        </div>
      )}

      {/* Image slider */}
      <div className="relative aspect-square bg-muted">
        {imageUrls.length > 0 ? (
          <Image
            src={imageUrls[currentImageIdx] || primaryImageUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {/* Primary indicator */}
        {imageUrls[currentImageIdx] === primaryImageUrl && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-2.5 w-2.5 fill-current" />
            Primary
          </div>
        )}

        {/* Navigation arrows */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {imageUrls.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    idx === currentImageIdx
                      ? "w-3 bg-white"
                      : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 p-3">
        {displayCategory && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {displayCategory}
          </span>
        )}

        <h3 className="text-sm font-semibold leading-tight text-foreground">
          {displayName}
        </h3>

        {displayDesc && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {displayDesc}
          </p>
        )}

        {suggestedPrice != null && suggestedPrice > 0 && (
          <p className="text-sm font-bold text-foreground">
            {suggestedPrice.toLocaleString()} EGP
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {onEdit && (
            <button
              onClick={() => onEdit(draftId, "name")}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
              {isRtl ? "تعديل" : "Edit"}
            </button>
          )}
          {onDiscard && (
            <button
              onClick={() => onDiscard(draftId)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
              {isRtl ? "حذف" : "Discard"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
