"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Check,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface DraftProduct {
  id: string
  groupId: string
  name: string
  description: string
  category: string
  priceSuggestion: number | null
  sizes: string[]
  gender: "men" | "women" | "unisex"
  images: string[]
  mainImage: string
  isDraft: true
  aiConfidence: "high" | "medium" | "low"
  createdAt: string
}

interface DraftProductCardProps {
  draft: DraftProduct
  onUpdate: (updated: DraftProduct) => void
  onRemove: (id: string) => void
  index: number
}

export function DraftProductCard({
  draft,
  onUpdate,
  onRemove,
  index,
}: DraftProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editState, setEditState] = useState({
    name: draft.name,
    description: draft.description,
    category: draft.category,
    priceSuggestion: draft.priceSuggestion,
    sizes: draft.sizes,
    gender: draft.gender,
  })

  const handleSave = () => {
    onUpdate({
      ...draft,
      ...editState,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditState({
      name: draft.name,
      description: draft.description,
      category: draft.category,
      priceSuggestion: draft.priceSuggestion,
      sizes: draft.sizes,
      gender: draft.gender,
    })
    setIsEditing(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < draft.images.length - 1 ? prev + 1 : 0
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : draft.images.length - 1
    )
  }

  const confidenceColors = {
    high: "text-green-500 bg-green-500/10",
    medium: "text-yellow-500 bg-yellow-500/10",
    low: "text-orange-500 bg-orange-500/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      {/* Image Slider */}
      <div className="relative aspect-square bg-muted">
        <img
          src={draft.images[currentImageIndex]}
          alt={draft.name}
          className="w-full h-full object-cover"
        />

        {/* Draft Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/90 text-white text-xs font-semibold backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          Draft
        </div>

        {/* AI Confidence Badge */}
        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm",
            confidenceColors[draft.aiConfidence]
          )}
        >
          {draft.aiConfidence === "high"
            ? "AI: High"
            : draft.aiConfidence === "medium"
            ? "AI: Medium"
            : "AI: Low"}
        </div>

        {/* Slider Controls */}
        {draft.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {draft.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    idx === currentImageIndex
                      ? "bg-white w-4"
                      : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 group">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-3">
            <Input
              value={editState.name}
              onChange={(e) =>
                setEditState((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Product name"
              className="font-semibold"
            />

            <Textarea
              value={editState.description}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description"
              rows={2}
              className="text-sm"
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={editState.category}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="Category"
                className="text-sm"
              />
              <Input
                type="number"
                value={editState.priceSuggestion || ""}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    priceSuggestion: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                placeholder="Price (EGP)"
                className="text-sm"
              />
            </div>

            {/* Sizes */}
            <div className="flex flex-wrap gap-1">
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setEditState((prev) => ({
                      ...prev,
                      sizes: prev.sizes.includes(size)
                        ? prev.sizes.filter((s) => s !== size)
                        : [...prev.sizes, size],
                    }))
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-all",
                    editState.sizes.includes(size)
                      ? "bg-violet-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Gender */}
            <div className="flex gap-1">
              {(["men", "women", "unisex"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() =>
                    setEditState((prev) => ({ ...prev, gender: g }))
                  }
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium capitalize transition-all",
                    editState.gender === g
                      ? "bg-violet-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Save/Cancel */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} className="flex-1 gap-1">
                <Check className="h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            <div>
              <h4 className="font-semibold text-sm truncate">{draft.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {draft.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-muted">
                {draft.category}
              </span>
              <span className="capitalize">{draft.gender}</span>
              {draft.priceSuggestion && (
                <span className="ml-auto font-semibold text-foreground">
                  {draft.priceSuggestion} EGP
                </span>
              )}
            </div>

            {/* Sizes */}
            <div className="flex flex-wrap gap-1">
              {draft.sizes.map((size) => (
                <span
                  key={size}
                  className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground"
                >
                  {size}
                </span>
              ))}
            </div>

            {/* Not persisted warning */}
            <div className="flex items-center gap-1.5 text-[10px] text-amber-500 pt-1">
              <AlertTriangle className="h-3 w-3" />
              Not saved yet — requires approval
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1 gap-1 text-xs"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(draft.id)}
                className="gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
