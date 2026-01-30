"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers,
  Upload,
  FolderUp,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image,
  Clock,
  Loader2,
  Sparkles,
  Package,
  ChevronRight,
  X,
  Minus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { ImageDetailModal } from "@/components/admin/ImageDetailModal"
import { BatchDetailModal } from "@/components/admin/BatchDetailModal"
import { bulkDeals as arBulkDeals } from "@/lib/i18n/ar/bulk-deals"
import { bulkDeals as enBulkDeals } from "@/lib/i18n/en/bulk-deals"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface BulkBatch {
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

interface BulkDealsPageClientProps {
  initialBatches: BulkBatch[]
}

const buildStatusConfig = (
  labels: typeof enBulkDeals
): Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; spin?: boolean }> => ({
  pending: { icon: Clock, label: labels.pending, color: "text-yellow-500 bg-yellow-500/10" },
  analyzing: { icon: Loader2, label: labels.analyzing, color: "text-blue-500 bg-blue-500/10", spin: true },
  processing: { icon: Loader2, label: labels.processingStatus, color: "text-violet-500 bg-violet-500/10", spin: true },
  completed: { icon: CheckCircle2, label: labels.completed, color: "text-green-500 bg-green-500/10" },
  failed: { icon: XCircle, label: labels.failed, color: "text-red-500 bg-red-500/10" },
  paused: { icon: Pause, label: labels.paused, color: "text-orange-500 bg-orange-500/10" },
})

interface UploadingFile {
  file: File
  preview: string
  status: "pending" | "uploading" | "completed" | "failed"
  progress: number
  url?: string
  storageId?: string
  error?: string
}

