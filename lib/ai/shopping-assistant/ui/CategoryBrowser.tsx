"use client"

import { Layers } from "lucide-react"

interface Category {
  id: string
  name: string
  name_ar?: string
  image_url?: string
  sort_order?: number
}

interface CategoryBrowserProps {
  categories: Category[]
  locale: "ar" | "en"
}

export function CategoryBrowser({ categories, locale }: CategoryBrowserProps) {
  const isRTL = locale === "ar"

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isRTL ? "لا توجد فئات متاحة" : "No categories available"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir={isRTL ? "rtl" : "ltr"}>
      {categories.map((category) => (
        <div
          key={category.id}
          className="group rounded-xl border border-border/50 bg-card p-4 text-center transition-shadow hover:shadow-md cursor-pointer"
        >
          {category.image_url ? (
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg overflow-hidden bg-muted">
              <img
                src={category.image_url}
                alt={isRTL ? category.name_ar || category.name : category.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
          )}
          <p className="text-sm font-medium truncate">
            {isRTL ? category.name_ar || category.name : category.name}
          </p>
        </div>
      ))}
    </div>
  )
}
