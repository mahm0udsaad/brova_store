"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

type AdminProduct = {
  id: string
  name: string
  name_ar: string | null
  price: number
  status: 'draft' | 'active'
  images: string[]
  image_url: string | null
  category: string | null
  category_ar: string | null
  description: string | null
  description_ar: string | null
  inventory: number
}

interface ProductEditorProps {
  product: AdminProduct
  locale: string
}

export default function ProductEditor({ product, locale }: ProductEditorProps) {
  const t = useTranslations("admin")
  const isArabic = locale === 'ar'
  const [status, setStatus] = useState<'draft' | 'active'>(product.status)
  const [price, setPrice] = useState<string>(product.price?.toString() || "")
  const [inventory, setInventory] = useState<string>(product.inventory?.toString() || "0")
  const [images, setImages] = useState<string[]>(
    product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : [])
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const pendingPricing = useMemo(() => {
    const parsed = Number(price)
    return !price || Number.isNaN(parsed) || parsed <= 0
  }, [price])

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    const parsedPrice = price ? Number(price) : 0
    const parsedInventory = inventory ? Number(inventory) : 0

    if (price && Number.isNaN(parsedPrice)) {
      setError(t("editor.priceError")) // Add key to admin.ts if missing, or use generic
      setIsSaving(false)
      return
    }

    if (inventory && Number.isNaN(parsedInventory)) {
      setError(t("editor.inventoryError")) // Add key
      setIsSaving(false)
      return
    }

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        price: parsedPrice,
        inventory: parsedInventory,
        images,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || t("editor.updateError"))
      setIsSaving(false)
      return
    }

    setSuccess(t("editor.updateSuccess"))
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("editor.inventory")} / {
                isArabic
                  ? (product.category_ar || product.category || t("editor.uncategorized"))
                  : (product.category || t("editor.uncategorized"))
              }
            </p>
            <h1 className="text-2xl font-bold">
              {isArabic ? (product.name_ar || product.name) : product.name}
            </h1>
          </div>
          <Link href={`/${locale}/admin/inventory`} className="text-sm font-semibold text-primary">
            {t("inventory.backToDashboard")}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{t("editor.status")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("editor.statusDesc")}
                </p>
              </div>
              <button
                onClick={() => setStatus((prev) => prev === 'active' ? 'draft' : 'active')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {status === 'active'
                  ? t("editor.statusPublished")
                  : t("editor.statusDraft")
                }
              </button>
            </div>

            <div>
              <label className="text-sm font-semibold">
                {t("editor.price")}
              </label>
              <Input
                type="number"
                min="0"
                placeholder={t("editor.pricePlaceholder")}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-2"
              />
              {pendingPricing && (
                <p className="text-xs text-amber-500 mt-2">
                  {t("inventory.pendingPricing")}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">
                {t("editor.inventory")}
              </label>
              <Input
                type="number"
                min="0"
                placeholder={t("editor.inventoryPlaceholder")}
                value={inventory}
                onChange={(event) => setInventory(event.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("editor.inventoryDesc")}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold">
                {t("editor.images")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("editor.imagesDesc")}
              </p>
            </div>
            <div className="space-y-3">
              {images.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t("editor.noImages")}
                </div>
              )}
              {images.map((image, index) => (
                <div key={`${image}-${index}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <img src={image} alt={`Product ${index + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {t("editor.imageIndex", { index: index + 1 })}
                    </p>
                    <p className="text-xs break-all">{image}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => moveImage(index, index - 1)}>
                      {t("editor.up")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => moveImage(index, index + 1)}>
                      {t("editor.down")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-emerald-500">{success}</p>}
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? t("editor.saving")
              : t("editor.save")
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
