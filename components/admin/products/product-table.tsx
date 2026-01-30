"use client"

import Link from "next/link"
import { MoreVertical, Edit, Eye, EyeOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "next-intl"
import { useState, useRef, useEffect } from "react"

interface Product {
  id: string
  name: string
  name_ar: string | null
  price: number
  category: string | null
  category_ar: string | null
  image_url: string | null
  status: 'draft' | 'active'
  stock_quantity: number
  sku: string | null
  ai_generated: boolean
}

interface ProductTableProps {
  products: Product[]
  selectedIds: Set<string>
  allSelected: boolean
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onDelete: (id: string, name: string) => void
  loading?: boolean
}

function ActionMenu({ productId, productName, onDelete }: { productId: string; productName: string; onDelete: (id: string, name: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const locale = useLocale()
  const t = useTranslations("admin")
  const buildHref = (href: string) => `/${locale}${href}`

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(!open)}>
        <MoreVertical className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg py-1">
          <Link
            href={buildHref(`/admin/products/${productId}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full"
            onClick={() => setOpen(false)}
          >
            <Edit className="w-3.5 h-3.5" /> {t("products.edit")}
          </Link>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 transition-colors w-full text-left"
            onClick={() => { setOpen(false); onDelete(productId, productName) }}
          >
            <Trash2 className="w-3.5 h-3.5" /> {t("products.delete")}
          </button>
        </div>
      )}
    </div>
  )
}

export function ProductTable({
  products, selectedIds, allSelected, onToggleSelect, onToggleSelectAll, onDelete, loading,
}: ProductTableProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const buildHref = (href: string) => `/${locale}${href}`

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">{t("products.empty")}</p>
        <Link href={buildHref('/admin/products/new')}>
          <Button>{t("products.createFirst")}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_80px_48px] gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border">
          <div>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="rounded border-border"
            />
          </div>
          <span>{t("products.table.product")}</span>
          <span>{t("products.table.category")}</span>
          <span>{t("products.table.price")}</span>
          <span>{t("products.table.status")}</span>
          <span>{t("products.table.stock")}</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div
              key={product.id}
              className={`grid grid-cols-[40px_2fr_1fr_1fr_1fr_80px_48px] gap-3 px-4 py-3 items-center transition-colors ${
                selectedIds.has(product.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => onToggleSelect(product.id)}
                  className="rounded border-border"
                />
              </div>
              <Link href={buildHref(`/admin/products/${product.id}`)} className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{product.name}</p>
                  {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                  {product.ai_generated && (
                    <span className="text-[10px] font-medium text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded-full">AI</span>
                  )}
                </div>
              </Link>
              <p className="text-sm text-muted-foreground truncate">
                {product.category || t("products.uncategorized")}
              </p>
              <p className="text-sm font-semibold">
                {product.price > 0
                  ? `${product.price.toLocaleString(locale)} EGP`
                  : t("products.noPrice")}
              </p>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                  product.status === 'active'
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {product.status === 'active' ? t("products.published") : t("products.draft")}
              </span>
              <p className={`text-sm font-medium ${
                product.stock_quantity === 0 ? 'text-red-500' :
                product.stock_quantity <= 5 ? 'text-amber-500' :
                'text-muted-foreground'
              }`}>
                {product.stock_quantity}
              </p>
              <ActionMenu productId={product.id} productName={product.name} onDelete={onDelete} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-border">
        {products.map((product) => (
          <Link
            key={product.id}
            href={buildHref(`/admin/products/${product.id}`)}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(product.id)}
              onChange={(e) => { e.preventDefault(); onToggleSelect(product.id) }}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-border flex-shrink-0"
            />
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    product.status === 'active'
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {product.status === 'active' ? t("products.published") : t("products.draft")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {product.price > 0 ? `${product.price.toLocaleString(locale)} EGP` : t("products.noPrice")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
