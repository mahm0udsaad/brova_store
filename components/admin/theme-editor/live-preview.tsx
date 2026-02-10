"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { RefreshCw, ExternalLink, Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LivePreviewProps {
  previewToken?: string
}

export function LivePreview({ previewToken }: LivePreviewProps) {
  const t = useTranslations("admin.themeEditor")
  const locale = useLocale()
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const [refreshKey, setRefreshKey] = useState(0)

  const previewUrl = previewToken
    ? `/${locale}/preview?token=${previewToken}`
    : `/${locale}/preview?template=general`

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleOpenNewTab = () => {
    window.open(previewUrl, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            {t("previewDesktop")}
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            {t("previewMobile")}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenNewTab} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t("openNewTab")}
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-900">
        <div
          className={cn(
            "mx-auto bg-white dark:bg-black transition-[max-width] duration-300",
            viewMode === "mobile" ? "max-w-[375px]" : "w-full"
          )}
        >
          <div
            className={cn(
              "relative border rounded-lg overflow-hidden",
              viewMode === "mobile" && "shadow-xl"
            )}
            style={{ aspectRatio: viewMode === "mobile" ? "375/667" : "16/9" }}
          >
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full"
              title="Store Preview"
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
