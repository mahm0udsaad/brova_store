"use client"

import { useState, useRef } from "react"
import { Star, Trash2, GripVertical, Upload, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface ImageGalleryEditorProps {
  images: string[]
  onChange: (images: string[]) => void
  onUpload: (files: File[]) => Promise<string[]>
  uploading?: boolean
  maxImages?: number
}

export function ImageGalleryEditor({
  images, onChange, onUpload, uploading, maxImages = 10,
}: ImageGalleryEditorProps) {
  const t = useTranslations("admin")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remaining = maxImages - images.length
    const toUpload = files.slice(0, remaining)
    const urls = await onUpload(toUpload)
    onChange([...images, ...urls])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIdx !== null) return // internal reorder handled separately
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return
    const remaining = maxImages - images.length
    const toUpload = files.slice(0, remaining)
    const urls = await onUpload(toUpload)
    onChange([...images, ...urls])
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const setPrimary = (index: number) => {
    if (index === 0) return
    const reordered = [...images]
    const [moved] = reordered.splice(index, 1)
    reordered.unshift(moved)
    onChange(reordered)
  }

  // Drag reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === targetIdx) return
  }

  const handleDragEnd = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      return
    }
    const reordered = [...images]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    onChange(reordered)
    setDragIdx(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t("editor.images")}</label>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
      </div>

      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {images.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDragEnd(idx)}
            className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab ${
              idx === 0 ? 'border-primary' : 'border-border'
            } ${dragIdx === idx ? 'opacity-50 scale-95' : ''}`}
          >
            <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setPrimary(idx)}
                className={`p-1.5 rounded-lg ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-black hover:bg-white'}`}
                title={idx === 0 ? t("editor.primaryImage") : t("editor.setAsPrimary")}
              >
                <Star className="w-3.5 h-3.5" fill={idx === 0 ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => removeImage(idx)}
                className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-red-500 hover:text-white"
                title={t("editor.removeImage")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary badge */}
            {idx === 0 && (
              <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                {t("editor.primary")}
              </div>
            )}
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">
              {uploading ? t("editor.uploading") : t("editor.addImage")}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
