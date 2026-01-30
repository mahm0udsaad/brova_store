"use client"

import { useState } from "react"
import { GripVertical, Edit2, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
}

interface CategoryListProps {
  categories: StoreCategory[]
  onEdit: (category: StoreCategory) => void
  onDelete: (id: string, name: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function CategoryList({ categories, onEdit, onDelete, onReorder }: CategoryListProps) {
  const t = useTranslations("admin")
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Group by parent
  const topLevel = categories.filter(c => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === overId) return
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const ids = topLevel.map(c => c.id)
    const fromIdx = ids.indexOf(draggedId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, draggedId)
    onReorder(reordered)
    setDraggedId(null)
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("categories.empty")}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {topLevel.map((cat) => {
        const children = getChildren(cat.id)
        return (
          <div key={cat.id}>
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, cat.id)}
              onDragOver={(e) => handleDragOver(e, cat.id)}
              onDrop={(e) => handleDrop(e, cat.id)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                draggedId === cat.id ? 'opacity-50' : 'hover:bg-muted/50'
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
              {cat.image_url && (
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{cat.name}</p>
                {cat.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{cat.name_ar}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{cat.slug}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(cat)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(cat.id, cat.name)}
                  className="hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {/* Children */}
            {children.map(child => (
              <div key={child.id} className="flex items-center gap-3 px-4 py-3 pl-12 hover:bg-muted/50">
                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{child.name}</p>
                  {child.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{child.name_ar}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{child.slug}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(child)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(child.id, child.name)}
                    className="hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
