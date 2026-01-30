"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Download, Edit, Share2, Facebook, Instagram, Music2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SocialPostPreview } from "@/components/admin/marketing/social-post-preview"
import { useTranslations } from "next-intl"

interface Draft {
  id: string
  platform: string
  ui_structure: any
  media_assets: any
  copy_text: any
  status: string
  created_at: string
}

interface CampaignDetailClientProps {
  drafts: Draft[]
  campaignId: string
  locale: string
}

export function CampaignDetailClient({ drafts, campaignId, locale }: CampaignDetailClientProps) {
  const t = useTranslations("admin")
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState<string>(drafts[0]?.platform || "facebook")

  const selectedDraft = drafts.find((d) => d.platform === selectedPlatform) || drafts[0]

  const campaignDate = new Date(campaignId).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-5 h-5" />
      case "instagram":
        return <Instagram className="w-5 h-5" />
      case "tiktok":
        return <Music2 className="w-5 h-5" />
      default:
        return null
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "from-blue-500 to-blue-600"
      case "instagram":
        return "from-pink-500 via-purple-500 to-orange-500"
      case "tiktok":
        return "from-black to-gray-800"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const handleCopyText = () => {
    const text = `${selectedDraft.ui_structure.caption}\n\n${selectedDraft.copy_text.hashtags.map((h: string) => `#${h}`).join(" ")}\n\n${selectedDraft.ui_structure.cta}`
    navigator.clipboard.writeText(text)
    // TODO: Show toast
  }

  const platformLabels: Record<string, string> = {
    facebook: t("marketingGenerator.platforms.facebook"),
    instagram: t("marketingGenerator.platforms.instagram"),
    tiktok: t("marketingGenerator.platforms.tiktok"),
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/admin/marketing`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("campaignDetail.title")}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{campaignDate}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <Share2 className="w-4 h-4 mr-2" />
              {t("campaignDetail.copyText")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t("campaignDetail.export")}
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Edit className="w-4 h-4 mr-2" />
              {t("campaignDetail.editCampaign")}
            </Button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-3 p-1 rounded-lg border bg-muted/50">
          {drafts.map((draft) => (
            <button
              key={draft.platform}
              onClick={() => setSelectedPlatform(draft.platform)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedPlatform === draft.platform
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${getPlatformColor(draft.platform)} flex items-center justify-center text-white`}
              >
                {getPlatformIcon(draft.platform)}
              </div>
              <span className="capitalize">{platformLabels[draft.platform] || draft.platform}</span>
            </button>
          ))}
        </div>

        {/* Post Preview */}
        <motion.div
          key={selectedPlatform}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Preview */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">{t("campaignDetail.postPreview")}</h3>
              <SocialPostPreview draft={selectedDraft} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Caption */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">{t("campaignDetail.caption")}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedDraft.ui_structure.caption}
              </p>
            </div>

            {/* Hashtags */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">{t("campaignDetail.hashtags")}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDraft.copy_text.hashtags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">{t("campaignDetail.cta")}</h3>
              <p className="text-sm text-muted-foreground">{selectedDraft.ui_structure.cta}</p>
            </div>

            {/* Best Time to Post */}
            {selectedDraft.ui_structure.suggestedTime && (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-3">{t("campaignDetail.bestTime")}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDraft.ui_structure.suggestedTime}
                </p>
              </div>
            )}

            {/* Tips */}
            {selectedDraft.ui_structure.tips && (
              <div className="rounded-xl border bg-card p-6 bg-violet-500/5 border-violet-500/20">
                <h3 className="font-semibold mb-3 text-violet-600">{t("campaignDetail.tips")}</h3>
                <p className="text-sm text-muted-foreground">{selectedDraft.ui_structure.tips}</p>
              </div>
            )}

            {/* Status */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">{t("campaignDetail.status")}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedDraft.status === "draft"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-green-500/10 text-green-600"
                }`}
              >
                {t(`campaignDetail.statuses.${selectedDraft.status}`)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
