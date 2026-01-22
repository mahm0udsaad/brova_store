"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AdminProduct = {
  id: string
  name: string
  price: number | null
  sizes: string[] | null
  images: string[] | null
  image_url: string | null
  published: boolean | null
  category_id: string | null
}

interface ProductEditorProps {
  product: AdminProduct
}

export default function ProductEditor({ product }: ProductEditorProps) {
  const [published, setPublished] = useState<boolean>(!!product.published)
  const [price, setPrice] = useState<string>(product.price?.toString() || "")
  const [sizes, setSizes] = useState<string[]>(product.sizes ?? [])
  const [images, setImages] = useState<string[]>(product.images ?? (product.image_url ? [product.image_url] : []))
  const [newSize, setNewSize] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const pendingPricing = useMemo(() => {
    const parsed = Number(price)
    return !price || Number.isNaN(parsed) || parsed <= 0
  }, [price])

  const handleAddSize = () => {
    const next = newSize.trim().toUpperCase()
    if (!next || sizes.includes(next)) return
    setSizes((prev) => [...prev, next])
    setNewSize("")
  }

  const handleRemoveSize = (size: string) => {
    setSizes((prev) => prev.filter((item) => item !== size))
  }

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

    const parsedPrice = price ? Number(price) : null
    if (price && Number.isNaN(parsedPrice)) {
      setError("Price must be a number")
      setIsSaving(false)
      return
    }

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        published,
        price: parsedPrice,
        sizes,
        images,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || "Failed to update product")
      setIsSaving(false)
      return
    }

    setSuccess("Product updated")
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Inventory / {product.category_id || "Uncategorized"}</p>
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>
          <Link href="/admin/inventory" className="text-sm font-semibold text-primary">
            Back to Inventory
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Status</p>
                <p className="text-xs text-muted-foreground">Switch between Draft and Published.</p>
              </div>
              <button
                onClick={() => setPublished((prev) => !prev)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  published ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {published ? "Published" : "Draft"}
              </button>
            </div>

            <div>
              <label className="text-sm font-semibold">Price (EGP)</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-2"
              />
              {pendingPricing && <p className="text-xs text-amber-500 mt-2">Pending pricing</p>}
            </div>

            <div>
              <label className="text-sm font-semibold">Sizes</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold"
                  >
                    {size}
                    <button onClick={() => handleRemoveSize(size)} className="text-muted-foreground">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add size"
                  value={newSize}
                  onChange={(event) => setNewSize(event.target.value)}
                />
                <Button variant="outline" onClick={handleAddSize}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold">Image Gallery</p>
              <p className="text-xs text-muted-foreground">Reorder images to control the main display.</p>
            </div>
            <div className="space-y-3">
              {images.length === 0 && (
                <div className="text-sm text-muted-foreground">No images available.</div>
              )}
              {images.map((image, index) => (
                <div key={`${image}-${index}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <img src={image} alt={`Product ${index + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Image {index + 1}</p>
                    <p className="text-xs break-all">{image}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => moveImage(index, index - 1)}>
                      Up
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => moveImage(index, index + 1)}>
                      Down
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
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
