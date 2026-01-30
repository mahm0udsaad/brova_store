"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Rocket, CheckCircle2, Loader2 } from "lucide-react"
import { publishStore } from "@/lib/actions/store"
import { useTranslations } from "next-intl"

export function AdminHeader({ storeStatus, storeSlug }: { storeStatus: string, storeSlug: string }) {
  const t = useTranslations("admin")
  const [isPublishing, setIsPublishing] = useState(false)
  const [status, setStatus] = useState(storeStatus)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await publishStore()
      setStatus("active")
    } catch (error) {
      console.error("Failed to publish", error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    window.open(`/`, "_blank")
  }

  return (
    <div className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-2">
        {/* Placeholder for future breadcrumbs */}
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePreview}>
          <ExternalLink className="w-4 h-4 mr-2" />
          {t("header.previewStore")}
        </Button>
        
        {status === "active" ? (
          <Button variant="ghost" size="sm" className="text-green-600 bg-green-50 pointer-events-none hover:bg-green-100 hover:text-green-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("header.published")}
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={handlePublish} 
            disabled={isPublishing}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
            {isPublishing ? t("header.publishing") : t("header.publishStore")}
          </Button>
        )}
      </div>
    </div>
  )
}
