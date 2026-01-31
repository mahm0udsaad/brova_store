"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus, Upload, Sparkles, Trash2, Edit, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBanner, updateBanner, deleteBanner, type BannerInput } from "@/lib/actions/banners"
import { useToast } from "@/hooks/use-toast"

interface Banner extends BannerInput {
  id: string
  sort_order?: number
}

interface BannersManagerProps {
  banners: Banner[]
  onUpdate: () => void
}

export function BannersManager({ banners, onUpdate }: BannersManagerProps) {
  const t = useTranslations("admin.themeEditor.banners")
  const [isOpen, setIsOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  return (
    <div className="space-y-4">
      {/* Add Banner Button */}
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">{t("title")}</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBanner(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addBanner")}
            </Button>
          </DialogTrigger>
          <BannerDialog
            banner={editingBanner}
            onClose={() => {
              setIsOpen(false)
              setEditingBanner(null)
            }}
            onSuccess={onUpdate}
          />
        </Dialog>
      </div>

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{t("noBanners")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((banner) => (
            <BannerItem
              key={banner.id}
              banner={banner}
              onEdit={() => {
                setEditingBanner(banner)
                setIsOpen(true)
              }}
              onDelete={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BannerItem({
  banner,
  onEdit,
  onDelete,
}: {
  banner: Banner
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useTranslations("admin.themeEditor.banners")
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this banner?")) return

    startTransition(async () => {
      const result = await deleteBanner(banner.id)
      if (result.success) {
        toast({ title: "Banner deleted" })
        onDelete()
      } else {
        toast({ title: "Failed to delete banner", variant: "destructive" })
      }
    })
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Drag Handle */}
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

      {/* Thumbnail */}
      {banner.image_url && (
        <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
          <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-full object-cover" loading="lazy" width={96} height={64} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{banner.title || "Untitled"}</p>
        <div className="flex gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {banner.position}
          </Badge>
          {banner.is_active && (
            <Badge variant="default" className="text-xs bg-green-600">
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function BannerDialog({
  banner,
  onClose,
  onSuccess,
}: {
  banner: Banner | null
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations("admin.themeEditor.banners")
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<Partial<BannerInput>>(
    banner || {
      image_url: "",
      title: "",
      title_ar: "",
      link_type: "none",
      link_target: "",
      position: "top",
      is_active: true,
    }
  )

  const handleSubmit = () => {
    if (!formData.image_url) {
      toast({ title: "Please upload an image", variant: "destructive" })
      return
    }

    startTransition(async () => {
      const result = banner
        ? await updateBanner(banner.id, formData)
        : await createBanner(formData as BannerInput)

      if (result.success) {
        toast({ title: banner ? "Banner updated" : "Banner created" })
        onSuccess()
        onClose()
      } else {
        toast({ title: "Failed to save banner", variant: "destructive" })
      }
    })
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{banner ? "Edit Banner" : t("addBanner")}</DialogTitle>
        <DialogDescription>
          Configure your banner image and settings
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>{t("image")}</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button">
              <Upload className="h-4 w-4 mr-2" />
              {t("imageUpload")}
            </Button>
            <Button variant="outline" size="sm" type="button">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("generateWithAI")}
            </Button>
          </div>
          {formData.image_url && (
            <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border">
              <img src={formData.image_url} alt="Banner" className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("bannerTitle")}</Label>
            <Input
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Banner title"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("bannerTitleAr")}</Label>
            <Input
              value={formData.title_ar || ""}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              placeholder="عنوان البانر"
              dir="rtl"
            />
          </div>
        </div>

        {/* Link Type */}
        <div className="space-y-2">
          <Label>{t("linkType")}</Label>
          <Select
            value={formData.link_type}
            onValueChange={(value: any) => setFormData({ ...formData, link_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Link Target */}
        {formData.link_type !== "none" && (
          <div className="space-y-2">
            <Label>{t("linkTarget")}</Label>
            <Input
              value={formData.link_target || ""}
              onChange={(e) => setFormData({ ...formData, link_target: e.target.value })}
              placeholder={
                formData.link_type === "external"
                  ? "https://example.com"
                  : formData.link_type === "product"
                  ? "Product ID"
                  : "Category slug"
              }
            />
          </div>
        )}

        {/* Position */}
        <div className="space-y-2">
          <Label>{t("position.label")}</Label>
          <Select
            value={formData.position}
            onValueChange={(value: any) => setFormData({ ...formData, position: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">{t("position.top")}</SelectItem>
              <SelectItem value="top">{t("position.top")}</SelectItem>
              <SelectItem value="middle">{t("position.middle")}</SelectItem>
              <SelectItem value="bottom">{t("position.bottom")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <Label>{t("active")}</Label>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving..." : banner ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
