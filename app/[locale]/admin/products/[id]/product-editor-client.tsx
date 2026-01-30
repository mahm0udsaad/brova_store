"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageGalleryEditor } from "@/components/admin/products/image-gallery-editor"
import { VariantEditor } from "@/components/admin/products/variant-editor"
import { CategoryPicker } from "@/components/admin/products/category-picker"
import { AIActionBar } from "@/components/admin/products/ai-action-bar"
import { useProductForm } from "@/hooks/use-product-form"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useAIProductAction } from "@/hooks/use-ai-product-action"
import { useTranslations } from "next-intl"
import { triggerHaptic } from "@/lib/haptics"

interface StoreCategory {
  id: string
  name: string
  name_ar: string | null
  slug: string
  store_id: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface ProductEditorClientProps {
  product: any
  categories: StoreCategory[]
  storeId: string
  locale: string
  isNew?: boolean
}

export default function ProductEditorClient({
  product, categories: initialCategories, storeId, locale, isNew,
}: ProductEditorClientProps) {
  const t = useTranslations("admin")
  const buildHref = (href: string) => `/${locale}${href}`
  const [categories, setCategories] = useState(initialCategories)

  const form = useProductForm({
    productId: isNew ? undefined : product?.id,
    initialValues: product ? {
      name: product.name || '',
      name_ar: product.name_ar || '',
      description: product.description || '',
      description_ar: product.description_ar || '',
      price: Number(product.price) || 0,
      inventory: product.inventory || 0,
      status: product.status || 'draft',
      category: product.category || '',
      category_ar: product.category_ar || '',
      category_id: product.category_id || '',
      tags: product.tags || [],
      image_url: product.image_url || '',
      images: product.images || [],
      sku: product.sku || '',
      gender: product.gender || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      variants: product.variants || [],
    } : undefined,
    autosaveEnabled: !isNew,
    autosaveDelay: 1500,
  })

  const imageUpload = useImageUpload({
    storeId,
    productId: product?.id || 'new',
  })

  const aiAction = useAIProductAction(product?.id || '')

  const handleSave = async () => {
    try {
      const result = await form.save()
      triggerHaptic("success")
      if (isNew && result?.product?.id) {
        window.location.href = buildHref(`/admin/products/${result.product.id}`)
      }
    } catch {
      triggerHaptic("error")
    }
  }

  const handlePublish = async () => {
    await form.publish()
    triggerHaptic("success")
  }

  const handleUnpublish = async () => {
    await form.unpublish()
    triggerHaptic("success")
  }

  const handleImageUpload = async (files: File[]) => {
    const urls = await imageUpload.uploadFiles(files)
    const newImages = [...form.values.images, ...urls]
    form.updateFields({
      images: newImages,
      image_url: newImages[0] || '',
    })
    return urls
  }

  const handleImagesChange = (images: string[]) => {
    form.updateFields({
      images,
      image_url: images[0] || '',
    })
  }

  const handleCategorySelect = (categoryId: string, categoryName: string, categoryNameAr?: string) => {
    form.updateFields({
      category_id: categoryId,
      category: categoryName,
      category_ar: categoryNameAr || '',
    })
  }

  const handleCreateCategory = async (name: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) return null
      const { category } = await res.json()
      setCategories(prev => [...prev, category])
      return category
    } catch {
      return null
    }
  }

  const handleAIAction = async (action: string) => {
    form.pauseAutosave()
    await aiAction.requestAction(action)
    form.resumeAutosave()
  }

  // Tags input
  const [tagInput, setTagInput] = useState("")
  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.values.tags.includes(tag)) {
      form.updateField('tags', [...form.values.tags, tag])
      setTagInput("")
    }
  }
  const removeTag = (tag: string) => {
    form.updateField('tags', form.values.tags.filter(t => t !== tag))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={buildHref("/admin/products")}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {isNew ? t("editor.createProduct") : t("editor.editProduct")}
              </h1>
              {form.lastSaved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t("editor.lastSaved", { time: new Date(form.lastSaved).toLocaleTimeString(locale) })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && form.values.status === 'draft' && (
              <Button variant="outline" onClick={handlePublish} disabled={form.saving} className="gap-1.5">
                <Eye className="w-4 h-4" /> {t("editor.publish")}
              </Button>
            )}
            {!isNew && form.values.status === 'active' && (
              <Button variant="outline" onClick={handleUnpublish} disabled={form.saving} className="gap-1.5">
                <EyeOff className="w-4 h-4" /> {t("editor.unpublish")}
              </Button>
            )}
            <Button onClick={handleSave} disabled={form.saving} className="gap-1.5">
              <Save className="w-4 h-4" />
              {form.saving ? t("editor.saving") : t("editor.save")}
            </Button>
          </div>
        </div>

        {/* Status badge */}
        {!isNew && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              form.values.status === 'active'
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {form.values.status === 'active' ? t("editor.statusPublished") : t("editor.statusDraft")}
            </span>
            {product?.ai_generated && (
              <span className="text-xs font-medium text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">
                {t("editor.aiGenerated")}
              </span>
            )}
            {form.dirty && (
              <span className="text-xs text-amber-500">{t("editor.unsavedChanges")}</span>
            )}
          </div>
        )}

        {form.error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-500">{form.error}</p>
          </div>
        )}

        {/* AI Action Bar */}
        {!isNew && (
          <AIActionBar
            onImproveDescription={() => handleAIAction('improve-description')}
            onSuggestCategory={() => handleAIAction('suggest-category')}
            onOptimizePrice={() => handleAIAction('optimize-price')}
            loading={aiAction.loading}
            loadingAction={aiAction.loading ? 'loading' : undefined}
          />
        )}

        {/* Images */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <ImageGalleryEditor
            images={form.values.images}
            onChange={handleImagesChange}
            onUpload={handleImageUpload}
            uploading={imageUpload.uploading}
          />
        </div>

        {/* Basic info */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold">{t("editor.basicInfo")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.nameEn")}</label>
              <Input
                value={form.values.name}
                onChange={(e) => form.updateField('name', e.target.value)}
                placeholder={t("editor.nameEnPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.nameAr")}</label>
              <Input
                value={form.values.name_ar}
                onChange={(e) => form.updateField('name_ar', e.target.value)}
                placeholder={t("editor.nameArPlaceholder")}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.descriptionEn")}</label>
              <textarea
                value={form.values.description}
                onChange={(e) => form.updateField('description', e.target.value)}
                placeholder={t("editor.descriptionEnPlaceholder")}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.descriptionAr")}</label>
              <textarea
                value={form.values.description_ar}
                onChange={(e) => form.updateField('description_ar', e.target.value)}
                placeholder={t("editor.descriptionArPlaceholder")}
                rows={4}
                dir="rtl"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold">{t("editor.pricingInventory")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.price")}</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={form.values.price || ''}
                  onChange={(e) => form.updateField('price', Number(e.target.value))}
                  placeholder="0"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">EGP</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.inventory")}</label>
              <Input
                type="number"
                min="0"
                value={form.values.inventory || ''}
                onChange={(e) => form.updateField('inventory', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("editor.sku")}</label>
              <Input
                value={form.values.sku}
                onChange={(e) => form.updateField('sku', e.target.value)}
                placeholder="SKU-001"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold">{t("editor.category")}</h2>
          <CategoryPicker
            categories={categories}
            selectedId={form.values.category_id}
            onSelect={handleCategorySelect}
            onCreateNew={handleCreateCategory}
          />
        </div>

        {/* Variants */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold">{t("editor.variants")}</h2>
          <VariantEditor
            gender={form.values.gender}
            sizes={form.values.sizes}
            colors={form.values.colors}
            onGenderChange={(v) => form.updateField('gender', v as any)}
            onSizesChange={(v) => form.updateField('sizes', v)}
            onColorsChange={(v) => form.updateField('colors', v)}
          />
        </div>

        {/* Tags */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">{t("editor.tags")}</h2>
          <div className="flex flex-wrap gap-2">
            {form.values.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder={t("editor.addTag")}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
              {t("editor.add")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
