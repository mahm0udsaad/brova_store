"use client"

import { Target, Wand2, Plus, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
}

interface GeneratorConfigProps {
  products: Product[]
  selectedProducts: string[]
  campaignGoal: string
  tone: string
  onProductsChange: (ids: string[]) => void
  onCampaignGoalChange: (goal: string) => void
  onToneChange: (tone: string) => void
  onOpenProductSelector: () => void
}

const TONE_OPTIONS = [
  { value: "casual", labelKey: "marketingGenerator.tones.casual", emoji: "😊" },
  { value: "professional", labelKey: "marketingGenerator.tones.professional", emoji: "💼" },
  { value: "playful", labelKey: "marketingGenerator.tones.playful", emoji: "🎉" },
  { value: "luxurious", labelKey: "marketingGenerator.tones.luxurious", emoji: "✨" },
  { value: "edgy", labelKey: "marketingGenerator.tones.edgy", emoji: "🔥" },
]

export function GeneratorConfig({
  products,
  selectedProducts,
  campaignGoal,
  tone,
  onProductsChange,
  onCampaignGoalChange,
  onToneChange,
  onOpenProductSelector,
}: GeneratorConfigProps) {
  const t = useTranslations("admin")
  const selectedProductData = products.filter((p) => selectedProducts.includes(p.id))

  return (
    <div className="space-y-6">
      {/* Products */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Package className="w-4 h-4" />
          {t("marketingGenerator.productsCount", { count: selectedProducts.length })}
        </label>
        
        {selectedProducts.length === 0 ? (
          <button
            onClick={onOpenProductSelector}
            className="w-full py-8 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{t("marketingGenerator.selectProducts")}</p>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedProductData.map((product) => (
                <div key={product.id} className="relative group">
                  <div className="rounded-lg border-2 border-violet-500/50 p-2 bg-violet-500/5">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full aspect-square object-cover rounded-md mb-2"
                      />
                    )}
                    <p className="text-xs font-medium truncate">{product.name}</p>
                  </div>
                  <button
                    onClick={() => onProductsChange(selectedProducts.filter(id => id !== product.id))}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={onOpenProductSelector} variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t("marketingGenerator.addMoreProducts")}
            </Button>
          </div>
        )}
      </div>

      {/* Campaign Goal */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Target className="w-4 h-4" />
          {t("marketingGenerator.campaignGoal.label")}
        </label>
        <input
          type="text"
          value={campaignGoal}
          onChange={(e) => onCampaignGoalChange(e.target.value)}
          placeholder={t("marketingGenerator.campaignGoal.placeholder")}
          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Tone */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Wand2 className="w-4 h-4" />
          {t("marketingGenerator.toneStyle")}
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onToneChange(option.value)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 transition-all",
                tone === option.value
                  ? "border-violet-500 bg-violet-500/10 font-semibold"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <span className="mr-2">{option.emoji}</span>
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
