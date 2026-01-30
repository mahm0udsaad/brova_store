"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InventoryOnboardingWizard } from "@/components/inventory-onboarding-wizard"
import { triggerHaptic } from "@/lib/haptics"
import { useLocale, useTranslations } from "next-intl"

type InventoryProductRow = {
  id: string
  name: string
  name_ar: string | null
  price: number
  category: string | null
  category_ar: string | null
  image_url: string | null
  status: 'draft' | 'active'
  inventory: number
  slug: string
}

interface InventoryPageClientProps {
  initialProducts: InventoryProductRow[]
}

export default function InventoryPageClient({ initialProducts }: InventoryPageClientProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const buildHref = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`)
  const [products, setProducts] = useState<InventoryProductRow[]>(initialProducts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const onboardingProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price ?? null,
    category_id: null,
    image_url: product.image_url,
    published: product.status === "active",
    sizes: null,
  }))

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(t("inventory.confirmDelete", { name: productName }))) {
      return
    }

    setDeletingId(productId)
    setError(null)
    triggerHaptic("warning")

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || t("inventory.deleteError"))
      }

      // Remove product from list
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      triggerHaptic("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.deleteError"))
      triggerHaptic("error")
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("inventory.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <InventoryOnboardingWizard products={onboardingProducts} onComplete={handleRefresh} />
            <Link href={buildHref("/admin")} className="text-sm font-semibold text-primary whitespace-nowrap">
              {t("inventory.backToDashboard")}
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span className="col-span-2">{t("inventory.table.product")}</span>
              <span>{t("inventory.table.category")}</span>
              <span>{t("inventory.table.price")}</span>
              <span>{t("inventory.table.status")}</span>
              <span className="text-end">{t("inventory.table.actions")}</span>
            </div>
            <div className="divide-y divide-border">
              {products.map((product) => {
                const pendingPricing = !product.price || product.price <= 0
                const isDeleting = deletingId === product.id
                return (
                  <div key={product.id} className="grid grid-cols-6 gap-4 px-4 py-4 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        {pendingPricing && (
                          <p className="text-xs text-amber-500 font-medium">
                            {t("inventory.pendingPricing")}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.category || t("inventory.uncategorized")}
                    </p>
                    <p className="text-sm font-semibold">
                      {pendingPricing
                        ? t("inventory.pricePlaceholder")
                        : t("inventory.priceWithCurrency", { amount: product.price?.toLocaleString(locale) })}
                    </p>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${
                        product.status === 'active'
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.status === 'active' ? t("inventory.statusPublished") : t("inventory.statusDraft")}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={buildHref(`/admin/products/${product.id}`)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {t("inventory.edit")}
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                        title={t("inventory.deleteTitle")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-border">
            {products.map((product) => {
              const pendingPricing = !product.price || product.price <= 0
              const isDeleting = deletingId === product.id
              return (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.category || t("inventory.uncategorized")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            product.status === 'active'
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.status === 'active' ? t("inventory.statusPublished") : t("inventory.statusDraft")}
                        </span>
                        {pendingPricing && (
                          <p className="text-xs text-amber-500 font-medium">
                            {t("inventory.pendingPricing")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm font-semibold">
                      {pendingPricing
                        ? t("inventory.pricePlaceholder")
                        : t("inventory.priceWithCurrency", { amount: product.price?.toLocaleString(locale) })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Link href={buildHref(`/admin/products/${product.id}`)}>
                        <Button variant="outline" size="sm" className="h-9">
                          {t("inventory.edit")}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("inventory.empty")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
