"use client"

import { useState } from "react"
import { Check, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
  parent_id: string | null
}

interface CategoryPickerProps {
  categories: StoreCategory[]
  selectedId: string
  onSelect: (categoryId: string, categoryName: string, categoryNameAr?: string) => void
  onCreateNew: (name: string) => Promise<StoreCategory | null>
}

export function CategoryPicker({ categories, selectedId, onSelect, onCreateNew }: CategoryPickerProps) {
  const t = useTranslations("admin")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = categories.find(c => c.id === selectedId)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const cat = await onCreateNew(newName.trim())
    if (cat) {
      onSelect(cat.id, cat.name, cat.name_ar || undefined)
      setNewName("")
      setOpen(false)
    }
    setCreating(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-left flex items-center justify-between hover:border-primary/50 transition-colors"
      >
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected ? selected.name : t("editor.selectCategory")}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("editor.searchCategories")}
                className="h-8 text-sm"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {/* None option */}
              <button
                onClick={() => { onSelect('', '', ''); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {!selectedId && <Check className="w-3.5 h-3.5 text-primary" />}
                <span className={!selectedId ? 'font-medium' : 'text-muted-foreground'}>
                  {t("editor.noCategory")}
                </span>
              </button>

              {filtered.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onSelect(cat.id, cat.name, cat.name_ar || undefined); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                    cat.parent_id ? 'pl-7' : ''
                  }`}
                >
                  {selectedId === cat.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  <span className={selectedId === cat.id ? 'font-medium' : ''}>{cat.name}</span>
                </button>
              ))}

              {filtered.length === 0 && search && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {t("editor.noCategoriesFound")}
                </div>
              )}
            </div>

            {/* Inline create */}
            <div className="border-t border-border p-2 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("editor.newCategoryName")}
                className="h-8 text-sm flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
