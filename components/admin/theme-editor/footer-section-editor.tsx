"use client"

import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface FooterSection {
  about_text: string
  about_text_ar: string
  social_links: {
    instagram: string
    facebook: string
    twitter: string
    whatsapp: string
    tiktok: string
  }
}

interface FooterSectionEditorProps {
  footer: FooterSection
  onChange: (footer: FooterSection) => void
}

export function FooterSectionEditor({ footer, onChange }: FooterSectionEditorProps) {
  const t = useTranslations("admin.themeEditor.footer")

  return (
    <div className="space-y-6">
      {/* About Text */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("aboutText")}</Label>
          <Textarea
            value={footer.about_text}
            onChange={(e) => onChange({ ...footer, about_text: e.target.value })}
            placeholder="Tell customers about your store..."
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("aboutTextAr")}</Label>
          <Textarea
            value={footer.about_text_ar}
            onChange={(e) => onChange({ ...footer, about_text_ar: e.target.value })}
            placeholder="أخبر العملاء عن متجرك..."
            dir="rtl"
            rows={4}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">{t("socialLinks")}</Label>

        <div className="space-y-2">
          <Label htmlFor="instagram">{t("instagram")}</Label>
          <Input
            id="instagram"
            value={footer.social_links.instagram}
            onChange={(e) =>
              onChange({
                ...footer,
                social_links: { ...footer.social_links, instagram: e.target.value },
              })
            }
            placeholder="https://instagram.com/yourstore"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">{t("facebook")}</Label>
          <Input
            id="facebook"
            value={footer.social_links.facebook}
            onChange={(e) =>
              onChange({
                ...footer,
                social_links: { ...footer.social_links, facebook: e.target.value },
              })
            }
            placeholder="https://facebook.com/yourstore"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">{t("twitter")}</Label>
          <Input
            id="twitter"
            value={footer.social_links.twitter}
            onChange={(e) =>
              onChange({
                ...footer,
                social_links: { ...footer.social_links, twitter: e.target.value },
              })
            }
            placeholder="https://twitter.com/yourstore"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">{t("whatsapp")}</Label>
          <Input
            id="whatsapp"
            value={footer.social_links.whatsapp}
            onChange={(e) =>
              onChange({
                ...footer,
                social_links: { ...footer.social_links, whatsapp: e.target.value },
              })
            }
            placeholder="+20 123 456 7890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiktok">{t("tiktok")}</Label>
          <Input
            id="tiktok"
            value={footer.social_links.tiktok}
            onChange={(e) =>
              onChange({
                ...footer,
                social_links: { ...footer.social_links, tiktok: e.target.value },
              })
            }
            placeholder="https://tiktok.com/@yourstore"
          />
        </div>
      </div>
    </div>
  )
}