export function BulkDealsPageClient({ initialBatches }: BulkDealsPageClientProps) {
  const router = useRouter()
  const locale = useLocale()
  const AR_BULK_DEALS = locale === "ar" ? arBulkDeals : enBulkDeals
  const statusConfig = buildStatusConfig(AR_BULK_DEALS)
  const [batches, setBatches] = useState<BulkBatch[]>(initialBatches)
  const [selectedBatch, setSelectedBatch] = useState<BulkBatch | null>(null)
  
  // Batch creation state
  const [batchName, setBatchName] = useState("")
  const [shotMode, setShotMode] = useState<"single" | "multi">("single")
  const [shotCount, setShotCount] = useState(3)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [processingImages, setProcessingImages] = useState<{
    images: string[]
    operations: string[]
    status: "processing" | "completed"
    results?: Array<{
      originalUrl: string
      processedUrl?: string
      status: "pending" | "processing" | "completed" | "failed"
      error?: string
    }>
  } | null>(null)
  const [toast, setToast] = useState<{
    message: string
    variant: "success" | "error" | "info"
  } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const { setPageContext } = useAdminAssistant()

  // Set page context for AI assistant
  useEffect(() => {
    // Get processed image URLs if available
    const processedUrls = processingImages?.results
      ?.filter(r => r.status === "completed" && r.processedUrl)
      .map(r => r.processedUrl!) || []
    
    // Fall back to original images if no processed URLs
    const availableImages = processedUrls.length > 0 
      ? processedUrls 
      : processingImages?.images || []

    setPageContext({
      pageName: AR_BULK_DEALS.pageTitle,
      pageType: "bulk-deals",
      selectedItems: selectedBatch ? [selectedBatch.id] : [],
      filters: {},
      capabilities: [
        "Process multiple product images",
        "Remove backgrounds in batch",
        "Generate lifestyle shots",
        "Auto-create draft products",
        "Group similar images",
      ],
      availableImages: availableImages.length > 0 ? availableImages : undefined,
      contextData: processingImages ? {
        processingStatus: processingImages.status,
        operations: processingImages.operations,
        processedCount: processingImages.results?.filter(r => r.status === "completed").length || 0,
        totalCount: processingImages.images.length,
      } : undefined,
    })
  }, [selectedBatch, setPageContext, processingImages])

  // Subscribe to real-time batch updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("batch-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bulk_deal_batches" },
        (payload: RealtimePostgresChangesPayload<BulkBatch>) => {
          if (payload.eventType === "INSERT") {
            setBatches((prev) => {
              const exists = prev.some(b => b.id === payload.new.id)
              return exists ? prev : [payload.new as BulkBatch, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setBatches((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new as BulkBatch : b))
            )
            if (selectedBatch?.id === payload.new.id) {
              setSelectedBatch(payload.new as BulkBatch)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedBatch])

  // Listen for AI-triggered bulk processing
  useEffect(() => {
    const handleBulkProcessing = (event: CustomEvent) => {
      const { imageUrls, operations } = event.detail
      // Initialize with all images in processing state
      const initialResults = imageUrls.map((url: string) => ({
        originalUrl: url,
        status: "processing" as const,
      }))
      setProcessingImages({ 
        images: imageUrls, 
        operations, 
        status: "processing",
        results: initialResults,
      })
    }

    const handleProcessingResults = (event: CustomEvent) => {
      const { results, errors } = event.detail
      console.log("Received processing results:", results, errors)
      
      setProcessingImages((prev) => {
        if (!prev) return null
        
        // Map results to our format
        const updatedResults = prev.images.map((originalUrl) => {
          const result = results?.find((r: any) => r.imageUrl === originalUrl)
          const error = errors?.find((e: any) => e.imageUrl === originalUrl)
          
          if (result) {
            return {
              originalUrl,
              processedUrl: result.result?.imageUrl || result.result,
              status: "completed" as const,
            }
          } else if (error) {
            return {
              originalUrl,
              status: "failed" as const,
              error: error.error,
            }
          }
          return {
            originalUrl,
            status: "completed" as const, // Mark as completed if no specific result/error
          }
        })
        
        return {
          ...prev,
          status: "completed",
          results: updatedResults,
        }
      })
    }

    const handleToast = (event: CustomEvent) => {
      const { message, variant } = event.detail
      showToast(message, variant)
    }

    window.addEventListener("ai-start-bulk-processing" as any, handleBulkProcessing)
    window.addEventListener("ai-processing-results" as any, handleProcessingResults)
    window.addEventListener("ai-show-toast" as any, handleToast)

    return () => {
      window.removeEventListener("ai-start-bulk-processing" as any, handleBulkProcessing)
      window.removeEventListener("ai-processing-results" as any, handleProcessingResults)
      window.removeEventListener("ai-show-toast" as any, handleToast)
    }
  }, [])

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview))
    }
  }, [filePreviews])

  const showToast = (message: string, variant: "success" | "error" | "info") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 5000)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    )

    if (files.length > 0) {
      handleFilesSelected(files)
    }
  }, [selectedFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFilesSelected(files)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    const newErrors: string[] = []
    
    // Check total count
    if (selectedFiles.length + files.length > 50) {
      newErrors.push(AR_BULK_DEALS.errors.tooMany)
      setErrors(newErrors)
      return
    }

    // Filter image files only
    const imageFiles = files.filter(f => f.type.startsWith("image/"))
    
    if (imageFiles.length === 0) {
      newErrors.push(AR_BULK_DEALS.errors.noFiles)
      setErrors(newErrors)
      return
    }

    // Create preview URLs
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file))
    
    setSelectedFiles(prev => [...prev, ...imageFiles])
    setFilePreviews(prev => [...prev, ...newPreviews])
    setErrors([])
  }

  const removeFile = (index: number) => {
    // Revoke preview URL
    URL.revokeObjectURL(filePreviews[index])
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    // Revoke all preview URLs
    filePreviews.forEach(preview => URL.revokeObjectURL(preview))
    
    setSelectedFiles([])
    setFilePreviews([])
    setErrors([])
  }

  const handleUpload = async () => {
    // Validate
    const validationErrors: string[] = []
    
    if (!batchName.trim()) {
      validationErrors.push(AR_BULK_DEALS.errors.noName)
    }
    
    if (selectedFiles.length === 0) {
      validationErrors.push(AR_BULK_DEALS.errors.noFiles)
    }
    
    if (selectedFiles.length > 50) {
      validationErrors.push(AR_BULK_DEALS.errors.tooMany)
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsUploading(true)
    setErrors([])

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error(AR_BULK_DEALS.errors.authError)
      }

      // Step 1: Create batch
      const createResponse = await fetch("/api/admin/bulk-deals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchName.trim(),
          totalImages: selectedFiles.length,
          shotConfig: {
            mode: shotMode,
            shotCount: shotMode === "multi" ? shotCount : 1,
          },
        }),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(error.error || AR_BULK_DEALS.errors.uploadError)
      }

      const { batchId } = await createResponse.json()

      // Step 2: Upload files with progress tracking
      const filesToUpload: UploadingFile[] = selectedFiles.map((file, idx) => ({
        file,
        preview: filePreviews[idx],
        status: "pending" as const,
        progress: 0,
      }))

      setUploadingFiles(filesToUpload)

      const uploadedUrls: string[] = []
      let completed = 0

      // Upload in batches of 5
      const batchSize = 5
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, Math.min(i + batchSize, selectedFiles.length))
        
        await Promise.all(
          batch.map(async (file, batchIdx) => {
            const actualIdx = i + batchIdx
            const fileName = `${user.id}/bulk/${Date.now()}-${actualIdx}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

            // Update status to uploading
            setUploadingFiles(prev =>
              prev.map((uf, idx) =>
                idx === actualIdx ? { ...uf, status: "uploading" as const, progress: 50 } : uf
              )
            )

            // Upload to storage
            const { data, error } = await supabase.storage
              .from("products")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
              })

            if (error) {
              console.error(`Upload error for ${fileName}:`, error)
              setUploadingFiles(prev =>
                prev.map((uf, idx) =>
                  idx === actualIdx
                    ? { ...uf, status: "failed" as const, progress: 100, error: error.message }
                    : uf
                )
              )
              return
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from("products")
              .getPublicUrl(fileName)

            // Register image with batch
            await fetch(`/api/admin/bulk-deals/${batchId}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                storageId: fileName,
                fileName: file.name,
                originalUrl: publicUrl,
              }),
            })

            uploadedUrls.push(publicUrl)
            completed++

            // Update status to completed
            setUploadingFiles(prev =>
              prev.map((uf, idx) =>
                idx === actualIdx
                  ? { ...uf, status: "completed" as const, progress: 100, url: publicUrl, storageId: fileName }
                  : uf
              )
            )

            // Update overall progress
            setUploadProgress(Math.round((completed / selectedFiles.length) * 100))
          })
        )
      }

      // Step 3: Finalize batch
      const finalizeResponse = await fetch(`/api/admin/bulk-deals/${batchId}/finalize`, {
        method: "POST",
      })

      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize batch")
      }

      showToast(AR_BULK_DEALS.uploadSuccess, "success")

      // Navigate to batch detail page after a short delay
      setTimeout(() => {
        router.push(`/admin/bulk-deals/${batchId}`)
      }, 1500)

    } catch (error) {
      console.error("Upload error:", error)
      showToast(
        error instanceof Error ? error.message : AR_BULK_DEALS.errors.uploadError,
        "error"
      )
    } finally {
      setIsUploading(false)
    }
  }

  const startProcessing = async (batchId: string) => {
    try {
      const response = await fetch("/api/admin/bulk-deals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      })

      if (!response.ok) {
        throw new Error("Failed to start processing")
      }
      
      showToast(AR_BULK_DEALS.processingStarted, "success")
    } catch (error) {
      console.error("Processing error:", error)
      showToast(AR_BULK_DEALS.errors.processingError, "error")
    }
  }

  const handleSaveProductDetails = (details: any) => {
    console.log("Saving product details:", details)
    setSelectedImage(null)
  }

  const stats = {
    total: batches.length,
    processing: batches.filter((b) => ["analyzing", "processing"].includes(b.status)).length,
    completed: batches.filter((b) => b.status === "completed").length,
    totalImages: batches.reduce((acc, b) => acc + b.total_images, 0),
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg"
          >
            {toast.variant === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {toast.variant === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            {toast.variant === "info" && <AlertCircle className="h-5 w-5 text-blue-500" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{AR_BULK_DEALS.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {AR_BULK_DEALS.workflow.step1.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{AR_BULK_DEALS.totalBatches}</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{AR_BULK_DEALS.processingBatches}</p>
            <p className="text-2xl font-bold mt-1 text-violet-500">{stats.processing}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{AR_BULK_DEALS.completedBatches}</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{stats.completed}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{AR_BULK_DEALS.totalImages}</p>
            <p className="text-2xl font-bold mt-1">{stats.totalImages}</p>
          </div>
        </div>

        {/* Inline AI Processing Section */}
        <AnimatePresence>
          {processingImages && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-xl border bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {processingImages.status === "processing" ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {processingImages.status === "processing" ? "جاري معالجة الصور..." : "اكتملت المعالجة!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {processingImages.operations.join(", ")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setProcessingImages(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Processing Progress */}
              {processingImages.results && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span>{processingImages.results.filter(r => r.status === "pending").length} في الانتظار</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                      <span>{processingImages.results.filter(r => r.status === "processing").length} قيد المعالجة</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>{processingImages.results.filter(r => r.status === "completed").length} مكتمل</span>
                    </span>
                    {processingImages.results.filter(r => r.status === "failed").length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span>{processingImages.results.filter(r => r.status === "failed").length} فشل</span>
                      </span>
                    )}
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {processingImages.results.map((result, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          result.status === "processing" && "border-violet-500 shadow-lg shadow-violet-500/20",
                          result.status === "completed" && "border-green-500",
                          result.status === "failed" && "border-red-500",
                          result.status === "pending" && "border-border"
                        )}
                      >
                        <img
                          src={result.processedUrl || result.originalUrl}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Status Overlay */}
                        {result.status === "processing" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                        
                        {result.status === "completed" && (
                          <div className="absolute top-2 right-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        
                        {result.status === "failed" && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-500" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons - Show when processing is complete */}
                  {processingImages.status === "completed" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          <Sparkles className="inline h-4 w-4 text-violet-500 mr-1" />
                          الصور جاهزة! هل تريد تحويلها إلى منتجات؟
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Get processed image URLs
                            const processedUrls = processingImages.results
                              ?.filter(r => r.status === "completed" && r.processedUrl)
                              .map(r => r.processedUrl!) || []
                            
                            // Trigger AI to create products with auto-fill
                            window.dispatchEvent(new CustomEvent("ai-create-products-request", {
                              detail: { 
                                imageUrls: processedUrls.length > 0 ? processedUrls : processingImages.images,
                                autoFill: true 
                              }
                            }))
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          إنشاء تلقائي بالذكاء الاصطناعي
                        </Button>
                        <Button
                          onClick={() => {
                            // Get processed image URLs for manual product creation
                            const processedUrls = processingImages.results
                              ?.filter(r => r.status === "completed" && r.processedUrl)
                              .map(r => r.processedUrl!) || []
                            
                            // Navigate to product creation with these images
                            const urlsParam = encodeURIComponent(JSON.stringify(
                              processedUrls.length > 0 ? processedUrls : processingImages.images
                            ))
                            router.push(`/admin/products/new?images=${urlsParam}`)
                          }}
                          className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                          <Package className="h-4 w-4" />
                          إنشاء المنتجات يدوياً
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Batch Creation Form */}
        {!isUploading && selectedFiles.length === 0 ? (
          <div className="space-y-6">
            {/* Batch Configuration */}
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">{AR_BULK_DEALS.batchInfo}</h3>
                
                {/* Batch Name */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">{AR_BULK_DEALS.batchName}</label>
                  <Input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder={AR_BULK_DEALS.batchNamePlaceholder}
                    className="max-w-md"
                    disabled={isUploading}
                  />
                </div>

                {/* Shot Mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">{AR_BULK_DEALS.shotMode}</label>
                  <div className="flex gap-3">
                    <Button
                      variant={shotMode === "single" ? "default" : "outline"}
                      onClick={() => setShotMode("single")}
                      disabled={isUploading}
                      className={cn(
                        "flex-1 max-w-xs",
                        shotMode === "single" && "bg-gradient-to-r from-violet-500 to-purple-600"
                      )}
                    >
                      {AR_BULK_DEALS.singleShot}
                    </Button>
                    <Button
                      variant={shotMode === "multi" ? "default" : "outline"}
                      onClick={() => setShotMode("multi")}
                      disabled={isUploading}
                      className={cn(
                        "flex-1 max-w-xs",
                        shotMode === "multi" && "bg-gradient-to-r from-violet-500 to-purple-600"
                      )}
                    >
                      {AR_BULK_DEALS.multiShot}
                    </Button>
                  </div>
                </div>

                {/* Shot Count Slider (Multi mode only) */}
                {shotMode === "multi" && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{AR_BULK_DEALS.shotCountLabel}</label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setShotCount(Math.max(2, shotCount - 1))}
                          disabled={shotCount <= 2 || isUploading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-lg font-bold min-w-8 text-center">{shotCount}</span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setShotCount(Math.min(7, shotCount + 1))}
                          disabled={shotCount >= 7 || isUploading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[shotCount]}
                      onValueChange={([value]) => setShotCount(value)}
                      min={2}
                      max={7}
                      step={1}
                      disabled={isUploading}
                      className="max-w-md"
                    />
                    <p className="text-xs text-muted-foreground">
                      {shotCount} {AR_BULK_DEALS.shotCountLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-8 transition-all",
                dragActive
                  ? "border-violet-500 bg-violet-500/5"
                  : "border-muted-foreground/20 hover:border-muted-foreground/40"
              )}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FolderUp className="w-12 h-12 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold mb-2">
                  {AR_BULK_DEALS.dropImages}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {AR_BULK_DEALS.maxImages}
                </p>

                <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
                  <Upload className="w-4 h-4 mr-2" />
                  {AR_BULK_DEALS.selectImages}
                </Button>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-4"
              >
                {errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-red-500">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ) : selectedFiles.length > 0 && !isUploading ? (
          /* File Preview Grid */
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">
                    {selectedFiles.length} {AR_BULK_DEALS.imagesSelected}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {batchName || AR_BULK_DEALS.batchNamePlaceholder} • {shotMode === "single" ? AR_BULK_DEALS.singleShot : `${AR_BULK_DEALS.multiShot} (${shotCount})`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearAllFiles}>
                    {AR_BULK_DEALS.clearAll}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!batchName.trim() || selectedFiles.length === 0}
                    className="bg-gradient-to-r from-violet-500 to-purple-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {AR_BULK_DEALS.upload}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {selectedFiles.map((file, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative aspect-square group"
                  >
                    <img
                      src={filePreviews[idx]}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg border-2 border-muted"
                    />
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    
                    {/* File name */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-1.5 rounded-b-lg">
                      <p className="text-[9px] text-white truncate">{file.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Errors */}
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-4"
              >
                {errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-red-500">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          /* Upload Progress */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                {AR_BULK_DEALS.uploading}
              </h3>
              <div className="text-sm text-muted-foreground">
                {uploadingFiles.filter(f => f.status === "completed").length} / {uploadingFiles.length}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">{uploadProgress}%</p>
            </div>

            {/* Upload Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {uploadingFiles.map((uf, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="relative aspect-square"
                >
                  <img
                    src={uf.preview}
                    alt={uf.file.name}
                    className={cn(
                      "w-full h-full object-cover rounded-lg border-2",
                      uf.status === "pending" && "border-muted opacity-60",
                      uf.status === "uploading" && "border-violet-500",
                      uf.status === "completed" && "border-green-500",
                      uf.status === "failed" && "border-red-500"
                    )}
                  />

                  {/* Status overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    {uf.status === "pending" && <Clock className="h-6 w-6 text-white/80" />}
                    {uf.status === "uploading" && <Loader2 className="h-6 w-6 text-white animate-spin" />}
                    {uf.status === "completed" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                    {uf.status === "failed" && <XCircle className="h-6 w-6 text-red-500" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Workflow Info */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            {AR_BULK_DEALS.workflow.title}
          </h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: 1, title: AR_BULK_DEALS.workflow.step1.title, desc: AR_BULK_DEALS.workflow.step1.description },
              { step: 2, title: AR_BULK_DEALS.workflow.step2.title, desc: AR_BULK_DEALS.workflow.step2.description },
              { step: 3, title: AR_BULK_DEALS.workflow.step3.title, desc: AR_BULK_DEALS.workflow.step3.description },
              { step: 4, title: AR_BULK_DEALS.workflow.step4.title, desc: AR_BULK_DEALS.workflow.step4.description },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-sm font-bold text-violet-500">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 hidden sm:block ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Batches List */}
        <div className="space-y-4">
          <h3 className="font-semibold">{AR_BULK_DEALS.recentBatches}</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 border rounded-xl"
            >
              <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{AR_BULK_DEALS.noBatches}</h3>
              <p className="text-sm text-muted-foreground">
                {AR_BULK_DEALS.noBatchesDesc}
              </p>
            </motion.div>
          ) : (
            batches.map((batch, index) => {
              const status = statusConfig[batch.status]
              const StatusIcon = status.icon
              const progress = batch.total_images > 0
                ? (batch.processed_count / batch.total_images) * 100
                : 0

              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/bulk-deals/${batch.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", status.color)}>
                      <StatusIcon className={cn("w-5 h-5", status.spin && "animate-spin")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{batch.name}</h4>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          status.color
                        )}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {batch.total_images} {AR_BULK_DEALS.imagesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {batch.product_groups?.length || 0} {AR_BULK_DEALS.productsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(batch.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {["analyzing", "processing"].includes(batch.status) && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {batch.processed_count} / {batch.total_images} {AR_BULK_DEALS.processedImages}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {batch.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            startProcessing(batch.id)
                          }}
                          className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {AR_BULK_DEALS.start}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedImage && (
          <ImageDetailModal
            imageUrl={selectedImage}
            onClose={() => setSelectedImage(null)}
            onSave={handleSaveProductDetails}
          />
        )}

      </AnimatePresence>
    </div>
  )
}
