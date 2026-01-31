"use client"

import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

interface LayoutSection {
  products_per_row: 3 | 4 | 5
  show_categories: boolean
  show_featured: boolean
  show_new_arrivals: boolean
  header_style: "transparent" | "solid" | "sticky"
}

interface LayoutSectionEditorProps {
  layout: LayoutSection
  onChange: (layout: LayoutSection) => void
}

export function LayoutSectionEditor({ layout, onChange }: LayoutSectionEditorProps) {
  const t = useTranslations("admin.themeEditor.layout")

  return (
    <div className="space-y-6">
      {/* Products per Row */}
      <div className="space-y-3">
        <Label>{t("productsPerRow.label")}</Label>
        <RadioGroup
          value={String(layout.products_per_row)}
          onValueChange={(value) =>
            onChange({ ...layout, products_per_row: Number(value) as 3 | 4 | 5 })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="ppr-3" />
            <Label htmlFor="ppr-3" className="font-normal cursor-pointer">
              {t("productsPerRow.three")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4" id="ppr-4" />
            <Label htmlFor="ppr-4" className="font-normal cursor-pointer">
              {t("productsPerRow.four")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="5" id="ppr-5" />
            <Label htmlFor="ppr-5" className="font-normal cursor-pointer">
              {t("productsPerRow.five")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Show Sections */}
      <div className="space-y-3">
        <Label className="text-base">{t("sections.label")}</Label>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-categories" className="font-normal">
            {t("sections.categories")}
          </Label>
          <Switch
            id="show-categories"
            checked={layout.show_categories}
            onCheckedChange={(checked) => onChange({ ...layout, show_categories: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-featured" className="font-normal">
            {t("sections.featured")}
          </Label>
          <Switch
            id="show-featured"
            checked={layout.show_featured}
            onCheckedChange={(checked) => onChange({ ...layout, show_featured: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-new-arrivals" className="font-normal">
            {t("sections.newArrivals")}
          </Label>
          <Switch
            id="show-new-arrivals"
            checked={layout.show_new_arrivals}
            onCheckedChange={(checked) => onChange({ ...layout, show_new_arrivals: checked })}
          />
        </div>
      </div>

      {/* Header Style */}
      <div className="space-y-3">
        <Label>{t("headerStyle.label")}</Label>
        <RadioGroup
          value={layout.header_style}
          onValueChange={(value) =>
            onChange({ ...layout, header_style: value as "transparent" | "solid" | "sticky" })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="transparent" id="header-transparent" />
            <Label htmlFor="header-transparent" className="font-normal cursor-pointer">
              {t("headerStyle.transparent")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="solid" id="header-solid" />
            <Label htmlFor="header-solid" className="font-normal cursor-pointer">
              {t("headerStyle.solid")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sticky" id="header-sticky" />
            <Label htmlFor="header-sticky" className="font-normal cursor-pointer">
              {t("headerStyle.sticky")}
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
