"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Sparkles,
  Loader2,
  Check,
  ImageOff,
  Wand2,
  Camera,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ImageDetailModalProps {
  imageUrl: string
  onClose: () => void
  onSave?: (details: ProductDetails) => void
}

interface ProductDetails {
  title: string
  description: string
  price: number
  category: string
}

interface GeneratedImage {
  id: string
  url: string
  action: string
  status: "generating" | "completed" | "failed"
}

const AI_ACTIONS = [
  { id: "remove_bg", label: "Remove Background", icon: ImageOff },
  { id: "lifestyle", label: "Add to Lifestyle", icon: Camera },
  { id: "enhance", label: "Enhance Quality", icon: Sparkles },
  { id: "regenerate", label: "Regenerate Style", icon: RefreshCw },
]

export function ImageDetailModal({ imageUrl, onClose, onSave }: ImageDetailModalProps) {
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    title: "",
    description: "",
    price: 0,
    category: "",
  })
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const handleAIAction = async (actionId: string) => {
    setProcessingAction(actionId)

    // Create placeholder for generating image
    const newImage: GeneratedImage = {
      id: `${actionId}-${Date.now()}`,
      url: "",
      action: actionId,
      status: "generating",
    }
    setGeneratedImages((prev) => [...prev, newImage])

    try {
      // Call the appropriate API endpoint based on action
      const endpoint = `/api/admin/bulk-deals/ai-edit`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          action: actionId,
        }),
      })

      if (!response.ok) throw new Error("Failed to process image")

      const data = await response.json()

      // Update the generated image with the result
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.id === newImage.id
            ? { ...img, url: data.imageUrl, status: "completed" }
            : img
        )
      )
    } catch (error) {
      console.error("AI action failed:", error)
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.id === newImage.id ? { ...img, status: "failed" } : img
        )
      )
    } finally {
      setProcessingAction(null)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(productDetails)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Image Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Image Preview & AI Actions */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* AI Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet-500" />
                  AI Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {AI_ACTIONS.map((action) => {
                    const Icon = action.icon
                    const isProcessing = processingAction === action.id
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        className={cn(
                          "justify-start",
                          isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleAIAction(action.id)}
                        disabled={isProcessing || !!processingAction}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4 mr-2" />
                        )}
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Generated Results */}
              {generatedImages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Generated Results</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedImages.map((img) => (
                      <div
                        key={img.id}
                        className="aspect-square rounded-lg overflow-hidden bg-muted relative"
                      >
                        {img.status === "generating" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                          </div>
                        )}
                        {img.status === "completed" && img.url && (
                          <img
                            src={img.url}
                            alt="Generated"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {img.status === "failed" && (
                          <div className="absolute inset-0 flex items-center justify-center text-red-500">
                            <X className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Product Details Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Product Details</h3>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Title</label>
                  <Input
                    placeholder="Enter product name..."
                    value={productDetails.title}
                    onChange={(e) =>
                      setProductDetails((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe the product..."
                    rows={4}
                    value={productDetails.description}
                    onChange={(e) =>
                      setProductDetails((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={productDetails.price || ""}
                    onChange={(e) =>
                      setProductDetails((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="e.g., T-Shirts, Hoodies..."
                    value={productDetails.category}
                    onChange={(e) =>
                      setProductDetails((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Info Box */}
                <div className="rounded-lg border bg-violet-500/5 border-violet-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-violet-500 mb-1">
                        AI Tip
                      </p>
                      <p className="text-muted-foreground">
                        Use AI actions to generate multiple showcase images.
                        You'll only need to manually enter product details once,
                        and we'll create the images for you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Product
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
