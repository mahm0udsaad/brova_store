"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image,
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Download,
  Wand2,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { useLocale, useTranslations } from "next-intl"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface Asset {
  id: string
  asset_type: string
  source_url: string | null
  generated_url: string
  prompt: string | null
  product_id: string | null
  created_at: string
  metadata: any
}

interface Product {
  id: string
  name: string
  image_url: string | null
}

interface MediaPageClientProps {
  initialAssets: Asset[]
  products: Product[]
}

export function MediaPageClient({ initialAssets, products }: MediaPageClientProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const isRtl = locale === "ar"
  const assetTypeLabels: Record<string, string> = {
    product_image: t("mediaPage.assetTypes.productImage"),
    lifestyle: t("mediaPage.assetTypes.lifestyle"),
    try_on: t("mediaPage.assetTypes.tryOn"),
    background_removed: t("mediaPage.assetTypes.backgroundRemoved"),
    model_shot: t("mediaPage.assetTypes.modelShot"),
    video_thumbnail: t("mediaPage.assetTypes.videoThumbnail"),
  }
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { setPageContext, isGenerating, currentActivity, currentAgent } = useAdminAssistant()

  // Set page context for AI assistant
  useEffect(() => {
    setPageContext({
      pageName: t("mediaPage.title"),
      pageType: "media",
      selectedItems: selectedAssets,
      filters: { type: filterType, search: searchQuery },
      capabilities: [
        t("mediaPage.capabilities.removeBackground"),
        t("mediaPage.capabilities.lifestyleShots"),
        t("mediaPage.capabilities.tryOn"),
        t("mediaPage.capabilities.batchProcess"),
        t("mediaPage.capabilities.organize"),
      ],
    })
  }, [selectedAssets, filterType, searchQuery, setPageContext, t])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("assets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generated_assets" },
        (payload: RealtimePostgresChangesPayload<Asset>) => {
          if (payload.eventType === "INSERT") {
            setAssets((prev) => [payload.new as Asset, ...prev])
          } else if (payload.eventType === "DELETE") {
            setAssets((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = !searchQuery ||
      asset.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === "all" || asset.asset_type === filterType

    return matchesSearch && matchesType
  })

  const toggleSelect = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(filteredAssets.map((a) => a.id))
    }
  }

  const handleDelete = async () => {
    if (!selectedAssets.length) return
    if (!confirm(t("mediaPage.confirmDelete", { count: selectedAssets.length }))) return

    const supabase = createClient()

    for (const id of selectedAssets) {
      await supabase.from("generated_assets").delete().eq("id", id)
    }

    setSelectedAssets([])
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* AI Activity Indicator */}
        <AnimatePresence>
          {isGenerating && currentAgent === "photographer" && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            >
              <div className="rounded-xl border bg-card/95 backdrop-blur-lg shadow-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-semibold text-foreground",
                      isRtl && "text-right"
                    )}>
                      {t("mediaPage.generatingTitle")}
                    </p>
                    <p className={cn(
                      "text-xs text-muted-foreground truncate",
                      isRtl && "text-right"
                    )}>
                      {currentActivity || t("mediaPage.generatingSubtitle")}
                    </p>
                  </div>
                  <Loader2 className="h-5 w-5 text-violet-500 animate-spin flex-shrink-0" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
          isRtl && "sm:flex-row-reverse"
        )}>
          <div className={cn(isRtl && "text-right")}>
            <h1 className="text-2xl font-bold">
              {t("mediaPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("mediaPage.subtitle")}
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-3",
            isRtl && "flex-row-reverse"
          )}>
            <Button variant="outline" disabled={isUploading}>
              <Upload className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
              {t("mediaPage.actions.upload")}
            </Button>
            <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <Wand2 className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
              {t("mediaPage.actions.generate")}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center gap-4",
          isRtl && "sm:flex-row-reverse"
        )}>
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
              isRtl ? "right-3" : "left-3"
            )} />
            <input
              type="text"
              placeholder={t("mediaPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4"
              )}
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className={cn(
            "flex items-center gap-2 flex-wrap",
            isRtl && "flex-row-reverse"
          )}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={cn(
                "px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm",
                isRtl && "text-right"
              )}
              dir={isRtl ? "rtl" : "ltr"}
            >
              <option value="all">{t("mediaPage.filters.allTypes")}</option>
              {Object.entries(assetTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <div className="flex items-center border rounded-xl overflow-hidden">
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("rounded-none", viewMode === "grid" && "bg-muted")}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("rounded-none", viewMode === "list" && "bg-muted")}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        <AnimatePresence>
          {selectedAssets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-muted",
                isRtl && "flex-row-reverse"
              )}
            >
              <span className="text-sm font-medium">
                {t("mediaPage.selection.count", { count: selectedAssets.length })}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedAssets.length === filteredAssets.length 
                  ? t("mediaPage.selection.deselectAll")
                  : t("mediaPage.selection.selectAll")}
              </Button>
              <Button variant="outline" size="sm">
                <Download className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                {t("mediaPage.selection.download")}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                {t("mediaPage.selection.delete")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assets Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Skeleton Loading for AI Generated Images */}
            {isGenerating && currentAgent === "photographer" && (
              <>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="aspect-square rounded-xl overflow-hidden border bg-muted"
                  >
                    <div className="relative w-full h-full">
                      <Skeleton className="w-full h-full" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                          <p className="text-xs text-muted-foreground">
                            {t("mediaPage.generatingInline")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  "group relative aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer transition-all",
                  selectedAssets.includes(asset.id) && "ring-2 ring-primary"
                )}
                onClick={() => toggleSelect(asset.id)}
              >
                <img
                  src={asset.generated_url}
                  alt={asset.prompt || t("mediaPage.assetAlt")}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <div className={cn(
                    "absolute top-2",
                    isRtl ? "right-2" : "left-2"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedAssets.includes(asset.id)
                        ? "bg-primary border-primary"
                        : "border-white/60 group-hover:border-white"
                    )}>
                      {selectedAssets.includes(asset.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity",
                    isRtl ? "right-2 left-2" : "left-2 right-2"
                  )}>
                    <span className="text-xs font-medium text-white px-2 py-1 rounded-full bg-black/50">
                      {assetTypeLabels[asset.asset_type] || asset.asset_type}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl border bg-card cursor-pointer transition-all hover:bg-muted",
                  selectedAssets.includes(asset.id) && "ring-2 ring-primary"
                )}
                onClick={() => toggleSelect(asset.id)}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  selectedAssets.includes(asset.id)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/40"
                )}>
                  {selectedAssets.includes(asset.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                <img
                  src={asset.generated_url}
                  alt={asset.prompt || t("mediaPage.assetAlt")}
                  className="w-14 h-14 rounded-lg object-cover"
                />

                <div className={cn(
                  "flex-1 min-w-0",
                  isRtl && "text-right"
                )}>
                  <p className="text-sm font-medium truncate">
                    {asset.prompt || t("mediaPage.untitled")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assetTypeLabels[asset.asset_type] || asset.asset_type}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(asset.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredAssets.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("text-center py-16", isRtl && "text-right")}
          >
            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {t("mediaPage.empty.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterType !== "all"
                ? t("mediaPage.empty.filtered")
                : t("mediaPage.empty.default")}
            </p>
            <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Wand2 className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
              {t("mediaPage.empty.cta")}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
