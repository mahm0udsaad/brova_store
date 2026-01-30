"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { ProductCard } from "@/components/product-card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types"
import { useLocale, useTranslations } from "next-intl"

interface SearchPageClientProps {
  products: Product[]
}

export default function SearchPageClient({ products }: SearchPageClientProps) {
  const locale = useLocale()
  const t = useTranslations("searchPage")
  const [query, setQuery] = useState("")
  const { itemCount } = useCart()

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products
    const lowerQuery = query.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery),
    )
  }, [query, products])

  return (
    <div className="min-h-screen bg-background pt-[72px] pb-bottom-nav">
      <div className="max-w-md mx-auto px-4">
        <Header showBack title={t("title")} />

        <div className="relative mb-6">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ltr:pl-10 rtl:pr-10 h-12 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("noResults", { query })}</p>
          </div>
        )}
      </div>

      <BottomNav cartCount={itemCount} />
    </div>
  )
}
