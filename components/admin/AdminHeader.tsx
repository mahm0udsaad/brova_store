"use client"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Rocket, CheckCircle2, Loader2, Search, Command } from "lucide-react"
import { publishStore } from "@/lib/actions/store"
import { useTranslations } from "next-intl"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton } from "@/components/admin/UserButton"

export const AdminHeader = memo(function AdminHeader({ storeStatus, storeSlug, orgSlug }: { storeStatus: string, storeSlug: string, orgSlug: string }) {
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
    if (!orgSlug) {
      window.open("/", "_blank")
      return
    }
    const hostname = window.location.hostname
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1"
    const port = window.location.port ? `:${window.location.port}` : ""

    const storeUrl = isLocal
      ? `http://${orgSlug}.localhost${port}`
      : `https://${orgSlug}.brova.app`

    window.open(storeUrl, "_blank")
  }

  return (
    <div className="h-16 px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shrink-0 bg-transparent backdrop-blur-sm">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Command Bar Placeholder */}
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <div className="h-9 w-full rounded-full border border-white/10 bg-white/5 px-10 text-sm flex items-center text-muted-foreground hover:bg-white/10 hover:border-white/20 transition-all cursor-text shadow-sm">
            <span className="opacity-50">{t("searchPlaceholder") || "Ask AI or search..."}</span>
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <ThemeToggle compact />
          <UserButton />
        </div>
      </div>
    </div>
  )
})
