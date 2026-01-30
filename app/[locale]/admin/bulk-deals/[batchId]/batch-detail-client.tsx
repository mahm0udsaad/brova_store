"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Package,
  AlertCircle,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { bulkDeals as arBulkDeals } from "@/lib/i18n/ar/bulk-deals"
import { bulkDeals as enBulkDeals } from "@/lib/i18n/en/bulk-deals"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  DraftProductCard,
  type DraftProduct,
} from "@/components/admin/DraftProductCard"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface BatchImage {
  id: string
  batch_id: string
  storage_id: string
  file_name: string
  original_url: string | null
  processed_url: string | null
  processing_data: any
  status: "pending" | "processing" | "completed" | "failed"
  error_message: string | null
  created_at: string
  updated_at: string
}

interface Batch {
  id: string
  name: string
  status: "pending" | "analyzing" | "processing" | "completed" | "failed" | "paused"
  source_urls: string[]
  product_groups: any[]
  config: any
  total_images: number
  processed_count: number
  failed_count: number
  current_product: string | null
  error_log: any[]
  created_at: string
  updated_at: string
  completed_at: string | null
}

interface BatchDetailClientProps {
  batch: Batch
  initialImages: BatchImage[]
}

type StatusConfig = {
  icon: LucideIcon
  label: string
  color: string
  spin?: boolean
}

