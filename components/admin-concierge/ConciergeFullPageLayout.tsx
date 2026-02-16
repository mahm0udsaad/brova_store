"use client"

import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ConciergeConversation } from "./ConciergeConversation"
import { LiveStorePreview } from "./preview/LiveStorePreview"

interface ConciergeFullPageLayoutProps {
  storeId: string
  onRequestReview: () => void
}

export function ConciergeFullPageLayout({
  storeId,
  onRequestReview,
}: ConciergeFullPageLayoutProps) {
  const locale = useLocale()
  const isRtl = locale === "ar"

  return (
    <div
      className={cn(
        "flex flex-1 min-h-0",
        isRtl ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Chat panel */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          "border-border",
          isRtl ? "border-l" : "border-r"
        )}
      >
        <ConciergeConversation
          onRequestReview={onRequestReview}
          storeId={storeId}
        />
      </div>

      {/* Preview panel — hidden on mobile */}
      <div className="w-[420px] shrink-0 bg-muted/30 hidden lg:flex flex-col">
        <LiveStorePreview />
      </div>
    </div>
  )
}
