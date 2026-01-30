"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const COMMON_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1a1a4e' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Beige', hex: '#d4b896' },
]

interface VariantEditorProps {
  gender: string
  sizes: string[]
  colors: string[]
  onGenderChange: (value: string) => void
  onSizesChange: (sizes: string[]) => void
  onColorsChange: (colors: string[]) => void
}

export function VariantEditor({
  gender, sizes, colors,
  onGenderChange, onSizesChange, onColorsChange,
}: VariantEditorProps) {
  const t = useTranslations("admin")

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      onSizesChange(sizes.filter(s => s !== size))
    } else {
      onSizesChange([...sizes, size])
    }
  }

  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      onColorsChange(colors.filter(c => c !== color))
    } else {
      onColorsChange([...colors, color])
    }
  }

  return (
    <div className="space-y-5">
      {/* Gender */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("editor.gender")}</label>
        <div className="flex gap-2 flex-wrap">
          {['men', 'women', 'unisex', 'kids'].map(g => (
            <button
              key={g}
              onClick={() => onGenderChange(gender === g ? '' : g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                gender === g
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {t(`editor.gender_${g}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("editor.sizes")}</label>
        <div className="flex gap-2 flex-wrap">
          {COMMON_SIZES.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`w-10 h-10 rounded-lg text-xs font-semibold border transition-colors ${
                sizes.includes(size)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("editor.colors")}</label>
        <div className="flex gap-2 flex-wrap">
          {COMMON_COLORS.map(({ name, hex }) => (
            <button
              key={name}
              onClick={() => toggleColor(name)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                colors.includes(name)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: hex }}
              />
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