export function BatchDetailClient({ batch: initialBatch, initialImages }: BatchDetailClientProps) {
  const locale = useLocale()
  const labels = locale === "ar" ? arBulkDeals : enBulkDeals
  const router = useRouter()
  const [batch, setBatch] = useState<Batch>(initialBatch)
  const [images, setImages] = useState<BatchImage[]>(initialImages)
  const [selectedImage, setSelectedImage] = useState<BatchImage | null>(null)

  // Draft generation state — all in-memory, no persistence
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([])
  const [generationError, setGenerationError] = useState<string | null>(null)

  const statusConfig: Record<Batch["status"], StatusConfig> = {
    pending: { icon: Clock, label: labels.pending, color: "text-yellow-500 bg-yellow-500/10" },
    analyzing: { icon: Loader2, label: labels.analyzing, color: "text-blue-500 bg-blue-500/10", spin: true },
    processing: { icon: Loader2, label: labels.processingStatus, color: "text-violet-500 bg-violet-500/10", spin: true },
    completed: { icon: CheckCircle2, label: labels.completed, color: "text-green-500 bg-green-500/10" },
    failed: { icon: XCircle, label: labels.failed, color: "text-red-500 bg-red-500/10" },
    paused: { icon: Pause, label: labels.paused, color: "text-orange-500 bg-orange-500/10" },
  }

  const imageStatusConfig: Record<BatchImage["status"], StatusConfig> = {
    pending: { icon: Clock, label: labels.pending, color: "text-yellow-500" },
    processing: { icon: Loader2, label: labels.processingStatus, color: "text-violet-500", spin: true },
    completed: { icon: CheckCircle2, label: labels.completed, color: "text-green-500" },
    failed: { icon: XCircle, label: labels.failed, color: "text-red-500" },
  }

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()

    const batchChannel = supabase
      .channel(`batch-${batch.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bulk_deal_batches",
          filter: `id=eq.${batch.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Batch>) => {
          setBatch(payload.new as Batch)
        }
      )
      .subscribe()

    const imagesChannel = supabase
      .channel(`batch-images-${batch.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bulk_deal_images",
          filter: `batch_id=eq.${batch.id}`,
        },
        (payload: RealtimePostgresChangesPayload<BatchImage>) => {
          if (payload.eventType === "INSERT") {
            setImages((prev) => [...prev, payload.new as BatchImage])
          } else if (payload.eventType === "UPDATE") {
            setImages((prev) =>
              prev.map((img) =>
                img.id === payload.new.id ? (payload.new as BatchImage) : img
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(batchChannel)
      supabase.removeChannel(imagesChannel)
    }
  }, [batch.id])

  // Generate draft products from batch images
  const handleGenerateDrafts = async () => {
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const response = await fetch("/api/admin/bulk-deals/generate-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate drafts")
      }

      const data = await response.json()
      setDraftProducts(data.drafts)
    } catch (error) {
      console.error("Draft generation error:", error)
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate drafts"
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateDraft = (updated: DraftProduct) => {
    setDraftProducts((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    )
  }

  const handleRemoveDraft = (id: string) => {
    setDraftProducts((prev) => prev.filter((d) => d.id !== id))
  }

  const batchStatus = statusConfig[batch.status]
  const BatchStatusIcon = batchStatus.icon
  const progress =
    batch.total_images > 0
      ? (batch.processed_count / batch.total_images) * 100
      : 0

  const shotMode = batch.config?.shotMode || "single"
  const shotCount = batch.config?.shotCount || 1

  const canGenerateDrafts =
    images.length > 0 &&
    !isGenerating &&
    draftProducts.length === 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/admin/bulk-deals`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{batch.name}</h1>
            <p className="text-sm text-muted-foreground">
              {labels.batchInfo} • {new Date(batch.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
            </p>
          </div>
          {canGenerateDrafts && (
            <Button
              onClick={handleGenerateDrafts}
              className="bg-gradient-to-r from-violet-500 to-purple-600 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {locale === "ar" ? "توليد مسودات المنتجات" : "Generate Draft Products"}
            </Button>
          )}
          {isGenerating && (
            <Button disabled className="gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {locale === "ar" ? "جاري التحليل..." : "Analyzing..."}
            </Button>
          )}
        </div>

        {/* Batch Info Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{labels.batchStatus}</p>
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", batchStatus.color)}>
                  <BatchStatusIcon
                    className={cn("w-4 h-4", batchStatus.spin && "animate-spin")}
                  />
                </div>
                <span className="font-medium">{batchStatus.label}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{labels.shotMode}</p>
              <p className="font-medium">
                {shotMode === "single"
                  ? labels.singleShot
                  : `${labels.multiShot} (${shotCount})`}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{labels.totalImages}</p>
              <p className="text-2xl font-bold">{batch.total_images}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{labels.processingStatus}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-500">
                    {batch.processed_count} {labels.completed}
                  </span>
                  {batch.failed_count > 0 && (
                    <span className="text-red-500">
                      {batch.failed_count} {labels.failed}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generation in progress */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">
                  {locale === "ar"
                    ? "الذكاء الاصطناعي يحلل صورك..."
                    : "AI is analyzing your images..."}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "تجميع المنتجات المتشابهة وتوليد التفاصيل"
                    : "Grouping similar products and generating details"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Generation Error */}
        {generationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-500">
                {locale === "ar" ? "خطأ في التوليد" : "Generation Error"}
              </p>
              <p className="text-sm text-red-500/80">{generationError}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGenerationError(null)
                handleGenerateDrafts()
              }}
              className="text-xs"
            >
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </motion.div>
        )}

        {/* Draft Product Cards */}
        {draftProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Package className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {locale === "ar"
                      ? `${draftProducts.length} مسودة منتج`
                      : `${draftProducts.length} Draft Product${draftProducts.length !== 1 ? "s" : ""}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar"
                      ? "راجع وعدّل قبل الحفظ — لم يتم حفظ أي شيء بعد"
                      : "Review and edit before saving — nothing is persisted yet"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftProducts([])}
                className="text-xs text-muted-foreground"
              >
                {locale === "ar" ? "مسح الكل" : "Clear All"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {draftProducts.map((draft, idx) => (
                  <DraftProductCard
                    key={draft.id}
                    draft={draft}
                    onUpdate={handleUpdateDraft}
                    onRemove={handleRemoveDraft}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Active Processing Indicator */}
        {["analyzing", "processing"].includes(batch.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              <h3 className="font-semibold">{labels.processing}</h3>
            </div>
            {batch.current_product && (
              <p className="text-sm text-muted-foreground">
                {labels.currentProduct}: {batch.current_product}
              </p>
            )}
          </motion.div>
        )}

        {/* Images Grid */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {labels.imagesCount} ({images.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {images.map((image, idx) => {
                const imgStatus = imageStatusConfig[image.status]
                const ImgStatusIcon = imgStatus.icon

                return (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative aspect-square group cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.processed_url || image.original_url || ""}
                      alt={image.file_name}
                      className={cn(
                        "w-full h-full object-cover rounded-xl border-2 transition-all",
                        image.status === "pending" && "border-muted opacity-60",
                        image.status === "processing" &&
                          "border-violet-500 ring-2 ring-violet-500/20",
                        image.status === "completed" && "border-green-500",
                        image.status === "failed" && "border-red-500"
                      )}
                    />

                    {/* Status Overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-xl transition-opacity",
                        image.status === "pending" && "bg-background/60",
                        image.status === "processing" &&
                          "bg-violet-500/20 backdrop-blur-sm",
                        image.status === "completed" &&
                          "bg-green-500/20 backdrop-blur-sm opacity-0 group-hover:opacity-100",
                        image.status === "failed" &&
                          "bg-red-500/20 backdrop-blur-sm"
                      )}
                    >
                      <ImgStatusIcon
                        className={cn(
                          "h-8 w-8",
                          imgStatus.color,
                          imgStatus.spin && "animate-spin"
                        )}
                      />
                    </div>

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
                        image.status === "pending" && "bg-muted",
                        image.status === "processing" && "bg-violet-500",
                        image.status === "completed" && "bg-green-500",
                        image.status === "failed" && "bg-red-500"
                      )}
                    >
                      <ImgStatusIcon
                        className={cn(
                          "h-3 w-3 text-white",
                          imgStatus.spin && "animate-spin"
                        )}
                      />
                    </div>

                    {/* File name */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-2 rounded-b-xl">
                      <p className="text-[10px] text-white truncate">
                        {image.file_name}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Error Log */}
        {batch.error_log && batch.error_log.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
            <h3 className="font-semibold text-red-500 mb-4">Errors</h3>
            <div className="space-y-2">
              {batch.error_log.map((error: any, idx: number) => (
                <div
                  key={idx}
                  className="text-sm text-red-500 flex items-start gap-2"
                >
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {typeof error === "string"
                      ? error
                      : error.message || JSON.stringify(error)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-card rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedImage.file_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {imageStatusConfig[selectedImage.status].label}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedImage(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4">
                {selectedImage.original_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Original</p>
                    <img
                      src={selectedImage.original_url}
                      alt="Original"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                {selectedImage.processed_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Processed</p>
                    <img
                      src={selectedImage.processed_url}
                      alt="Processed"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {selectedImage.error_message && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                    <p className="text-sm text-red-500">
                      {selectedImage.error_message}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
