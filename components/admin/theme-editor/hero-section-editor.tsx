"use client"

import { useTranslations } from "next-intl"
import { Upload, Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HeroSection {
  enabled: boolean
  image_url: string | null
  title: string
  title_ar: string
  subtitle: string
  subtitle_ar: string
  cta_text: string
  cta_text_ar: string
  cta_link: string
}

interface HeroSectionEditorProps {
  hero: HeroSection
  onChange: (hero: HeroSection) => void
}

export function HeroSectionEditor({ hero, onChange }: HeroSectionEditorProps) {
  const t = useTranslations("admin.themeEditor.hero")

  return (
    <div className="space-y-6">
      {/* Enable Hero */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t("enable")}</Label>
        </div>
        <Switch
          checked={hero.enabled}
          onCheckedChange={(enabled) => onChange({ ...hero, enabled })}
        />
      </div>

      {hero.enabled && (
        <>
          {/* Hero Image */}
          <div className="space-y-2">
            <Label>{t("image")}</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                {t("imageUpload")}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t("generateWithAI")}
              </Button>
            </div>
            {hero.image_url && (
              <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border">
                <img
                  src={hero.image_url}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("title")}</Label>
              <Input
                value={hero.title}
                onChange={(e) => onChange({ ...hero, title: e.target.value })}
                placeholder="Welcome to our store"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("titleAr")}</Label>
              <Input
                value={hero.title_ar}
                onChange={(e) => onChange({ ...hero, title_ar: e.target.value })}
                placeholder="مرحباً بك في متجرنا"
                dir="rtl"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("subtitle")}</Label>
              <Textarea
                value={hero.subtitle}
                onChange={(e) => onChange({ ...hero, subtitle: e.target.value })}
                placeholder="Discover amazing products"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("subtitleAr")}</Label>
              <Textarea
                value={hero.subtitle_ar}
                onChange={(e) => onChange({ ...hero, subtitle_ar: e.target.value })}
                placeholder="اكتشف منتجات مذهلة"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("ctaText")}</Label>
              <Input
                value={hero.cta_text}
                onChange={(e) => onChange({ ...hero, cta_text: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("ctaTextAr")}</Label>
              <Input
                value={hero.cta_text_ar}
                onChange={(e) => onChange({ ...hero, cta_text_ar: e.target.value })}
                placeholder="تسوق الآن"
                dir="rtl"
              />
            </div>
          </div>

          {/* CTA Link */}
          <div className="space-y-2">
            <Label>{t("ctaLink")}</Label>
            <Input
              value={hero.cta_link}
              onChange={(e) => onChange({ ...hero, cta_link: e.target.value })}
              placeholder="/products"
            />
          </div>
        </>
      )}
    </div>
  )
}
