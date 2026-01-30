"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Package, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
  category_id: string | null
  description?: string
}

interface ProductSelectionModalProps {
  products: Product[]
  selectedProducts: string[]
  onSelectionChange: (productIds: string[]) => void
  onClose: () => void
  onConfirm: () => void
}

export function ProductSelectionModal({
  products,
  selectedProducts,
  onSelectionChange,
  onClose,
  onConfirm,
}: ProductSelectionModalProps) {
  const t = useTranslations("admin")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleProduct = (productId: string) => {
    onSelectionChange(
      selectedProducts.includes(productId)
        ? selectedProducts.filter((id) => id !== productId)
        : [...selectedProducts, productId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("marketingGenerator.productSelect.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("marketingGenerator.productSelect.count", { count: selectedProducts.length })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("marketingGenerator.productSelect.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.includes(product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={cn(
                    "relative rounded-lg border-2 p-2 transition-all hover:scale-105",
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-md mb-2"
                    />
                  )}
                  <p className="text-xs font-medium truncate">{product.name}</p>
                  {product.price && (
                    <p className="text-xs text-muted-foreground">${product.price}</p>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-violet-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("marketingGenerator.productSelect.count", { count: selectedProducts.length })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("marketingGenerator.productSelect.cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={selectedProducts.length === 0}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {t("marketingGenerator.productSelect.confirm")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
