"use client"

import { useCallback, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface ImageUploadZoneProps {
  onUploadComplete?: (urls: string[], batchId: string) => Promise<void>
  onError?: (error: string) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
  locale?: "en" | "ar"
  disabled?: boolean
}

interface PreviewImage {
  id: string
  file: File
  preview: string
  isUploading: boolean
  error?: string
}

/**
 * Image upload zone with drag-and-drop support
 * Uploads images to Supabase Storage and triggers bulk workflow
 */
export function ImageUploadZone({
  onUploadComplete,
  onError,
  maxFiles = 20,
  maxSizePerFile = 50, // 50MB
  locale = "en",
  disabled = false,
}: ImageUploadZoneProps) {
  const t = useTranslations("onboarding")
  const isRtl = locale === "ar"

  const [previews, setPreviews] = useState<PreviewImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createClient } = require("@/lib/supabase/client")

  /**
   * Validate file
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Only image files are allowed" }
    }

    const sizeInMB = file.size / (1024 * 1024)
    if (sizeInMB > maxSizePerFile) {
      return { valid: false, error: `File size must be less than ${maxSizePerFile}MB` }
    }

    return { valid: true }
  }

  /**
   * Handle file selection (from input or drag-drop)
   */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return

      const newFiles = Array.from(files)
      const totalFiles = previews.length + newFiles.length

      if (totalFiles > maxFiles) {
        if (onError) {
          onError(`Maximum ${maxFiles} files allowed`)
        }
        return
      }

      const validFiles: PreviewImage[] = []

      newFiles.forEach((file) => {
        const validation = validateFile(file)
        if (validation.valid) {
          const id = Math.random().toString(36).substr(2, 9)
          const preview = URL.createObjectURL(file)
          validFiles.push({
            id,
            file,
            preview,
            isUploading: false,
          })
        } else if (validation.error && onError) {
          onError(`${file.name}: ${validation.error}`)
        }
      })

      setPreviews((prev) => [...prev, ...validFiles])
    },
    [previews.length, maxFiles, disabled, onError]
  )

  /**
   * Remove a preview
   */
  const removePreview = useCallback((id: string) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  /**
   * Clear all previews
   */
  const clearAll = useCallback(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.preview))
    setPreviews([])
  }, [previews])

  /**
   * Upload images to Supabase Storage
   */
  const uploadToSupabase = useCallback(async () => {
    if (previews.length === 0 || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user?.id) {
        if (onError) onError("User not authenticated")
        return
      }

      const batchId = crypto.randomUUID()
      const uploadedUrls: string[] = []
      const totalFiles = previews.length

      // Upload each file
      for (let i = 0; i < totalFiles; i++) {
        const preview = previews[i]
        setPreviews((prev) =>
          prev.map((p) => (p.id === preview.id ? { ...p, isUploading: true } : p))
        )

        try {
          const fileExt = preview.file.name.split(".").pop()
          const fileName = `${batchId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
          const storagePath = `onboarding/${user.user.id}/${fileName}`

          const { error: uploadError, data } = await supabase.storage
            .from("uploads")
            .upload(storagePath, preview.file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from("uploads")
            .getPublicUrl(storagePath)

          uploadedUrls.push(publicUrl.publicUrl)

          // Update progress
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))

          // Mark as uploaded
          setPreviews((prev) =>
            prev.map((p) => (p.id === preview.id ? { ...p, isUploading: false } : p))
          )
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Upload failed"
          setPreviews((prev) =>
            prev.map((p) => (p.id === preview.id ? { ...p, error: errorMsg, isUploading: false } : p))
          )
          if (onError) onError(errorMsg)
        }
      }

      // All files uploaded successfully
      if (uploadedUrls.length > 0) {
        // Trigger workflow
        if (onUploadComplete) {
          await onUploadComplete(uploadedUrls, batchId)
        }
        // Clear previews after successful upload
        clearAll()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      if (onError) onError(message)
      console.error("Error uploading images:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [previews, isUploading, onUploadComplete, onError, clearAll, createClient])

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 transition-colors",
          isDragging ? "border-violet-500 bg-violet-50/50" : "border-muted-foreground/30 bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => {
          e.preventDefault()
          !disabled && setIsDragging(true)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn("p-3 rounded-lg", isDragging ? "bg-violet-500/10" : "bg-muted")}>
            <Upload className={cn("w-5 h-5", isDragging ? "text-violet-500" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              {isRtl ? "اسحب الصور هنا أو انقر للاختيار" : "Drag images here or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRtl ? `PNG, JPG، GIF - أقصى ${maxFiles} صور، ${maxSizePerFile}MB لكل صورة` : `PNG, JPG, GIF - Max ${maxFiles} images, ${maxSizePerFile}MB each`}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full mt-4 py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRtl ? "اختر الصور" : "Select Images"}
        </button>
      </motion.div>

      {/* Preview Grid */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {isRtl ? `${previews.length} صورة محددة` : `${previews.length} image${previews.length === 1 ? "" : "s"} selected`}
              </p>
              {!isUploading && (
                <button
                  onClick={clearAll}
                  className="text-xs text-destructive hover:text-destructive/80 font-medium"
                >
                  {isRtl ? "مسح الكل" : "Clear All"}
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {isRtl ? "جاري التحميل..." : "Uploading..."}
                  </span>
                  <span className="font-medium text-foreground">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {previews.map((preview) => (
                <motion.div
                  key={preview.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group rounded-lg overflow-hidden"
                >
                  {/* Image */}
                  <img
                    src={preview.preview}
                    alt="Preview"
                    className={cn(
                      "w-full h-32 object-cover bg-muted",
                      preview.isUploading && "opacity-50"
                    )}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  {/* Loading */}
                  {preview.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}

                  {/* Error */}
                  {preview.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/50">
                      <span className="text-xs text-white text-center px-2">{preview.error}</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  {!preview.isUploading && !preview.error && (
                    <button
                      onClick={() => removePreview(preview.id)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            {!isUploading && previews.some((p) => !p.error) && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={uploadToSupabase}
                disabled={disabled || isUploading}
                className="w-full py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRtl ? "رفع الصور" : "Upload Images"}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
