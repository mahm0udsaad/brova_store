"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  ImageOff,
  Camera,
  Sparkles,
  RefreshCw,
  Loader2,
  Check,
  X,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageEditorProps {
  imageUrl: string
  onClose?: () => void
  onApply?: (editedUrl: string) => void
  className?: string
}

interface AIAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  apiAction: string
}

const AI_ACTIONS: AIAction[] = [
  {
    id: "remove_bg",
    label: "Remove Background",
    icon: ImageOff,
    description: "Clean product cutout",
    apiAction: "remove_background",
  },
  {
    id: "lifestyle",
    label: "Add to Lifestyle",
    icon: Camera,
    description: "Place in lifestyle scene",
    apiAction: "generate_lifestyle",
  },
  {
    id: "enhance",
    label: "Enhance",
    icon: Sparkles,
    description: "Improve quality & lighting",
    apiAction: "generate_image",
  },
  {
    id: "regenerate",
    label: "Regenerate",
    icon: RefreshCw,
    description: "New style variation",
    apiAction: "generate_image",
  },
]

interface GeneratedResult {
  id: string
  url: string
  action: string
  status: "generating" | "completed" | "failed"
}

export function ImageEditor({
  imageUrl,
  onClose,
  onApply,
  className,
}: ImageEditorProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (action: AIAction) => {
    setSelectedAction(action.id)
    setIsProcessing(true)

    const newResult: GeneratedResult = {
      id: `${action.id}-${Date.now()}`,
      url: "",
      action: action.id,
      status: "generating",
    }
    setResults((prev) => [...prev, newResult])

    try {
      let response: Response

      if (action.apiAction === "remove_background") {
        // Call photographer agent via assistant API
        response = await fetch("/api/admin/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request: `Remove background from this image: ${imageUrl}`,
            context: null,
          }),
        })
      } else if (action.apiAction === "generate_lifestyle") {
        response = await fetch("/api/admin/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request: `Generate a lifestyle shot for this product: ${imageUrl}`,
            context: null,
          }),
        })
      } else if (action.id === "enhance") {
        response = await fetch("/api/admin/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request: `Enhance this product image with better lighting and quality: ${imageUrl}`,
            context: null,
          }),
        })
      } else {
        // Regenerate - use showcase to get variations
        response = await fetch("/api/admin/bulk-deals/showcase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            count: 1,
            style: "clean",
          }),
        })
      }

      if (!response.ok) throw new Error("Failed to process image")

      const data = await response.json()

      // Extract the image URL from the response
      let generatedUrl = ""
      if (data.images && data.images.length > 0) {
        generatedUrl = data.images[0].url
      } else if (data.tasks) {
        // From assistant API - extract from tasks
        const imageTask = data.tasks.find((t: any) => 
          t.output?.imageUrl || t.output?.asset?.generated_url
        )
        generatedUrl = imageTask?.output?.imageUrl || imageTask?.output?.asset?.generated_url || ""
      }

      if (!generatedUrl) {
        throw new Error("No image URL in response")
      }

      setResults((prev) =>
        prev.map((r) =>
          r.id === newResult.id
            ? { ...r, url: generatedUrl, status: "completed" }
            : r
        )
      )
    } catch (error) {
      console.error("Action failed:", error)
      setResults((prev) =>
        prev.map((r) =>
          r.id === newResult.id ? { ...r, status: "failed" } : r
        )
      )
    } finally {
      setIsProcessing(false)
      setSelectedAction(null)
    }
  }

  const handleApply = (url: string) => {
    if (onApply) {
      onApply(url)
    }
  }

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `edited-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Original Image */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Original Image</h3>
        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt="Original"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* AI Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          AI Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {AI_ACTIONS.map((action) => {
            const Icon = action.icon
            const isActive = selectedAction === action.id
            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  "flex flex-col items-start h-auto p-3 text-left",
                  isActive && "border-violet-500 bg-violet-500/5"
                )}
                onClick={() => handleAction(action)}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Generated Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Generated Results</h3>
          <div className="grid grid-cols-2 gap-3">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-2"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                  {result.status === "generating" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                  )}
                  {result.status === "completed" && result.url && (
                    <img
                      src={result.url}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {result.status === "failed" && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500">
                      <X className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {result.status === "completed" && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleApply(result.url)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(result.url)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          Click an AI action to generate a new version. Each action uses credits
          from your daily limit.
        </p>
      </div>
    </div>
  )
}
