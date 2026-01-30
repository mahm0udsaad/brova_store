"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle2, XCircle, Image as ImageIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProcessingImage {
  id: string
  url: string
  status: "pending" | "processing" | "completed" | "failed"
  operation?: string
  result?: {
    imageUrl?: string
    error?: string
  }
}

interface BulkProcessingPanelProps {
  images: string[]
  operations: string[]
  onClose: () => void
  onComplete?: (results: ProcessingImage[]) => void
}

export function BulkProcessingPanel({ 
  images, 
  operations, 
  onClose,
  onComplete 
}: BulkProcessingPanelProps) {
  const [processingImages, setProcessingImages] = useState<ProcessingImage[]>(
    images.map((url, idx) => ({
      id: `img-${idx}`,
      url,
      status: "pending" as const,
    }))
  )
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    // Listen for real processing results from AI
    const handleProcessingResults = (event: CustomEvent) => {
      const { results, errors } = event.detail

      console.log("Received processing results:", results, errors)
      
      // Update images with actual results
      setProcessingImages(prev => {
        const updated = [...prev]
        
        // Map results to images
        results?.forEach((result: any) => {
          const imgIdx = updated.findIndex(img => img.url === result.imageUrl)
          if (imgIdx !== -1) {
            updated[imgIdx] = {
              ...updated[imgIdx],
              status: "completed",
              result: {
                imageUrl: result.result?.imageUrl || result.result,
              },
            }
          }
        })

        // Map errors to images
        errors?.forEach((error: any) => {
          const imgIdx = updated.findIndex(img => img.url === error.imageUrl)
          if (imgIdx !== -1) {
            updated[imgIdx] = {
              ...updated[imgIdx],
              status: "failed",
              result: {
                error: error.error || "Processing failed",
              },
            }
          }
        })

        return updated
      })

      setIsProcessing(false)
      setCurrentOperation(null)

      // Call completion callback after a short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete(processingImages)
        }
      }, 1000)
    }

    window.addEventListener("ai-processing-results" as any, handleProcessingResults)

    // Set initial operation
    if (operations.length > 0) {
      setCurrentOperation(operations[0])
      
      // Mark all images as processing
      setProcessingImages(prev =>
        prev.map(img => ({ ...img, status: "processing" as const }))
      )
    }

    return () => {
      window.removeEventListener("ai-processing-results" as any, handleProcessingResults)
    }
  }, [operations, onComplete])

  const stats = {
    pending: processingImages.filter(img => img.status === "pending").length,
    processing: processingImages.filter(img => img.status === "processing").length,
    completed: processingImages.filter(img => img.status === "completed").length,
    failed: processingImages.filter(img => img.status === "failed").length,
  }

  const allCompleted = stats.pending === 0 && stats.processing === 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={allCompleted ? onClose : undefined} />

      {/* Panel */}
      <motion.div 
        className="relative bg-card border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        layoutId="bulk-processing-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-violet-500/10 to-purple-600/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              {allCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-white" />
              ) : (
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {allCompleted ? "Processing Complete!" : "Processing Images"}
              </h3>
              {currentOperation && isProcessing && (
                <p className="text-xs text-muted-foreground">
                  Current operation: {currentOperation.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={!allCompleted}
            className={cn(!allCompleted && "opacity-50 cursor-not-allowed")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 border-b px-6 py-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-500">{stats.processing}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Progress */}
        {!allCompleted && (
          <div className="px-6 py-3 bg-muted/30">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((stats.completed + stats.failed) / processingImages.length) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {processingImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative aspect-square group"
                >
                  <img
                    src={img.result?.imageUrl || img.url}
                    alt={`Processing ${idx + 1}`}
                    className={cn(
                      "w-full h-full object-cover rounded-xl border-2 transition-all",
                      img.status === "pending" && "border-muted opacity-60",
                      img.status === "processing" && "border-violet-500 ring-2 ring-violet-500/20 animate-pulse",
                      img.status === "completed" && "border-green-500",
                      img.status === "failed" && "border-red-500"
                    )}
                  />

                  {/* Status Overlay */}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-xl transition-opacity",
                    img.status === "pending" && "bg-background/60",
                    img.status === "processing" && "bg-violet-500/20 backdrop-blur-sm",
                    img.status === "completed" && "bg-green-500/20 backdrop-blur-sm opacity-0 group-hover:opacity-100",
                    img.status === "failed" && "bg-red-500/20 backdrop-blur-sm"
                  )}>
                    {img.status === "pending" && (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    {img.status === "processing" && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                        {img.operation && (
                          <p className="text-xs font-medium text-violet-500 bg-background/90 px-2 py-1 rounded">
                            {img.operation.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    )}
                    {img.status === "completed" && (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    )}
                    {img.status === "failed" && (
                      <div className="flex flex-col items-center gap-1">
                        <XCircle className="h-8 w-8 text-red-500" />
                        {img.result?.error && (
                          <p className="text-xs text-red-500 bg-background/90 px-2 py-1 rounded text-center">
                            {img.result.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={cn(
                    "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
                    img.status === "pending" && "bg-muted",
                    img.status === "processing" && "bg-violet-500",
                    img.status === "completed" && "bg-green-500",
                    img.status === "failed" && "bg-red-500"
                  )}>
                    {img.status === "pending" && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
                    {img.status === "processing" && <Loader2 className="h-3 w-3 text-white animate-spin" />}
                    {img.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
                    {img.status === "failed" && <XCircle className="h-3 w-3 text-white" />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        {allCompleted && (
          <div className="border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Processing complete: {stats.completed} successful, {stats.failed} failed
            </p>
            <Button onClick={onClose} className="bg-gradient-to-r from-violet-500 to-purple-600">
              Done
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
