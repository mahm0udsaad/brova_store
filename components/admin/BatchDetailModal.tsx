"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BatchDetailModalProps {
  batch: {
    id: string
    name: string
    status: string
    source_urls: string[]
    product_groups?: any[]
    total_images: number
    processed_count: number
    failed_count: number
  }
  onClose: () => void
  onImageClick?: (imageUrl: string) => void
  onGenerateShowcase?: (imageUrls: string[]) => void
}

type FilterType = "all" | "processed" | "pending" | "failed"

export function BatchDetailModal({
  batch,
  onClose,
  onImageClick,
  onGenerateShowcase,
}: BatchDetailModalProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock processed status for images (in real app, this would come from the batch data)
  const getImageStatus = (url: string, index: number): "processed" | "pending" | "failed" => {
    if (index < batch.processed_count) return "processed"
    if (index >= batch.total_images - batch.failed_count) return "failed"
    return "pending"
  }

  const filteredImages = batch.source_urls.filter((url, index) => {
    const status = getImageStatus(url, index)
    if (filter === "all") return true
    return status === filter
  })

  const toggleImageSelection = (url: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedImages(newSelected)
  }

  const selectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(filteredImages))
    }
  }

  const handleGenerateShowcase = async () => {
    if (selectedImages.size === 0) return

    setIsGenerating(true)
    try {
      if (onGenerateShowcase) {
        await onGenerateShowcase(Array.from(selectedImages))
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "All", count: batch.total_images },
    { id: "processed", label: "Processed", count: batch.processed_count },
    {
      id: "pending",
      label: "Pending",
      count: batch.total_images - batch.processed_count - batch.failed_count,
    },
    { id: "failed", label: "Failed", count: batch.failed_count },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{batch.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {batch.total_images} images · {batch.product_groups?.length || 0} products
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  filter === f.id
                    ? "bg-violet-500 text-white"
                    : "bg-background hover:bg-muted"
                )}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedImages.size} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleGenerateShowcase}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Showcase
                    </>
                  )}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={selectAll}>
              {selectedImages.size === filteredImages.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No images found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((url, index) => {
                const actualIndex = batch.source_urls.indexOf(url)
                const status = getImageStatus(url, actualIndex)
                const isSelected = selectedImages.has(url)

                return (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group relative"
                  >
                    <div
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer transition-all",
                        isSelected && "ring-4 ring-violet-500"
                      )}
                      onClick={() => toggleImageSelection(url)}
                    >
                      <img
                        src={url}
                        alt={`Image ${actualIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        {status === "processed" && (
                          <div className="bg-green-500 rounded-full p-1">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {status === "failed" && (
                          <div className="bg-red-500 rounded-full p-1">
                            <XCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {status === "pending" && (
                          <div className="bg-yellow-500 rounded-full p-1">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Selection Checkbox */}
                      <div
                        className={cn(
                          "absolute top-2 right-2 w-6 h-6 rounded-full border-2 transition-all",
                          isSelected
                            ? "bg-violet-500 border-violet-500"
                            : "bg-white/80 border-white/80 group-hover:border-violet-500"
                        )}
                      >
                        {isSelected && (
                          <Check className="w-full h-full text-white p-0.5" />
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onImageClick) onImageClick(url)
                        }}
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Image {actualIndex + 1}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {filteredImages.length} of {batch.total_images} images shown
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
